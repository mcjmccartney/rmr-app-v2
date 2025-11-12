import { ReactNode } from 'react';
import '../globals.css';

export default function SessionPlanPreviewLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Minimal layout without AppProvider, ModalProvider, or Layout wrapper
  // This prevents interference with Paged.js rendering
  // But we still need globals.css for Tailwind
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}

