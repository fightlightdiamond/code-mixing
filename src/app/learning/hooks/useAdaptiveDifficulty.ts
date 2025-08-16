"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserLearningPreferences, LearningStats } from "../types/learning";
import { DifficultyLevel } from "@prisma/client";

interface AdaptiveDifficultyConfig {
  minAccuracy: number; // Minimum accuracy to maintain current level
  promotionAccuracy: number; // Accuracy needed to advance to next level
  demotionAccuracy: number; // Accuracy below which user is demoted
  minSessionsForPromotion: number; // Minimum sessions before considering promotion
  recentSessionsToConsider: number; // Number of recent sessions to analyze
}

const DEFAULT_CONFIG: AdaptiveDifficultyConfig = {
  minAccuracy: 0.7, // 70%
  promotionAccuracy: 0.85, // 85%
  demotionAccuracy: 0.5, // 50%
  minSessionsForPromotion: 5,
  recentSessionsToConsider: 10,
};

const DIFFICULTY_ORDER: DifficultyLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
];

export function useAdaptiveDifficulty(
  userPreferences: UserLearningPreferences,
  learningStats: LearningStats,
  config: Partial<AdaptiveDifficultyConfig> = {}
) {
  const [adaptiveConfig] = useState<AdaptiveDifficultyConfig>({
    ...DEFAULT_CONFIG,
    ...config,
  });

  const [recommendedLevel, setRecommendedLevel] = useState<DifficultyLevel>(
    userPreferences.difficultyLevel
  );
  const [shouldAdjustLevel, setShouldAdjustLevel] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState<string>("");

  // Calculate user performance metrics
  const calculatePerformanceMetrics = useCallback(() => {
    const { averageScore, completionRate, storiesCompleted } = learningStats;

    // Overall performance score (weighted average)
    const performanceScore = averageScore * 0.6 + completionRate * 0.4;

    return {
      performanceScore,
      averageScore,
      completionRate,
      storiesCompleted,
    };
  }, [learningStats]);

  // Determine if level adjustment is needed
  const evaluateLevelAdjustment = useCallback(() => {
    const metrics = calculatePerformanceMetrics();
    const currentLevelIndex = DIFFICULTY_ORDER.indexOf(
      userPreferences.difficultyLevel
    );

    // Not enough data to make recommendations
    if (metrics.storiesCompleted < adaptiveConfig.minSessionsForPromotion) {
      setRecommendedLevel(userPreferences.difficultyLevel);
      setShouldAdjustLevel(false);
      setAdjustmentReason("Cần thêm dữ liệu để đánh giá");
      return;
    }

    // Check for promotion (move to higher difficulty)
    if (
      metrics.performanceScore >= adaptiveConfig.promotionAccuracy &&
      metrics.completionRate >= 0.8 &&
      currentLevelIndex < DIFFICULTY_ORDER.length - 1
    ) {
      const nextLevel = DIFFICULTY_ORDER[currentLevelIndex + 1];
      setRecommendedLevel(nextLevel);
      setShouldAdjustLevel(true);
      setAdjustmentReason(
        `Hiệu suất xuất sắc (${Math.round(metrics.performanceScore * 100)}%). Bạn có thể thử cấp độ cao hơn.`
      );
      return;
    }

    // Check for demotion (move to lower difficulty)
    if (
      metrics.performanceScore < adaptiveConfig.demotionAccuracy &&
      metrics.completionRate < 0.6 &&
      currentLevelIndex > 0
    ) {
      const previousLevel = DIFFICULTY_ORDER[currentLevelIndex - 1];
      setRecommendedLevel(previousLevel);
      setShouldAdjustLevel(true);
      setAdjustmentReason(
        `Hiệu suất thấp (${Math.round(metrics.performanceScore * 100)}%). Thử cấp độ dễ hơn để xây dựng nền tảng.`
      );
      return;
    }

    // Stay at current level
    setRecommendedLevel(userPreferences.difficultyLevel);
    setShouldAdjustLevel(false);
    setAdjustmentReason("Cấp độ hiện tại phù hợp với khả năng của bạn");
  }, [
    userPreferences.difficultyLevel,
    calculatePerformanceMetrics,
    adaptiveConfig,
  ]);

  // Run evaluation when dependencies change
  useEffect(() => {
    evaluateLevelAdjustment();
  }, [evaluateLevelAdjustment]);

  // Get difficulty adjustment suggestions
  const getDifficultyAdjustmentSuggestion = useCallback(() => {
    const metrics = calculatePerformanceMetrics();

    if (!shouldAdjustLevel) {
      return null;
    }

    return {
      currentLevel: userPreferences.difficultyLevel,
      recommendedLevel,
      reason: adjustmentReason,
      confidence: Math.min(
        Math.abs(metrics.performanceScore - adaptiveConfig.minAccuracy) * 2,
        1
      ),
      metrics: {
        averageScore: Math.round(metrics.averageScore * 100),
        completionRate: Math.round(metrics.completionRate * 100),
        storiesCompleted: metrics.storiesCompleted,
      },
    };
  }, [
    shouldAdjustLevel,
    userPreferences.difficultyLevel,
    recommendedLevel,
    adjustmentReason,
    calculatePerformanceMetrics,
    adaptiveConfig.minAccuracy,
  ]);

  // Get personalized story recommendations based on performance
  const getPersonalizedRecommendations = useCallback(() => {
    const metrics = calculatePerformanceMetrics();
    const recommendations = [];

    // If struggling, recommend easier stories
    if (metrics.performanceScore < adaptiveConfig.minAccuracy) {
      recommendations.push({
        type: "easier_stories",
        title: "Thử truyện dễ hơn",
        description: "Chọn truyện có ít từ vựng khó để xây dựng tự tin",
        priority: "high",
      });
    }

    // If doing well, suggest more challenging content
    if (metrics.performanceScore > adaptiveConfig.promotionAccuracy) {
      recommendations.push({
        type: "challenging_stories",
        title: "Thử thách bản thân",
        description: "Bạn đã sẵn sàng cho những truyện khó hơn",
        priority: "medium",
      });
    }

    // If completion rate is low, suggest shorter stories
    if (metrics.completionRate < 0.6) {
      recommendations.push({
        type: "shorter_stories",
        title: "Truyện ngắn hơn",
        description: "Thử những truyện ngắn để duy trì động lực",
        priority: "medium",
      });
    }

    // If average score is good but completion rate is low, suggest time management
    if (metrics.averageScore > 0.8 && metrics.completionRate < 0.7) {
      recommendations.push({
        type: "time_management",
        title: "Quản lý thời gian",
        description: "Đặt mục tiêu thời gian cụ thể cho mỗi truyện",
        priority: "low",
      });
    }

    return recommendations;
  }, [calculatePerformanceMetrics, adaptiveConfig]);

  return {
    recommendedLevel,
    shouldAdjustLevel,
    adjustmentReason,
    getDifficultyAdjustmentSuggestion,
    getPersonalizedRecommendations,
    performanceMetrics: calculatePerformanceMetrics(),
  };
}
