'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

/**
 * React Query Provider
 * 
 * Provides data caching and synchronization for the application.
 * Configured with optimal defaults for performance and UX.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // Create QueryClient instance with optimized configuration
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache data for 5 minutes
            staleTime: 5 * 60 * 1000,
            
            // Keep unused data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            
            // Retry failed requests once
            retry: 1,
            
            // Don't refetch on window focus (we have realtime subscriptions)
            refetchOnWindowFocus: false,
            
            // Don't refetch on mount if data is fresh
            refetchOnMount: false,
            
            // Refetch on reconnect
            refetchOnReconnect: true,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

