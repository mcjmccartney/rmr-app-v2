import { NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import playwright from "playwright-core";

// --- Supabase ---
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 300; // Vercel max limit

export async function GET(req: Request) {
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

    console.log("Launching Chromium...");

    const executablePath = await chromium.executablePath();

    const browser = await playwright.chromium.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    const previewUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/session-plan-preview/${sessionId}?pagedjs=print`;

    console.log("Navigating to:", previewUrl);

    await page.goto(previewUrl, {
      waitUntil: "networkidle",
      timeout: 120_000,
    });

    // Wait for Paged.js ready attribute
    await page.waitForFunction(
      () => document.body.getAttribute("data-paged-ready") === "true",
      { timeout: 120_000 }
    );

    console.log("Paged.js ready. Generating PDF...");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    await browser.close();

    // --- Upload to Supabase ---
    const filePath = `session-plans/${sessionId}-${Date.now()}.pdf`;

    const upload = await supabase.storage
      .from("session-plans")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
      });

    if (upload.error) {
      console.error("Upload error:", upload.error);
      return NextResponse.json(
        { error: upload.error.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("session-plans")
      .getPublicUrl(filePath);

    const pdfUrl = publicUrlData.publicUrl;

    console.log("PDF uploaded:", pdfUrl);

    // --- Send to Make.com ---
    console.log("Sending webhook to Make.com...");

    const makeRes = await fetch(
      "https://hook.eu1.make.com/lbfmnhl3xpf7c0y2sfos3vdln6y1fmqm",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      }
    );

    if (!makeRes.ok) {
      const text = await makeRes.text();
      console.error("Make.com error:", text);
      return NextResponse.json(
        { error: `Make.com error: ${text}` },
        { status: 500 }
      );
    }

    console.log("Webhook sent successfully.");

    return NextResponse.json({ success: true, pdfUrl });
  } catch (err: any) {
    console.error("Unhandled PDF generation error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}