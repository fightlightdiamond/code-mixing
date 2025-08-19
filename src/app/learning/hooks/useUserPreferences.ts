"use client";
import { logger } from '@/lib/logger';

import { useState, useEffect, useCallback } from "react";
import type { UserLearningPreferences } from "../types/learning";
import { DifficultyLevel, StoryType } from "@prisma/client";

// Default preferences
const DEFAULT_PREFERENCES = {
  embeddingRatio: 20,
  difficultyLevel: "beginner",
  theme: "light",
  topicPreferences: ["original", "chemdanhtu"],
  audioEnabled: true,
  autoPlayAudio: false,
  playbackSpeed: 1,
  vocabularyReviewFrequency: "daily",
  dailyGoal: 20,
  notificationsEnabled: true,
} satisfies UserLearningPreferences;

const STORAGE_KEY = "learning-preferences";

export function useUserPreferences() {
  const [preferences, setPreferences] =
    useState<UserLearningPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (err) {
      logger.error("Failed to load user preferences:", undefined, err as Error);
      setError("Không thể tải cài đặt người dùng");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;

      if (preferences.theme === "dark") {
        root.classList.add("dark");
      } else if (preferences.theme === "light") {
        root.classList.remove("dark");
      } else {
        // System theme
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        if (mediaQuery.matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    applyTheme();

    // Listen for system theme changes if using system theme
    if (preferences.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [preferences.theme]);

  // Save preferences to localStorage and server
  const savePreferences = useCallback(
    async (newPreferences: UserLearningPreferences) => {
      setIsSaving(true);
      try {
        setError(null);

        const res = await fetch("/api/user/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPreferences),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
        setPreferences(newPreferences);

        const response = await fetch("/api/user/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPreferences),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return true;
      } catch (err) {
        logger.error("Failed to save user preferences:", undefined, err as Error);
        setError("Không thể lưu cài đặt");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  // Update a specific preference
  const updatePreference = useCallback(
    <K extends keyof UserLearningPreferences>(
      key: K,
      value: UserLearningPreferences[K]
    ) => {
      const newPreferences = { ...preferences, [key]: value };
      return savePreferences(newPreferences);
    },
    [preferences, savePreferences]
  );

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    return savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  // Get filtered stories based on preferences
  const getStoryFilters = useCallback(() => {
    return {
      level: preferences.difficultyLevel,
      storyTypes: preferences.topicPreferences,
      embeddingRatio: preferences.embeddingRatio,
    };
  }, [
    preferences.difficultyLevel,
    preferences.topicPreferences,
    preferences.embeddingRatio,
  ]);

  // Check if a story matches user preferences
  const isStoryRecommended = useCallback(
    (story: {
      difficulty: DifficultyLevel;
      storyType: StoryType;
      chemRatio?: number;
    }) => {
      // Check difficulty level
      if (story.difficulty !== preferences.difficultyLevel) {
        return false;
      }

      // Check topic preferences
      if (
        preferences.topicPreferences.length > 0 &&
        !preferences.topicPreferences.includes(story.storyType)
      ) {
        return false;
      }

      // Check embedding ratio (if available)
      if (
        story.chemRatio &&
        Math.abs(story.chemRatio - preferences.embeddingRatio) > 10
      ) {
        return false;
      }

      return true;
    },
    [
      preferences.difficultyLevel,
      preferences.topicPreferences,
      preferences.embeddingRatio,
    ]
  );

  // Get audio settings
  const getAudioSettings = useCallback(() => {
    return {
      enabled: preferences.audioEnabled,
      autoPlay: preferences.autoPlayAudio,
      playbackSpeed: preferences.playbackSpeed,
    };
  }, [
    preferences.audioEnabled,
    preferences.autoPlayAudio,
    preferences.playbackSpeed,
  ]);

  // Get learning goals
  const getLearningGoals = useCallback(() => {
    return {
      dailyGoal: preferences.dailyGoal,
      reviewFrequency: preferences.vocabularyReviewFrequency,
      notificationsEnabled: preferences.notificationsEnabled,
    };
  }, [
    preferences.dailyGoal,
    preferences.vocabularyReviewFrequency,
    preferences.notificationsEnabled,
  ]);

  return {
    preferences,
    isLoading,
    isSaving,
    error,
    savePreferences,
    updatePreference,
    resetPreferences,
    getStoryFilters,
    isStoryRecommended,
    getAudioSettings,
    getLearningGoals,
  };
}
