"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  UserLearningPreferences,
  VocabularyProgress,
  ReviewFrequency,
} from "../types/learning";

interface ReviewSchedule {
  word: string;
  nextReviewDate: Date;
  priority: "high" | "medium" | "low";
  daysSinceLastReview: number;
  reviewCount: number;
  masteryLevel: number;
}

interface SpacedRepetitionConfig {
  initialInterval: number; // days
  easyMultiplier: number;
  goodMultiplier: number;
  hardMultiplier: number;
  againMultiplier: number;
  masteryThreshold: number; // 0-100
}

const DEFAULT_SRS_CONFIG: SpacedRepetitionConfig = {
  initialInterval: 1,
  easyMultiplier: 2.5,
  goodMultiplier: 1.8,
  hardMultiplier: 1.2,
  againMultiplier: 0.5,
  masteryThreshold: 85,
};

export function useVocabularyReview(
  userPreferences: UserLearningPreferences,
  vocabularyProgress: VocabularyProgress[],
  config: Partial<SpacedRepetitionConfig> = {}
) {
  const [srsConfig] = useState<SpacedRepetitionConfig>({
    ...DEFAULT_SRS_CONFIG,
    ...config,
  });

  const [progress, setProgress] = useState<VocabularyProgress[]>(
    vocabularyProgress
  );

  const [reviewSchedule, setReviewSchedule] = useState<ReviewSchedule[]>([]);
  const [todayReviews, setTodayReviews] = useState<ReviewSchedule[]>([]);
  const [upcomingReviews, setUpcomingReviews] = useState<ReviewSchedule[]>([]);

  // Calculate next review date based on spaced repetition algorithm
  const calculateNextReviewDate = useCallback(
    (
      vocabulary: VocabularyProgress,
      difficulty: "again" | "hard" | "good" | "easy"
    ): Date => {
      const now = new Date();
      const daysSinceLastReview = Math.max(
        1,
        Math.floor(
          (now.getTime() - vocabulary.lastReviewed.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

      let multiplier: number;
      switch (difficulty) {
        case "again":
          multiplier = srsConfig.againMultiplier;
          break;
        case "hard":
          multiplier = srsConfig.hardMultiplier;
          break;
        case "good":
          multiplier = srsConfig.goodMultiplier;
          break;
        case "easy":
          multiplier = srsConfig.easyMultiplier;
          break;
      }

      // Calculate interval based on previous performance
      const baseInterval =
        vocabulary.encounters === 1
          ? srsConfig.initialInterval
          : daysSinceLastReview;

      const newInterval = Math.max(1, Math.floor(baseInterval * multiplier));

      // Adjust based on accuracy rate
      const accuracyRate =
        vocabulary.totalAttempts > 0
          ? vocabulary.correctAnswers / vocabulary.totalAttempts
          : 0;

      const accuracyAdjustment =
        accuracyRate > 0.8 ? 1.2 : accuracyRate < 0.5 ? 0.8 : 1;
      const finalInterval = Math.floor(newInterval * accuracyAdjustment);

      const nextReviewDate = new Date(now);
      nextReviewDate.setDate(nextReviewDate.getDate() + finalInterval);

      return nextReviewDate;
    },
    [srsConfig]
  );

  // Calculate review priority based on various factors
  const calculateReviewPriority = useCallback(
    (vocabulary: VocabularyProgress): "high" | "medium" | "low" => {
      const now = new Date();
      const daysSinceLastReview = Math.floor(
        (now.getTime() - vocabulary.lastReviewed.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const daysUntilNextReview = Math.floor(
        (vocabulary.nextReview.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // High priority: overdue or due today
      if (daysUntilNextReview <= 0) {
        return "high";
      }

      // High priority: low mastery level and due soon
      if (vocabulary.masteryLevel < 50 && daysUntilNextReview <= 1) {
        return "high";
      }

      // Medium priority: due within 2 days or low accuracy
      const accuracyRate =
        vocabulary.totalAttempts > 0
          ? vocabulary.correctAnswers / vocabulary.totalAttempts
          : 0;

      if (daysUntilNextReview <= 2 || accuracyRate < 0.6) {
        return "medium";
      }

      return "low";
    },
    []
  );

  // Generate personalized review schedule
  const generateReviewSchedule = useCallback(
    (currentProgress: VocabularyProgress[] = progress) => {
      const now = new Date();
      const schedule: ReviewSchedule[] = [];

      currentProgress.forEach((vocab) => {
        const daysSinceLastReview = Math.floor(
          (now.getTime() - vocab.lastReviewed.getTime()) / (1000 * 60 * 60 * 24)
        );

        const reviewItem: ReviewSchedule = {
        word: vocab.word,
        nextReviewDate: vocab.nextReview,
        priority: calculateReviewPriority(vocab),
        daysSinceLastReview,
        reviewCount: vocab.encounters,
        masteryLevel: vocab.masteryLevel,
      };

      schedule.push(reviewItem);
    });

      // Sort by priority and next review date
      schedule.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.nextReviewDate.getTime() - b.nextReviewDate.getTime();
      });

      setReviewSchedule(schedule);
    },
    [progress, calculateReviewPriority]
  );

  // Filter reviews for today and upcoming
  const categorizeReviews = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayItems = reviewSchedule.filter(
      (item) => item.nextReviewDate <= tomorrow
    );

    const upcomingItems = reviewSchedule
      .filter((item) => item.nextReviewDate > tomorrow)
      .slice(0, 20); // Limit to next 20 items

    setTodayReviews(todayItems);
    setUpcomingReviews(upcomingItems);
  }, [reviewSchedule]);

  // Get review recommendations based on user preferences
  const getReviewRecommendations = useCallback(() => {
    const recommendations = [];
    const now = new Date();

    // Check if user should review based on their frequency preference
    const shouldReviewToday = () => {
      switch (userPreferences.vocabularyReviewFrequency) {
        case "daily":
          return true;
        case "every_other_day":
          return now.getDate() % 2 === 0;
        case "weekly":
          return now.getDay() === 1; // Monday
        default:
          return true;
      }
    };

    if (shouldReviewToday() && todayReviews.length > 0) {
      recommendations.push({
        type: "daily_review",
        title: "Ôn tập từ vựng hôm nay",
        description: `${todayReviews.length} từ cần ôn tập`,
        priority: "high",
        count: todayReviews.length,
      });
    }

    // Recommend focusing on difficult words
    const difficultWords = todayReviews.filter(
      (item) => item.masteryLevel < 50 || item.priority === "high"
    );

    if (difficultWords.length > 0) {
      recommendations.push({
        type: "difficult_words",
        title: "Tập trung vào từ khó",
        description: `${difficultWords.length} từ cần chú ý đặc biệt`,
        priority: "medium",
        count: difficultWords.length,
      });
    }

    // Recommend review session length based on daily goal
    const estimatedMinutes = Math.ceil(todayReviews.length * 0.5); // 30 seconds per word
    if (estimatedMinutes <= userPreferences.dailyGoal) {
      recommendations.push({
        type: "achievable_goal",
        title: "Mục tiêu khả thi",
        description: `Ôn tập ${estimatedMinutes} phút để đạt mục tiêu hôm nay`,
        priority: "low",
        estimatedTime: estimatedMinutes,
      });
    }

    return recommendations;
  }, [userPreferences, todayReviews]);

  // Update vocabulary progress after review
  const updateVocabularyProgress = useCallback(
    async (word: string, difficulty: "again" | "hard" | "good" | "easy") => {
      const vocabIndex = progress.findIndex((v) => v.word === word);
      if (vocabIndex === -1) return;

      const vocab = progress[vocabIndex];
      const nextReviewDate = calculateNextReviewDate(vocab, difficulty);

      // Calculate new mastery level
      let masteryAdjustment = 0;
      switch (difficulty) {
        case "again":
          masteryAdjustment = -10;
          break;
        case "hard":
          masteryAdjustment = -5;
          break;
        case "good":
          masteryAdjustment = 5;
          break;
        case "easy":
          masteryAdjustment = 10;
          break;
      }

      const newMasteryLevel = Math.max(
        0,
        Math.min(100, vocab.masteryLevel + masteryAdjustment)
      );

      // Update vocabulary progress
      const updatedVocab: VocabularyProgress = {
        ...vocab,
        encounters: vocab.encounters + 1,
        correctAnswers:
          difficulty === "again"
            ? vocab.correctAnswers
            : vocab.correctAnswers + 1,
        totalAttempts: vocab.totalAttempts + 1,
        lastReviewed: new Date(),
        nextReview: nextReviewDate,
        masteryLevel: newMasteryLevel,
        status:
          newMasteryLevel >= srsConfig.masteryThreshold
            ? "mastered"
            : "reviewing",
      };

      // TODO: Save to backend
      // await api.updateVocabularyProgress(updatedVocab);

      // Update local state
      const updatedProgress = [...progress];
      updatedProgress[vocabIndex] = updatedVocab;
      setProgress(updatedProgress);
      generateReviewSchedule(updatedProgress);
    },
    [progress, calculateNextReviewDate, generateReviewSchedule, srsConfig.masteryThreshold]
  );

  // Initialize and update schedule
  useEffect(() => {
    generateReviewSchedule();
  }, [generateReviewSchedule]);

  useEffect(() => {
    categorizeReviews();
  }, [categorizeReviews]);

  return {
    progress,
    reviewSchedule,
    todayReviews,
    upcomingReviews,
    getReviewRecommendations,
    updateVocabularyProgress,
    generateReviewSchedule,
  };
}
