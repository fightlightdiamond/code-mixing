import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { keyFactory } from "@/core/api/keyFactory";
import { api } from "@/core/api/api";
import type {
  LearningStory,
  Exercise,
  VocabularyData,
  LearningProgress,
  UserLearningPreferences,
  UpdateProgressData,
  VocabularyLookupData,
  SubmitExerciseData,
  ExerciseResult,
} from "./types";
import type { DifficultyLevel, StoryType } from "@prisma/client";

// Query builders for learning stories
export const buildLearningStoriesQuery = (params?: {
  search?: string;
  difficulty?: DifficultyLevel;
  storyType?: StoryType;
  limit?: number;
}) =>
  queryOptions({
    queryKey: keyFactory.list("learning-stories", params),
    queryFn: ({ signal }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append("search", params.search);
      if (params?.difficulty)
        searchParams.append("difficulty", params.difficulty);
      if (params?.storyType) searchParams.append("storyType", params.storyType);
      if (params?.limit) searchParams.append("limit", params.limit.toString());

      const url = `/api/learning/stories${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;
      return api<LearningStory[]>(url, { signal });
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
  });

export const buildStoryDetailQuery = (storyId: string) =>
  queryOptions({
    queryKey: keyFactory.detail("learning-story", storyId),
    queryFn: ({ signal }) =>
      api<LearningStory>(`/api/learning/stories/${storyId}`, { signal }),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });

export const buildStoryExercisesQuery = (storyId: string) =>
  queryOptions({
    queryKey: keyFactory.list("story-exercises", { storyId }),
    queryFn: ({ signal }) =>
      api<Exercise[]>(`/api/learning/exercises/story/${storyId}`, { signal }),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });

export const buildVocabularyQuery = (word: string, storyId?: string) =>
  queryOptions({
    queryKey: keyFactory.detail("vocabulary", { word, storyId }),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ word });
      if (storyId) params.append("storyId", storyId);
      return api<VocabularyData>(`/api/learning/vocabulary?${params}`, {
        signal,
      });
    },
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });

export const buildUserProgressQuery = () =>
  queryOptions({
    queryKey: keyFactory.detail("user-progress"),
    queryFn: ({ signal }) =>
      api<LearningProgress>("/api/learning/progress/user", { signal }),
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

export const buildUserPreferencesQuery = () =>
  queryOptions({
    queryKey: keyFactory.detail("user-preferences"),
    queryFn: ({ signal }) =>
      api<UserLearningPreferences>("/api/learning/preferences", { signal }),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });

export const buildProgressAnalyticsQuery = (
  timeframe?: "week" | "month" | "year"
) =>
  queryOptions({
    queryKey: keyFactory.list("progress-analytics", { timeframe }),
    queryFn: ({ signal }) => {
      const params = timeframe ? `?timeframe=${timeframe}` : "";
      return api<any>(`/api/learning/progress/analytics${params}`, { signal });
    },
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });

// Mutations
export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProgressData) =>
      api("/api/learning/progress/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-progress"] });
      queryClient.invalidateQueries({ queryKey: ["progress-analytics"] });
    },
  });
}

export function useSubmitExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitExerciseData) =>
      api<{ isCorrect: boolean; explanation?: string }>(
        "/api/learning/exercises/submit",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-progress"] });
    },
  });
}

export function useUpdateVocabularyProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      word: string;
      status: "learning" | "mastered";
      storyId?: string;
    }) =>
      api("/api/learning/vocabulary/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-progress"] });
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UserLearningPreferences>) =>
      api("/api/learning/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    },
  });
}

export function useSyncOfflineData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      progressUpdates: UpdateProgressData[];
      vocabularyUpdates: any[];
    }) =>
      api("/api/learning/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-progress"] });
      queryClient.invalidateQueries({ queryKey: ["progress-analytics"] });
    },
  });
}

// Specialized hooks for learning features
export function useLearningStories(params?: {
  search?: string;
  difficulty?: DifficultyLevel;
  storyType?: StoryType;
}) {
  return buildLearningStoriesQuery(params);
}

export function useStoryDetail(storyId: string) {
  return buildStoryDetailQuery(storyId);
}

export function useStoryExercises(storyId: string) {
  return buildStoryExercisesQuery(storyId);
}

export function useVocabularyLookup(word: string, storyId?: string) {
  return buildVocabularyQuery(word, storyId);
}

export function useUserProgress() {
  return buildUserProgressQuery();
}

export function useUserPreferences() {
  return buildUserPreferencesQuery();
}
