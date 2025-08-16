"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  BookOpen,
  Brain,
  Star,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type {
  UserLearningPreferences,
  LearningStats,
  DifficultyLevel,
} from "../types/learning";

interface PersonalizedRecommendationsProps {
  userPreferences: UserLearningPreferences;
  learningStats: LearningStats;
  difficultyAdjustment?: {
    currentLevel: DifficultyLevel;
    recommendedLevel: DifficultyLevel;
    reason: string;
    confidence: number;
    metrics: {
      averageScore: number;
      completionRate: number;
      storiesCompleted: number;
    };
  };
  vocabularyRecommendations?: Array<{
    type: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    count?: number;
    estimatedTime?: number;
  }>;
  onAcceptDifficultyChange?: (newLevel: DifficultyLevel) => void;
  onStartVocabularyReview?: () => void;
  className?: string;
}

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner: "Mới bắt đầu",
  elementary: "Cơ bản",
  intermediate: "Trung cấp",
  upper_intermediate: "Trung cấp cao",
  advanced: "Nâng cao",
  proficient: "Thành thạo",
};

const PRIORITY_COLORS = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

const PRIORITY_ICONS = {
  high: AlertCircle,
  medium: Clock,
  low: CheckCircle,
};

export function PersonalizedRecommendations({
  userPreferences,
  learningStats,
  difficultyAdjustment,
  vocabularyRecommendations = [],
  onAcceptDifficultyChange,
  onStartVocabularyReview,
  className = "",
}: PersonalizedRecommendationsProps) {
  const getDifficultyChangeIcon = () => {
    if (!difficultyAdjustment) return null;

    const currentIndex = Object.values(DifficultyLevel).indexOf(
      difficultyAdjustment.currentLevel
    );
    const recommendedIndex = Object.values(DifficultyLevel).indexOf(
      difficultyAdjustment.recommendedLevel
    );

    if (recommendedIndex > currentIndex) {
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    } else if (recommendedIndex < currentIndex) {
      return <TrendingDown className="h-5 w-5 text-orange-600" />;
    }
    return <Target className="h-5 w-5 text-blue-600" />;
  };

  const getPerformanceInsights = () => {
    const insights = [];

    if (learningStats.averageScore >= 0.9) {
      insights.push({
        type: "excellent_performance",
        icon: Star,
        title: "Hiệu suất xuất sắc",
        description: `Điểm trung bình ${Math.round(learningStats.averageScore * 100)}% - Bạn đang học rất tốt!`,
        color: "text-yellow-600",
      });
    } else if (learningStats.averageScore < 0.6) {
      insights.push({
        type: "needs_improvement",
        icon: AlertCircle,
        title: "Cần cải thiện",
        description: `Điểm trung bình ${Math.round(learningStats.averageScore * 100)}% - Hãy thử cấp độ dễ hơn hoặc ôn tập thêm`,
        color: "text-red-600",
      });
    }

    if (learningStats.currentStreak >= 7) {
      insights.push({
        type: "great_streak",
        icon: Target,
        title: "Chuỗi học tập tuyệt vời",
        description: `${learningStats.currentStreak} ngày liên tiếp - Hãy duy trì!`,
        color: "text-green-600",
      });
    } else if (learningStats.currentStreak === 0) {
      insights.push({
        type: "restart_streak",
        icon: Clock,
        title: "Bắt đầu lại chuỗi học tập",
        description: "Hãy học ít nhất 1 truyện hôm nay để bắt đầu chuỗi mới",
        color: "text-orange-600",
      });
    }

    if (learningStats.completionRate < 0.5) {
      insights.push({
        type: "completion_rate",
        icon: BookOpen,
        title: "Tỷ lệ hoàn thành thấp",
        description: `${Math.round(learningStats.completionRate * 100)}% - Thử chọn truyện ngắn hơn`,
        color: "text-orange-600",
      });
    }

    return insights;
  };

  const performanceInsights = getPerformanceInsights();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Performance Insights */}
      {performanceInsights.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Phân tích hiệu suất</CardTitle>
                <CardDescription>
                  Đánh giá dựa trên hoạt động học tập gần đây
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceInsights.map((insight, index) => {
                const IconComponent = insight.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <IconComponent
                      className={`h-5 w-5 mt-0.5 ${insight.color}`}
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Difficulty Level Adjustment */}
      {difficultyAdjustment &&
        difficultyAdjustment.currentLevel !==
          difficultyAdjustment.recommendedLevel && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  {getDifficultyChangeIcon()}
                </div>
                <div>
                  <CardTitle>Điều chỉnh cấp độ khó</CardTitle>
                  <CardDescription>
                    Gợi ý dựa trên hiệu suất học tập của bạn
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-600">
                        Cấp độ hiện tại:
                      </span>
                      <Badge variant="outline">
                        {DIFFICULTY_LABELS[difficultyAdjustment.currentLevel]}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Gợi ý:</span>
                      <Badge className="bg-blue-600">
                        {
                          DIFFICULTY_LABELS[
                            difficultyAdjustment.recommendedLevel
                          ]
                        }
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(difficultyAdjustment.confidence * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Độ tin cậy</div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-3">
                    {difficultyAdjustment.reason}
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {difficultyAdjustment.metrics.averageScore}%
                      </div>
                      <div className="text-xs text-gray-500">Điểm TB</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {difficultyAdjustment.metrics.completionRate}%
                      </div>
                      <div className="text-xs text-gray-500">Hoàn thành</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {difficultyAdjustment.metrics.storiesCompleted}
                      </div>
                      <div className="text-xs text-gray-500">Truyện</div>
                    </div>
                  </div>
                </div>

                {onAcceptDifficultyChange && (
                  <div className="flex space-x-3">
                    <Button
                      onClick={() =>
                        onAcceptDifficultyChange(
                          difficultyAdjustment.recommendedLevel
                        )
                      }
                      className="flex-1"
                    >
                      Áp dụng gợi ý
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Giữ nguyên
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Vocabulary Review Recommendations */}
      {vocabularyRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Ôn tập từ vựng</CardTitle>
                <CardDescription>
                  Lịch trình ôn tập được cá nhân hóa
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vocabularyRecommendations.map((rec, index) => {
                const PriorityIcon = PRIORITY_ICONS[rec.priority];
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${PRIORITY_COLORS[rec.priority]}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <PriorityIcon className="h-5 w-5 mt-0.5" />
                        <div>
                          <h4 className="font-medium">{rec.title}</h4>
                          <p className="text-sm opacity-80">
                            {rec.description}
                          </p>
                          {rec.estimatedTime && (
                            <p className="text-xs mt-1 opacity-70">
                              Thời gian ước tính: {rec.estimatedTime} phút
                            </p>
                          )}
                        </div>
                      </div>
                      {rec.count && (
                        <Badge variant="outline" className="ml-2">
                          {rec.count}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}

              {onStartVocabularyReview && (
                <Button
                  onClick={onStartVocabularyReview}
                  className="w-full mt-4"
                  variant="outline"
                >
                  Bắt đầu ôn tập
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Goals Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle>Mục tiêu học tập</CardTitle>
              <CardDescription>Tiến độ hôm nay và tuần này</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Daily Goal */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Mục tiêu hôm nay</span>
                <span className="text-sm text-gray-600">
                  {learningStats.timeSpentToday}/{userPreferences.dailyGoal}{" "}
                  phút
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (learningStats.timeSpentToday / userPreferences.dailyGoal) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Weekly Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Tiến độ tuần này</span>
                <span className="text-sm text-gray-600">
                  {learningStats.timeSpentThisWeek}/
                  {userPreferences.dailyGoal * 7} phút
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (learningStats.timeSpentThisWeek / (userPreferences.dailyGoal * 7)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
