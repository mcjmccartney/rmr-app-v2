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

    // --- Auto-detect REAL base URL (local or Vercel) ---
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!baseUrl) {
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else {
        baseUrl = "http://localhost:3000";
      }
    }

    const previewUrl = `${baseUrl}/session-plan-preview/${sessionId}?pagedjs=print`;

    console.log("Using preview URL:", previewUrl);

    // --- Load the session plan preview ---
    await page.goto(previewUrl, {
      waitUntil: "networkidle",
      timeout: 120_000,
    });

    // Wait for Paged.js signal
    await page.waitForFunction(
      () => document.body.getAttribute("data-paged-ready") === "true",
      { timeout: 120_000 }
    );

    console.log("Paged.js ready — generating PDF...");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
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
      console.error("Supabase upload error:", upload.error);
      return NextResponse.json(
        { error: upload.error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("session-plans")
      .getPublicUrl(filePath);

    const pdfUrl = publicUrlData.publicUrl;

    console.log("PDF uploaded to Supabase:", pdfUrl);

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
      const msg = await makeRes.text();
      console.error("Make.com webhook error:", msg);
      return NextResponse.json(
        { error: `Make.com error: ${msg}` },
        { status: 500 }
      );
    }

    console.log("Webhook sent successfully.");

    return NextResponse.json({
      success: true,
      pdfUrl,
    });
  } catch (err: any) {
    console.error("Unhandled PDF generator error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

const { data: listData, error: listError } = await supabase.storage.listBuckets();
console.log("Buckets in this project =", listData);
console.log("Bucket error =", listError);