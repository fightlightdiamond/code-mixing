"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Role {
  id: string;
  name: string;
  slug: string;
  tenantScope: string | null;
  isSystem: boolean;
  tenantId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertRoleInput {
  name: string;
  slug: string;
  tenantScope?: string | null;
  isSystem?: boolean;
  tenantId?: string | null;
}

const KEY = (params?: { q?: string; slug?: string; tenantScope?: string }) => [
  "roles",
  params?.q || "",
  params?.slug || "",
  params?.tenantScope || "",
];

export function buildRolesQuery(params?: { q?: string; slug?: string; tenantScope?: string }) {
  return {
    queryKey: KEY(params),
    queryFn: async (): Promise<Role[]> => {
      const url = new URL("/api/roles", window.location.origin);
      if (params?.q) url.searchParams.set("q", params.q);
      if (params?.slug) url.searchParams.set("slug", params.slug);
      if (params?.tenantScope) url.searchParams.set("tenantScope", params.tenantScope);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load roles");
      const data = await res.json();
      return data.data as Role[];
    },
  } as const;
}

export function useCreateRole(params?: { q?: string; slug?: string; tenantScope?: string }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertRoleInput): Promise<Role> => {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create role");
      return (await res.json()) as Role;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(params) }),
  });
}

export function useUpdateRole(params?: { q?: string; slug?: string; tenantScope?: string }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<UpsertRoleInput> }): Promise<Role> => {
      const res = await fetch(`/api/roles/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to update role");
      return (await res.json()) as Role;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(params) }),
  });
}

export function useDeleteRole(params?: { q?: string; slug?: string; tenantScope?: string }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete role");
      return (await res.json()) as { success: boolean };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(params) }),
  });
}
