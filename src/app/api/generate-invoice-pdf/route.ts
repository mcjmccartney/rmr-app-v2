import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  let browser;

  try {
    const { searchParams } = new URL(req.url);

    const clientId = searchParams.get("clientId")!;
    const clientFirstName = searchParams.get("clientFirstName") ?? "";
    const clientLastName = searchParams.get("clientLastName") ?? "";

    if (!clientId) {
      return NextResponse.json({ error: "Missing required clientId" }, { status: 400 });
    }

    console.log(`[INVOICE-PDF] Starting PDF generation for client ${clientId}`);

    const isProduction = !!process.env.VERCEL_ENV && process.env.VERCEL_ENV === 'production';

    if (isProduction) {
      const chromiumPackUrl = 'https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.x64.tar';
      const executablePath = await chromium.executablePath(chromiumPackUrl);

      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath,
        headless: true,
      });
    } else {
      const puppeteerFull = await import('puppeteer');
      browser = await puppeteerFull.default.launch({ headless: true });
    }

    console.log("[INVOICE-PDF] Browser launched");

    const page = await browser.newPage();

    // Capture page console messages and errors for debugging
    page.on('console', (msg) => console.log(`[INVOICE-PDF][PAGE-${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => console.error(`[INVOICE-PDF][PAGE-ERROR] ${String(err)}`));
    page.on('requestfailed', (req) => console.error(`[INVOICE-PDF][REQ-FAIL] ${req.url()} - ${req.failure()?.errorText}`));

    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    }

    const previewUrl = `${baseUrl}/invoice-preview/${clientId}?playwright=true`;
    console.log(`[INVOICE-PDF] Loading: ${previewUrl}`);

    await page.goto(previewUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });

    console.log("[INVOICE-PDF] DOM content loaded, waiting for data-paged-ready...");

    // Wait up to 60s for React to finish loading data and set the ready signal
    await page.waitForFunction(
      () => document.body.getAttribute("data-paged-ready") === "true",
      { timeout: 60_000 }
    );

    console.log("[INVOICE-PDF] data-paged-ready confirmed");

    await page.evaluate(() => document.fonts.ready);
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("[INVOICE-PDF] Generating PDF...");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
      preferCSSPageSize: false,
    });

    await browser.close();
    browser = null;

    console.log(`[INVOICE-PDF] PDF generated (${pdfBuffer.length} bytes)`);

    const filename = `${clientFirstName} ${clientLastName} - Behavioural Support Payment Record.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (err: any) {
    console.error("[INVOICE-PDF] Error:", err.message);
    if (browser) {
      try { await browser.close(); } catch {}
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
