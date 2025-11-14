'use client';

import { useState } from 'react';

interface PDFGenerateButtonProps {
  sessionId: string;
  session: {
    id: string;
    dogName?: string;
    bookingDate: string;
    bookingTime: string;
  } | null;
  client: {
    email: string;
    firstName: string;
    lastName: string;
    dogName: string;
  } | null;
  sessionPlan: {
    sessionNumber: number;
  } | null;
}

export default function PDFGenerateButton({ sessionId, session, client, sessionPlan }: PDFGenerateButtonProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generateAndSendPDF = async () => {
    if (!session || !client || !sessionPlan) {
      alert('Session data not loaded yet. Please wait.');
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Dynamically import libraries
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Get all rendered Paged.js pages
      const pages = document.querySelectorAll('.pagedjs_page');
      
      if (pages.length === 0) {
        alert('No pages found. Please wait for the document to render.');
        setIsGeneratingPDF(false);
        return;
      }

      console.log(`Capturing ${pages.length} pages...`);

      // Create new jsPDF document (A4 size, portrait)
      const pdf = new jsPDF('portrait', 'mm', 'a4');

      // Capture each page with html2canvas
      for (let i = 0; i < pages.length; i++) {
        console.log(`Capturing page ${i + 1}/${pages.length}...`);
        
        const canvas = await html2canvas(pages[i] as HTMLElement, {
          scale: 2, // High quality (2x resolution)
          backgroundColor: '#ecebdd', // Your page background color
          logging: false,
          useCORS: true, // Allow cross-origin images (fonts)
          allowTaint: true
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage(); // Add new page for subsequent pages
        }

        // Add image to PDF (A4 dimensions: 210mm x 297mm)
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      console.log('PDF generated, uploading to Supabase...');

      // Convert PDF to blob
      const pdfBlob = pdf.output('blob');

      // Upload to Supabase Storage
      const formData = new FormData();
      formData.append('file', pdfBlob, `session-plan-${session.id}.pdf`);
      formData.append('sessionId', session.id);

      const uploadResponse = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(`Failed to upload PDF: ${errorData.error}`);
      }

      const { pdfUrl } = await uploadResponse.json();
      console.log('PDF uploaded to:', pdfUrl);

      console.log('Sending to Make.com webhook...');

      // Send to Make.com webhook
      const response = await fetch('https://hook.eu1.make.com/lbfmnhl3xpf7c0y2sfos3vdln6y1fmqm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          pdfUrl: pdfUrl, // URL to download PDF from Supabase
          clientEmail: client.email,
          clientFirstName: client.firstName,
          clientLastName: client.lastName,
          dogName: session.dogName || client.dogName,
          sessionNumber: sessionPlan.sessionNumber,
          bookingDate: session.bookingDate,
          bookingTime: session.bookingTime,
          emailSubject: `Session ${sessionPlan.sessionNumber} Plan - ${session.dogName || client.dogName}`,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('PDF sent successfully! Check your email for the draft.');
        console.log('PDF sent to Make.com successfully');
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to send PDF: ${response.status} - ${errorText}`);
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <button
      onClick={generateAndSendPDF}
      disabled={isGeneratingPDF}
      className="text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ 
        backgroundColor: isGeneratingPDF ? '#7a2f00' : '#973b00',
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 999999
      }}
      onMouseEnter={(e) => !isGeneratingPDF && (e.currentTarget.style.backgroundColor = '#7a2f00')}
      onMouseLeave={(e) => !isGeneratingPDF && (e.currentTarget.style.backgroundColor = '#973b00')}
    >
      {isGeneratingPDF ? 'Generating PDF...' : 'Generate PDF Email'}
    </button>
  );
}

