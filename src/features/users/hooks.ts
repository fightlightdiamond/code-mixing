import { logger } from '@/lib/logger';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { keyFactory } from "@/core/api/keyFactory";
import { api, ApiError } from "@/core/api/api";
import type { ApiResponse } from "@/types/api";

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: "student" | "coach" | "admin";
  createdAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  role?: "student" | "coach" | "admin";
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: "student" | "coach" | "admin";
}

// Helper to get base URL for API calls
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use relative URLs (best practice)
    return '';
  }
  
  // Server-side: try to get URL from environment or use dynamic detection
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Fallback: construct from environment variables
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.VERCEL_URL || process.env.HOST || 'localhost';
  const port = process.env.PORT || '3002'; // Default to 3002 but can be overridden
  
  return `${protocol}://${host}${port !== '80' && port !== '443' ? `:${port}` : ''}`;
};

// Query builders
export const buildUsersListQuery = (params?: { search?: string }, enabled: boolean = true) =>
  queryOptions({
    queryKey: keyFactory.list("users", params),
    queryFn: async ({ signal }) => {
      const baseUrl = getBaseUrl();
      const url = `${baseUrl}/api/users${
        params?.search ? `?search=${encodeURIComponent(params.search)}` : ""
      }`;
      logger.info('🌐 [QUERY] API URL', {
        url,
        context: typeof window !== 'undefined' ? 'client' : 'server',
      });
      
      // Fetch API response with new format
      const response = await api<ApiResponse<User[]>>(url, { signal });
      
      // Extract users array from API response for backward compatibility
      if (response.success && response.data) {
        logger.info('✅ [QUERY] API response successful', {
          userCount: response.data.length,
        });
        return response.data; // Return just the users array
      } else {
        logger.error('❌ [QUERY] API response failed', { response });
        throw new Error(response.message || 'Failed to fetch users');
      }
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof ApiError && error.status === 401) {
        return false;
      }
      // For other errors, retry up to 3 times
      return failureCount < 3;
    },
    enabled,
  });

// Mutations
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUserData) =>
      api<User>("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserData }) =>
      api<User>(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
