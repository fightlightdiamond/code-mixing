"use client";
import { logger } from '@/lib/logger';

import React, { useState, useEffect, Suspense } from "react";
// Error boundary implementation (simplified)
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; FallbackComponent: React.ComponentType<any> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <this.props.FallbackComponent
          error={this.state.error}
          resetErrorBoundary={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
import { AccessibilityProvider } from "../contexts/AccessibilityContext";
import { SkipLinks } from "./SkipLinks";
import { AccessibilityPanel } from "./AccessibilityPanel";
import { StoryReader } from "./StoryReader";
import { AudioPlayer } from "./AudioPlayer";
import ExercisePanel from "./ExercisePanel";
import { VocabularyPopup } from "./VocabularyPopup";
import { ProgressTracker } from "./ProgressTracker";
import { SettingsPanel } from "./SettingsPanel";
import { OfflineIndicator } from "./OfflineIndicator";
import { SyncStatusPanel } from "./SyncStatusPanel";
import { PersonalizedRecommendations } from "./PersonalizedRecommendations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accessibility,
  Settings,
  BookOpen,
  Volume2,
  PenTool,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  LearningStory,
  Exercise,
  VocabularyData,
} from "../types/learning";

interface LearningAppProps {
  story: LearningStory;
  onStoryComplete?: (storyId: string) => void;
  onExerciseComplete?: (results: any[]) => void;
  className?: string;
}

// Error fallback component
function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardContent className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">
          Đã xảy ra lỗi
        </h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <Button onClick={resetErrorBoundary} variant="outline">
          Thử lại
        </Button>
      </CardContent>
    </Card>
  );
}

// Loading component
function LoadingSpinner({ message = "Đang tải..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export const LearningApp = React.memo(function LearningApp({
  story,
  onStoryComplete,
  onExerciseComplete,
  className,
}: LearningAppProps) {
  const [activePanel, setActivePanel] = useState<
    "story" | "exercises" | "progress" | "settings" | "accessibility" | null
  >("story");
  const [highlightedChunk, setHighlightedChunk] = useState<number>(-1);
  const [vocabularyPopup, setVocabularyPopup] = useState<{
    word: string;
    position: { x: number; y: number };
    data?: VocabularyData;
  } | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isStoryComplete, setIsStoryComplete] = useState(false);

  // Load exercises when story changes
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const response = await fetch(
          `/api/learning/exercises/story/${story.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setExercises(data.exercises || []);
        }
      } catch (error) {
        logger.error("Failed to load exercises:", undefined, error);
      }
    };

    if (story.id) {
      loadExercises();
    }
  }, [story.id]);

  const handleWordClick = async (
    word: string,
    position: { x: number; y: number }
  ) => {
    setVocabularyPopup({ word, position });

    try {
      const response = await fetch(
        `/api/learning/vocabulary/${encodeURIComponent(word)}`
      );
      if (response.ok) {
        const data = await response.json();
        setVocabularyPopup((prev) => (prev ? { ...prev, data } : null));
      }
    } catch (error) {
      logger.error("Failed to load vocabulary data:", undefined, error);
    }
  };

  const handleChunkHighlight = (chunkIndex: number) => {
    setHighlightedChunk(chunkIndex);
  };

  const handleStoryComplete = () => {
    setIsStoryComplete(true);
    setActivePanel("exercises");
    onStoryComplete?.(story.id);
  };

  const handleExerciseComplete = (results: unknown[]) => {
    onExerciseComplete?.(results);
    setActivePanel("progress");
  };

  const renderActivePanel = () => {
    switch (activePanel) {
      case "story":
        return (
          <div className="space-y-6">
            <StoryReader
              story={story}
              onWordClick={handleWordClick}
              highlightedChunk={highlightedChunk}
              className="mb-6"
            />

            {story.audio?.url && (
              <AudioPlayer
                audioUrl={story.audio.url}
                chunks={story.chunks}
                storyId={story.id}
                onChunkHighlight={handleChunkHighlight}
              />
            )}

            {isStoryComplete && (
              <div className="text-center py-8">
                <h3 className="text-xl font-semibold mb-4">
                  Chúc mừng! Bạn đã hoàn thành truyện
                </h3>
                <Button onClick={() => setActivePanel("exercises")}>
                  Làm bài tập
                </Button>
              </div>
            )}
          </div>
        );

      case "exercises":
        return exercises.length > 0 ? (
          <ExercisePanel
            storyId={story.id}
            exercises={exercises}
            onComplete={handleExerciseComplete}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <PenTool className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Chưa có bài tập</h3>
              <p className="text-gray-600">
                Bài tập cho truyện này đang được chuẩn bị.
              </p>
            </CardContent>
          </Card>
        );

      case "progress":
        return <ProgressTracker userId="current-user" storyId={story.id} />;

      case "settings":
        return <SettingsPanel onClose={() => setActivePanel("story")} />;

      case "accessibility":
        return <AccessibilityPanel onClose={() => setActivePanel("story")} />;

      default:
        return null;
    }
  };

  return (
    <AccessibilityProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <div
          className={cn(
            "min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50",
            className
          )}
        >
          <SkipLinks />

          {/* Header with navigation */}
          <header className="bg-white shadow-sm border-b sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-4">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {story.title}
                  </h1>
                  <OfflineIndicator />
                </div>

                <nav
                  className="flex items-center space-x-2"
                  role="navigation"
                  aria-label="Điều hướng chính"
                >
                  <Button
                    variant={activePanel === "story" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActivePanel("story")}
                    aria-current={activePanel === "story" ? "page" : undefined}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Truyện
                  </Button>

                  <Button
                    variant={activePanel === "exercises" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActivePanel("exercises")}
                    aria-current={
                      activePanel === "exercises" ? "page" : undefined
                    }
                    disabled={!isStoryComplete && exercises.length === 0}
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    Bài tập
                  </Button>

                  <Button
                    variant={activePanel === "progress" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActivePanel("progress")}
                    aria-current={
                      activePanel === "progress" ? "page" : undefined
                    }
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Tiến độ
                  </Button>

                  <Button
                    variant={activePanel === "settings" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActivePanel("settings")}
                    aria-current={
                      activePanel === "settings" ? "page" : undefined
                    }
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Cài đặt
                  </Button>

                  <Button
                    variant={
                      activePanel === "accessibility" ? "default" : "ghost"
                    }
                    size="sm"
                    onClick={() => setActivePanel("accessibility")}
                    aria-current={
                      activePanel === "accessibility" ? "page" : undefined
                    }
                    aria-label="Cài đặt trợ năng"
                  >
                    <Accessibility className="h-4 w-4" />
                  </Button>
                </nav>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main
            id="main-content"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            tabIndex={-1}
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Main panel */}
              <div className="lg:col-span-3">
                <Suspense fallback={<LoadingSpinner />}>
                  {renderActivePanel()}
                </Suspense>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <SyncStatusPanel />
                <PersonalizedRecommendations userId="current-user" />
              </div>
            </div>
          </main>

          {/* Vocabulary popup */}
          {vocabularyPopup && (
            <VocabularyPopup
              word={vocabularyPopup.word}
              position={vocabularyPopup.position}
              data={vocabularyPopup.data}
              isOpen={true}
              onClose={() => setVocabularyPopup(null)}
            />
          )}
        </div>
      </ErrorBoundary>
    </AccessibilityProvider>
  );
});
