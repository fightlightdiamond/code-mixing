import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { keyFactory } from "@/core/api/keyFactory";
import { api } from "@/core/api/api";

// Types
export type StoryType = 'original' | 'chemdanhtu' | 'chemdongtu' | 'chemtinhtu' | 'custom';
export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'upper_intermediate' | 'advanced' | 'proficient';
export type ContentStatus = 'draft' | 'in_review' | 'published' | 'archived' | 'rejected';
export type ChunkType = 'normal' | 'chem' | 'explain';

export interface StoryTag {
  id: string;
  name: string;
}

export interface StoryChunk {
  id: string;
  chunkOrder: number;
  chunkText: string;
  type: ChunkType;
}

export interface StoryVersion {
  id: string;
  version: number;
  content: string;
  isApproved: boolean;
  isPublished: boolean;
  chemingRatio?: number;
  createdAt: string;
  creator: {
    id: string;
    name: string;
  };
}

export interface AudioAsset {
  id: string;
  storageKey: string;
  voiceType: string;
  audioType: string;
  duration?: number;
  createdAt: string;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  storyType: StoryType;
  difficulty: DifficultyLevel;
  estimatedMinutes?: number;
  wordCount?: number;
  chemRatio?: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  lesson?: {
    id: string;
    title: string;
  } | null;
  creator: {
    id: string;
    name: string;
  };
  tags: StoryTag[];
  chunks: StoryChunk[];
  versions: StoryVersion[];
  audios: AudioAsset[];
  _count?: {
    versions: number;
    chunks: number;
    audios: number;
    learningSessions: number;
  };
}

export interface CreateStoryData {
  title: string;
  content: string;
  storyType: StoryType;
  difficulty: DifficultyLevel;
  estimatedMinutes?: number;
  chemRatio?: number;
  lessonId?: string;
  tagIds?: string[];
  status?: ContentStatus;
}

export interface UpdateStoryData {
  title?: string;
  content?: string;
  storyType?: StoryType;
  difficulty?: DifficultyLevel;
  estimatedMinutes?: number;
  chemRatio?: number;
  lessonId?: string;
  tagIds?: string[];
  status?: ContentStatus;
}

// Query builders
export const buildStoriesListQuery = (params?: {
  search?: string;
  lessonId?: string | null;
  storyType?: StoryType;
  difficulty?: DifficultyLevel;
  status?: ContentStatus;
  tagIds?: string[];
  createdBy?: string;
}) =>
  queryOptions({
    queryKey: keyFactory.list("stories", params),
    queryFn: ({ signal }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append("search", params.search);
      if (params?.lessonId !== undefined && params.lessonId !== null)
        searchParams.append("lessonId", params.lessonId);
      if (params?.storyType) searchParams.append("storyType", params.storyType);
      if (params?.difficulty) searchParams.append("difficulty", params.difficulty);
      if (params?.status) searchParams.append("status", params.status);
      if (params?.createdBy) searchParams.append("createdBy", params.createdBy);
      if (params?.tagIds?.length) {
        params.tagIds.forEach(tagId => searchParams.append("tagIds", tagId));
      }

      const url = `/api/stories${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;
      return api<Story[]>(url, { signal });
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
  });

// Mutations
export function useCreateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStoryData) =>
      api<Story>("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoryData }) =>
      api<Story>(`/api/stories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api(`/api/stories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
};

// Additional hooks for comprehensive management
export const buildTagsListQuery = () =>
  queryOptions({
    queryKey: keyFactory.list("tags"),
    queryFn: ({ signal }) => api<StoryTag[]>("/api/tags", { signal }),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

export const buildStoryVersionsQuery = (storyId: string) =>
  queryOptions({
    queryKey: keyFactory.list("story-versions", { storyId }),
    queryFn: ({ signal }) => api<StoryVersion[]>(`/api/stories/${storyId}/versions`, { signal }),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

export function useBulkUpdateStories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<UpdateStoryData> }) =>
      api("/api/stories/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, data }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useBulkDeleteStories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) =>
      api("/api/stories/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}
