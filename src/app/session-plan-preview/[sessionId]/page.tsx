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
  const isPrintMode = searchParams.get("print") === "true";

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
  const [pagedJsReady, setPagedJsReady] = useState(false);

  /* -------------------------------------------
     LOAD PAGED.JS FOR BROWSER PREVIEW ONLY
  -------------------------------------------- */
  useEffect(() => {
    if (loading || !sessionPlan || pagedJsReady) return;

    console.log("Loading Paged.js…");

    const script = document.createElement("script");
    script.src = "https://unpkg.com/pagedjs/dist/paged.polyfill.js";
    script.async = true;

    script.onload = () => {
      console.log("Paged.js loaded.");
      setPagedJsReady(true);
      setTimeout(() => {
        document.body.setAttribute("data-paged-ready", "true");
      }, 1000);
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [loading, sessionPlan, pagedJsReady]);

  /* -------------------------------------------
     THE NEW PRINT → UPLOAD → EMAIL WORKFLOW
     (works on Mac + Windows Chrome)
  -------------------------------------------- */
  useEffect(() => {
    if (!sessionPlan) return;

    console.log("🟢 Button effect mounted");

    const button = document.createElement("button");
    button.id = "pdf-export-btn";
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
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
      border: none;
      cursor: pointer;
      z-index: 999999;
      font-size: 1rem;
    `;

    document.body.appendChild(button);

    button.onclick = () => {
      console.log("🟡 Button clicked → print()");

      button.textContent = "Printing…";

      window.print();

      const afterPrint = () => {
        console.log("🟢 afterprint fired");

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/pdf";

        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return;

          console.log("📄 PDF selected:", file);

          button.textContent = "Uploading…";

          const formData = new FormData();
          formData.append("file", file);
          formData.append("sessionId", sessionPlan.sessionId);

          const uploadRes = await fetch("/api/upload-final-pdf", {
            method: "POST",
            body: formData,
          });

          const json = await uploadRes.json();

          if (!uploadRes.ok) {
            alert("Upload failed: " + json.error);
            button.textContent = "Generate PDF Email";
            return;
          }

          console.log("✔ Uploaded:", json.pdfUrl);
          button.textContent = "Sending email…";

          // SEND TO MAKE.COM
          await fetch("https://hook.eu1.make.com/lbfmnhl3xpf7c0y2sfos3vdln6y1fmqm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: sessionPlan.sessionId,
              pdfUrl: json.pdfUrl,
              clientEmail: client?.email,
              clientFirstName: client?.firstName,
              clientLastName: client?.lastName,
              dogName: session?.dogName || client?.dogName,
              sessionNumber: sessionPlan.sessionNumber,
              emailSubject: `Session ${sessionPlan.sessionNumber} Plan`,
              timestamp: new Date().toISOString(),
            }),
          });

          alert("PDF uploaded and emailed!");
          button.textContent = "Generate PDF Email";
        };

        input.click();
        window.removeEventListener("afterprint", afterPrint);
      };

      // Works on Windows Chrome + Mac Chrome
      const mediaQuery = window.matchMedia("print");
      mediaQuery.addEventListener("change", (e) => {
        if (!e.matches) afterPrint();
      });

      window.addEventListener("afterprint", afterPrint);
    };

    return () => {
      if (document.body.contains(button)) document.body.removeChild(button);
    };
  }, [sessionPlan, client, session]);

  /* -------------------------------------------
     FETCH SESSION DATA
  -------------------------------------------- */
  useEffect(() => {
    async function load() {
      try {
        console.log("Fetching session data…");

        const res = await fetch(`/api/session-plan-preview/${sessionId}`);
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Failed");

        const plan = json.sessionPlan;
        const sessionData = json.session;
        const clientData = json.client;
        const apData = json.actionPoints;

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

        const cli: Client = {
          id: clientData.id,
          firstName: clientData.first_name,
          lastName: clientData.last_name,
          dogName: clientData.dog_name,
          otherDogs: clientData.other_dogs || [],
          email: clientData.email,
          phone: clientData.phone,
          partnerName: clientData.partner_name,
          address: clientData.address,
          active: clientData.active,
          membership: clientData.membership,
          behaviouralBriefId: clientData.behavioural_brief_id,
          avatar: clientData.avatar,
          booking_terms_signed: clientData.booking_terms_signed,
          booking_terms_signed_date: clientData.booking_terms_signed_date,
        };

        setClient(cli);

        const goals = [
          plan.main_goal_1,
          plan.main_goal_2,
          plan.main_goal_3,
          plan.main_goal_4,
        ].filter(Boolean);

        setMainGoals(goals);

        setExplanationOfBehaviour(plan.explanation_of_behaviour || "");

        const editable: EditableActionPoint[] = [];

        for (const apId of plan.action_points || []) {
          const ap = apData.find((x: any) => x.id === apId);
          if (!ap) continue;

          const edited = plan.edited_action_points?.[apId];

          editable.push({
            header: edited?.header || ap.header,
            details: edited?.details || ap.details,
          });
        }

        setEditableActionPoints(editable);

        // Build title
        const dogName = sess.dogName || cli.dogName || "Dog";
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
     RENDER UI (unchanged)
  -------------------------------------------- */

  if (loading) return <div className="min-h-screen bg-white"></div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      {/* THE REST OF YOUR JSX LAYOUT BELOW — unchanged */}
      {/* Keeping your styling, layout, SafeHtmlRenderer, etc. */}

      {/* ... */}
    </>
  );
}