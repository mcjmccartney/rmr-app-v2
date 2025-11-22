'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SessionPlan, Session, Client, ActionPoint } from '@/types';
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer';

interface EditableActionPoint {
  header: string;
  details: string;
}

export default function SessionPlanPreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const isPlaywrightMode = searchParams.get("playwright") === "true";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [actionPoints, setActionPoints] = useState<ActionPoint[]>([]);
  const [editableActionPoints, setEditableActionPoints] = useState<EditableActionPoint[]>([]);
  const [mainGoals, setMainGoals] = useState<string[]>([]);
  const [explanationOfBehaviour, setExplanationOfBehaviour] = useState('');
  const [title, setTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [buttonText, setButtonText] = useState('Generate PDF & Send Email');

  /* -------------------------------------------
     SIGNAL READY FOR PLAYWRIGHT
  -------------------------------------------- */
  useEffect(() => {
    if (!loading) {
      // Signal that content is ready (for Playwright PDF generation)
      document.body.setAttribute("data-paged-ready", "true");
    }
  }, [loading]);

  /* -------------------------------------------
     PDF GENERATION HANDLER
  -------------------------------------------- */
  const handleGeneratePDF = async () => {
    if (!sessionPlan || !session || !client) {
      alert("Missing required data. Please refresh the page and try again.");
      return;
    }

    setIsGenerating(true);
    setButtonText("Generating PDF...");

    try {
      const params = new URLSearchParams({
        sessionId: sessionPlan.sessionId,
        clientEmail: client.email || '',
        clientFirstName: client.firstName || '',
        clientLastName: client.lastName || '',
        dogName: session.dogName || client.dogName || '',
        sessionNumber: sessionPlan.sessionNumber?.toString() || '1',
        bookingDate: session.bookingDate || '',
        bookingTime: session.bookingTime || '',
      });

      const response = await fetch(`/api/generate-session-plan-pdf?${params}`);
      const result = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', result);
        const errorMsg = result.error || 'Failed to generate PDF';
        const errorDetails = result.details ? `\n\nDetails: ${result.details}` : '';
        throw new Error(errorMsg + errorDetails);
      }

      setButtonText("✓ Email Draft Created!");
      alert('PDF generated successfully!\n\nAn Outlook draft email has been created with the PDF attached.\nCheck your Outlook drafts folder to review and send.');

      setTimeout(() => {
        setButtonText("Generate PDF & Send Email");
        setIsGenerating(false);
      }, 3000);

    } catch (error: any) {
      alert(`Failed to generate PDF: ${error.message}`);
      setButtonText("Generate PDF & Send Email");
      setIsGenerating(false);
    }
  };

  /* -------------------------------------------
     FETCH DATA
  -------------------------------------------- */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/session-plan-preview/${sessionId}`);
        const json = await res.json();

        if (!res.ok) throw new Error(json.error);

        const plan = json.sessionPlan;
        const sess = json.session;
        const cli = json.client;
        const apList = json.actionPoints;

        /* Build plan */
        const planObj: SessionPlan = {
          id: plan.id,
          sessionId: plan.session_id,
          sessionNumber: plan.session_number,
          mainGoal1: plan.main_goal_1,
          mainGoal2: plan.main_goal_2,
          mainGoal3: plan.main_goal_3,
          mainGoal4: plan.main_goal_4,
          explanationOfBehaviour: plan.explanation_of_behaviour,
          actionPoints: plan.action_points || [],
          editedActionPoints: plan.edited_action_points || {},
          documentEditUrl: plan.document_edit_url,
          noFirstPage: plan.no_first_page ?? true,
          createdAt: new Date(plan.created_at),
          updatedAt: new Date(plan.updated_at),
        };

        setSessionPlan(planObj);
        setSession(sess);
        setClient(cli);

        /* Goals */
        setMainGoals([
          plan.main_goal_1,
          plan.main_goal_2,
          plan.main_goal_3,
          plan.main_goal_4,
        ].filter(Boolean));

        setExplanationOfBehaviour(plan.explanation_of_behaviour || "");

        /* Action points */
        const aps: EditableActionPoint[] = [];
        for (const id of plan.action_points || []) {
          const ap = apList.find((x: any) => x.id === id);
          if (!ap) continue;

          const edited = plan.edited_action_points?.[id];
          aps.push({
            header: edited?.header || ap.header,
            details: edited?.details || ap.details,
          });
        }
        setEditableActionPoints(aps);

        /* Title */
        const dogName = sess.dog_name || cli.dog_name || "Dog";
        setTitle(`Session ${plan.session_number} - ${dogName}`);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
        setLoading(false);
      }
    }

    if (sessionId) load();
  }, [sessionId]);

  /* -------------------------------------------
     RENDER
  -------------------------------------------- */
  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen bg-white flex items-center justify-center">Error: {error}</div>;

  return (
    <>
      {/* FONT FACES */}
      <style>{`
        @font-face {
          font-family: 'Cooper Lt BT';
          src: url('/fonts/cooperltbt-regular-webfont.woff2') format('woff2'),
               url('/fonts/cooperltbt-regular-webfont.woff') format('woff');
          font-weight: normal;
          font-style: normal;
        }

        @font-face {
          font-family: 'Cooper Lt BT';
          src: url('/fonts/cooperltbt-bold-webfont.woff2') format('woff2'),
               url('/fonts/cooperltbt-bold-webfont.woff') format('woff');
          font-weight: bold;
          font-style: normal;
        }

        @font-face {
          font-family: 'Cooper Lt BT';
          src: url('/fonts/cooperltbt-italic-webfont.woff2') format('woff2'),
               url('/fonts/cooperltbt-italic-webfont.woff') format('woff');
          font-weight: normal;
          font-style: italic;
        }

        @font-face {
          font-family: 'Cooper Lt BT';
          src: url('/fonts/cooperltbt-bolditalic-webfont.woff2') format('woff2'),
               url('/fonts/cooperltbt-bolditalic-webfont.woff') format('woff');
          font-weight: bold;
          font-style: italic;
        }

        @font-face {
          font-family: 'Cooper Md BT';
          src: url('/fonts/coopermdbt-regular-webfont.woff2') format('woff2'),
               url('/fonts/coopermdbt-regular-webfont.woff') format('woff');
          font-weight: normal;
          font-style: normal;
        }

        @font-face {
          font-family: 'Cooper Blk BT';
          src: url('/fonts/cooperblkbt-regular-webfont.woff2') format('woff2'),
               url('/fonts/cooperblkbt-regular-webfont.woff') format('woff');
          font-weight: normal;
          font-style: normal;
        }

        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          button {
            display: none !important;
          }
        }

        .pdf-viewer {
          background: #525659;
          min-height: 100vh;
          padding: 2rem 0;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          background: #e6e6db;
          position: relative;
          page-break-after: always;
          margin: 0 auto 2rem auto;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
        }

        .page:last-child {
          page-break-after: auto;
          margin-bottom: 0;
        }

        .page-header {
          width: 100%;
          height: auto;
        }

        .page-footer {
          width: 100%;
          height: auto;
          position: absolute;
          bottom: 0;
          left: 0;
        }

        .page-content {
          padding: 1rem 2rem;
        }

        .action-point {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        @media print {
          .pdf-viewer {
            background: white;
            padding: 0;
          }

          .page {
            margin: 0;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="pdf-viewer" style={{
        fontFamily: "'Cooper Lt BT', Georgia, serif",
        position: 'relative'
      }}>

        {/* PDF GENERATION BUTTON - Only in user preview mode */}
        {!isPlaywrightMode && (
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              backgroundColor: buttonText.includes('✓') ? '#059669' : '#973b00',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              border: 'none',
              cursor: isGenerating ? 'wait' : 'pointer',
              zIndex: 999999,
              fontSize: '1rem',
              opacity: isGenerating ? 0.7 : 1,
            }}
          >
            {buttonText}
          </button>
        )}

        {/* PAGE 1 - Title, Main Goals, Explanation of Behaviour */}
        <div className="page">
          {/* Header Banner */}
          <img
            src="https://i.ibb.co/qYk7fyKf/Header-Banner.png"
            alt="Header"
            className="page-header"
          />

          <div className="page-content">
            <h1 style={{ fontSize: '2.25rem', marginBottom: '2.5rem', fontWeight: 'bold' }}>
              {title}
            </h1>

            {/* Main Goals */}
            {mainGoals.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.875rem', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                  Main Goals
                </h3>
                {mainGoals.map((g, i) => (
                  <p key={i} style={{ marginBottom: '0.5rem', color: '#1f2937' }}>
                    • <SafeHtmlRenderer html={g} />
                  </p>
                ))}
              </div>
            )}

            {/* Explanation of Behaviour */}
            {explanationOfBehaviour && (
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.875rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                  Explanation of Behaviour
                </h3>
                <SafeHtmlRenderer html={explanationOfBehaviour} />
              </div>
            )}
          </div>

          {/* Footer for Page 1 */}
          <img
            src="https://i.ibb.co/MkVL9vXD/Screenshot-2025-11-13-at-15-28-11.png"
            alt="Footer Page 1"
            className="page-footer"
          />
        </div>

        {/* PAGE 2+ - Action Points */}
        <h1 style={{ fontSize: '2.25rem', marginBottom: '2.5rem', fontWeight: 'bold' }}>
              {title}
            </h1>

        {editableActionPoints.length > 0 && editableActionPoints.map((ap, i) => (
          <div key={i} className="page">
            {/* Header Banner */}
            <img
              src="https://i.ibb.co/qYk7fyKf/Header-Banner.png"
              alt="Header"
              className="page-header"
            />

            <div className="page-content">
              <div className="action-point">
                <h3 style={{ fontSize: '1.875rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                  <SafeHtmlRenderer html={ap.header} />
                </h3>
                <div style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  padding: '1rem',
                  background: '#f9fafb'
                }}>
                  <SafeHtmlRenderer html={ap.details} />
                </div>
              </div>

              {/* Reminder on last action point */}
              {i === editableActionPoints.length - 1 && (
                <div style={{ marginTop: '5rem', fontSize: '0.875rem', color: '#374151' }}>
                  <strong>Reminder:</strong> Behavioural reports are for guidance only.
                </div>
              )}
            </div>

            {/* Footer for Page 2+ */}
            <img
              src="https://i.ibb.co/3Y4bTFNt/Screenshot-2025-11-13-at-15-28-11.png"
              alt="Footer Page 2+"
              className="page-footer"
            />
          </div>
        ))}
      </div>
    </>
  );
}