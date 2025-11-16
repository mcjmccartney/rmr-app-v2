'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { SessionPlan, Session, Client, ActionPoint } from '@/types';
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer';

interface EditableActionPoint {
  header: string;
  details: string;
}

export default function SessionPlanPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const isPrintMode = searchParams.get('print') === 'true';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [actionPoints, setActionPoints] = useState<ActionPoint[]>([]);
  const [title, setTitle] = useState('');
  const [mainGoals, setMainGoals] = useState<string[]>([]);
  const [explanationOfBehaviour, setExplanationOfBehaviour] = useState('');
  const [editableActionPoints, setEditableActionPoints] = useState<EditableActionPoint[]>([]);
  const [pagedJsReady, setPagedJsReady] = useState(false);

  // Load Paged.js for browser preview, skip for bots/PDF services
  useEffect(() => {
    if (loading || !sessionPlan || pagedJsReady) return;

    const ua = navigator.userAgent.toLowerCase();

    const botAgents = [
      'wkhtmltopdf',
      'chrome-lighthouse',
      'headless',
      'pdf',
      'node',
      'fetch',
      'make',
      'zapier',
      'insomnia',
      'postman',
    ];

    const isBot = botAgents.some((a) => ua.includes(a));
    const forcePrint = window.location.search.includes('pagedjs=print');

    // Skip Paged.js in automation / bots
    if (isBot || forcePrint) {
      console.log('Skipping Paged.js (bot/PDF mode)');
      // If any external PDF generator relies on this:
      document.body.setAttribute('data-paged-ready', 'true');
      setPagedJsReady(true);
      return;
    }

    console.log('Loading Paged.js preview for browser…');
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/pagedjs/dist/paged.polyfill.js';
    script.async = true;
    script.onload = () => {
      setPagedJsReady(true);
      setTimeout(() => {
        document.body.setAttribute('data-paged-ready', 'true');
        console.log('Paged.js ready signal set');
      }, 1000);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [loading, sessionPlan, pagedJsReady]);

  // Floating "Generate PDF Email" button using html2canvas + jsPDF (client-side)
  useEffect(() => {
    if (!session || !client || !sessionPlan || isPrintMode || !pagedJsReady) return;

    const button = document.createElement('button');
    button.id = 'pdf-generate-button-external';
    button.textContent = 'Generate PDF Email';
    button.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background-color: #973b00;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 500;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      border: none;
      cursor: pointer;
      z-index: 999999;
      font-family: inherit;
      font-size: 1rem;
      transition: all 0.2s;
    `;

    let isGenerating = false;

    const generatePDF = async () => {
  if (isGenerating) return;
  isGenerating = true;

  button.textContent = "Sending...";
  button.style.opacity = "0.5";
  button.disabled = true;

  try {
    // Build the Paged.js print URL that iLovePDF will load
    const previewUrl = `${window.location.origin}/session-plan-preview/${session.id}?pagedjs=print`;

    // Send to Make
    await fetch("https://hook.eu1.make.com/lbfmnhl3xpf7c0y2sfos3vdln6y1fmqm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        previewUrl,
        sessionId: session.id,
        clientEmail: client.email,
        clientFirstName: client.firstName,
        clientLastName: client.lastName,
        dogName: session.dogName || client.dogName,
        sessionNumber: sessionPlan.sessionNumber,
        bookingDate: session.bookingDate,
        bookingTime: session.bookingTime,
      }),
    });

    alert("PDF request sent to Make.com! Check your email shortly.");
  } catch (err) {
    console.error(err);
    alert("Failed to send request to Make. Please try again.");
  } finally {
    isGenerating = false;
    button.textContent = "Generate PDF Email";
    button.style.opacity = "1";
    button.disabled = false;
  }
};

    button.addEventListener('click', generatePDF);
    button.addEventListener('mouseenter', () => {
      if (!isGenerating) {
        button.style.backgroundColor = '#7a2f00';
      }
    });
    button.addEventListener('mouseleave', () => {
      if (!isGenerating) {
        button.style.backgroundColor = '#973b00';
      }
    });

    document.body.appendChild(button);

    return () => {
      if (document.body.contains(button)) {
        document.body.removeChild(button);
      }
    };
  }, [session, client, sessionPlan, isPrintMode, pagedJsReady]);

  // Fetch data (unchanged from your logic)
  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Starting to fetch session plan for sessionId:', sessionId);
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/session-plan-preview/${sessionId}`);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error:', errorData);
          setError(errorData.error || 'Failed to load session plan');
          setLoading(false);
          return;
        }

        const {
          sessionPlan: planData,
          session: sessionData,
          client: clientData,
          actionPoints: actionPointsData,
        } = await response.json();

        console.log('Session plan fetched:', planData);

        const plan: SessionPlan = {
          id: planData.id,
          sessionId: planData.session_id,
          sessionNumber: planData.session_number,
          mainGoal1: planData.main_goal_1,
          mainGoal2: planData.main_goal_2,
          mainGoal3: planData.main_goal_3,
          mainGoal4: planData.main_goal_4,
          explanationOfBehaviour: planData.explanation_of_behaviour,
          actionPoints: planData.action_points || [],
          editedActionPoints: planData.edited_action_points || {},
          documentEditUrl: planData.document_edit_url,
          noFirstPage:
            planData.no_first_page !== undefined ? planData.no_first_page : true,
          createdAt: new Date(planData.created_at),
          updatedAt: new Date(planData.updated_at),
        };

        setSessionPlan(plan);

        if (!sessionData) {
          console.error('Session not found');
          setError('Session not found');
          setLoading(false);
          return;
        }

        console.log('Session fetched:', sessionData);

        const sess: Session = {
          id: sessionData.id,
          clientId: sessionData.client_id,
          dogName: sessionData.dog_name,
          sessionType: sessionData.session_type,
          bookingDate: sessionData.booking_date,
          bookingTime: sessionData.booking_time,
          notes: sessionData.notes,
          quote: sessionData.quote,
          email: sessionData.email,
          sessionPlanId: sessionData.session_plan_id,
          sessionPaid: sessionData.session_paid,
          paymentConfirmedAt: sessionData.payment_confirmed_at,
          sessionPlanSent: sessionData.session_plan_sent,
          questionnaireBypass: sessionData.questionnaire_bypass,
          specialMarking: sessionData.special_marking,
          eventId: sessionData.event_id,
          googleMeetLink: sessionData.google_meet_link,
        };

        setSession(sess);

        let cli: Client | null = null;
        if (clientData) {
          cli = {
            id: clientData.id,
            firstName: clientData.first_name,
            lastName: clientData.last_name,
            partnerName: clientData.partner_name,
            dogName: clientData.dog_name,
            otherDogs: clientData.other_dogs || [],
            phone: clientData.phone,
            email: clientData.email,
            address: clientData.address,
            active: clientData.active,
            membership: clientData.membership,
            avatar: clientData.avatar,
            behaviouralBriefId: clientData.behavioural_brief_id,
            booking_terms_signed: clientData.booking_terms_signed,
            booking_terms_signed_date: clientData.booking_terms_signed_date,
          };
          setClient(cli);
        }

        if (actionPointsData) {
          const aps: ActionPoint[] = actionPointsData.map((ap: any) => ({
            id: ap.id,
            header: ap.header,
            details: ap.details,
          }));
          setActionPoints(aps);
        }

        let dogName = 'Dog';
        const sessionDogName = sess.dogName;
        if (sessionDogName && clientData) {
          if (
            clientData.dogName &&
            sessionDogName.toLowerCase() === clientData.dogName.toLowerCase()
          ) {
            dogName = clientData.dogName;
          } else if (
            clientData.otherDogs &&
            Array.isArray(clientData.otherDogs)
          ) {
            const matchingOtherDog = clientData.otherDogs.find(
              (dog: string) => dog.toLowerCase() === sessionDogName.toLowerCase()
            );
            if (matchingOtherDog) {
              dogName = matchingOtherDog;
            } else {
              dogName = sessionDogName;
            }
          } else {
            dogName = sessionDogName;
          }
        } else {
          dogName = sessionDogName || clientData?.dogName || 'Dog';
        }
        const titleText = `Session ${plan.sessionNumber} - ${dogName}`;
        setTitle(titleText);

        const goals: string[] = [];
        if (plan.mainGoal1) goals.push(plan.mainGoal1);
        if (plan.mainGoal2) goals.push(plan.mainGoal2);
        if (plan.mainGoal3) goals.push(plan.mainGoal3);
        if (plan.mainGoal4) goals.push(plan.mainGoal4);
        setMainGoals(goals);

        setExplanationOfBehaviour(plan.explanationOfBehaviour || '');

        const editableAPs: EditableActionPoint[] = [];
        const oldDogName = sess.dogName;

        for (const apId of plan.actionPoints) {
          if (apId.startsWith('blank-')) {
            const edited = plan.editedActionPoints?.[apId];
            if (edited && edited.header && edited.details) {
              let header = edited.header;
              let details = edited.details;

              if (
                oldDogName &&
                dogName &&
                oldDogName.toLowerCase() !== dogName.toLowerCase()
              ) {
                const regex = new RegExp(`\\b${oldDogName}\\b`, 'gi');
                header = header.replace(regex, dogName);
                details = details.replace(regex, dogName);
              }

              editableAPs.push({
                header,
                details,
              });
            }
          } else if (actionPointsData) {
            const actionPoint = actionPointsData.find(
              (ap: any) => ap.id === apId
            );
            if (actionPoint) {
              const edited = plan.editedActionPoints?.[apId];
              let header = edited?.header || actionPoint.header;
              let details = edited?.details || actionPoint.details;

              if (
                oldDogName &&
                dogName &&
                oldDogName.toLowerCase() !== dogName.toLowerCase()
              ) {
                const regex = new RegExp(`\\b${oldDogName}\\b`, 'gi');
                header = header.replace(regex, dogName);
                details = details.replace(regex, dogName);
              }

              editableAPs.push({
                header,
                details,
              });
            }
          }
        }
        setEditableActionPoints(editableAPs);

        console.log('All data loaded successfully, setting loading to false');
        setLoading(false);
      } catch (err) {
        console.error('Error fetching session plan preview:', err);
        setError('Failed to load session plan');
        setLoading(false);
      }
    }

    if (sessionId) {
      console.log('SessionId exists, calling fetchData');
      fetchData();
    } else {
      console.error('No sessionId provided');
    }
  }, [sessionId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading || !sessionPlan) {
    return <div className="min-h-screen bg-white"></div>;
  }

  return (
    <>
      <meta
        name="pdfshift-wait-for-selector"
        content="[data-paged-ready='true']"
      />

      <style>{`
  /* === Cooper Black Font === */
  @font-face {
  font-family: 'Cooper Black';
  src: url('/fonts/cooperltbt-bold-webfont.woff2') format('woff2'),
       url('/fonts/cooperltbt-bold-webfont.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Cooper Black 2';
  src: url('/fonts/cooperltbt-regular-webfont.woff2') format('woff2'),
       url('/fonts/cooperltbt-regular-webfont.woff') format('woff');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

  /* === Base Layout === */
  body {
    background: ${isPrintMode ? 'white' : '#ecebdd'};
    margin: 0;
    font-family: Arial, sans-serif;
    color: #222;
  }

  /* Decrease line height for paragraph text */
  p {
    line-height: 1.2;
    font-size: 14px;
  }

  /* === Headers use Cooper Black === */
 {
  font-family: "Cooper Black", Arial, sans-serif !important;
  font-weight: normal;
}

h1, h2, h3, h4, h5, h6 {
  font-family: "Cooper Black 2", Arial, sans-serif !important;
  font-weight: normal;
}

  /* Position reminder at bottom of page */
  .reminder-section {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0 1.5rem 1.5rem 1.5rem;
    background: #ecebdd;
  }

  /* Spacer to reserve space for reminder and force page break if needed */
  .reminder-spacer {
    height: 280px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .page-header {
  display: none !important;
}

  /* === Paged.js Preview Styling === */
  .pagedjs_pages {
    background: ${isPrintMode ? 'transparent' : '#525659'};
    padding: ${isPrintMode ? '0' : '40px 20px'};
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${isPrintMode ? '0' : '30px'};
  }

  .pagedjs_page {
    background: #ecebdd;
    box-shadow: ${isPrintMode ? 'none' : '0 0 20px rgba(0, 0, 0, 0.3)'};
    margin: 0 auto;
    position: relative;
  }

  .pagedjs_page_content {
    position: relative;
    min-height: 100%;
  }

  .pagedjs_margin,
  .pagedjs_margin-content,
  .pagedjs_area {
    background-color: #ecebdd !important;
  }

  .content-wrapper {
    background-color: #ecebdd;
    padding: 0;
    min-height: 100vh;
  }

  .action-point-box,
  .main-goals-section,
  .explanation-section {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .action-point-box {
    margin-top: 2.5rem;
  }

  .mt-12.mb-6.space-y-6 {
    page-break-inside: auto;
    break-inside: auto;
  }

  .break-before-page {
    page-break-before: always;
    break-before: page;
  }

  .break-after-page {
    page-break-after: always;
    break-after: page;
  }

  @media print {
    body {
      background: white !important;
    }

    .pagedjs_pages {
      background: transparent !important;
      padding: 0;
      margin: 0;
      gap: 0;
    }

    .pagedjs_page {
      background: #ecebdd !important;
      box-shadow: none;
      margin: 0;
      border: none;
    }

    button[title="Save as PDF"],
    .fixed.bottom-8.right-8 {
      display: none !important;
    }
  }
`}</style>

      <div className="content-wrapper">
        <div className="px-6 py-6">
          {!sessionPlan.noFirstPage && (
            <>
              <h1 className="text-4xl text-gray-900 mb-10">{title}</h1>

              {mainGoals.length > 0 && (
                <div className="main-goals-section relative mb-8">
                  <h3 className="absolute -top-5 left-4 bg-[#ecebdd] px-2 italic text-3xl">
                    Main Goals
                  </h3>
                  <div className="border-[3px] border-[#4f6749] rounded-md p-6">
                    <div
                      className="grid grid-cols-2 gap-x-4 gap-y-4"
                      style={{ fontSize: '14.5px' }}
                    >
                      {mainGoals.map((goal, index) => (
                        <div key={index} className="flex items-start">
                          <span className="font-medium text-gray-700 mr-2">
                            •
                          </span>
                          <SafeHtmlRenderer
                            html={goal}
                            className="inline text-gray-900"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {explanationOfBehaviour && (
                <div className="explanation-section mb-6 break-after-page">
                  <h3 className="text-gray-900 italic text-3xl mb-2">
                    Explanation of Behaviour
                  </h3>
                  <div className="relative">
                    <div
                      className="rounded-md"
                      style={{ paddingRight: '165px', paddingTop: '4px' }}
                    >
                      <SafeHtmlRenderer html={explanationOfBehaviour} />
                    </div>
                    <div
                      className="absolute top-0 right-0"
                      style={{ height: '480px', width: '150px' }}
                    >
                      <img
                        src="https://i.ibb.co/k6Dcmnws/Paws.png"
                        alt="Pawprints"
                        style={{
                          height: '580px',
                          width: 'auto',
                          objectFit: 'cover',
                          marginTop: '-40px',
                          marginRight: '-45px',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <h1 className="text-4xl text-gray-900 mb-10 mt-6 break-before-page">
                {title}
              </h1>
            </>
          )}

          {sessionPlan.noFirstPage && (
            <h1 className="text-4xl text-gray-900 mb-10">{title}</h1>
          )}

          {editableActionPoints.length > 0 && (
            <div className="mt-12 mb-6 space-y-6">
              {editableActionPoints.map((actionPoint, index) => (
                <div key={index} className="action-point-box relative">
                  <h3 className="absolute -top-5 left-4 bg-[#ecebdd] px-2 italic text-3xl">
                    <SafeHtmlRenderer
                      html={actionPoint.header}
                      className="inline"
                    />
                  </h3>

                  <div
                    className="border-[3px] border-[#4f6749] rounded-md p-4 text-gray-900 leading-relaxed"
                    style={{ paddingTop: '22px', fontSize: '14.5px' }}
                  >
                    <SafeHtmlRenderer html={actionPoint.details} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="reminder-spacer"></div>
        </div>

        <div className="reminder-section">
          <p className="font-bold text-gray-900">Reminder:</p>
          <p className="text-gray-900 text-base leading-relaxed mb-0">
            I&apos;m here to support you and your dog from a behavioural
            perspective. Sometimes, behavioural challenges can be linked to
            pain, diet, or physical discomfort, so I may highlight these areas
            if they seem relevant based on behavioural symptoms you&apos;ve
            shared with me or that I&apos;ve observed. Any thoughts I share
            within this report or any other communication with you around
            health, food, or physical wellbeing are intended to guide your
            conversations with your vet, physiotherapist, or nutritionist.
            I&apos;m not a vet and don&apos;t offer medical advice or
            diagnosis.
          </p>
        </div>
      </div>
    </>
  );
}