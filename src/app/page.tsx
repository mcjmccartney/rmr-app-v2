'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Add a small delay to allow AppContext to initialize
    const timer = setTimeout(() => {
      router.push('/sessions');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-800 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading Raising My Rescue...</p>
        <p className="mt-2 text-sm text-gray-500">Initializing application data...</p>
      </div>
    </div>
  );
}