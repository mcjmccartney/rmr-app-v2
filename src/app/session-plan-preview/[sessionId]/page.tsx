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
     PAGED.JS LOADER
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
  }, [loading, sessionPlan, pagedJsReady]);

  /* -------------------------------------------
     PRINT → UPLOAD → EMAIL BUTTON
  -------------------------------------------- */
  useEffect(() => {
    if (!sessionPlan) return;

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
      console.log("🟡 Print triggered");
      button.textContent = "Printing…";

      window.print();

      const afterPrint = () => {
        console.log("🟢 Print dialog closed");

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/pdf";

        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return;

          console.log("📄 PDF chosen");

          button.textContent = "Uploading…";

          const formData = new FormData();
          formData.append("file", file);
          formData.append("sessionId", sessionPlan.sessionId);

          const upload = await fetch("/api/upload-final-pdf", {
            method: "POST",
            body: formData,
          });

          const json = await upload.json();

          if (!upload.ok) {
            alert("Upload failed: " + json.error);
            button.textContent = "Generate PDF Email";
            return;
          }

          button.textContent = "Sending Email…";

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
            }),
          });

          alert("PDF emailed!");
          button.textContent = "Generate PDF Email";
        };

        input.click();
        window.removeEventListener("afterprint", afterPrint);
      };

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
     UI RENDER
  -------------------------------------------- */

  if (loading) return <div className="min-h-screen bg-white"></div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <meta name="pdfshift-wait-for-selector" content="[data-paged-ready='true']" />

      {/* WRAP ALL CONTENT SO PAGED.JS CAN SEE IT */}
      <div id="paged-content">

        {/* --- ALL YOUR ORIGINAL STYLES (unchanged) --- */}
        <style>{`
          body {
            background: ${isPrintMode ? 'white' : '#ecebdd'};
            margin: 0;
            font-family: Arial, sans-serif;
          }
        `}</style>

        {/* --- CONTENT WRAPPER --- */}
        <div className="content-wrapper px-6 py-6">

          <h1 className="text-4xl mb-10">{title}</h1>

          {/* Goals */}
          {mainGoals.length > 0 && (
            <div className="mb-8">
              <h3 className="text-3xl mb-3 italic">Main Goals</h3>

              {mainGoals.map((g, i) => (
                <p key={i} className="mb-2 text-gray-800">
                  • <SafeHtmlRenderer html={g} />
                </p>
              ))}
            </div>
          )}

          {/* Explanation */}
          {explanationOfBehaviour && (
            <div className="mb-10">
              <h3 className="text-3xl italic mb-3">Explanation of Behaviour</h3>
              <SafeHtmlRenderer html={explanationOfBehaviour} />
            </div>
          )}

          {/* Action Points */}
          {editableActionPoints.length > 0 && (
            <div className="space-y-8">
              {editableActionPoints.map((ap, i) => (
                <div key={i}>
                  <h3 className="text-3xl italic mb-3">
                    <SafeHtmlRenderer html={ap.header} />
                  </h3>
                  <div className="border-2 rounded-md p-4 bg-white">
                    <SafeHtmlRenderer html={ap.details} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-20 text-sm text-gray-700">
            <strong>Reminder:</strong> Behavioural reports are for guidance only.
          </div>
        </div>

      </div>
    </>
  );
}