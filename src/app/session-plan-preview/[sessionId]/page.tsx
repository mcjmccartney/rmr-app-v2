'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SessionPlan, Session, Client, ActionPoint } from '@/types';
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer';
import { cooperLtBT } from '@/app/fonts';

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
      {/* CSS for fonts and page layout */}
      <style>{`
        body, html {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
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
          height: 297mm;
          background: #e6e6db;
          position: relative;
          page-break-after: always;
          margin: 0 auto 2rem auto;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .page:last-child {
          page-break-after: auto;
          margin-bottom: 0;
        }

        .page-header {
          width: 100%;
          height: auto;
          margin-bottom: 20px;
        }

        .page-footer {
          width: 100%;
          height: auto;
          position: absolute;
          bottom: 0;
          left: 0;
        }

        .page-content {
          padding: 0rem 3.4rem;
          flex: 1;
        }

        .action-point {
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 2rem;
        }

        .action-points-container {
          page-break-before: always;
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

      <div className={`pdf-viewer ${cooperLtBT.className}`} style={{
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
              <div style={{ marginBottom: '2rem', position: 'relative' }}>
                <h3 style={{
                  fontSize: '1.875rem',
                  fontStyle: 'italic',
                  position: 'absolute',
                  top: '-1rem',
                  left: '1.5rem',
                  background: '#e6e6db',
                  padding: '0 0.5rem',
                  zIndex: 1
                }}>
                  Main Goals
                </h3>
                <div style={{
                  border: '5px solid #4e6749',
                  borderRadius: '0.5rem',
                  padding: '1.5rem 1rem 1rem 1rem',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem 2rem'
                }}>
                  {mainGoals.map((g, i) => (
                    <p key={i} style={{ margin: 0, color: '#1f2937', fontFamily: 'Arial, sans-serif' }}>
                      <SafeHtmlRenderer html={g} />
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation of Behaviour */}
            {explanationOfBehaviour && (
              <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.875rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                  Explanation of Behaviour
                </h3>
                <div style={{ fontFamily: 'Arial, sans-serif' }}>
                  <SafeHtmlRenderer html={explanationOfBehaviour} />
                </div>
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

        {/* PAGE 2+ - Action Points (2 per page) */}
        {editableActionPoints.length > 0 && (() => {
          const pages = [];
          const pointsPerPage = 2;

          for (let pageIndex = 0; pageIndex < Math.ceil(editableActionPoints.length / pointsPerPage); pageIndex++) {
            const startIdx = pageIndex * pointsPerPage;
            const endIdx = Math.min(startIdx + pointsPerPage, editableActionPoints.length);
            const pagePoints = editableActionPoints.slice(startIdx, endIdx);
            const isLastPage = endIdx === editableActionPoints.length;

            pages.push(
              <div key={`action-page-${pageIndex}`} className="page">
                {/* Header Banner */}
                <img
                  src="https://i.ibb.co/qYk7fyKf/Header-Banner.png"
                  alt="Header"
                  className="page-header"
                />

                <div className="page-content">
                  {/* Title on first Action Point page only */}
                  {pageIndex === 0 && (
                    <>
                      <h1 style={{ fontSize: '2.25rem', marginBottom: '2.5rem', fontWeight: 'bold' }}>
                        {title}
                      </h1>
                    </>
                  )}

                  {/* Action Points for this page */}
                  {pagePoints.map((ap, i) => (
                    <div
                      key={startIdx + i}
                      className="action-point"
                      style={{
                        position: 'relative',
                        marginTop: (pageIndex === 0 && i === 0) ? '2rem' : (pageIndex > 0 && i === 0) ? '2rem' : '0',
                        marginBottom: '2rem'
                      }}
                    >
                      <h3 style={{
                        fontSize: '1.875rem',
                        fontStyle: 'italic',
                        position: 'absolute',
                        top: '-1rem',
                        left: '1.5rem',
                        background: '#e6e6db',
                        padding: '0 0.5rem',
                        zIndex: 1
                      }}>
                        <SafeHtmlRenderer html={ap.header} />
                      </h3>
                      <div style={{
                        border: '5px solid #4e6749',
                        borderRadius: '0.5rem',
                        padding: '1.5rem 1rem 1rem 1rem',
                        fontFamily: 'Arial, sans-serif'
                      }}>
                        <SafeHtmlRenderer html={ap.details} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reminder on last page - absolutely positioned above footer */}
                {isLastPage && (
                  <div style={{
                    position: 'absolute',
                    bottom: '120px',
                    left: '3.4rem',
                    right: '3.4rem',
                    fontSize: '16px',
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    <p style={{ margin: 0 }}>
                      <strong>Reminder:</strong>
                      <br />
                      I'm here to support you and your dog from a behavioural perspective. Sometimes, behavioural challenges can be linked to pain, diet, or physical discomfort, so I may highlight these areas if they seem relevant based on behavioural symptoms you've shared with me or that I've observed. Any thoughts I share within this report or any other communication with you around health, food, or physical wellbeing are intended to guide your conversations with your vet, physiotherapist, or nutritionist. I'm not a vet and don't offer medical advice or diagnosis.
                    </p>
                  </div>
                )}

                {/* Footer for Page 2+ */}
                <img
                  src="https://i.ibb.co/3Y4bTFNt/Screenshot-2025-11-13-at-15-28-11.png"
                  alt="Footer Page 2+"
                  className="page-footer"
                />
              </div>
            );
          }

          return pages;
        })()}
      </div>
    </>
  );
}