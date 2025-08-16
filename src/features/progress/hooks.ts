import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { keyFactory } from "@/core/api/keyFactory";
import { api } from "@/core/api/api";
import type { ProgressStatusType } from "@/types/schema";

export interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  status: ProgressStatusType;
  lastViewedAt: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertProgressData {
  lessonId: string;
  status?: ProgressStatusType;
}

export interface UpdateProgressData {
  status?: ProgressStatusType;
  lastViewedAt?: string;
}

export interface ListProgressParams {
  status?: ProgressStatusType;
}

export type DeleteProgressParams = {
  id: string;
  lessonId?: string;
};

export const buildLessonProgressQuery = (lessonId: string) =>
  queryOptions({
    queryKey: keyFactory.detail("user-progress", lessonId),
    queryFn: ({ signal }) =>
      api<UserProgress | null>(`/api/progress?lessonId=${lessonId}`, { signal }),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    enabled: !!lessonId,
  });

export const buildProgressListQuery = (params?: ListProgressParams) =>
  queryOptions({
    queryKey: keyFactory.list("user-progress", params),
    queryFn: ({ signal }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append("status", params.status);
      const url = `/api/progress${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;
      return api<UserProgress[]>(url, { signal });
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

export const useLessonProgress = (lessonId: string) =>
  useQuery(buildLessonProgressQuery(lessonId));

export const useProgressList = (params?: ListProgressParams) =>
  useQuery(buildProgressListQuery(params));

export function useUpsertProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpsertProgressData) =>
      api<UserProgress>("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: keyFactory.detail("user-progress", data.lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: keyFactory.list("user-progress"),
      });
    },
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgressData }) =>
      api<UserProgress>(`/api/progress/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: keyFactory.detail("user-progress", data.lessonId),
      });
      queryClient.invalidateQueries({
        queryKey: keyFactory.list("user-progress"),
      });
    },
  });
}

export function useDeleteProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteProgressParams) =>
      api(`/api/progress/${id}`, { method: "DELETE" }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: keyFactory.list("user-progress"),
      });
      if (variables.lessonId) {
        queryClient.invalidateQueries({
          queryKey: keyFactory.detail(
            "user-progress",
            variables.lessonId
          ),
        });
      }
    },
  });
}
