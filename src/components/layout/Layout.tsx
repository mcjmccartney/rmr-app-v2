'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import FloatingActionButton from './FloatingActionButton';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  // Define the main navigation pages in order
  const mainPages = ['/clients', '/calendar', '/sessions'];

  // Keyboard navigation for main pages (excluding calendar page)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle navigation on main pages and when no modals are open
      if (!mainPages.includes(pathname)) return;

      // Don't handle left/right navigation on calendar page (calendar has its own navigation)
      if (pathname === '/calendar') return;

      // Check if any input/textarea is focused
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      )) {
        return;
      }

      // Check if any modal is open
      const modalElements = document.querySelectorAll('[role="dialog"], .modal, [data-modal]');
      if (modalElements.length > 0) {
        return;
      }

      const currentIndex = mainPages.indexOf(pathname);

      if (event.key === 'ArrowLeft' && currentIndex > 0) {
        event.preventDefault();
        router.push(mainPages[currentIndex - 1]);
      } else if (event.key === 'ArrowRight' && currentIndex < mainPages.length - 1) {
        event.preventDefault();
        router.push(mainPages[currentIndex + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pathname, router]);

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/behavioural-brief', '/behaviour-questionnaire', '/booking-terms', '/booking-terms-completed'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If it's a public route or user is not authenticated, render without protection
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // For protected routes, wrap with ProtectedRoute
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {children}
        <FloatingActionButton />
      </div>
    </ProtectedRoute>
  );
}
