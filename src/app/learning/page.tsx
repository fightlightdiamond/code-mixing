"use client";
import { logger } from '@/lib/logger';

import React, { useState } from "react";
import { Require } from "@/core/auth/Require";
import { FadeIn } from "@/components/ui/fade-in";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Play,
  Settings,
  TrendingUp,
  ArrowLeft,
  Accessibility,
} from "lucide-react";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";
import { SkipLinks } from "./components/SkipLinks";
import { AccessibilityPanel } from "./components/AccessibilityPanel";
import { StoryList } from "./components/StoryList";
import { StoryReaderContainer } from "./components/StoryReaderContainer";
import { SettingsPanel } from "./components/SettingsPanel";
import { useStories } from "./hooks/useStories";
import { useUserPreferences } from "./hooks/useUserPreferences";
import { useAdaptiveDifficulty } from "./hooks/useAdaptiveDifficulty";
import { useVocabularyReview } from "./hooks/useVocabularyReview";
import { PersonalizedRecommendations } from "./components/PersonalizedRecommendations";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { DownloadManager } from "./components/DownloadManager";
import { SyncStatusPanel } from "./components/SyncStatusPanel";
import { useOfflineManager } from "./hooks/useOfflineManager";
import type {
  LearningStory,
  LearningStats,
  VocabularyProgress,
} from "./types/learning";

type ViewMode = "dashboard" | "story-list" | "story-reader";

export default function LearningPage() {
  return (
    <AccessibilityProvider>
      <LearningPageContent />
    </AccessibilityProvider>
  );
}

