"use client";
import { logger } from '@/lib/logger';

import React, { useState, useCallback } from "react";
import { StoryReader } from "./StoryReader";
import { VocabularyPopup } from "./VocabularyPopup";
import { AudioPlayer } from "./AudioPlayer";
import ExercisePanel from "./ExercisePanel";
import { useVocabulary } from "../hooks/useVocabulary";
import { useExercises } from "../hooks/useExercises";
import { Button } from "@/components/ui/button";
import { BookOpen, PenTool } from "lucide-react";
import type {
  LearningStory,
  ExerciseResult,
  UserLearningPreferences,
} from "../types/learning";

interface StoryReaderContainerProps {
  story: LearningStory;
  userPreferences?: UserLearningPreferences;
  className?: string;
}

export function StoryReaderContainer({
  story,
  userPreferences,
  className,
}: StoryReaderContainerProps) {
  const [selectedWord, setSelectedWord] = useState<string>("");
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [highlightedChunk, setHighlightedChunk] = useState<
    number | undefined
  >();
  const [currentView, setCurrentView] = useState<"story" | "exercises">(
    "story"
  );
  const [storyCompleted, setStoryCompleted] = useState(false);

  const { vocabularyData, isLoading, fetchVocabulary, clearVocabulary } =
    useVocabulary();

  const {
    exercises,
    isLoading: exercisesLoading,
    error: exercisesError,
    submitExerciseResult,
  } = useExercises(story.id);

  const handleWordClick = useCallback(
    async (word: string, position: { x: number; y: number }) => {
      setSelectedWord(word);
      setPopupPosition(position);
      setIsPopupOpen(true);

      // Fetch vocabulary data for the clicked word
      await fetchVocabulary(word);
    },
    [fetchVocabulary]
  );

  const handlePopupClose = useCallback(() => {
    setIsPopupOpen(false);
    setSelectedWord("");
    clearVocabulary();
  }, [clearVocabulary]);

  const handleChunkHighlight = useCallback((chunkIndex: number) => {
    setHighlightedChunk(chunkIndex);
  }, []);

  const handleExerciseResult = useCallback(
    async (result: ExerciseResult) => {
      try {
        await submitExerciseResult(result);
      } catch (error) {
        logger.error("Failed to submit exercise result:", error);
      }
    },
    [submitExerciseResult]
  );

  const handleExercisesComplete = useCallback((results: ExerciseResult[]) => {
    logger.info("All exercises completed:", results);
    setStoryCompleted(true);
    // Here you could update user progress, show completion animation, etc.
  }, []);

  const handleShowExercises = () => {
    setCurrentView("exercises");
  };

  const handleShowStory = () => {
    setCurrentView("story");
  };

  // Mock audio URL - in real implementation, this would come from the story data
  const audioUrl = `/api/learning/stories/${story.id}/audio`;

  return (
    <div className={className}>
      {/* View Toggle */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <Button
            variant={currentView === "story" ? "default" : "ghost"}
            size="sm"
            onClick={handleShowStory}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Đọc truyện
          </Button>
          <Button
            variant={currentView === "exercises" ? "default" : "ghost"}
            size="sm"
            onClick={handleShowExercises}
            className="flex items-center gap-2"
            disabled={exercisesLoading}
          >
            <PenTool className="h-4 w-4" />
            Bài tập ({exercises.length})
          </Button>
        </div>
      </div>

      {currentView === "story" ? (
        <>
          {/* Audio Player */}
          <div className="mb-6">
            <AudioPlayer
              audioUrl={audioUrl}
              chunks={story.chunks}
              storyId={story.id}
              onChunkHighlight={handleChunkHighlight}
            />
          </div>

          {/* Story Content */}
          <StoryReader
            story={story}
            onWordClick={handleWordClick}
            highlightedChunk={highlightedChunk}
            userPreferences={userPreferences}
          />

          {/* Show exercises button after story */}
          {exercises.length > 0 && (
            <div className="mt-8 text-center">
              <Button
                onClick={handleShowExercises}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <PenTool className="h-5 w-5 mr-2" />
                Làm bài tập ({exercises.length} câu hỏi)
              </Button>
            </div>
          )}

          {/* Vocabulary Popup */}
          <VocabularyPopup
            word={selectedWord}
            isOpen={isPopupOpen}
            onClose={handlePopupClose}
            position={popupPosition}
            vocabularyData={vocabularyData}
            isLoading={isLoading}
          />
        </>
      ) : (
        <>
          {/* Exercise Panel */}
          {exercisesError ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <PenTool className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không thể tải bài tập
              </h3>
              <p className="text-gray-600 mb-4">{exercisesError}</p>
              <Button onClick={() => window.location.reload()}>Thử lại</Button>
            </div>
          ) : exercisesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải bài tập...</p>
            </div>
          ) : (
            <ExercisePanel
              storyId={story.id}
              exercises={exercises}
              onComplete={handleExercisesComplete}
              onExerciseResult={handleExerciseResult}
              className="max-w-4xl mx-auto"
            />
          )}
        </>
      )}
    </div>
  );
}
