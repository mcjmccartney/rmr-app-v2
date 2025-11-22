import { NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import playwright from "playwright-core";
import { createClient } from "@supabase/supabase-js";

// --- Supabase Client (Service Role Required) ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    console.log("[PDF-GEN] Launching Chromium...");

    const executablePath = await chromium.executablePath();

    browser = await playwright.chromium.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });

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
      waitUntil: "networkidle",
      timeout: 120_000,
    });

    console.log("[PDF-GEN] Page loaded, waiting for content to be ready...");

    // Wait for ready signal (set immediately in Playwright mode)
    await page.waitForFunction(
      () => document.body.getAttribute("data-paged-ready") === "true",
      { timeout: 30_000 } // Shorter timeout since no Paged.js processing
    );

    console.log("[PDF-GEN] Content ready — generating PDF with Playwright...");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
      preferCSSPageSize: true, // Use CSS @page rules for page sizing
    });

    console.log(`[PDF-GEN] PDF generated, size: ${pdfBuffer.length} bytes`);

    await browser.close();
    browser = null;

    // --- Upload to Supabase ---
    const filePath = `session-plans/${sessionId}-${Date.now()}.pdf`;

    console.log(`[PDF-GEN] Uploading to Supabase: ${filePath}`);

    const upload = await supabase.storage
      .from("session-plans")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
      });

    if (upload.error) {
      console.error("[PDF-GEN] Supabase upload error:", upload.error);
      return NextResponse.json(
        { error: `Failed to upload PDF: ${upload.error.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("session-plans")
      .getPublicUrl(filePath);

    const pdfUrl = publicUrlData.publicUrl;

    console.log(`[PDF-GEN] ✅ PDF uploaded successfully: ${pdfUrl}`);

    // --- Send to Make.com ---
    console.log("[PDF-GEN] Sending webhook to Make.com...");

    const webhookData = {
      sessionId,
      pdfUrl,
      clientEmail,
      clientFirstName,
      clientLastName,
      dogName,
      sessionNumber,
      bookingDate,
      bookingTime,
      emailSubject: `Session ${sessionNumber} Plan - ${dogName}`,
      timestamp: new Date().toISOString(),
    };

    console.log("[PDF-GEN] Webhook payload:", JSON.stringify(webhookData, null, 2));

    const makeRes = await fetch(
      "https://hook.eu1.make.com/lbfmnhl3xpf7c0y2sfos3vdln6y1fmqm",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookData),
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
      pdfUrl,
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