function LearningPageContent() {
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [selectedStory, setSelectedStory] = useState<LearningStory | null>(
    null
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showDownloadManager, setShowDownloadManager] = useState(false);

  const {
    stories,
    isLoading: storiesLoading,
    error: storiesError,
  } = useStories({
    autoFetch: viewMode === "story-list",
  });

  const {
    preferences,
    isLoading: preferencesLoading,
    isSaving: preferencesSaving,
    savePreferences,
    getStoryFilters,
  } = useUserPreferences();

  // Mock learning stats - in real implementation, this would come from API
  const mockLearningStats: LearningStats = {
    storiesCompleted: 5,
    vocabularyMastered: 120,
    timeSpentToday: 15,
    timeSpentThisWeek: 85,
    timeSpentTotal: 450,
    currentStreak: 3,
    longestStreak: 7,
    averageScore: 0.78,
    completionRate: 0.85,
  };

  // Mock vocabulary progress - in real implementation, this would come from API
  const mockVocabularyProgress: VocabularyProgress[] = [
    {
      word: "beautiful",
      status: "reviewing",
      encounters: 3,
      correctAnswers: 2,
      totalAttempts: 3,
      lastReviewed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      nextReview: new Date(),
      masteryLevel: 65,
    },
    {
      word: "adventure",
      status: "new",
      encounters: 1,
      correctAnswers: 1,
      totalAttempts: 1,
      lastReviewed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      nextReview: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
      masteryLevel: 30,
    },
  ];

  const { getDifficultyAdjustmentSuggestion, getPersonalizedRecommendations } =
    useAdaptiveDifficulty(preferences, mockLearningStats);

  const { getReviewRecommendations } = useVocabularyReview(
    preferences,
    mockVocabularyProgress
  );

  const { isOnline, isServiceWorkerReady } = useOfflineManager();

  const handleStorySelect = (story: LearningStory) => {
    setSelectedStory(story);
    setViewMode("story-reader");
  };

  const handleBackToDashboard = () => {
    setViewMode("dashboard");
    setSelectedStory(null);
  };

  const handleBackToStoryList = () => {
    setViewMode("story-list");
    setSelectedStory(null);
  };

  const handleShowStoryList = () => {
    setViewMode("story-list");
  };

  const handleShowSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handlePreferencesChange = async (
    newPreferences: typeof preferences
  ) => {
    const success = await savePreferences(newPreferences);
    if (!success) {
      alert("Không thể lưu cài đặt");
    }
    return success;
  };

  const handleAcceptDifficultyChange = async (
    newLevel: typeof preferences.difficultyLevel
  ) => {
    const success = await savePreferences({
      ...preferences,
      difficultyLevel: newLevel,
    });
    if (!success) {
      alert("Không thể lưu cài đặt");
    }
  };

  const handleStartVocabularyReview = () => {
    // TODO: Navigate to vocabulary review page
    logger.info("Starting vocabulary review...");
  };

  const handleShowDownloadManager = () => {
    setShowDownloadManager(true);
  };

  const handleCloseDownloadManager = () => {
    setShowDownloadManager(false);
  };

  // Story Reader View
  if (viewMode === "story-reader" && selectedStory) {
    return (
      <Require action="read" subject="Story">
        <div className="min-h-screen bg-white">
          <div className="container mx-auto px-4 py-8">
            {/* Navigation */}
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={handleBackToStoryList}
                className="flex items-center gap-2 mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách truyện
              </Button>
            </div>

            {/* Story Reader */}
            <StoryReaderContainer
              story={selectedStory}
              userPreferences={preferences}
            />
          </div>
        </div>
      </Require>
    );
  }

  // Story List View
  if (viewMode === "story-list") {
    return (
      <Require action="read" subject="Story">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="container mx-auto px-4 py-8">
            {/* Navigation */}
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại trang chính
              </Button>

              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Chọn truyện để đọc
                </h1>
                <p className="text-gray-600">
                  Khám phá thư viện truyện phong phú với nhiều chủ đề và cấp độ
                  khác nhau
                </p>
              </div>
            </div>

            {/* Story List */}
            {storiesError ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">
                  <BookOpen className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không thể tải danh sách truyện
                </h3>
                <p className="text-gray-600 mb-4">{storiesError}</p>
                <Button onClick={() => window.location.reload()}>
                  Thử lại
                </Button>
              </div>
            ) : (
              <StoryList
                stories={stories}
                onStorySelect={handleStorySelect}
                userPreferences={preferences}
                showRecommended={true}
                className="max-w-7xl mx-auto"
              />
            )}
          </div>
        </div>
      </Require>
    );
  }

  // Dashboard View (default)
  return (
    <Require action="read" subject="Story">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <SkipLinks />

        <div id="main-content" tabIndex={-1}>
          <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <FadeIn>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Học tiếng Anh qua
                  <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Truyện chêm
                  </span>
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Khám phá phương pháp học tiếng Anh độc đáo thông qua câu
                  chuyện có chêm từ tiếng Anh. Học từ vựng tự nhiên và hiệu quả
                  trong ngữ cảnh thực tế.
                </p>
              </div>

              {/* Offline Indicator */}
              <div className="flex justify-center mb-8">
                <OfflineIndicator />
              </div>
            </FadeIn>

            {/* Quick Stats */}
            <FadeIn delay={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <Card className="text-center">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-bold text-blue-600">
                      0
                    </CardTitle>
                    <CardDescription>Truyện đã đọc</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="text-center">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-bold text-green-600">
                      0
                    </CardTitle>
                    <CardDescription>Từ vựng đã học</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="text-center">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-bold text-purple-600">
                      0
                    </CardTitle>
                    <CardDescription>Bài tập hoàn thành</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="text-center">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl font-bold text-orange-600">
                      Beginner
                    </CardTitle>
                    <CardDescription>Cấp độ hiện tại</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </FadeIn>

            {/* Main Learning Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Story Selection */}
              <FadeIn delay={0.2}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle>Chọn truyện để đọc</CardTitle>
                        <CardDescription>
                          Khám phá thư viện truyện phong phú với nhiều chủ đề và
                          cấp độ khác nhau
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Truyện cấp độ Beginner
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Những câu chuyện đơn giản với từ vựng cơ bản, phù hợp
                          cho người mới bắt đầu
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleShowStoryList}
                          >
                            Xem truyện
                          </Button>
                          {isServiceWorkerReady && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleShowDownloadManager}
                            >
                              Tải về
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg opacity-50">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Truyện cấp độ Intermediate
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Mở khóa sau khi hoàn thành 5 truyện cấp độ Beginner
                        </p>
                        <Button variant="outline" size="sm" disabled>
                          Chưa mở khóa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              {/* Continue Learning */}
              <FadeIn delay={0.3}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Play className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <CardTitle>Tiếp tục học tập</CardTitle>
                        <CardDescription>
                          Quay lại với truyện đang đọc dở hoặc ôn tập từ vựng
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Chưa có truyện đang đọc
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Hãy chọn một truyện để bắt đầu hành trình học tập của
                          bạn
                        </p>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={handleShowStoryList}
                        >
                          Chọn truyện đầu tiên
                        </Button>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Ôn tập từ vựng
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Không có từ vựng nào cần ôn tập hôm nay
                        </p>
                        <Button variant="outline" size="sm" disabled>
                          Ôn tập ngay
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>

            {/* Personalized Recommendations */}
            {!preferencesLoading && (
              <FadeIn delay={0.35}>
                <PersonalizedRecommendations
                  userPreferences={preferences}
                  learningStats={mockLearningStats}
                  difficultyAdjustment={getDifficultyAdjustmentSuggestion()}
                  vocabularyRecommendations={getReviewRecommendations()}
                  onAcceptDifficultyChange={handleAcceptDifficultyChange}
                  onStartVocabularyReview={handleStartVocabularyReview}
                  className="mb-12"
                />
              </FadeIn>
            )}

            {/* Additional Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Progress Tracking */}
              <FadeIn delay={0.4}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle>Theo dõi tiến độ</CardTitle>
                        <CardDescription>
                          Xem chi tiết quá trình học tập và thành tích của bạn
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Tiến độ tuần này
                        </span>
                        <span className="text-sm font-medium">0/7 ngày</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: "0%" }}
                        ></div>
                      </div>
                      <Button variant="outline" className="w-full">
                        Xem chi tiết tiến độ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              {/* Settings */}
              <FadeIn delay={0.5}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Settings className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle>Cài đặt học tập</CardTitle>
                        <CardDescription>
                          Tùy chỉnh trải nghiệm học tập theo sở thích cá nhân
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Tỷ lệ chêm từ
                        </span>
                        <span className="text-sm font-medium">
                          {preferencesLoading
                            ? "..."
                            : `${preferences.embeddingRatio}%`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Chế độ giao diện
                        </span>
                        <span className="text-sm font-medium">
                          {preferencesLoading
                            ? "..."
                            : preferences.theme === "light"
                              ? "Sáng"
                              : preferences.theme === "dark"
                                ? "Tối"
                                : "Theo hệ thống"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleShowSettings}
                          disabled={preferencesLoading}
                        >
                          Mở cài đặt
                        </Button>

                        {/* Quick Sync Status */}
                        <div className="pt-2 border-t">
                          <SyncStatusPanel
                            userId="current-user"
                            compact={true}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && !preferencesLoading && (
            <SettingsPanel
              preferences={preferences}
              onPreferencesChange={handlePreferencesChange}
              onClose={handleCloseSettings}
              isSaving={preferencesSaving}
            />
          )}

          {/* Download Manager Modal */}
          {showDownloadManager && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      Tải truyện để đọc offline
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseDownloadManager}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto">
                  <DownloadManager
                    stories={stories}
                    className="border-0 shadow-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Require>
  );
}
