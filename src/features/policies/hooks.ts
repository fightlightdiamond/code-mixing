"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type PolicyEffect = "allow" | "deny";

export interface ResourcePolicy {
  id: string; // UUID in Prisma
  name: string;
  resource: string;
  effect: PolicyEffect;
  conditions: Record<string, unknown> | null;
  priority: number;
  tenantId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertPolicyInput {
  name: string;
  resource: string;
  effect: PolicyEffect;
  conditions: Record<string, unknown> | null;
  priority: number;
  tenantId?: string | null;
  isActive: boolean;
}

const POLICIES_KEY = (params?: { resource?: string; tenantId?: string | null }) => [
  "policies",
  params?.resource || "all",
  params?.tenantId || "all",
];

export function buildPoliciesQuery(params?: { resource?: string; tenantId?: string | null }) {
  return {
    queryKey: POLICIES_KEY(params),
    queryFn: async (): Promise<ResourcePolicy[]> => {
      const url = new URL("/api/policies", window.location.origin);
      if (params?.resource) url.searchParams.set("resource", params.resource);
      if (params?.tenantId) url.searchParams.set("tenantId", params.tenantId);
      const res = await fetch(url.toString(), { headers: { "content-type": "application/json" } });
      if (!res.ok) throw new Error("Failed to load policies");
      const data = await res.json();
      return data.data as ResourcePolicy[];
    },
  } as const;
}

export function useCreatePolicy(params?: { resource?: string; tenantId?: string | null }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertPolicyInput): Promise<ResourcePolicy> => {
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create policy");
      return (await res.json()) as ResourcePolicy;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: POLICIES_KEY(params) });
    },
  });
}

export function useUpdatePolicy(params?: { resource?: string; tenantId?: string | null }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<UpsertPolicyInput> }): Promise<ResourcePolicy> => {
      const res = await fetch(`/api/policies/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to update policy");
      return (await res.json()) as ResourcePolicy;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: POLICIES_KEY(params) });
    },
  });
}

export function useDeletePolicy(params?: { resource?: string; tenantId?: string | null }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      const res = await fetch(`/api/policies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete policy");
      return (await res.json()) as { success: boolean };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: POLICIES_KEY(params) });
    },
  });
}
