/**
 * Common SSR utilities for admin pages
 * Handles authentication context issues during server-side rendering
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Skip SSR prefetch for authenticated routes to avoid 401 errors
 * 
 * SSR context doesn't have access to user authentication (cookies/localStorage)
 * This prevents "Unauthorized" errors during SSR prefetch that cause 7s delays
 * 
 * @param routeName - Name of the admin route for logging
 * @param queryClient - TanStack Query client (unused but kept for future use)
 */
export function skipAuthenticatedSSRPrefetch(
  routeName: string, 
  queryClient?: QueryClient
): void {
  console.log(`🔐 [SSR] Skipping prefetch for authenticated route: ${routeName} - will load client-side`);
  
  // Note: This prevents the "Unauthorized" error during SSR prefetch
  // Client-side rendering will handle authentication and data fetching properly
  
  // Future enhancement: Could add conditional prefetch for public data
  // or implement server-side auth context if needed
}

/**
 * Log SSR performance for admin pages
 */
export function logSSRPerformance(routeName: string, startTime: number): void {
  const duration = Date.now() - startTime;
  console.log(`⚡ [SSR] ${routeName} rendered in ${duration}ms`);
}

/**
 * Common admin page wrapper that handles SSR authentication issues
 */
export interface AdminPageSSRConfig {
  routeName: string;
  skipPrefetch?: boolean;
  logPerformance?: boolean;
}

export function handleAdminPageSSR(config: AdminPageSSRConfig): void {
  const startTime = Date.now();
  
  if (config.skipPrefetch !== false) {
    skipAuthenticatedSSRPrefetch(config.routeName);
  }
  
  if (config.logPerformance) {
    // Log after a short delay to capture full SSR time
    setTimeout(() => logSSRPerformance(config.routeName, startTime), 0);
  }
}
