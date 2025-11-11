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

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch session plan
        const { data: planData, error: planError } = await supabase
          .from('session_plans')
          .select('*')
          .eq('session_id', sessionId)
          .single();

        if (planError) {
          setError('Session plan not found');
          setLoading(false);
          return;
        }

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
          setError('Session not found');
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

        // Fetch client if session has clientId
        if (sess.clientId) {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', sess.clientId)
            .single();

          if (!clientError && clientData) {
            const cli: Client = {
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
        const dogName = sess.dogName || (client?.dogName) || 'Dog';
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

        setLoading(false);
      } catch (err) {
        console.error('Error fetching session plan preview:', err);
        setError('Failed to load session plan');
        setLoading(false);
      }
    }

    if (sessionId) {
      fetchData();
    }
  }, [sessionId]);

  // Auto-trigger print dialog after content loads
  useEffect(() => {
    if (!loading && !error && sessionPlan) {
      // Small delay to ensure content is fully rendered
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, error, sessionPlan]);

  if (loading) {
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

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          /* Prevent individual action point boxes from splitting across pages */
          .action-point-box {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Ensure proper page sizing with cream background */
          @page {
            margin: 0.5in;
            size: A4;
          }

          /* Make header appear on every page */
          .page-header {
            position: running(header);
          }

          /* Cream background for print */
          body {
            background-color: #ecebdd !important;
          }
        }

        @media screen {
          /* Cream background for screen preview */
          body {
            background-color: #ecebdd !important;
          }
        }
      `}</style>

      <div className="min-h-screen p-8" style={{ backgroundColor: '#ecebdd' }}>
        <div className="max-w-4xl mx-auto">
          {/* Header Section - Narrower */}
          <div style={{ backgroundColor: '#4f6749' }} className="text-white p-4 rounded-lg mb-6 page-header">
            <h1 className="text-xl font-bold">RAISING MY RESCUE</h1>
            <p className="text-sm text-gray-300">Professional Dog Training Services</p>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>

          {/* Main Goals */}
          {mainGoals.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Main Goals</h3>
              <div className="bg-white p-4 rounded-md space-y-2">
                {mainGoals.map((goal, index) => (
                  <div key={index} className="flex items-start">
                    <span className="font-medium text-gray-700 mr-2">•</span>
                    <div className="flex-1">
                      <strong>Main Goal {index + 1}:</strong>{' '}
                      <SafeHtmlRenderer html={goal} className="inline" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation of Behaviour */}
          {explanationOfBehaviour && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Explanation of Behaviour</h3>
              <div className="bg-white p-4 rounded-md">
                <SafeHtmlRenderer html={explanationOfBehaviour} />
              </div>
            </div>
          )}

          {/* Action Points */}
          {editableActionPoints.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Action Points</h3>
              <div className="space-y-4">
                {editableActionPoints.map((actionPoint, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-4 action-point-box bg-white">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Action Point {index + 1}: <SafeHtmlRenderer html={actionPoint.header} className="inline" />
                    </h4>
                    <div className="text-gray-700">
                      <SafeHtmlRenderer html={actionPoint.details} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t border-gray-200">
            Generated on {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')}
          </div>
        </div>
      </div>
    </>
  );
}

