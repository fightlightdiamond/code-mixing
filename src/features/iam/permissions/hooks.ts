"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/core/api/api";

export interface Permission {
  id: string;
  name: string;
  slug: string;
  resource: string;
  action: string;
  description?: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertPermissionInput {
  name: string;
  slug: string;
  resource: string;
  action: string;
  description?: string | null;
  isSystem?: boolean;
}

const KEY = (params?: { q?: string; resource?: string; action?: string }) => [
  "permissions",
  params?.q || "",
  params?.resource || "",
  params?.action || "",
];

export function buildPermissionsQuery(params?: { q?: string; resource?: string; action?: string }) {
  return {
    queryKey: KEY(params),
    queryFn: async (): Promise<Permission[]> => {
      const url = new URL("/api/permissions", window.location.origin);
      if (params?.q) url.searchParams.set("q", params.q);
      if (params?.resource) url.searchParams.set("resource", params.resource);
      if (params?.action) url.searchParams.set("action", params.action);
      const data = await api<{ data: Permission[] }>(url.toString());
      return data.data;
    },
  } as const;
}

export function useCreatePermission(params?: { q?: string; resource?: string; action?: string }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertPermissionInput): Promise<Permission> => {
      const res = await api<Permission>("/api/permissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(params) }),
  });
}

export function useUpdatePermission(params?: { q?: string; resource?: string; action?: string }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<UpsertPermissionInput> }): Promise<Permission> => {
      const res = await api<Permission>(`/api/permissions/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(params) }),
  });
}

export function useDeletePermission(params?: { q?: string; resource?: string; action?: string }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      const res = await api<{ success: boolean }>(`/api/permissions/${id}`, { method: "DELETE" });
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(params) }),
  });
}
