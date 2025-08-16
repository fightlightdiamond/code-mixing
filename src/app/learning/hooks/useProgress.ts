"use client";
import { logger } from '@/lib/logger';

import { useState, useEffect, useCallback } from "react";
import type {
  LearningProgress,
  VocabularyProgress,
  LevelProgress,
  LearningStats,
  Achievement,
} from "../types/learning";

interface UseProgressOptions {
  userId: string;
  autoSync?: boolean;
  syncInterval?: number;
}

export function useProgress({
  userId,
  autoSync = true,
  syncInterval = 30000,
}: UseProgressOptions) {
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [vocabularyProgress, setVocabularyProgress] = useState<
    VocabularyProgress[]
  >([]);
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(
    null
  );
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load progress data from server
  const loadProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [progressRes, vocabRes, levelRes, statsRes] = await Promise.all([
        fetch(`/api/learning/progress/user?userId=${userId}`),
        fetch(`/api/learning/progress/vocabulary?userId=${userId}`),
        fetch(`/api/learning/progress/level?userId=${userId}`),
        fetch(`/api/learning/progress/stats?userId=${userId}`),
      ]);

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgress(progressData);
      }

      if (vocabRes.ok) {
        const vocabData = await vocabRes.json();
        setVocabularyProgress(vocabData.vocabularyProgress || []);
      }

      if (levelRes.ok) {
        const levelData = await levelRes.json();
        setLevelProgress(levelData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      logger.error("Error loading progress:", err);
      setError("Không thể tải tiến độ học tập");

      // Load from localStorage as fallback
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load progress from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(`learning-progress-${userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        setProgress(data.progress);
        setVocabularyProgress(data.vocabularyProgress || []);
        setLevelProgress(data.levelProgress);
        setStats(data.stats);
      }
    } catch (err) {
      logger.error("Error loading from localStorage:", err);
    }
  }, [userId]);

  // Save progress to localStorage
  const saveToLocalStorage = useCallback(() => {
    try {
      const data = {
        progress,
        vocabularyProgress,
        levelProgress,
        stats,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(`learning-progress-${userId}`, JSON.stringify(data));
    } catch (err) {
      logger.error("Error saving to localStorage:", err);
    }
  }, [userId, progress, vocabularyProgress, levelProgress, stats]);

  // Update story completion
  const updateStoryCompletion = useCallback(
    async (storyId: string, timeSpent: number, score?: number) => {
      try {
        const response = await fetch("/api/learning/progress/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            type: "story_completion",
            storyId,
            timeSpent,
            score,
          }),
        });

        if (response.ok) {
          const updatedProgress = await response.json();
          setProgress(updatedProgress.progress);
          setStats(updatedProgress.stats);
          setLevelProgress(updatedProgress.levelProgress);

          // Save to localStorage
          saveToLocalStorage();
        }
      } catch (err) {
        logger.error("Error updating story completion:", err);
      }
    },
    [userId, saveToLocalStorage]
  );

  // Update vocabulary progress
  const updateVocabularyProgress = useCallback(
    async (word: string, isCorrect: boolean, timeSpent: number) => {
      try {
        const response = await fetch("/api/learning/vocabulary/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            word,
            isCorrect,
            timeSpent,
          }),
        });

        if (!response.ok) {
          throw new Error("Request failed");
        }

        const updatedVocab = await response.json();
        setVocabularyProgress((prev) => {
          const index = prev.findIndex((v) => v.word === word);
          if (index >= 0) {
            const newProgress = [...prev];
            newProgress[index] = updatedVocab;
            return newProgress;
          }
          return [...prev, updatedVocab];
        });

        // Update overall progress
        loadProgress();
      } catch (err) {
        logger.error("Error updating vocabulary progress:", err);
        setError("Không thể cập nhật tiến độ từ vựng");
      }
    },
    [userId, loadProgress]
  );

  // Get vocabulary words due for review
  const getVocabularyForReview = useCallback((): VocabularyProgress[] => {
    const now = new Date();
    return vocabularyProgress
      .filter(
        (vocab) =>
          vocab.status === "reviewing" && new Date(vocab.nextReview) <= now
      )
      .sort(
        (a, b) =>
          new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime()
      );
  }, [vocabularyProgress]);

  // Get achievement notifications
  const getNewAchievements = useCallback((): Achievement[] => {
    if (!progress) return [];

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return progress.achievements.filter(
      (achievement) => new Date(achievement.unlockedAt) > oneHourAgo
    );
  }, [progress]);

  // Calculate spaced repetition interval
  const calculateNextReview = useCallback(
    (
      masteryLevel: number,
      correctAnswers: number,
      totalAttempts: number
    ): Date => {
      const successRate =
        totalAttempts > 0 ? correctAnswers / totalAttempts : 0;
      const baseInterval = 1; // 1 day

      let multiplier = 1;
      if (successRate >= 0.9) multiplier = 4;
      else if (successRate >= 0.8) multiplier = 3;
      else if (successRate >= 0.7) multiplier = 2;
      else if (successRate >= 0.6) multiplier = 1.5;

      const interval = baseInterval * multiplier * (masteryLevel / 100 + 1);
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + Math.ceil(interval));

      return nextReview;
    },
    []
  );

  // Mark vocabulary as mastered
  const markVocabularyMastered = useCallback(
    async (word: string) => {
      try {
        const response = await fetch(
          "/api/learning/progress/vocabulary/master",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId,
              word,
            }),
          }
        );

        if (response.ok) {
          setVocabularyProgress((prev) =>
            prev.map((vocab) =>
              vocab.word === word
                ? { ...vocab, status: "mastered" as const, masteryLevel: 100 }
                : vocab
            )
          );

          // Update overall progress
          loadProgress();
        }
      } catch (err) {
        logger.error("Error marking vocabulary as mastered:", err);
      }
    },
    [userId, loadProgress]
  );

  // Get progress percentage for a specific area
  const getProgressPercentage = useCallback(
    (area: "stories" | "vocabulary" | "overall"): number => {
      if (!progress) return 0;

      switch (area) {
        case "stories":
          return Math.min(100, (progress.storiesRead / 50) * 100); // Assuming 50 stories per level
        case "vocabulary":
          return Math.min(100, (progress.vocabularyLearned / 500) * 100); // Assuming 500 words per level
        case "overall":
          return progress.completionPercentage;
        default:
          return 0;
      }
    },
    [progress]
  );

  // Initialize and set up auto-sync
  useEffect(() => {
    loadProgress();

    if (autoSync) {
      const interval = setInterval(loadProgress, syncInterval);
      return () => clearInterval(interval);
    }
  }, [loadProgress, autoSync, syncInterval]);

  // Save to localStorage when data changes
  useEffect(() => {
    if (progress || vocabularyProgress.length > 0 || levelProgress || stats) {
      saveToLocalStorage();
    }
  }, [progress, vocabularyProgress, levelProgress, stats, saveToLocalStorage]);

  return {
    progress,
    vocabularyProgress,
    levelProgress,
    stats,
    isLoading,
    error,
    actions: {
      updateStoryCompletion,
      updateVocabularyProgress,
      markVocabularyMastered,
      refresh: loadProgress,
    },
    utils: {
      getVocabularyForReview,
      getNewAchievements,
      calculateNextReview,
      getProgressPercentage,
    },
  };
}
