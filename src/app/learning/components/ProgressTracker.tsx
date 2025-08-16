"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProgress } from "../hooks/useProgress";
import { useOfflineProgress } from "../hooks/useOfflineProgress";
import { useOfflineManager } from "../hooks/useOfflineManager";
import { OfflineProgressIndicator } from "./OfflineProgressIndicator";
import type { ProgressTrackerProps } from "../types/learning";

export function ProgressTracker({ userId, className }: ProgressTrackerProps) {
  const {
    progress,
    stats,
    levelProgress,
    isLoading,
    error,
    utils: { getProgressPercentage, getNewAchievements },
  } = useProgress({ userId });

  const { isOnline } = useOfflineManager();
  const { offlineData, hasPendingSync } = useOfflineProgress(userId);

  // Use offline data when online data is not available or when offline
  const displayProgress = progress || offlineData.learningProgress;
  const displayStats = stats || offlineData.learningStats;

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!displayProgress || !displayStats) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Offline Progress Indicator */}
        <OfflineProgressIndicator userId={userId} showDetails={true} />

        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <p>Chưa có dữ liệu tiến độ</p>
              <p className="text-sm">
                Hãy bắt đầu đọc truyện để theo dõi tiến độ!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const newAchievements = getNewAchievements();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Offline Progress Indicator */}
      <OfflineProgressIndicator userId={userId} showDetails={false} />

      {/* Offline Data Warning */}
      {!isOnline && hasPendingSync && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="text-center text-orange-800">
              <p className="font-medium">Showing offline data</p>
              <p className="text-sm">
                Progress will sync when you're back online
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Achievements */}
      {newAchievements.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              🎉 Thành tích mới!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {newAchievements.map((achievement) => (
                <Badge
                  key={achievement.id}
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800"
                >
                  {achievement.iconUrl && (
                    <img
                      src={achievement.iconUrl}
                      alt=""
                      className="w-4 h-4 mr-1"
                    />
                  )}
                  {achievement.title}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tổng quan tiến độ</span>
            <Badge variant="outline">Level {displayProgress.level}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Tiến độ tổng thể</span>
                <span>{Math.round(displayProgress.completionPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${displayProgress.completionPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Level Progress */}
            {levelProgress && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Kinh nghiệm Level {levelProgress.currentLevel}</span>
                  <span>
                    {levelProgress.currentXP} /{" "}
                    {levelProgress.totalXPForCurrentLevel} XP
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(levelProgress.currentXP / levelProgress.totalXPForCurrentLevel) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stories Read */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {displayStats.storiesCompleted}
              </div>
              <div className="text-sm text-gray-600">Truyện đã đọc</div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-blue-600 h-1 rounded-full"
                    style={{ width: `${getProgressPercentage("stories")}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vocabulary Mastered */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {displayStats.vocabularyMastered}
              </div>
              <div className="text-sm text-gray-600">Từ vựng đã học</div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-green-600 h-1 rounded-full"
                    style={{ width: `${getProgressPercentage("vocabulary")}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {displayStats.currentStreak}
              </div>
              <div className="text-sm text-gray-600">Chuỗi ngày học</div>
              <div className="text-xs text-gray-500 mt-1">
                Cao nhất: {displayStats.longestStreak} ngày
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Spent */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(displayStats.timeSpentTotal / 60)}h
              </div>
              <div className="text-sm text-gray-600">Tổng thời gian</div>
              <div className="text-xs text-gray-500 mt-1">
                Hôm nay: {Math.round(displayStats.timeSpentToday)}m
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hiệu suất học tập</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Điểm trung bình:</span>
                <span className="font-semibold">
                  {Math.round(displayStats.averageScore * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tỷ lệ hoàn thành:</span>
                <span className="font-semibold">
                  {Math.round(displayStats.completionRate * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Thời gian tuần này:</span>
                <span className="font-semibold">
                  {Math.round(displayStats.timeSpentThisWeek / 60)}h{" "}
                  {Math.round(displayStats.timeSpentThisWeek % 60)}m
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thành tích gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {displayProgress.achievements.slice(0, 5).map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-2">
                  {achievement.iconUrl && (
                    <img src={achievement.iconUrl} alt="" className="w-5 h-5" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {achievement.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(achievement.unlockedAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {achievement.category}
                  </Badge>
                </div>
              ))}
              {displayProgress.achievements.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  <p>Chưa có thành tích nào</p>
                  <p className="text-xs">Hãy tiếp tục học để mở khóa!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
