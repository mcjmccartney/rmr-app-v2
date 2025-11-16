import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import playwright from "playwright-core";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const clientEmail = req.nextUrl.searchParams.get("clientEmail");
    const clientFirstName = req.nextUrl.searchParams.get("clientFirstName");
    const clientLastName = req.nextUrl.searchParams.get("clientLastName");
    const dogName = req.nextUrl.searchParams.get("dogName");
    const sessionNumber = req.nextUrl.searchParams.get("sessionNumber");
    const bookingDate = req.nextUrl.searchParams.get("bookingDate");
    const bookingTime = req.nextUrl.searchParams.get("bookingTime");

    const BASE_URL =
      process.env.BASE_URL || "https://rmrcms.vercel.app";

    const url = `${BASE_URL}/session-plan-preview/${sessionId}?pagedjs=print`;

    console.log("Generating PDF for:", url);

    // --------- LAUNCH CHROME ----------
    const browser = await playwright.chromium.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage({
      viewport: { width: 1200, height: 1600 },
    });

    await page.goto(url, { waitUntil: "networkidle", timeout: 40000 });
    await page.waitForSelector("[data-paged-ready='true']", { timeout: 40000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();

    // -----------------------------------
    //  UPLOAD PDF TO SUPABASE STORAGE
    // -----------------------------------

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fileName = `session-plan-${sessionId}-${Date.now()}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("session-plans")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("session-plans")
      .getPublicUrl(fileName);

    const pdfUrl = urlData.publicUrl;

    console.log("PDF stored at:", pdfUrl);

    // -----------------------------------
    // SEND TO MAKE.COM WEBHOOK
    // -----------------------------------

    const webhookResponse = await fetch(
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

    if (!webhookResponse.ok) {
      const text = await webhookResponse.text();
      throw new Error(`Make.com error: ${text}`);
    }

    return NextResponse.json({ pdfUrl, success: true });
  } catch (error: any) {
    console.error("PDF Generator Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}