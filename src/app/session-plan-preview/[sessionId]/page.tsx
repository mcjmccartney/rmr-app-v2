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

  // Load Paged.js only in browser mode
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

    if (isBot || forcePrint) {
      setPagedJsReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/pagedjs/dist/paged.polyfill.js";
    script.async = true;
    script.onload = () => {
      setPagedJsReady(true);
      setTimeout(() => {
        document.body.setAttribute("data-paged-ready", "true");
      }, 1000);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [loading, sessionPlan, pagedJsReady]);

  // NEW PDF BUTTON — Calls Vercel Serverless Playwright PDF API
  useEffect(() => {
    if (!session || !client || !sessionPlan || isPrintMode || !pagedJsReady) return;

    const button = document.createElement("button");
    button.id = "pdf-generate-button-external";
    button.textContent = "Generate PDF Email";
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

    let generating = false;

    const generate = async () => {
      if (generating) return;
      generating = true;

      button.textContent = "Generating...";
      button.style.opacity = "0.5";
      button.disabled = true;

      try {
        const params = new URLSearchParams({
          sessionId: session.id,
          clientEmail: client.email,
          clientFirstName: client.firstName,
          clientLastName: client.lastName,
          dogName: session.dogName || client.dogName,
          sessionNumber: sessionPlan.sessionNumber.toString(),
          bookingDate: session.bookingDate ?? "",
          bookingTime: session.bookingTime ?? "",
        });

        const res = await fetch(`/api/generate-session-plan-pdf?${params}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        alert("PDF sent! 🎉 Check your email draft.");
      } catch (error) {
        console.error(error);
        alert("Failed to generate PDF. Please try again.");
      } finally {
        generating = false;
        button.textContent = "Generate PDF Email";
        button.style.opacity = "1";
        button.disabled = false;
      }
    };

    button.addEventListener("click", generate);
    document.body.appendChild(button);

    return () => {
      if (document.body.contains(button)) {
        document.body.removeChild(button);
      }
    };
  }, [session, client, sessionPlan, isPrintMode, pagedJsReady]);

  // Fetch session data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/session-plan-preview/${sessionId}`);

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || "Failed to load session plan");
          setLoading(false);
          return;
        }

        const { sessionPlan: planData, session: sessionData, client: clientData, actionPoints: actionPointsData } =
          await response.json();

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
          noFirstPage: planData.no_first_page !== undefined ? planData.no_first_page : true,
          createdAt: new Date(planData.created_at),
          updatedAt: new Date(planData.updated_at),
        };

        setSessionPlan(plan);

        if (!sessionData) {
          setError("Session not found");
          setLoading(false);
          return;
        }

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

        // Build dynamic dog name
        let dogName = 'Dog';
        const sessionDogName = sess.dogName;

        if (sessionDogName && clientData) {
          if (clientData.dogName && sessionDogName.toLowerCase() === clientData.dogName.toLowerCase()) {
            dogName = clientData.dogName;
          } else if (clientData.otherDogs?.includes(sessionDogName)) {
            dogName = sessionDogName;
          } else {
            dogName = sessionDogName;
          }
        } else {
          dogName = sessionDogName || clientData?.dogName || 'Dog';
        }

        setTitle(`Session ${plan.sessionNumber} - ${dogName}`);

        const goals: string[] = [];
        if (plan.mainGoal1) goals.push(plan.mainGoal1);
        if (plan.mainGoal2) goals.push(plan.mainGoal2);
        if (plan.mainGoal3) goals.push(plan.mainGoal3);
        if (plan.mainGoal4) goals.push(plan.mainGoal4);
        setMainGoals(goals);

        setExplanationOfBehaviour(plan.explanationOfBehaviour || "");

        // Build editable action points
        const editableAPs: EditableActionPoint[] = [];
        const oldDogName = sess.dogName;

        for (const apId of plan.actionPoints) {
          if (apId.startsWith("blank-")) {
            const edited = plan.editedActionPoints?.[apId];
            if (edited?.header && edited?.details) {
              let header = edited.header;
              let details = edited.details;

              if (oldDogName && dogName && oldDogName.toLowerCase() !== dogName.toLowerCase()) {
                const regex = new RegExp(`\\b${oldDogName}\\b`, "gi");
                header = header.replace(regex, dogName);
                details = details.replace(regex, dogName);
              }

              editableAPs.push({ header, details });
            }
          } else if (actionPointsData) {
            const actionPoint = actionPointsData.find((ap: any) => ap.id === apId);
            if (actionPoint) {
              const edited = plan.editedActionPoints?.[apId];
              let header = edited?.header || actionPoint.header;
              let details = edited?.details || actionPoint.details;

              if (oldDogName && dogName && oldDogName.toLowerCase() !== dogName.toLowerCase()) {
                const regex = new RegExp(`\\b${oldDogName}\\b`, "gi");
                header = header.replace(regex, dogName);
                details = details.replace(regex, dogName);
              }

              editableAPs.push({ header, details });
            }
          }
        }
        setEditableActionPoints(editableAPs);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load session plan");
        setLoading(false);
      }
    }

    if (sessionId) fetchData();
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
      <meta name="pdfshift-wait-for-selector" content="[data-paged-ready='true']" />

      {/* Paged.js Styles */}
      <style>{`
        /* all your CSS unchanged... */
      `}</style>

      {/* ===== Document Output ===== */}
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
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4" style={{ fontSize: '14.5px' }}>
                      {mainGoals.map((goal, index) => (
                        <div key={index} className="flex items-start">
                          <span className="font-medium text-gray-700 mr-2">•</span>
                          <SafeHtmlRenderer html={goal} className="inline text-gray-900" />
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
                    <div className="rounded-md" style={{ paddingRight: '165px', paddingTop: '4px' }}>
                      <SafeHtmlRenderer html={explanationOfBehaviour} />
                    </div>
                    <div className="absolute top-0 right-0" style={{ height: '480px', width: '150px' }}>
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

              <h1 className="text-4xl text-gray-900 mb-10 mt-6 break-before-page">{title}</h1>
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
                    <SafeHtmlRenderer html={actionPoint.header} className="inline" />
                  </h3>

                  <div className="border-[3px] border-[#4f6749] rounded-md p-4 text-gray-900 leading-relaxed" style={{ paddingTop: '22px', fontSize: '14.5px' }}>
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
            I'm here to support you and your dog...
          </p>
        </div>
      </div>
    </>
  );
}