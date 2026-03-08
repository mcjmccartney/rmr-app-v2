import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function buildInvoiceHtml(params: {
  clientFirstName: string;
  clientLastName: string;
  dogName: string;
  rows: Array<{ date: string; service: string; amount: number; paid: boolean }>;
  grandTotal: number;
  generatedDate: string;
}): string {
  const { clientFirstName, clientLastName, dogName, rows, grandTotal, generatedDate } = params;

  const rowsHtml = rows.map((row, i) => `
    <tr style="${i % 2 === 1 ? 'background: rgba(255,255,255,0.4);' : ''}">
      <td style="padding: 9px 12px; vertical-align: top; color: #374151; border-bottom: 1px solid #d4c9b8;">${formatDate(row.date)}</td>
      <td style="padding: 9px 12px; vertical-align: top; color: #1a1a1a; border-bottom: 1px solid #d4c9b8;">${row.service}</td>
      <td style="padding: 9px 12px; vertical-align: top; text-align: right; color: #1a1a1a; border-bottom: 1px solid #d4c9b8;">£${row.amount.toFixed(2)}</td>
      <td style="padding: 9px 12px; vertical-align: top; text-align: center; color: ${row.paid ? '#16a34a' : '#dc2626'}; font-weight: 600; font-size: 12px; border-bottom: 1px solid #d4c9b8;">${row.paid ? 'Paid' : 'Unpaid'}</td>
    </tr>
  `).join('');

  const dogLine = dogName ? `<p style="margin: 2px 0 0 0; font-size: 14px; color: #374151; font-weight: 500;">Dog: ${dogName}</p>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html {
      -webkit-font-smoothing: antialiased;
      margin: 0;
      padding: 0;
      background: #eaeade;
    }
    @page { size: A4; margin: 0; }
    .page {
      width: 210mm;
      min-height: 297mm;
      background: #eaeade;
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
    }
    .page-header { width: 100%; height: auto; display: block; }
    .page-content { padding: 28px 40px 40px 40px; flex: 1; }
    .table-footer {
      background: #92400e;
      padding: 12px 12px;
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      color: #ffffff;
      font-weight: 600;
      width: 100%;
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
  </style>
</head>
<body>
  <div class="page">
    <img src="https://i.ibb.co/qYk7fyKf/Header-Banner.png" alt="Header" class="page-header" />
    <div class="page-content">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: bold; margin: 0 0 8px 0; color: #1a1a1a;">Behavioural Support Payment Record</h1>
          <p style="margin: 0 0 2px 0; font-size: 14px; color: #374151; font-weight: 500;">Client: ${clientFirstName} ${clientLastName}</p>
          ${dogLine}
        </div>
        <div style="text-align: right; font-size: 12px; color: #6b7280; padding-top: 4px;">
          <div>Generated: ${generatedDate}</div>
        </div>
      </div>

      <p style="font-size: 13px; color: #4b5563; margin: 16px 0 20px 0; line-height: 1.5; font-style: italic;">
        Behaviour consultations and support provided following veterinary referral for behavioural concerns.
      </p>

      <table>
        <thead>
          <tr style="background: #92400e; color: white;">
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 13px; width: 100px;">Date</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 600; font-size: 13px;">Service</th>
            <th style="padding: 10px 12px; text-align: right; font-weight: 600; font-size: 13px; width: 90px;">Amount</th>
            <th style="padding: 10px 12px; text-align: center; font-weight: 600; font-size: 13px; width: 70px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 12px; text-align: right; color: #92400e; border-top: 2px solid #92400e; font-weight: 700; font-size: 14px; background: rgba(146,64,14,0.07);">Grand Total</td>
            <td style="padding: 12px; text-align: right; color: #92400e; border-top: 2px solid #92400e; font-weight: 700; font-size: 14px; background: rgba(146,64,14,0.07);">£${grandTotal.toFixed(2)}</td>
            <td style="border-top: 2px solid #92400e; background: rgba(146,64,14,0.07);"></td>
          </tr>
        </tfoot>
      </table>
      <div class="table-footer">
        <span>Molly Fisher, Behavioural Specialist<br />(Trading as Raising My Rescue)</span>
        <span>raisingmyrescue@outlook.com</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

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

    // Fetch data server-side — avoids all client-side auth/redirect issues
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('client_id', clientId)
      .order('booking_date', { ascending: true });

    const { data: aliases } = await supabase
      .from('client_email_aliases')
      .select('*')
      .eq('client_id', clientId);

    const emails = [
      client.email,
      ...(aliases || []).map((a: any) => a.email),
    ].filter(Boolean).map((e: string) => e.toLowerCase());

    const { data: memberships } = await supabase
      .from('memberships')
      .select('*')
      .in('email', emails)
      .order('date', { ascending: true });

    // Build merged, sorted rows
    const rows: Array<{ date: string; service: string; amount: number; paid: boolean }> = [];

    for (const s of sessions || []) {
      rows.push({
        date: s.booking_date,
        service: s.session_type || 'Session',
        amount: s.quote || 0,
        paid: !!s.session_paid,
      });
    }

    for (const m of memberships || []) {
      rows.push({
        date: m.date,
        service: 'Behaviour Support Programme (Monthly)',
        amount: m.amount || 0,
        paid: true,
      });
    }

    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const grandTotal = rows.reduce((sum, r) => sum + r.amount, 0);
    const generatedDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    const firstName = clientFirstName || client.first_name || '';
    const lastName = clientLastName || client.last_name || '';
    const dogName = client.dog_name || '';

    console.log(`[INVOICE-PDF] Data fetched: ${rows.length} rows, £${grandTotal.toFixed(2)} total`);

    const html = buildInvoiceHtml({ clientFirstName: firstName, clientLastName: lastName, dogName, rows, grandTotal, generatedDate });

    // Launch browser
    const isProduction = !!process.env.VERCEL_ENV && process.env.VERCEL_ENV === 'production';

    if (isProduction) {
      const chromiumPackUrl = 'https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.x64.tar';
      const executablePath = await chromium.executablePath(chromiumPackUrl);
      browser = await puppeteer.launch({ args: chromium.args, executablePath, headless: true });
    } else {
      const puppeteerFull = await import('puppeteer');
      browser = await puppeteerFull.default.launch({ headless: true });
    }

    console.log("[INVOICE-PDF] Browser launched");

    const page = await browser.newPage();

    // Load HTML directly — no network requests, no auth issues
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 60_000 });

    await page.evaluate(() => document.fonts.ready);
    await new Promise(resolve => setTimeout(resolve, 1000));

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

    const filename = `${firstName} ${lastName} - Behavioural Support Payment Record.pdf`;

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
