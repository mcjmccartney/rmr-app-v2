'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { SessionPlan, Session, Client, ActionPoint } from '@/types';
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer';
import { cooperLtBT } from '@/app/fonts';
import { getSessionDogName } from '@/utils/dogNameUtils';

interface EditableActionPoint {
  header: string;
  details: string;
}

/* -----------------------------------------------------------------------
   NEW COMPONENT — DYNAMIC ACTION POINT PAGINATION
------------------------------------------------------------------------ */
interface DynamicActionPointPagesProps {
  title: string;
  editableActionPoints: EditableActionPoint[];
  isPlaywrightMode?: boolean;
  noFirstPage?: boolean;
  onPaginationComplete?: () => void;
}

function DynamicActionPointPages({ title, editableActionPoints, isPlaywrightMode = false, noFirstPage = true, onPaginationComplete }: DynamicActionPointPagesProps) {
  const [pages, setPages] = useState<EditableActionPoint[][]>([]);
  const [needsSeparateReminderPage, setNeedsSeparateReminderPage] = useState(false);

  useEffect(() => {
    if (!editableActionPoints || editableActionPoints.length === 0) return;

    // Approx A4 height in px (297mm * 3.78)
    const PAGE_HEIGHT = 297 * 3.78; // ~1122px
    // Header (113px) + margin (20px) + Middle Footer (113px) = 246px
    const CONTENT_MAX_MIDDLE = PAGE_HEIGHT - 246;
    // Header (113px) + margin (20px) + Final Footer (~93px) = ~226px
    const CONTENT_MAX_FINAL = PAGE_HEIGHT - 226;

    const tempWrapper = document.createElement('div');
    tempWrapper.style.position = 'absolute';
    tempWrapper.style.visibility = 'hidden';
    tempWrapper.style.width = '210mm';
    tempWrapper.style.padding = '20px 3.4rem 0 3.4rem';
    tempWrapper.style.fontFamily = 'Arial, sans-serif';
    document.body.appendChild(tempWrapper);

    // Measure the actual reminder height including margin
    const reminderBlock = document.createElement('div');
    reminderBlock.style.fontSize = '15px';
    reminderBlock.style.fontFamily = 'Arial, sans-serif';
    reminderBlock.style.marginTop = '2rem';
    reminderBlock.innerHTML = `
      <p style="margin: 0;">
        <strong>Reminder:</strong><br />
        I'm here to support you and your dog from a behavioural perspective.
        Sometimes, behavioural challenges can be linked to pain, diet, or
        physical discomfort, so I may highlight these areas if they seem
        relevant based on behavioural symptoms you've shared with me or that
        I've observed. Any thoughts I share within this report or any other
        communication with you around health, food, or physical wellbeing are
        intended to guide your conversations with your vet, physiotherapist,
        or nutritionist. I'm not a vet and don't offer medical advice or
        diagnosis.
      </p>
    `;
    tempWrapper.appendChild(reminderBlock);
    // Reminder now flows in the document with 2rem top margin
    const REMINDER_HEIGHT = reminderBlock.offsetHeight;
    tempWrapper.innerHTML = '';

    // Clear temp wrapper
    tempWrapper.innerHTML = '';

    const builtPages: EditableActionPoint[][] = [];
    let currentPage: EditableActionPoint[] = [];
    let pageIndex = 0;

    // Helper function to create an action point element
    const createActionPointElement = (ap: EditableActionPoint, isFirstOnPage: boolean, isLastOnPage: boolean) => {
      const wrapper = document.createElement('div');
      wrapper.style.marginBottom = '0';
      wrapper.style.marginTop = isFirstOnPage ? '0' : '1.5rem';
      wrapper.style.position = 'relative';

      const block = document.createElement('div');
      block.style.border = '5px solid #4e6749';
      block.style.borderRadius = '0.5rem';
      block.style.padding = '1.5rem 1rem 1rem 1rem';

      block.innerHTML = `
        <h3 style="font-size:1.875rem;font-style:italic;margin-bottom:1rem;">
          ${ap.header}
        </h3>
        <div class="action-point-content">
          ${ap.details}
        </div>
      `;

      const paragraphs = block.querySelectorAll('p');
      paragraphs.forEach((p, index) => {
        (p as HTMLElement).style.marginBottom = index === paragraphs.length - 1 ? '0' : '1rem';
      });

      wrapper.appendChild(block);
      return wrapper;
    };

    // Helper function to build and measure the current page
    const measureCurrentPage = () => {
      tempWrapper.innerHTML = '';

      // Add title on first page
      if (pageIndex === 0) {
        const titleBlock = document.createElement('h1');
        titleBlock.style.fontSize = '2.25rem';
        titleBlock.style.marginBottom = '1.5rem';
        titleBlock.style.fontWeight = 'bold';
        titleBlock.style.fontFamily = 'Arial, sans-serif';
        titleBlock.textContent = title;
        tempWrapper.appendChild(titleBlock);
      }

      // Add all action points on current page
      currentPage.forEach((ap, index) => {
        const isFirstOnPage = index === 0;
        const isLastOnPage = index === currentPage.length - 1;
        const element = createActionPointElement(ap, isFirstOnPage, isLastOnPage);
        tempWrapper.appendChild(element);
      });

      return tempWrapper.offsetHeight;
    };

    editableActionPoints.forEach((ap, apIndex) => {
      const isLastOverall = apIndex === editableActionPoints.length - 1;

      // Add action point to current page
      currentPage.push(ap);

      // Measure the current page with this action point
      const pageHeight = measureCurrentPage();

      // Determine content max for this page
      let contentMax = isLastOverall ? CONTENT_MAX_FINAL : CONTENT_MAX_MIDDLE;

      // Check if it fits
      if (pageHeight > contentMax) {
        // Remove the action point that doesn't fit
        currentPage.pop();

        // Save the current page (if it has items)
        if (currentPage.length > 0) {
          builtPages.push(currentPage);
        }

        // Start a new page with this action point
        currentPage = [ap];
        pageIndex++;
      }
    });

    // Push last page
    if (currentPage.length > 0) builtPages.push(currentPage);

    // Check if there's enough space for the reminder on the last page
    // Measure the last page to see if reminder fits
    const lastPageHeight = measureCurrentPage();
    const remainingSpace = CONTENT_MAX_FINAL - lastPageHeight;
    const spaceNeededForReminder = REMINDER_HEIGHT + 20; // reminder height (includes 2rem margin) + safety margin
    const needsNewPage = remainingSpace < spaceNeededForReminder;
    setNeedsSeparateReminderPage(needsNewPage);

    document.body.removeChild(tempWrapper);
    setPages(builtPages);

    // Signal that pagination is complete
    if (onPaginationComplete) {
      onPaginationComplete();
    }
  }, [editableActionPoints, onPaginationComplete]);

  return (
    <>
      {pages.map((page, pageIndex) => {
        const isLastActionPointPage = pageIndex === pages.length - 1;
        const showReminderOnThisPage = isLastActionPointPage && !needsSeparateReminderPage;
        // Use final footer for last action point page (whether reminder is on it or on separate page after)
        // Use middle footer for all other action point pages
        const useFinalFooter = isLastActionPointPage;
        const footerImage = useFinalFooter
          ? "https://i.ibb.co/qZMcS8m/Copy-of-Raising-My-Rescue.png"
          : "https://i.ibb.co/Z6yY6r7M/Copy-of-Raising-My-Rescue-2.png";

        return (
          <div key={pageIndex} className="page">
            <img
              src="https://i.ibb.co/qYk7fyKf/Header-Banner.png"
              alt="Header"
              className="page-header"
            />

            <div className="page-content">
              {pageIndex === 0 && (
                <h1 style={{
                  fontSize: '2.25rem',
                  marginBottom: '1.5rem',
                  fontWeight: 'bold',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  {title}
                </h1>
              )}

              {page.map((ap, i) => {
                const isFirstOnPage = i === 0;
                return (
                  <div
                    key={i}
                    className="action-point"
                    style={{
                      marginBottom: '0',
                      marginTop: isFirstOnPage ? '0' : '1.5rem',
                      position: 'relative'
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1.875rem',
                        fontStyle: 'italic',
                        position: 'absolute',
                        top: '-1rem',
                        left: '1.5rem',
                        background: '#eaeade',
                        padding: '0 0.5rem',
                        zIndex: 1
                      }}
                    >
                      <SafeHtmlRenderer html={ap.header} />
                    </h3>

                    <div
                      style={{
                        border: '5px solid #4e6749',
                        borderRadius: '0.5rem',
                        padding: '1.5rem 1rem 1rem 1rem',
                        fontFamily: 'Arial, sans-serif'
                      }}
                    >
                      <SafeHtmlRenderer html={ap.details} />
                    </div>
                  </div>
                );
              })}

              {/* REMINDER - show on last action point page if there's room */}
              {showReminderOnThisPage && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '113px',
                    left: '3.4rem',
                    right: '3.4rem',
                    fontSize: '15px',
                    fontFamily: 'Arial, sans-serif'
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <strong>Reminder:</strong><br />
                    I'm here to support you and your dog from a behavioural perspective.
                    Sometimes, behavioural challenges can be linked to pain, diet, or
                    physical discomfort, so I may highlight these areas if they seem
                    relevant based on behavioural symptoms you've shared with me or that
                    I've observed. Any thoughts I share within this report or any other
                    communication with you around health, food, or physical wellbeing are
                    intended to guide your conversations with your vet, physiotherapist,
                    or nutritionist. I'm not a vet and don't offer medical advice or
                    diagnosis.
                  </p>
                </div>
              )}
            </div>

            <img
              src={footerImage}
              alt="Footer"
              className="page-footer"
            />
          </div>
        );
      })}

      {/* SEPARATE REMINDER PAGE - if needed */}
      {needsSeparateReminderPage && (
        <div className="page">
          <img
            src="https://i.ibb.co/qYk7fyKf/Header-Banner.png"
            alt="Header"
            className="page-header"
          />

          <div className="page-content">
            <div
              style={{
                position: 'absolute',
                bottom: '93px',
                left: '3.4rem',
                right: '3.4rem',
                fontSize: '15px',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              <p style={{ margin: 0 }}>
                <strong>Reminder:</strong><br />
                I'm here to support you and your dog from a behavioural perspective.
                Sometimes, behavioural challenges can be linked to pain, diet, or
                physical discomfort, so I may highlight these areas if they seem
                relevant based on behavioural symptoms you've shared with me or that
                I've observed. Any thoughts I share within this report or any other
                communication with you around health, food, or physical wellbeing are
                intended to guide your conversations with your vet, physiotherapist,
                or nutritionist. I'm not a vet and don't offer medical advice or
                diagnosis.
              </p>
            </div>
          </div>

          <img
            src="https://i.ibb.co/qZMcS8m/Copy-of-Raising-My-Rescue.png"
            alt="Footer"
            className="page-footer"
          />
        </div>
      )}
    </>
  );
}

/* -----------------------------------------------------------------------
   ORIGINAL PAGE COMPONENT — MERGED WITH DYNAMIC PAGINATION
------------------------------------------------------------------------ */

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
  const [editableActionPoints, setEditableActionPoints] = useState<EditableActionPoint[]>([]);
  const [mainGoals, setMainGoals] = useState<string[]>([]);
  const [explanationOfBehaviour, setExplanationOfBehaviour] = useState('');
  const [title, setTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [buttonText, setButtonText] = useState('Generate PDF & Send Email');
  const [paginationComplete, setPaginationComplete] = useState(false);

  useEffect(() => {
    if (!loading && paginationComplete) {
      document.body.setAttribute("data-paged-ready", "true");
    }
  }, [loading, paginationComplete]);

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
        clientEmail: (client as any).email || '',
        clientFirstName: (client as any).first_name || '',
        clientLastName: (client as any).last_name || '',
        dogName: (session as any).dog_name || (client as any).dog_name || '',
        sessionNumber: sessionPlan.sessionNumber?.toString() || '1',
        bookingDate: (session as any).booking_date || '',
        bookingTime: (session as any).booking_time || '',
      });

      const response = await fetch(`/api/generate-session-plan-pdf?${params}`);
      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || 'Failed to generate PDF';
        const errorDetails = result.details ? `\n\nDetails: ${result.details}` : '';
        throw new Error(errorMsg + errorDetails);
      }

      setButtonText("✓ Email Draft Created!");

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

        setMainGoals([
          plan.main_goal_1,
          plan.main_goal_2,
          plan.main_goal_3,
          plan.main_goal_4,
        ].filter(Boolean));

        setExplanationOfBehaviour(plan.explanation_of_behaviour || '');

        const aps = [];
        for (const id of plan.action_points || []) {
          // Check if this is a custom/blank action point (starts with 'blank-')
          if (id.startsWith('blank-')) {
            // For custom action points, use only the edited content
            const edited = plan.edited_action_points?.[id];
            if (edited) {
              aps.push({
                header: edited.header || '',
                details: edited.details || '',
              });
            }
          } else {
            // For predefined action points, look up in apList
            const ap = apList.find((x: any) => x.id === id);
            if (!ap) continue;
            const edited = plan.edited_action_points?.[id];
            aps.push({
              header: edited?.header || ap.header,
              details: edited?.details || ap.details,
            });
          }
        }
        setEditableActionPoints(aps);

        const dogName = getSessionDogName(sess.dog_name, cli);
        setTitle(`Session ${plan.session_number} - ${dogName}`);

        setLoading(false);
      } catch (err) {
        setError("Failed to load data");
        setLoading(false);
      }
    }

    if (sessionId) load();
  }, [sessionId]);

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen bg-white flex items-center justify-center">Error: {error}</div>;

  return (
    <>
      <style>{`
        body, html {
          -webkit-font-smoothing: antialiased;
        }

        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          button { display: none !important; }
        }

        .pdf-viewer {
          background: #525659;
          min-height: 100vh;
          padding: 2rem 0;
        }

        .page {
          width: 210mm;
          height: 297mm;
          background: #eaeade;
          position: relative;
          page-break-after: always;
          margin: 0 auto 2rem auto;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .page:last-child {
          page-break-after: auto;
        }

        .page-header {
          width: 100%;
          height: auto;
          display: block;
        }

        .page-footer {
          width: 100%;
          position: absolute;
          bottom: 0;
          left: 0;
        }

        .page-content {
          padding: 20px 3.4rem 0 3.4rem;
          flex: 1;
          position: relative;
        }

        .action-point {
          page-break-inside: avoid;
          break-inside: avoid;
          font-size: 15px;
        }

        @media print {
          .pdf-viewer {
            background: #eaeade;
            padding: 0;
          }
          .page {
            margin: 0;
            box-shadow: none;
            page-break-inside: avoid;
            page-break-after: always;
            height: 297mm;
            overflow: hidden;
          }
          .page:last-child {
            page-break-after: auto;
          }
          .action-point {
            page-break-inside: avoid;
            break-inside: avoid;
            font-size: 15px;
          }
        }
      `}</style>

      <div className={`pdf-viewer ${cooperLtBT.className}`}>

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
              border: 'none',
              cursor: isGenerating ? 'wait' : 'pointer',
              zIndex: 999999,
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {buttonText}
          </button>
        )}

        {/* PAGE 1 - Only render if noFirstPage is false */}
        {!sessionPlan?.noFirstPage && (
          <div className="page">
            <img
              src="https://i.ibb.co/qYk7fyKf/Header-Banner.png"
              alt="Header"
              className="page-header"
            />

            <div className="page-content">
              <h1 style={{
                fontSize: '2.25rem',
                marginBottom: '1.5rem',
                fontWeight: 'bold',
                fontFamily: 'Arial, sans-serif'
              }}>
                {title}
              </h1>

              {mainGoals.length > 0 && (
                <div style={{ marginBottom: '2rem', position: 'relative' }}>
                  <h3
                    style={{
                      fontSize: '1.875rem',
                      fontStyle: 'italic',
                      position: 'absolute',
                      top: '-1rem',
                      left: '1.5rem',
                      background: '#eaeade',
                      padding: '0 0.5rem',
                      zIndex: 1
                    }}
                  >
                    Main Goals
                  </h3>

                  <div style={{
                    border: '5px solid #4e6749',
                    borderRadius: '0.5rem',
                    padding: '1.5rem 1rem 1rem',
                    display: 'grid',
                    fontSize: '15px',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem 2rem'
                  }}>
                    {mainGoals.map((g, i) => (
                      <p key={i} style={{ margin: 0, fontFamily: 'Arial, sans-serif' }}>
                        <SafeHtmlRenderer html={g} />
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {explanationOfBehaviour && (
                <div style={{ marginBottom: '2.5rem', position: 'relative' }}>
                  <h3
                    style={{
                      fontSize: '1.875rem',
                      fontStyle: 'italic',
                      marginBottom: '0.75rem'
                    }}
                  >
                    Explanation of Behaviour
                  </h3>

                  <div style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '15px',
                    display: 'flex'
                  }}>
                    <div style={{ flex: 1 }}>
                      <SafeHtmlRenderer html={explanationOfBehaviour} />
                    </div>
                    <img
                      src="https://i.ibb.co/k6Dcmnws/Paws.png"
                      alt="Paws"
                      style={{
                        width: 'auto',
                        height: '500px',
                        marginRight: '-25px',
                        marginTop: '-50px'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <img
              src="https://i.ibb.co/S7Kb8xjh/Copy-of-Raising-My-Rescue-1.png"
              alt="Footer Page 1"
              className="page-footer"
            />
          </div>
        )}

        {/* DYNAMIC ACTION POINT PAGES */}
        <DynamicActionPointPages
          title={title}
          editableActionPoints={editableActionPoints}
          isPlaywrightMode={isPlaywrightMode}
          noFirstPage={sessionPlan?.noFirstPage ?? true}
          onPaginationComplete={() => setPaginationComplete(true)}
        />

      </div>
    </>
  );
}