// lib/query/client.ts
/**
 * TanStack Query client configuration for server state management
 * RED TEAM: Test cache poisoning, stale data issues, race conditions
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { APIError } from '../api/client';

/**
 * Handle query errors globally
 */
function handleQueryError(error: unknown): void {
  console.error('Query Error:', error);

  if (error instanceof APIError) {
    // Handle specific error codes
    switch (error.code) {
      case 'UNAUTHORIZED':
      case 'TOKEN_EXPIRED':
        // Trigger logout or token refresh
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        break;
      case 'FORBIDDEN':
        // Redirect to access denied page
        break;
      case 'RATE_LIMIT_EXCEEDED':
        // Show rate limit notification
        break;
    }
  }
}

/**
 * Handle mutation errors globally
 */
function handleMutationError(error: unknown): void {
  console.error('Mutation Error:', error);

  if (error instanceof APIError) {
    // Show user-friendly error message
    const message = error.message || 'An error occurred. Please try again.';

    // Dispatch custom event for UI notification
    window.dispatchEvent(
      new CustomEvent('app:error', {
        detail: { message, code: error.code },
      })
    );
  }
}

/**
 * Create and configure QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: handleQueryError,
    }),
    mutationCache: new MutationCache({
      onError: handleMutationError,
    }),
    defaultOptions: {
      queries: {
        // Stale time: how long data is considered fresh
        staleTime: 60 * 1000, // 1 minute

        // Cache time: how long inactive data stays in cache
        gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)

        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on client errors
          if (error instanceof APIError && error.status >= 400 && error.status < 500) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch configuration
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,

        // Network mode
        networkMode: 'online',
      },
      mutations: {
        // Retry mutations on network errors
        retry: (failureCount, error) => {
          if (error instanceof APIError) {
            // Only retry on network errors or server errors
            return error.status >= 500 && failureCount < 2;
          }
          return false;
        },
        networkMode: 'online',
      },
    },
  });
}

// Singleton instance for client-side
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return createQueryClient();
  }

  // Browser: reuse existing client
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }

  return browserQueryClient;
}