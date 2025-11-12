import { ReactNode } from 'react';

export default function SessionPlanPreviewLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Minimal layout without AppProvider, ModalProvider, or Layout wrapper
  // This prevents interference with Paged.js rendering
  return <>{children}</>;
}

