import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import { createClient } from '@supabase/supabase-js';
import { DOG_CLUB_GUIDES } from '@/data/dogClubGuides';

export const maxDuration = 300; // allow long Vercel runtimes

export async function GET(req: Request) {
  let browser;

  try {
    const { searchParams } = new URL(req.url);

    // Extract params safely
    const sessionId = searchParams.get("sessionId")!;
    const clientEmail = searchParams.get("clientEmail") ?? "";
    const clientFirstName = searchParams.get("clientFirstName") ?? "";
    const clientLastName = searchParams.get("clientLastName") ?? "";
    const dogName = searchParams.get("dogName") ?? "";
    const sessionNumber = searchParams.get("sessionNumber") ?? "";
    const bookingDate = searchParams.get("bookingDate") ?? "";
    const bookingTime = searchParams.get("bookingTime") ?? "";

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing required sessionId" },
        { status: 400 }
      );
    }

    console.log(`[PDF-GEN] Starting PDF generation for session ${sessionId}`);
    console.log(`[PDF-GEN] Client: ${clientFirstName} ${clientLastName}, Dog: ${dogName}`);

    // Fetch session plan to get Dog Club Guides
    console.log("[PDF-GEN] Fetching session plan data...");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: sessionPlanData, error: sessionPlanError } = await supabase
      .from('session_plans')
      .select('dog_club_guides')
      .eq('session_id', sessionId)
      .single();

    let dogClubGuides: string[] = [];
    if (!sessionPlanError && sessionPlanData?.dog_club_guides) {
      dogClubGuides = sessionPlanData.dog_club_guides;
      console.log("[PDF-GEN] Found Dog Club Guides:", dogClubGuides);
    }

    console.log("[PDF-GEN] Launching Chromium...");

    // For Vercel/AWS Lambda, use @sparticuz/chromium-min with hosted .tar file
    // For local development, use local Chromium/Chrome
    const isProduction = !!process.env.VERCEL_ENV && process.env.VERCEL_ENV === 'production';

    if (isProduction) {
      // Use the hosted chromium .tar file from GitHub releases
      // This avoids the "bin does not exist" error in Vercel deployments
      const chromiumPackUrl = 'https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.x64.tar';
      const executablePath = await chromium.executablePath(chromiumPackUrl);

      console.log("[PDF-GEN] Production mode - using @sparticuz/chromium-min");
      console.log("[PDF-GEN] Chromium pack URL:", chromiumPackUrl);
      console.log("[PDF-GEN] Executable path:", executablePath);

      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath,
        headless: true,
      });
    } else {
      // Local development - use regular puppeteer with system Chrome
      console.log("[PDF-GEN] Development mode - using local Chromium");

      const puppeteerFull = await import('puppeteer');
      browser = await puppeteerFull.default.launch({
        headless: true,
      });
    }

    console.log("[PDF-GEN] Browser launched successfully");

    const page = await browser.newPage();

    // --- Auto-detect REAL base URL (local or Vercel) ---
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!baseUrl) {
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else {
        baseUrl = "http://localhost:3000";
      }
    }

    // Use playwright=true to bypass Paged.js and use native CSS @page rules
    const previewUrl = `${baseUrl}/session-plan-preview/${sessionId}?playwright=true`;

    console.log(`[PDF-GEN] Loading preview URL: ${previewUrl}`);

    // --- Load the session plan preview ---
    await page.goto(previewUrl, {
      waitUntil: "networkidle0",
      timeout: 120_000,
    });

    console.log("[PDF-GEN] Page loaded, waiting for content to be ready...");

    // Wait for ready signal (set immediately in Playwright mode)
    await page.waitForFunction(
      () => document.body.getAttribute("data-paged-ready") === "true",
      { timeout: 30_000 } // Shorter timeout since no Paged.js processing
    );

    console.log("[PDF-GEN] Waiting for fonts to load...");

    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);

    // Log loaded fonts for debugging
    const loadedFonts = await page.evaluate(() => {
      const fonts = [];
      for (const font of document.fonts) {
        fonts.push(`${font.family} ${font.weight} ${font.style} - ${font.status}`);
      }
      return fonts;
    });
    console.log("[PDF-GEN] Loaded fonts:", loadedFonts);

    // Add extra delay to ensure fonts are fully rendered
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log("[PDF-GEN] Fonts loaded — generating PDF with Puppeteer...");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
      preferCSSPageSize: true, // Use CSS @page rules for page sizing
    });

    console.log(`[PDF-GEN] PDF generated, size: ${pdfBuffer.length} bytes`);

    await browser.close();
    browser = null;

    // --- Send to Make.com using multipart/form-data ---
    console.log("[PDF-GEN] Preparing multipart/form-data for Make.com...");

    const pdfFileName = `Session-${sessionNumber}-${dogName.replace(/\s+/g, '-')}.pdf`;

    // Create FormData with the PDF file and metadata
    const FormData = (await import('formdata-node')).FormData;
    const { Blob } = await import('buffer');

    const formData = new FormData();

    // Add the PDF file
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('pdf', pdfBlob, pdfFileName);

    // Add metadata as separate fields
    formData.append('sessionId', sessionId);
    formData.append('clientEmail', clientEmail);
    formData.append('clientFirstName', clientFirstName);
    formData.append('clientLastName', clientLastName);
    formData.append('dogName', dogName);
    formData.append('sessionNumber', sessionNumber);
    formData.append('bookingDate', bookingDate);
    formData.append('bookingTime', bookingTime);
    formData.append('emailSubject', `Session ${sessionNumber} Plan - ${dogName}`);
    formData.append('timestamp', new Date().toISOString());

    // Add Dog Club Guides if any are selected
    if (dogClubGuides.length > 0) {
      const selectedGuides = dogClubGuides
        .map(guideId => DOG_CLUB_GUIDES.find(g => g.id === guideId))
        .filter(Boolean);

      // Create formatted text for email
      const guidesText = selectedGuides
        .map(guide => `${guide!.title} - ${guide!.url}`)
        .join('\n');

      formData.append('dogClubGuides', guidesText);
      console.log("[PDF-GEN] Added Dog Club Guides to formData:", guidesText);
    }

    console.log("[PDF-GEN] Sending multipart/form-data to Make.com...");
    console.log("[PDF-GEN] PDF filename:", pdfFileName);
    console.log("[PDF-GEN] Metadata:", {
      sessionId,
      clientEmail,
      clientFirstName,
      clientLastName,
      dogName,
      sessionNumber,
      bookingDate,
      bookingTime,
    });

    const makeRes = await fetch(
      "https://hook.eu1.make.com/lbfmnhl3xpf7c0y2sfos3vdln6y1fmqm",
      {
        method: "POST",
        body: formData as any,
        // Let FormData set the Content-Type with boundary
      }
    );

    if (!makeRes.ok) {
      const msg = await makeRes.text();
      console.error("[PDF-GEN] Make.com webhook error:", msg);
      return NextResponse.json(
        { error: `Failed to send email webhook: ${msg}` },
        { status: 500 }
      );
    }

    console.log("[PDF-GEN] ✅ Webhook sent successfully to Make.com");

    return NextResponse.json({
      success: true,
      message: "PDF generated and email draft created successfully"
    });
  } catch (err: any) {
    console.error("[PDF-GEN] ❌ Unhandled error:", err);
    console.error("[PDF-GEN] Error name:", err.name);
    console.error("[PDF-GEN] Error message:", err.message);
    console.error("[PDF-GEN] Error stack:", err.stack);

    // Ensure browser is closed on error
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("[PDF-GEN] Error closing browser:", closeErr);
      }
    }

    return NextResponse.json(
      {
        error: err.message || "Unknown error occurred during PDF generation",
        details: err.stack || err.toString()
      },
      { status: 500 }
    );
  }
}