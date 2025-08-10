import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { keyFactory } from "@/core/api/keyFactory";
import { api } from "@/core/api/api";

// Types
export interface Lesson {
  id: string;
  title: string;
  order: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  unitId: string;
  courseId: string;
  tenantId: string;
  _count?: {
    stories: number;
    vocabularies: number;
    quizzes: number;
    userResults: number;
  };
}

export interface LessonDetail extends Lesson {
  stories: Array<{
    id: number;
    title: string;
    storyType: string;
    chemRatio: number | null;
    createdAt: string;
  }>;
  vocabularies: Array<{
    id: number;
    word: string;
    meaning: string;
    example: string | null;
  }>;
  grammarPoints: Array<{
    id: number;
    point: string;
    explanation: string;
  }>;
  quizzes: Array<{
    id: number;
    title: string;
    description: string | null;
    _count: {
      questions: number;
    };
  }>;
}

export interface CreateLessonData {
  title: string;
  order: number;
  unitId: string;
  courseId: string;
  status?: string;
}

export interface UpdateLessonData {
  title?: string;
  order?: number;
  status?: string;
}

// Query builders
export const buildLessonsListQuery = (params?: {
  search?: string;
  status?: string;
}) =>
  queryOptions({
    queryKey: keyFactory.list("lessons", params),
    queryFn: ({ signal }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append("search", params.search);
      if (params?.status) searchParams.append("status", params.status);

      const url = `/api/lessons${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;
      return api<Lesson[]>(url, { signal });
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
  });

export const buildLessonDetailQuery = (id: string) =>
  queryOptions({
    queryKey: keyFactory.detail("lessons", id),
    queryFn: ({ signal }) =>
      api<LessonDetail>(`/api/lessons/${id}`, { signal }),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    enabled: !!id,
  });

// Mutations
export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLessonData) =>
      api<Lesson>("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLessonData }) =>
      api<Lesson>(`/api/lessons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api(`/api/lessons/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}
