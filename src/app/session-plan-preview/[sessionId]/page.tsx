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
        throw new Error(result.error || 'Failed to generate PDF');
      }

      setButtonText("✓ PDF Created!");
      alert('PDF generated successfully!\n\nAn Outlook draft email has been created.');

      if (result.pdfUrl && confirm('Would you like to view the PDF?')) {
        window.open(result.pdfUrl, '_blank');
      }

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
    <div style={{
      minHeight: '100vh',
      background: isPlaywrightMode ? 'white' : '#ecebdd',
      fontFamily: 'Arial, sans-serif',
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

      {/* SESSION PLAN CONTENT */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
        background: 'white',
        minHeight: '100vh'
      }}>

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

        {/* Action Points */}
        {editableActionPoints.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {editableActionPoints.map((ap, i) => (
              <div key={i}>
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
            ))}
          </div>
        )}

        <div style={{ marginTop: '5rem', fontSize: '0.875rem', color: '#374151' }}>
          <strong>Reminder:</strong> Behavioural reports are for guidance only.
        </div>
      </div>

      {/* CSS for PDF generation */}
      <style>{`
        @page {
          size: A4;
          margin: 20mm;
        }

        @media print {
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}