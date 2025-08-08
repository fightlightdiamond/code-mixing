import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { keyFactory } from "@/core/api/keyFactory";
import { api } from "@/core/api/api";

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

// Query builders
export const buildUsersListQuery = (params?: { search?: string }) =>
  queryOptions({
    queryKey: keyFactory.list("users", params),
    queryFn: ({ signal }) => {
      const url = `/api/users${
        params?.search ? `?search=${encodeURIComponent(params.search)}` : ""
      }`;
      return api<User[]>(url, { signal });
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
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
