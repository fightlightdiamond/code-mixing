"use client";

import { useState, useCallback, useEffect } from "react";

export interface AudioBookmark {
  id: string;
  storyId: string;
  position: number;
  timestamp: Date;
  note?: string;
}

interface AudioProgress {
  storyId: string;
  currentPosition: number;
  lastUpdated: Date;
  bookmarks: AudioBookmark[];
}

interface UseAudioProgressOptions {
  storyId: string;
  autoSave?: boolean;
  saveInterval?: number;
}

export function useAudioProgress({
  storyId,
  autoSave = true,
  saveInterval = 5000,
}: UseAudioProgressOptions) {
  const [progress, setProgress] = useState<AudioProgress>({
    storyId,
    currentPosition: 0,
    lastUpdated: new Date(),
    bookmarks: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load progress from localStorage and server on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        // First try to load from localStorage for immediate display
        const stored = localStorage.getItem(`audio-progress-${storyId}`);
        if (stored) {
          const parsedProgress = JSON.parse(stored);
          setProgress({
            ...parsedProgress,
            lastUpdated: new Date(parsedProgress.lastUpdated),
            bookmarks: parsedProgress.bookmarks.map((bookmark: any) => ({
              ...bookmark,
              timestamp: new Date(bookmark.timestamp),
            })),
          });
        }

        // Then try to load from server and merge
        try {
          const response = await fetch(
            `/api/learning/progress/audio?storyId=${storyId}`
          );
          if (response.ok) {
            const serverProgress = await response.json();

            // Use server data if it's more recent
            const localTimestamp = stored
              ? new Date(JSON.parse(stored).lastUpdated)
              : new Date(0);
            const serverTimestamp = new Date(serverProgress.lastUpdated);

            if (serverTimestamp > localTimestamp) {
              const mergedProgress = {
                storyId,
                currentPosition: serverProgress.currentPosition,
                lastUpdated: serverTimestamp,
                bookmarks: serverProgress.bookmarks.map((bookmark: any) => ({
                  ...bookmark,
                  timestamp: new Date(bookmark.timestamp),
                })),
              };
              setProgress(mergedProgress);

              // Update localStorage with server data
              localStorage.setItem(
                `audio-progress-${storyId}`,
                JSON.stringify(mergedProgress)
              );
            }
          }
        } catch (serverError) {
          console.warn("Failed to load progress from server:", serverError);
          // Continue with local data only
        }
      } catch (error) {
        console.error("Error loading audio progress:", error);
        setError("Không thể tải tiến độ âm thanh");
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [storyId]);

  // Save progress to localStorage
  const saveProgress = useCallback(
    async (progressData: AudioProgress) => {
      try {
        localStorage.setItem(
          `audio-progress-${storyId}`,
          JSON.stringify(progressData)
        );

        // Also save to server if user is authenticated
        if (autoSave) {
          try {
            await fetch("/api/learning/progress/audio", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                storyId,
                position: progressData.currentPosition,
                bookmarks: progressData.bookmarks,
              }),
            });
          } catch (serverError) {
            console.warn("Failed to save progress to server:", serverError);
            // Continue with local storage only
          }
        }

        setError(null);
      } catch (error) {
        console.error("Error saving audio progress:", error);
        setError("Không thể lưu tiến độ âm thanh");
      }
    },
    [storyId, autoSave]
  );

  // Update current position
  const updatePosition = useCallback(
    (position: number) => {
      const newProgress = {
        ...progress,
        currentPosition: position,
        lastUpdated: new Date(),
      };
      setProgress(newProgress);

      // Auto-save if enabled
      if (autoSave) {
        saveProgress(newProgress);
      }
    },
    [progress, autoSave, saveProgress]
  );

  // Add bookmark
  const addBookmark = useCallback(
    (position: number, note?: string) => {
      const bookmark: AudioBookmark = {
        id: `bookmark-${Date.now()}`,
        storyId,
        position,
        timestamp: new Date(),
        note,
      };

      const newProgress = {
        ...progress,
        bookmarks: [...progress.bookmarks, bookmark],
        lastUpdated: new Date(),
      };

      setProgress(newProgress);
      saveProgress(newProgress);

      return bookmark;
    },
    [progress, storyId, saveProgress]
  );

  // Remove bookmark
  const removeBookmark = useCallback(
    (bookmarkId: string) => {
      const newProgress = {
        ...progress,
        bookmarks: progress.bookmarks.filter((b) => b.id !== bookmarkId),
        lastUpdated: new Date(),
      };

      setProgress(newProgress);
      saveProgress(newProgress);
    },
    [progress, saveProgress]
  );

  // Update bookmark note
  const updateBookmarkNote = useCallback(
    (bookmarkId: string, note: string) => {
      const newProgress = {
        ...progress,
        bookmarks: progress.bookmarks.map((b) =>
          b.id === bookmarkId ? { ...b, note } : b
        ),
        lastUpdated: new Date(),
      };

      setProgress(newProgress);
      saveProgress(newProgress);
    },
    [progress, saveProgress]
  );

  // Jump to bookmark
  const jumpToBookmark = useCallback(
    (bookmarkId: string) => {
      const bookmark = progress.bookmarks.find((b) => b.id === bookmarkId);
      if (bookmark) {
        updatePosition(bookmark.position);
        return bookmark.position;
      }
      return null;
    },
    [progress.bookmarks, updatePosition]
  );

  // Clear all progress
  const clearProgress = useCallback(() => {
    const clearedProgress = {
      storyId,
      currentPosition: 0,
      lastUpdated: new Date(),
      bookmarks: [],
    };

    setProgress(clearedProgress);
    localStorage.removeItem(`audio-progress-${storyId}`);

    // Also clear from server
    if (autoSave) {
      fetch("/api/learning/progress/audio", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storyId }),
      }).catch((error) => {
        console.warn("Failed to clear progress from server:", error);
      });
    }
  }, [storyId, autoSave]);

  // Get formatted time for display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Get progress percentage
  const getProgressPercentage = useCallback(
    (duration: number): number => {
      if (duration === 0) return 0;
      return Math.min(100, (progress.currentPosition / duration) * 100);
    },
    [progress.currentPosition]
  );

  return {
    progress,
    isLoading,
    error,
    actions: {
      updatePosition,
      addBookmark,
      removeBookmark,
      updateBookmarkNote,
      jumpToBookmark,
      clearProgress,
      saveProgress: () => saveProgress(progress),
    },
    utils: {
      formatTime,
      getProgressPercentage,
    },
  };
}
