// Testing utilities for React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { QueryKey } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { apiClient } from './api';

interface GlobalWithFetch {
  fetch: typeof fetch;
}

// Mock API responses - using unknown instead of any for better type safety
export interface MockResponse<T = unknown> {
  data?: T;
  error?: Error;
  delay?: number;
  status?: number;
}

export class MockApiClient {
  private mocks = new Map<string, MockResponse>();
  private callLog: Array<{ url: string; options?: RequestInit; timestamp: number }> = [];

  // Set up mock responses
  mock<T>(url: string | RegExp, response: MockResponse<T>) {
    const key = url instanceof RegExp ? url.source : url;
    this.mocks.set(key, response);
  }

  // Clear all mocks
  clearMocks() {
    this.mocks.clear();
    this.callLog = [];
  }

  // Get call history
  getCallLog() {
    return [...this.callLog];
  }

  // Mock fetch implementation
  async mockFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input.url;
    
    // Log the call
    this.callLog.push({
      url,
      options: init,
      timestamp: Date.now(),
    });

    // Find matching mock
    let mockResponse: MockResponse | undefined;
    for (const [pattern, response] of this.mocks.entries()) {
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        // Regex pattern
        const regex = new RegExp(pattern.slice(1, -1));
        if (regex.test(url)) {
          mockResponse = response;
          break;
        }
      } else if (url.includes(pattern)) {
        // String pattern
        mockResponse = response;
        break;
      }
    }

    // Apply delay if specified
    if (mockResponse?.delay) {
      await new Promise(resolve => setTimeout(resolve, mockResponse.delay));
    }

    // Return error response
    if (mockResponse?.error) {
      throw mockResponse.error;
    }

    // Return success response
    const status = mockResponse?.status || 200;
    const data = mockResponse?.data;

    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Create test query client
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}


// Test wrapper component
interface TestWrapperProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

export function TestWrapper({ children, queryClient }: TestWrapperProps) {
  const client = queryClient || createTestQueryClient();

  return React.createElement(
    QueryClientProvider,
    { client },
    children
  );
}

// Query test helpers
export const queryTestHelpers = {
  // Wait for query to settle
  waitForQuery: async (queryClient: QueryClient, queryKey: QueryKey) => {
    return new Promise<void>((resolve) => {
      const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
        if (event?.query?.queryKey === queryKey && event?.query?.state.status !== 'pending') {
          unsubscribe();
          resolve();
        }
      });
    });
  },

  // Set query data for testing
  setQueryData: <T>(queryClient: QueryClient, queryKey: QueryKey, data: T) => {
    queryClient.setQueryData(queryKey, data);
  },

  // Trigger query error
  setQueryError: (queryClient: QueryClient, queryKey: QueryKey, error: Error) => {
    queryClient.setQueryData(queryKey, () => {
      throw error;
    });
  },

  // Get query state
  getQueryState: (queryClient: QueryClient, queryKey: QueryKey) => {
    return queryClient.getQueryState(queryKey);
  },

  // Clear all queries
  clear: (queryClient: QueryClient) => {
    queryClient.clear();
  },
};

// Mutation test helpers
export const mutationTestHelpers = {
  // Mock successful mutation
  mockSuccess: <T>(mockClient: MockApiClient, url: string, data: T) => {
    mockClient.mock(url, { data, status: 200 });
  },

  // Mock failed mutation
  mockError: (mockClient: MockApiClient, url: string, error: Error) => {
    mockClient.mock(url, { error });
  },

  // Mock slow mutation
  mockSlow: <T>(mockClient: MockApiClient, url: string, data: T, delay: number) => {
    mockClient.mock(url, { data, delay, status: 200 });
  },
};

// Integration test helpers
export const integrationTestHelpers = {
  // Setup complete test environment
  setupTestEnvironment: () => {
    const mockClient = new MockApiClient();
    const queryClient = createTestQueryClient();
    
    // Replace global fetch with mock
    const originalFetch = (globalThis as GlobalWithFetch).fetch;
    // Cast to satisfy TS overloads in different environments
    (globalThis as GlobalWithFetch).fetch = mockClient.mockFetch.bind(mockClient) as typeof fetch;
    
    return {
      mockClient,
      queryClient,
      cleanup: () => {
        (globalThis as GlobalWithFetch).fetch = originalFetch;
        queryClient.clear();
        mockClient.clearMocks();
      },
    };
  },

  // Common test scenarios
  scenarios: {
    // Test optimistic updates
    optimisticUpdate: <T extends { id: number }>(
      queryClient: QueryClient,
      listKey: QueryKey,
      detailKey: QueryKey,
      updateData: Partial<T>
    ) => {
      // Set initial data
      queryClient.setQueryData(listKey, [{ id: 1, name: 'Test' }]);
      queryClient.setQueryData(detailKey, { id: 1, name: 'Test' });
      
      // Simulate optimistic update
      queryClient.setQueryData(listKey, (old: T[] | undefined) => 
        old?.map((item: T) => item.id === 1 ? { ...item, ...updateData } : item)
      );
      queryClient.setQueryData(detailKey, (old: T | undefined) => ({ ...old, ...updateData }));
      
      return {
        listData: queryClient.getQueryData(listKey),
        detailData: queryClient.getQueryData(detailKey),
      };
    },

    // Test cache invalidation
    cacheInvalidation: async (queryClient: QueryClient, pattern: QueryKey) => {
      await queryClient.invalidateQueries({ queryKey: pattern });

      // Return queries that were invalidated
      return queryClient.getQueryCache().findAll({ queryKey: pattern });
    },

    // Illustrate timeout and retry configuration
    timeoutAndRetry: async () => {
      const { mockClient, cleanup } = integrationTestHelpers.setupTestEnvironment();
      // A slow endpoint that will exceed the timeout
      mockClient.mock('/slow', { delay: 50, status: 200, data: { ok: true } });
      try {
        await apiClient.request('/slow', { timeout: 10, retries: 2 });
      } catch {
        // ignore
      }
      const attempts = mockClient.getCallLog().length;
      cleanup();
      return attempts;
    },
  },
};
