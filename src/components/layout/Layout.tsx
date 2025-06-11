'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import FloatingActionButton from './FloatingActionButton';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
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
