'use client';

import { useSearchParams, useParams } from 'next/navigation';
import PDFGenerateButton from '@/components/PDFGenerateButton';
import { useEffect, useState } from 'react';

export default function SessionPlanPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const params = useParams();
  const sessionId = params.sessionId as string;
  const isPrintMode = searchParams.get('print') === 'true';
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    // Listen for session data from the page component
    const handleSessionData = (event: CustomEvent) => {
      setSessionData(event.detail);
    };

    window.addEventListener('sessionDataLoaded' as any, handleSessionData);

    return () => {
      window.removeEventListener('sessionDataLoaded' as any, handleSessionData);
    };
  }, []);

  return (
    <>
      {children}
      {/* Render button completely outside the page component */}
      {!isPrintMode && sessionData && (
        <PDFGenerateButton
          sessionId={sessionId}
          session={sessionData.session}
          client={sessionData.client}
          sessionPlan={sessionData.sessionPlan}
        />
      )}
    </>
  );
}

