"use client";

import React, { useCallback, useMemo, lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import {
  useAccessibility,
  useKeyboardNavigation,
  useScreenReader,
} from "../contexts/AccessibilityContext";
import { useSkipLinkTarget } from "./SkipLinks";
import type {
  StoryReaderProps,
  UserLearningPreferences,
} from "../types/learning";

// Lazy load image component for better performance
const LazyImage = lazy(() =>
  import("next/image").then((module) => ({ default: module.default }))
);

interface EnhancedStoryReaderProps extends StoryReaderProps {
  userPreferences?: UserLearningPreferences;
}

// Memoized StoryReader component for performance optimization
export const StoryReader = React.memo(function StoryReader({
  story,
  onWordClick,
  highlightedChunk,
  className,
  userPreferences,
}: EnhancedStoryReaderProps) {
  const { settings } = useAccessibility();
  const { handleKeyDown } = useKeyboardNavigation();
  const { announceNavigation, announceAction } = useScreenReader();
  const skipTarget = useSkipLinkTarget("story-content");
  // Dynamically adjust embedding ratio based on user preferences
  const adjustEmbeddingRatio = useCallback(
    (chunkText: string, targetRatio: number): string => {
      const englishWordRegex = /\b[a-zA-Z]+(?:[''-][a-zA-Z]+)*\b/g;
      const englishWords = chunkText.match(englishWordRegex) || [];
      const totalWords = chunkText.split(/\s+/).length;
      const currentRatio = (englishWords.length / totalWords) * 100;

      // If current ratio is close to target, return as is
      if (Math.abs(currentRatio - targetRatio) <= 5) {
        return chunkText;
      }

      // If we need to reduce English words
      if (currentRatio > targetRatio) {
        const wordsToKeep = Math.floor((totalWords * targetRatio) / 100);
        let adjustedText = chunkText;
        let keptWords = 0;

        // Replace some English words with Vietnamese equivalents (simplified approach)
        const replacements: Record<string, string> = {
          hello: "xin chào",
          good: "tốt",
          bad: "xấu",
          big: "lớn",
          small: "nhỏ",
          happy: "vui",
          sad: "buồn",
          beautiful: "đẹp",
          house: "nhà",
          car: "xe",
          book: "sách",
          water: "nước",
          food: "thức ăn",
          friend: "bạn",
          family: "gia đình",
          love: "yêu",
          time: "thời gian",
          day: "ngày",
          night: "đêm",
          morning: "buổi sáng",
        };

        englishWords.forEach((word) => {
          if (keptWords >= wordsToKeep && replacements[word.toLowerCase()]) {
            adjustedText = adjustedText.replace(
              new RegExp(`\\b${word}\\b`, "g"),
              replacements[word.toLowerCase()]
            );
          } else {
            keptWords++;
          }
        });

        return adjustedText;
      }

      // If we need more English words, we'd need more sophisticated logic
      // For now, return the original text
      return chunkText;
    },
    []
  );

  // Process chunk text to identify and highlight embedded English words
  const processChunkText = useCallback(
    (chunkText: string, isChemChunk: boolean) => {
      if (!isChemChunk) {
        return <span>{chunkText}</span>;
      }

      // Adjust embedding ratio if user preferences are available
      let adjustedText = chunkText;
      if (userPreferences && userPreferences.embeddingRatio) {
        adjustedText = adjustEmbeddingRatio(
          chunkText,
          userPreferences.embeddingRatio
        );
      }

      // Simple regex to identify English words (letters, apostrophes, hyphens)
      // This assumes embedded words are surrounded by Vietnamese text
      const englishWordRegex = /\b[a-zA-Z]+(?:[''-][a-zA-Z]+)*\b/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = englishWordRegex.exec(adjustedText)) !== null) {
        // Add Vietnamese text before the English word
        if (match.index > lastIndex) {
          parts.push(
            <span key={`text-${lastIndex}`}>
              {adjustedText.slice(lastIndex, match.index)}
            </span>
          );
        }

        // Add the English word as a clickable element with accessibility features
        const englishWord = match[0];
        parts.push(
          <button
            key={`word-${match.index}`}
            className={cn(
              "vocabulary-word inline-block px-1 py-0.5 mx-0.5 rounded-sm",
              "bg-blue-100 text-blue-800 hover:bg-blue-200",
              "border border-blue-200 hover:border-blue-300",
              "transition-colors duration-200",
              "font-medium text-sm",
              "cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500",
              "focus:ring-offset-2",
              // Accessibility enhancements
              "min-h-[44px] min-w-[44px] touch-manipulation",
              settings.reducedMotion && "transition-none"
            )}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onWordClick(englishWord, {
                x: rect.left + rect.width / 2,
                y: rect.top,
              });
              announceAction(`Đã chọn từ ${englishWord}`);
            }}
            onKeyDown={(e) => {
              handleKeyDown(e, {
                onEnter: () => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onWordClick(englishWord, {
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                  });
                  announceAction(`Đã chọn từ ${englishWord}`);
                },
                onSpace: () => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onWordClick(englishWord, {
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                  });
                  announceAction(`Đã chọn từ ${englishWord}`);
                },
              });
            }}
            title={`Nhấn để xem định nghĩa của "${englishWord}"`}
            aria-label={`Từ vựng tiếng Anh: ${englishWord}. Nhấn để xem định nghĩa.`}
            role="button"
            tabIndex={0}
          >
            {englishWord}
          </button>
        );

        lastIndex = match.index + match[0].length;
      }

      // Add remaining Vietnamese text
      if (lastIndex < adjustedText.length) {
        parts.push(
          <span key={`text-${lastIndex}`}>{adjustedText.slice(lastIndex)}</span>
        );
      }

      return <>{parts}</>;
    },
    [onWordClick, userPreferences, adjustEmbeddingRatio]
  );

  // Memoize processed chunks for performance
  const processedChunks = useMemo(() => {
    return story.chunks.map((chunk) => ({
      ...chunk,
      processedText: processChunkText(chunk.chunkText, chunk.type === "chem"),
    }));
  }, [story.chunks, processChunkText]);

  return (
    <div className={cn("max-w-4xl mx-auto", className)}>
      {/* Story Header */}
      <header className="mb-8" {...skipTarget}>
        <h1
          className="text-3xl font-bold text-gray-900 mb-4"
          id="story-title"
          tabIndex={-1}
        >
          {story.title}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <span className="font-medium">Cấp độ:</span>
            <span className="capitalize">{story.difficulty}</span>
          </span>
          {story.estimatedMinutes && (
            <span className="flex items-center gap-1">
              <span className="font-medium">Thời gian:</span>
              <span>{story.estimatedMinutes} phút</span>
            </span>
          )}
          {story.wordCount && (
            <span className="flex items-center gap-1">
              <span className="font-medium">Số từ:</span>
              <span>{story.wordCount}</span>
            </span>
          )}
          {(story.chemRatio || userPreferences?.embeddingRatio) && (
            <span className="flex items-center gap-1">
              <span className="font-medium">Tỷ lệ chêm:</span>
              <span>
                {userPreferences?.embeddingRatio
                  ? `${userPreferences.embeddingRatio}% (tùy chỉnh)`
                  : `${Math.round((story.chemRatio || 0) * 100)}%`}
              </span>
            </span>
          )}
        </div>
      </header>

      {/* Story Content with Lazy Loading */}
      <main
        className="prose prose-lg max-w-none"
        role="main"
        aria-labelledby="story-title"
      >
        {processedChunks.map((chunk, index) => (
          <LazyChunk
            key={chunk.id}
            chunk={chunk}
            index={index}
            isHighlighted={highlightedChunk === index}
          />
        ))}
      </main>

      {/* Story Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="text-center text-gray-600">
          <p className="text-sm">
            Bạn đã hoàn thành việc đọc truyện "{story.title}"
          </p>
          {story.lesson && (
            <p className="text-xs mt-1">Thuộc bài học: {story.lesson.title}</p>
          )}
        </div>
      </footer>
    </div>
  );
});

// Memoized chunk component for lazy loading
const LazyChunk = React.memo(function LazyChunk({
  chunk,
  index,
  isHighlighted,
}: {
  chunk: any;
  index: number;
  isHighlighted: boolean;
}) {
  return (
    <section
      className={cn("mb-4 p-4 rounded-lg transition-all duration-300", {
        // Highlight current chunk during audio playback
        "bg-yellow-50 border-l-4 border-yellow-400": isHighlighted,
        // Different styling for different chunk types
        "bg-gray-50": chunk.type === "explain",
        "bg-white": chunk.type === "normal" || chunk.type === "chem",
      })}
      data-chunk-index={index}
      data-chunk-type={chunk.type}
      aria-label={`Đoạn văn ${index + 1}`}
      aria-current={isHighlighted ? "true" : undefined}
      role="region"
    >
      <p
        className="text-lg leading-relaxed text-gray-800 mb-0"
        aria-live={isHighlighted ? "polite" : undefined}
      >
        {chunk.processedText}
      </p>

      {/* Show chunk type indicator for debugging/admin */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-2 text-xs text-gray-400">
          Chunk {chunk.chunkOrder} ({chunk.type})
        </div>
      )}
    </section>
  );
});
