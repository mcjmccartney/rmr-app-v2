'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface InvoiceRow {
  date: string;
  service: string;
  amount: number;
  paid: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function InvoicePreviewContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.clientId as string;
  const isPlaywrightMode = searchParams.get('playwright') === 'true';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [dogName, setDogName] = useState('');
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [buttonText, setButtonText] = useState('Download PDF');

  useEffect(() => {
    async function load() {
      console.log(`[INVOICE] Starting load for clientId: ${clientId}`);
      try {
        console.log(`[INVOICE] Fetching /api/invoice-preview/${clientId}`);
        const res = await fetch(`/api/invoice-preview/${clientId}`);
        console.log(`[INVOICE] Fetch response status: ${res.status}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        const { client, sessions, memberships } = json;
        console.log(`[INVOICE] Data loaded: ${sessions?.length} sessions, ${memberships?.length} memberships`);

        setClientName(`${client.first_name} ${client.last_name}`);
        setClientFirstName(client.first_name || '');
        setClientLastName(client.last_name || '');
        setDogName(client.dog_name || '');

        const allRows: InvoiceRow[] = [];

        for (const s of sessions || []) {
          allRows.push({
            date: s.booking_date,
            service: s.session_type || 'Session',
            amount: s.quote || 0,
            paid: !!s.session_paid,
          });
        }

        for (const m of memberships || []) {
          allRows.push({
            date: m.date,
            service: 'Behaviour Support Programme (Monthly)',
            amount: m.amount || 0,
            paid: true,
          });
        }

        allRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setRows(allRows);
        setGrandTotal(allRows.reduce((sum, r) => sum + r.amount, 0));
        setLoading(false);
      } catch (err: any) {
        console.error(`[INVOICE] Load error: ${err.message}`);
        setError(err.message);
        setLoading(false);
      }
    }

    if (clientId) load();
    else console.warn('[INVOICE] No clientId available');
  }, [clientId]);

  useEffect(() => {
    console.log(`[INVOICE] loading changed to: ${loading}`);
    if (!loading) {
      console.log('[INVOICE] Setting data-paged-ready=true');
      document.body.setAttribute('data-paged-ready', 'true');
    }
  }, [loading]);

  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    setButtonText('Generating PDF...');
    try {
      const params = new URLSearchParams({
        clientId,
        clientFirstName,
        clientLastName,
      });
      const res = await fetch(`/api/generate-invoice-pdf?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${clientFirstName} ${clientLastName} - Behavioural Support Payment Record.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setButtonText('✓ Downloaded!');
      setTimeout(() => setButtonText('Download PDF'), 3000);
    } catch (err: any) {
      alert(`Failed to generate PDF: ${err.message}`);
      setButtonText('Download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', background: '#eaeade', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>Loading...</div>;
  if (error) return (
    <div style={{ minHeight: '100vh', background: '#eaeade', padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#dc2626' }}>Error loading invoice data</h2>
      <p style={{ color: '#374151', marginTop: '8px' }}>{error}</p>
      <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '12px' }}>clientId: {clientId}</p>
    </div>
  );

  return (
    <>
      <style>{`
        body, html {
          -webkit-font-smoothing: antialiased;
          margin: 0;
          padding: 0;
        }

        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          button { display: none !important; }
          .pdf-viewer { background: #eaeade; padding: 0; }
          .page { margin: 0; box-shadow: none; }
        }

        .pdf-viewer {
          background: #525659;
          min-height: 100vh;
          padding: 2rem 0;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          background: #eaeade;
          position: relative;
          margin: 0 auto 2rem auto;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
        }

        .page-header {
          width: 100%;
          height: auto;
          display: block;
        }

        .page-content {
          padding: 28px 40px 40px 40px;
          flex: 1;
        }

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
          font-family: Arial, sans-serif;
          width: 100%;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        thead tr {
          background: #92400e;
          color: white;
        }

        thead th {
          padding: 10px 12px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
        }

        tbody tr {
          border-bottom: 1px solid #d4c9b8;
        }

        tbody tr:nth-child(even) {
          background: rgba(255,255,255,0.4);
        }

        tbody td {
          padding: 9px 12px;
          vertical-align: top;
        }

        .grand-total-row td {
          padding: 12px 12px;
          border-top: 2px solid #92400e;
          font-weight: 700;
          font-size: 14px;
          background: rgba(146,64,14,0.07);
        }
      `}</style>

      <div className="pdf-viewer">
        <div className="page">
          <img
            src="https://i.ibb.co/qYk7fyKf/Header-Banner.png"
            alt="Header"
            className="page-header"
          />

          <div className="page-content">
            {/* Title row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1a1a1a' }}>
                  Behavioural Support Payment Record
                </h1>
                <p style={{ margin: '0 0 2px 0', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                  Client: {clientName}
                </p>
                {dogName && (
                  <p style={{ margin: 0, fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                    Dog: {dogName}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280', paddingTop: '4px' }}>
                <div>Generated: {generatedDate}</div>
              </div>
            </div>

            {/* Subtitle */}
            <p style={{ fontSize: '13px', color: '#4b5563', margin: '16px 0 20px 0', lineHeight: '1.5', fontStyle: 'italic' }}>
              Behaviour consultations and support provided following veterinary referral for behavioural concerns.
            </p>

            {/* Table */}
            <table>
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Date</th>
                  <th>Service</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>Amount</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: '#374151' }}>{formatDate(row.date)}</td>
                    <td style={{ color: '#1a1a1a' }}>{row.service}</td>
                    <td style={{ textAlign: 'right', color: '#1a1a1a' }}>£{row.amount.toFixed(2)}</td>
                    <td style={{ textAlign: 'center', color: row.paid ? '#16a34a' : '#dc2626', fontWeight: '600', fontSize: '12px' }}>
                      {row.paid ? 'Paid' : 'Unpaid'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="grand-total-row">
                  <td colSpan={2} style={{ textAlign: 'right', color: '#92400e' }}>Grand Total</td>
                  <td style={{ textAlign: 'right', color: '#92400e' }}>£{grandTotal.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
            <div className="table-footer">
              <span>Molly Fisher, Behavioural Specialist<br />(Trading as Raising My Rescue)</span>
              <span>raisingmyrescue@outlook.com</span>
            </div>
          </div>
        </div>
      </div>

      {!isPlaywrightMode && (
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            backgroundColor: buttonText.includes('✓') ? '#059669' : '#4e6749',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: '500',
            border: 'none',
            cursor: isDownloading ? 'wait' : 'pointer',
            zIndex: 999999,
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
          }}
        >
          {buttonText}
        </button>
      )}
    </>
  );
}

export default function InvoicePreviewPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#eaeade' }} />}>
      <InvoicePreviewContent />
    </Suspense>
  );
}
