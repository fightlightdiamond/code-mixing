import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { keyFactory } from "@/core/api/keyFactory";
import { api } from "@/core/api/api";

// Types
export interface QuizQuestion {
  id: number;
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  lessonId: number | null;
  createdAt: string;
  updatedAt: string;
  lesson?: {
    id: number;
    title: string;
  } | null;
  questions: QuizQuestion[];
  _count: {
    questions: number;
    userResults: number;
  };
}

export interface CreateQuizData {
  title: string;
  description?: string;
  lessonId?: number;
  questions?: Array<{
    questionText: string;
    questionType?: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
  }>;
}

export interface UpdateQuizData {
  title?: string;
  description?: string;
  lessonId?: number;
  questions?: Array<{
    questionText: string;
    questionType?: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
  }>;
}

// Query builders
export const buildQuizzesListQuery = (params?: {
  search?: string;
  lessonId?: number;
}) =>
  queryOptions({
    queryKey: keyFactory.list("quizzes", params),
    queryFn: ({ signal }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append("search", params.search);
      if (params?.lessonId)
        searchParams.append("lessonId", params.lessonId.toString());

      const url = `/api/quizzes${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;
      return api<Quiz[]>(url, { signal });
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
  });

export const buildQuizDetailQuery = (id: number) =>
  queryOptions({
    queryKey: keyFactory.detail("quizzes", id),
    queryFn: ({ signal }) => api<Quiz>(`/api/quizzes/${id}`, { signal }),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    enabled: !!id,
  });

// Mutations
export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuizData) =>
      api<Quiz>("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] }); // Update lesson counts
    },
  });
}

export function useUpdateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateQuizData }) =>
      api<Quiz>(`/api/quizzes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] }); // Update lesson counts
    },
  });
}

export function useDeleteQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api(`/api/quizzes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] }); // Update lesson counts
    },
  });
}
