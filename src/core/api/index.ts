/**
 * @fileoverview Enterprise-grade React Query API layer
 * 
 * This module provides a comprehensive, type-safe, and scalable API layer
 * built on top of @tanstack/react-query with the following features:
 * 
 * - 🏗️ **Resource Factory Pattern**: Automatically generates CRUD hooks
 * - 🔑 **Smart Query Keys**: Hierarchical, normalized cache keys
 * - 🚀 **Optimistic Updates**: Built-in optimistic UI patterns
 * - 📊 **Performance Monitoring**: Query/mutation analytics
 * - 🛡️ **Error Handling**: Comprehensive error types and retry logic
 * - 🧪 **Testing Utilities**: Complete testing toolkit
 * - 🔄 **Cache Management**: Intelligent invalidation strategies
 * - 📱 **Offline Support**: Network-aware query behavior
 * 
 * @example Basic Usage
 * ```typescript
 * import { makeResource } from '@/core/api';
 * 
 * const UserResource = makeResource('users');
 * 
 * function UserList() {
 *   const { data, isLoading } = UserResource.useList();
 *   const createUser = UserResource.useCreate();
 *   
 *   return (
 *     <div>
 *       {data?.map(user => <div key={user.id}>{user.name}</div>)}
 *       <button onClick={() => createUser.mutate({ name: 'New User' })}>
 *         Add User
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example Advanced Usage with Custom Profiles
 * ```typescript
 * // Real-time data
 * const { data } = UserResource.useList({}, 'realtime');
 * 
 * // Static data (long cache)
 * const { data } = UserResource.useList({}, 'static');
 * 
 * // Custom invalidation
 * const updateUser = UserResource.useUpdate((vars) => ['users', 'orders']);
 * ```
 * 
 * @example Testing
 * ```typescript
 * import { TestWrapper, mockApiClient } from '@/core/api/testing';
 * 
 * test('user creation', async () => {
 *   mockApiClient.mock('/api/users', { data: { id: 1, name: 'Test' } });
 *   
 *   render(
 *     <TestWrapper>
 *       <UserForm />
 *     </TestWrapper>
 *   );
 * });
 * ```
 */

// Core API exports
export { api, apiClient } from './api';
export { makeResource } from './resourceFactory';
export { keyFactory, queryKeyUtils } from './keyFactory';
export { queryProfiles } from './queryConfig';
export { entities } from './entityRegistry';

// Error handling
export {
  ApiError,
  NetworkError,
  ValidationError,
  retryConfig,
  handleApiError,
  isRetryableError,
} from './errorHandling';

// Monitoring and analytics
export {
  queryMonitor,
  createMonitoringPlugin,
  devTools,
} from './monitoring';

// Import devTools and queryMonitor for internal use
import { devTools, queryMonitor } from './monitoring';

// Testing utilities
export {
  MockApiClient,
  createTestQueryClient,
  TestWrapper,
  queryTestHelpers,
  mutationTestHelpers,
  integrationTestHelpers,
} from './testing';

// Type exports
export type {
  EntityName,
  BaseEntity,
} from './entityRegistry';

export type {
  QueryProfileName,
} from './queryConfig';

// Re-export commonly used React Query types
export type {
  UseQueryResult,
  UseMutationResult,
  UseInfiniteQueryResult,
  QueryKey,
  MutationKey,
  QueryClient,
  QueryOptions,
  MutationOptions,
} from '@tanstack/react-query';

/**
 * Version information
 */
export const VERSION = '2.0.0';

/**
 * Feature flags for gradual rollout
 */
export const FEATURES = {
  MONITORING: process.env.NODE_ENV === 'development',
  OPTIMISTIC_UPDATES: true,
  OFFLINE_SUPPORT: true,
  ANALYTICS: process.env.NODE_ENV === 'production',
} as const;

/**
 * Configuration constants
 */
export const CONFIG = {
  DEFAULT_STALE_TIME: 60_000,
  DEFAULT_GC_TIME: 5 * 60_000,
  MAX_RETRY_ATTEMPTS: 3,
  MONITORING_BUFFER_SIZE: 1000,
} as const;

/**
 * Development utilities
 * Only available in development mode
 */
export const dev = process.env.NODE_ENV === 'development' ? {
  // Get performance stats
  getStats: () => devTools.getStats(),
  
  // Get slow queries
  getSlowQueries: (threshold?: number) => devTools.getSlowQueries(threshold),
  
  // Get error patterns
  getErrorPatterns: () => devTools.getErrorPatterns(),
  
  // Export metrics
  exportMetrics: () => devTools.exportMetrics(),
  
  // Clear monitoring data
  clearMetrics: () => queryMonitor.clear(),
} : undefined;

/**
 * Global configuration function
 * Call this once in your app initialization
 */
export function configureApi(config: {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  enableMonitoring?: boolean;
  enableAnalytics?: boolean;
}) {
  // Apply global configuration
  if (config.enableMonitoring && process.env.NODE_ENV === 'development') {
    console.log('🔍 API monitoring enabled');
  }
  
  if (config.enableAnalytics && process.env.NODE_ENV === 'production') {
    console.log('📊 API analytics enabled');
  }
  
  // Store config for use by other modules
  (globalThis as any).__API_CONFIG__ = config;
}

/**
 * Health check utilities
 */
export const healthCheck = {
  // Check if API is responsive
  ping: async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
  
  // Get API status
  status: async (): Promise<{
    healthy: boolean;
    latency: number;
    timestamp: number;
  }> => {
    const start = performance.now();
    const healthy = await healthCheck.ping();
    const latency = performance.now() - start;
    
    return {
      healthy,
      latency: Math.round(latency),
      timestamp: Date.now(),
    };
  },
};
