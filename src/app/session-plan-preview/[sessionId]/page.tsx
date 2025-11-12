'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SessionPlan, Session, Client, ActionPoint } from '@/types';
import SafeHtmlRenderer from '@/components/SafeHtmlRenderer';

interface EditableActionPoint {
  header: string;
  details: string;
}

export default function SessionPlanPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

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

  // Load Paged.js dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/pagedjs/dist/paged.polyfill.js';
    script.async = true;
    script.onload = () => {
      console.log('Paged.js loaded successfully');

      // Inject @page margin box rules after Paged.js loads
      const pageStyle = document.createElement('style');
      pageStyle.textContent = `
        @page {
          @top-center {
            content: element(header);
          }
          @bottom-center {
            content: element(footer);
          }
        }
      `;
      document.head.appendChild(pageStyle);
    };
    script.onerror = () => {
      console.error('Failed to load Paged.js');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script when component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Starting to fetch session plan for sessionId:', sessionId);
        setLoading(true);
        setError(null);

        // Fetch session plan
        const { data: planData, error: planError } = await supabase
          .from('session_plans')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (planError) {
          console.error('Session plan error:', planError);
          setError('Session plan not found');
          setLoading(false);
          return;
        }

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
          createdAt: new Date(planData.created_at),
          updatedAt: new Date(planData.updated_at),
        };

        setSessionPlan(plan);

        // Fetch session
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (sessionError) {
          console.error('Session error:', sessionError);
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

        // Fetch client if session has clientId
        let clientData = null;
        if (sess.clientId) {
          const { data: fetchedClientData, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', sess.clientId)
            .single();

          if (!clientError && fetchedClientData) {
            const cli: Client = {
              id: fetchedClientData.id,
              firstName: fetchedClientData.first_name,
              lastName: fetchedClientData.last_name,
              partnerName: fetchedClientData.partner_name,
              dogName: fetchedClientData.dog_name,
              otherDogs: fetchedClientData.other_dogs || [],
              phone: fetchedClientData.phone,
              email: fetchedClientData.email,
              address: fetchedClientData.address,
              active: fetchedClientData.active,
              membership: fetchedClientData.membership,
              avatar: fetchedClientData.avatar,
              behaviouralBriefId: fetchedClientData.behavioural_brief_id,
              booking_terms_signed: fetchedClientData.booking_terms_signed,
              booking_terms_signed_date: fetchedClientData.booking_terms_signed_date,
            };
            setClient(cli);
            clientData = cli;
          }
        }

        // Fetch all action points
        const { data: actionPointsData, error: actionPointsError } = await supabase
          .from('action_points')
          .select('*')
          .order('header');

        if (!actionPointsError && actionPointsData) {
          const aps: ActionPoint[] = actionPointsData.map((ap) => ({
            id: ap.id,
            header: ap.header,
            details: ap.details,
          }));
          setActionPoints(aps);
        }

        // Build title
        const dogName = sess.dogName || clientData?.dogName || 'Dog';
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

        // Build editable action points
        const editableAPs: EditableActionPoint[] = [];
        if (actionPointsData) {
          for (const apId of plan.actionPoints) {
            const actionPoint = actionPointsData.find((ap) => ap.id === apId);
            if (actionPoint) {
              const edited = plan.editedActionPoints?.[apId];
              editableAPs.push({
                header: edited?.header || actionPoint.header,
                details: edited?.details || actionPoint.details,
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

  console.log('Render state:', { loading, error, sessionPlan: !!sessionPlan, session: !!session });

  if (loading) {
    console.log('Rendering loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session plan...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionPlan) {
    console.log('Rendering error screen');
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Session plan not found'}</p>
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

  console.log('Rendering main content');
  return (
    <>
      {/* Paged.js styles for pagination */}
      <style>{`
  /* === Base Layout === */
  body {
    background: #ecebdd;
    margin: 0;
    font-family: "Helvetica", sans-serif;
    color: #222;
  }

  /* === Paged.js Preview === */
  .pagedjs_pages {
    background: #ecebdd;  /* consistent background behind pages */
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .pagedjs_page {
    background: #ecebdd;  /* A4 page color */
    width: 210mm;
    height: 297mm;
    overflow: hidden;
    margin: 0;
    border: none;
    box-shadow: none;
  }

  .content-wrapper {
    background-color: #ecebdd;
    width: 100%;
    height: 100%;
    padding-top: 0;         /* header at top edge */
    padding-bottom: 2cm;    /* space for footer */
  }

  /* === Paged.js Pagination Rules === */
  .action-point-box,
  .main-goals-section,
  .explanation-section {
    page-break-inside: avoid;
    break-inside: avoid;
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
      background: #ecebdd !important;
    }

    .pagedjs_pages {
      background: #ecebdd !important;
      padding: 0;
      margin: 0;
    }

    .pagedjs_page {
      background: #ecebdd !important;
      box-shadow: none;
      margin: 0;
      border: none;
    }
  }
`}</style>

      {/* === @page setup (Paged.js) === */}
      <style
  dangerouslySetInnerHTML={{
    __html: `
      @page {
        size: A4;
        margin: 0;  /* full bleed */
        background: #ecebdd;

        @top-center {
          content: element(header);
        }

        @bottom-center {
          content: element(footer);
        }
      }

      .page-header {
        position: running(header);
      }

      .page-footer {
        position: running(footer);
      }
    `,
  }}
/>

      {/* === ACTUAL DOCUMENT === */}
      <div className="content-wrapper">
        {/* Header */}
        <div
          style={{ backgroundColor: "#4f6749" }}
          className="p-3 mb-6 page-header flex items-center justify-between"
        >
          <img
            src="https://i.ibb.co/tp6WV8TN/Screenshot-2025-11-12-at-13-38-12.png"
            alt="Raising My Rescue Text Logo"
            className="h-12 w-auto rounded"
          />
          <img
            src="https://i.ibb.co/0V6pRF85/Screenshot-2025-11-12-at-13-17-36.png"
            alt="Raising My Rescue Logo"
            className="h-12 w-auto ml-4 rounded"
          />
        </div>

        {/* Title */}
        <h2 className="text-5xl text-gray-900 mb-10">{title}</h2>

        {/* Main Goals */}
        {mainGoals.length > 0 && (
          <div className="main-goals-section relative mb-8">
            <h3 className="absolute -top-5 left-4 bg-[#ecebdd] px-2 italic text-3xl">
              Main Goals
            </h3>
            <div className="border-[3px] border-[#4f6749] rounded-md p-6">
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
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

        {/* Action Points (next page) */}
        {editableActionPoints.length > 0 && (
          <div className="mb-6 space-y-6">
            {editableActionPoints.map((actionPoint, index) => (
              <div key={index} className="action-point-box relative">
                <h4 className="absolute -top-5 left-4 bg-[#ecebdd] px-2 italic text-3xl">
                  <SafeHtmlRenderer html={actionPoint.header} className="inline" />
                </h4>

                <div className="border-[3px] border-[#4f6749] rounded-md p-4 text-gray-900 leading-relaxed">
                  <SafeHtmlRenderer html={actionPoint.details} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="page-footer bg-[#ecebdd] mt-12 py-6 border-t-2 border-[#4f6749] flex flex-col sm:flex-row justify-between items-center text-center sm:text-left text-black font-serif tracking-wide">
          <p className="text-base italic">A happier life with your dog</p>
          <a
            href="https://www.raisingmyrescue.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-base cursor-pointer no-underline hover:underline-offset-4"
            style={{ color: "black", textDecoration: "none" }}
          >
            www.raisingmyrescue.co.uk
          </a>
        </div>
      </div>
    </>
  );
}

