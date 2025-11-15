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

  useEffect(() => {
  if (loading || !sessionPlan || pagedJsReady) return;

  const ua = navigator.userAgent.toLowerCase();

  const botAgents = [
    "wkhtmltopdf",
    "chrome-lighthouse",
    "headless",
    "pdf",
    "node",
    "fetch",
    "make",
    "zapier",
    "insomnia",
    "postman"
  ];

  const isBot = botAgents.some(a => ua.includes(a));
  const forcePrint = window.location.search.includes("pagedjs=print");

  // ❌ DO NOT load Paged.js in PDF mode / automation
  if (isBot || forcePrint) {
    console.log("Skipping Paged.js (bot/PDF mode)");
    setPagedJsReady(true);
    return;
  }

  // ✅ Load Paged.js only for real browsers
  console.log("Loading Paged.js preview for browser…");
  const script = document.createElement("script");
  script.src = "https://unpkg.com/pagedjs/dist/paged.polyfill.js";
  script.async = true;
  script.onload = () => {
    setPagedJsReady(true);
    // Signal that pagination is complete for PDF generators
    setTimeout(() => {
      document.body.setAttribute('data-paged-ready', 'true');
      console.log('Paged.js ready signal set');
    }, 1000); // Wait 1 second after Paged.js loads to ensure pagination is complete
  };
  document.body.appendChild(script);

  return () => {
    if (document.body.contains(script)) {
      document.body.removeChild(script);
    }
  };
}, [loading, sessionPlan, pagedJsReady]);

  // Create button imperatively after Paged.js finishes - completely outside React
  useEffect(() => {
    if (!session || !client || !sessionPlan || isPrintMode || !pagedJsReady) return;

    // Create button element directly in DOM
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
      button.textContent = 'Generating PDF...';
      button.style.backgroundColor = '#7a2f00';
      button.disabled = true;
      button.style.opacity = '0.5';
      button.style.cursor = 'not-allowed';

      try {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        const pages = document.querySelectorAll('.pagedjs_page');

        if (pages.length === 0) {
          alert('No pages found. Please wait for the document to render.');
          return;
        }

        console.log(`Capturing ${pages.length} pages...`);

        const pdf = new jsPDF('portrait', 'mm', 'a4');

        for (let i = 0; i < pages.length; i++) {
          console.log(`Capturing page ${i + 1}/${pages.length}...`);

          const canvas = await html2canvas(pages[i] as HTMLElement, {
            scale: 2.5,
            backgroundColor: '#ecebdd',
            logging: false,
            useCORS: true,
            allowTaint: true
          });

          const imgData = canvas.toDataURL('image/jpeg', 1.0);

          if (i > 0) {
            pdf.addPage();
          }

          pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        }

        console.log('PDF generated, uploading to Supabase...');

        const pdfBlob = pdf.output('blob');

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

        const response = await fetch('https://hook.eu1.make.com/lbfmnhl3xpf7c0y2sfos3vdln6y1fmqm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: session.id,
            pdfUrl: pdfUrl,
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
        isGenerating = false;
        button.textContent = 'Generate PDF Email';
        button.style.backgroundColor = '#973b00';
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
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

    // Append directly to body, not to any React-managed element
    document.body.appendChild(button);

    return () => {
      // Cleanup
      if (document.body.contains(button)) {
        document.body.removeChild(button);
      }
    };
  }, [session, client, sessionPlan, isPrintMode, pagedJsReady]);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Starting to fetch session plan for sessionId:', sessionId);
        setLoading(true);
        setError(null);

        // Fetch all data from public API endpoint (bypasses RLS)
        const response = await fetch(`/api/session-plan-preview/${sessionId}`);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error:', errorData);
          setError(errorData.error || 'Failed to load session plan');
          setLoading(false);
          return;
        }

        const { sessionPlan: planData, session: sessionData, client: clientData, actionPoints: actionPointsData } = await response.json();

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
          noFirstPage: planData.no_first_page !== undefined ? planData.no_first_page : true, // Default to true (removed state)
          createdAt: new Date(planData.created_at),
          updatedAt: new Date(planData.updated_at),
        };

        setSessionPlan(plan);

        // Use session data from API
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

        // Use client data from API
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

        // Use action points from API
        if (actionPointsData) {
          const aps: ActionPoint[] = actionPointsData.map((ap: any) => ({
            id: ap.id,
            header: ap.header,
            details: ap.details,
          }));
          setActionPoints(aps);
        }

        // Build title - prioritize client's current dog name over session's stored name
        let dogName = 'Dog';
        const sessionDogName = sess.dogName;
        if (sessionDogName && clientData) {
          // Check if session dog matches client's primary dog (case-insensitive)
          if (clientData.dogName && sessionDogName.toLowerCase() === clientData.dogName.toLowerCase()) {
            dogName = clientData.dogName; // Use client's current name (may have been edited)
          }
          // Check if session dog matches any of the other dogs
          else if (clientData.otherDogs && Array.isArray(clientData.otherDogs)) {
            const matchingOtherDog = clientData.otherDogs.find(
              (dog: string) => dog.toLowerCase() === sessionDogName.toLowerCase()
            );
            if (matchingOtherDog) {
              dogName = matchingOtherDog; // Use the current name from otherDogs array
            } else {
              dogName = sessionDogName; // Fallback to session's dog name
            }
          } else {
            dogName = sessionDogName; // Fallback to session's dog name
          }
        } else {
          dogName = sessionDogName || clientData?.dogName || 'Dog';
        }
        const titleText = `Session ${plan.sessionNumber} - ${dogName}`;
        setTitle(titleText);

        // Build main goals
        const goals: string[] = [];
        if (plan.mainGoal1) goals.push(plan.mainGoal1);
        if (plan.mainGoal2) goals.push(plan.mainGoal2);
        if (plan.mainGoal3) goals.push(plan.mainGoal3);
        if (plan.mainGoal4) goals.push(plan.mainGoal4);
        setMainGoals(goals);

        // Set explanation
        setExplanationOfBehaviour(plan.explanationOfBehaviour || '');

        // Build editable action points and replace old dog name with current one
        const editableAPs: EditableActionPoint[] = [];
        // Get the old dog name from session (what was stored)
        const oldDogName = sess.dogName;

        for (const apId of plan.actionPoints) {
          // Check if this is a blank action point (custom added)
          if (apId.startsWith('blank-')) {
            // For blank action points, use the edited content directly
            const edited = plan.editedActionPoints?.[apId];
            if (edited && edited.header && edited.details) {
              let header = edited.header;
              let details = edited.details;

              // Replace old dog name with current dog name (case-insensitive)
              if (oldDogName && dogName && oldDogName.toLowerCase() !== dogName.toLowerCase()) {
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
            // For library action points, look them up
            const actionPoint = actionPointsData.find((ap: any) => ap.id === apId);
            if (actionPoint) {
              const edited = plan.editedActionPoints?.[apId];
              let header = edited?.header || actionPoint.header;
              let details = edited?.details || actionPoint.details;

              // Replace old dog name with current dog name (case-insensitive)
              if (oldDogName && dogName && oldDogName.toLowerCase() !== dogName.toLowerCase()) {
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

  // Auto-trigger print dialog after content loads
  // TEMPORARILY DISABLED - uncomment when ready
  // useEffect(() => {
  //   if (!loading && !error && sessionPlan) {
  //     // Small delay to ensure content is fully rendered
  //     const timer = setTimeout(() => {
  //       window.print();
  //     }, 500);
  //     return () => clearTimeout(timer);
  //   }
  // }, [loading, error, sessionPlan]);

  console.log('Component render - loading:', loading, 'sessionPlan:', !!sessionPlan, 'error:', error);

  // Don't show loading screen - just render content when ready
  if (error) {
    console.log('Returning error screen');
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

  // Wait for data to be ready (don't wait for Paged.js)
  if (loading || !sessionPlan) {
    console.log('Returning empty div - loading:', loading, 'sessionPlan:', !!sessionPlan);
    return <div className="min-h-screen bg-white"></div>;
  }

  console.log('About to render session plan content - title:', title, 'mainGoals:', mainGoals.length);

  return (
    <>
      {/* Meta tag for PDF services to wait for rendering */}
      <meta name="pdfshift-wait-for-selector" content="[data-paged-ready='true']" />

      {/* Paged.js styles for pagination */}
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
  /* Headings use Cooper Black */
 {
  font-family: "Cooper Black", Arial, sans-serif !important;
  font-weight: normal; /* Cooper is already heavy */
}

h1, h2, h3, h4, h5, h6 {
  font-family: "Cooper Black 2", Arial, sans-serif !important;
  font-weight: normal; /* Cooper is already heavy */
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
    height: 280px; /* Approximate height of reminder section */
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .page-header {
  display: none !important;
}

  /* === Paged.js Preview Styling (minimal overrides) === */
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

  /* Ensure all Paged.js elements have the correct background */
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

  /* === Paged.js Pagination Rules === */
  .action-point-box,
  .main-goals-section,
  .explanation-section {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Add top margin when Action Point starts on a new page */
  .action-point-box {
    margin-top: 3rem; /* 48px - same as mt-12 */
  }

  /* Ensure action points container allows proper page breaks */
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

  /* === Print Cleanup === */
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

    /* Hide floating buttons when printing */
    button[title="Save as PDF"],
    .fixed.bottom-8.right-8 {
      display: none !important;
    }
  }
`}</style>

      {/* === ACTUAL DOCUMENT === */}
      <div className="content-wrapper">

        {/* Main Content Area with Padding */}
        <div className="px-6 py-6" style={{ margin: '0px 28px' }}>
          {/* First Page - Show if user has NOT clicked Remove (noFirstPage is false or undefined) */}
          {!sessionPlan.noFirstPage && (
            <>
              {/* Title */}
              <h1 className="text-4xl text-gray-900 mb-10">{title}</h1>

              {/* Main Goals */}
              {mainGoals.length > 0 && (
                <div className="main-goals-section relative mb-8">
                  <h3 className="absolute -top-5 left-4 bg-[#ecebdd] px-2 italic text-3xl">
                    Main Goals
                  </h3>
                  <div className="border-[3px] border-[#4f6749] rounded-md p-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      {mainGoals.map((goal, index) => (
                        <div key={index} className="flex items-start">
                          <span className="font-medium text-gray-700 mr-2">•</span>
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

              {/* Explanation of Behaviour */}
              {explanationOfBehaviour && (
                <div className="explanation-section mb-6 break-after-page">
                  <h3 className="text-gray-900 italic text-3xl mb-2">
                    Explanation of Behaviour
                  </h3>
                  <div className="rounded-md">
                    <SafeHtmlRenderer html={explanationOfBehaviour} />
                  </div>
                </div>
              )}

              {/* Title - On second page when first page exists */}
              <h1 className="text-4xl text-gray-900 mb-10 mt-6 break-before-page">{title}</h1>
            </>
          )}


          {/* Title - On first page when user clicked Remove (noFirstPage is true) */}
          {sessionPlan.noFirstPage && (
            <h1 className="text-4xl text-gray-900 mb-10">{title}</h1>
          )}
          

        {/* Action Points */}
        {editableActionPoints.length > 0 && (
          <div className="mt-12 mb-6 space-y-6">
            {editableActionPoints.map((actionPoint, index) => (
              <div key={index} className="action-point-box relative">
                <h3 className="absolute -top-5 left-4 bg-[#ecebdd] px-2 italic text-3xl">
                  <SafeHtmlRenderer html={actionPoint.header} className="inline" />
                </h3>

                <div className="border-[3px] border-[#4f6749] rounded-md p-4 text-gray-900 leading-relaxed">
                  <SafeHtmlRenderer html={actionPoint.details} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Spacer to reserve space for reminder and force page break if needed */}
        <div className="reminder-spacer"></div>
        </div> {/* Close Main Content Area */}

        {/* Reminder Section - Positioned at bottom of page */}
        <div className="reminder-section" style={{ margin: '0px 28px' }}>
          <h6 className="text-2xl text-gray-900 mb-3">Reminder:</h6>
          <p className="text-gray-900 text-base leading-relaxed mb-0">
            I'm here to support you and your dog from a behavioural perspective. Sometimes, behavioural
            challenges can be linked to pain, diet, or physical discomfort, so I may highlight these areas if
            they seem relevant based on behavioural symptoms you've shared with me or that I've
            observed. Any thoughts I share within this report or any other communication with you around
            health, food, or physical wellbeing are intended to guide your conversations with your vet,
            physiotherapist, or nutritionist. I'm not a vet and don't offer medical advice or diagnosis.
          </p>
        </div>
      </div>
    </>
  );
}

