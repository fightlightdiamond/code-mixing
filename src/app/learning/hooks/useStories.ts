"use client";
import { logger } from '@/lib/logger';

import { useState, useEffect, useCallback } from "react";
import type { LearningStory, StoryFilters } from "../types/learning";
import type { DifficultyLevel } from "@prisma/client";

interface UseStoriesReturn {
  stories: LearningStory[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseStoriesOptions {
  filters?: StoryFilters;
  autoFetch?: boolean;
}

export function useStories(options: UseStoriesOptions = {}): UseStoriesReturn {
  const { filters, autoFetch = true } = options;
  const [stories, setStories] = useState<LearningStory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (filters?.level) {
        params.append("level", filters.level);
      }
      if (filters?.storyType) {
        params.append("type", filters.storyType);
      }
      if (filters?.search) {
        params.append("search", filters.search);
      }
      if (filters?.minWordCount) {
        params.append("minWords", filters.minWordCount.toString());
      }
      if (filters?.maxWordCount) {
        params.append("maxWords", filters.maxWordCount.toString());
      }

      const url = `/api/learning/stories${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStories(data);
    } catch (err) {
      logger.error("Error fetching stories:", undefined, err as Error);
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách truyện"
      );
      setStories([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      fetchStories();
    }
  }, [fetchStories, autoFetch]);

  return {
    stories,
    isLoading,
    error,
    refetch: fetchStories,
  };
}

// Hook to fetch a single story by ID
export function useStory(storyId: string | null) {
  const [story, setStory] = useState<LearningStory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStory = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/stories/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setStory(data);
    } catch (err) {
      logger.error("Error fetching story:", undefined, err as Error);
      setError(err instanceof Error ? err.message : "Không thể tải truyện");
      setStory(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (storyId) {
      fetchStory(storyId);
    } else {
      setStory(null);
      setError(null);
    }
  }, [storyId, fetchStory]);

  return {
    story,
    isLoading,
    error,
    refetch: storyId ? () => fetchStory(storyId) : () => Promise.resolve(),
  };
}
