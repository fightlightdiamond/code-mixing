import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback } from "react";
import type { LearningStory } from "../types/learning";

interface OfflineStatus {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  cacheStatus: CacheStatus | null;
}

interface CacheStatus {
  totalSize: number;
  storyCacheSize: number;
  audioCacheSize: number;
  apiCacheSize: number;
  cachedStories: number;
  cachedAudioFiles: number;
  cachedApiResponses: number;
  maxSizes: {
    story: number;
    audio: number;
    api: number;
  };
}

interface DownloadProgress {
  storyId: string;
  progress: number;
  status: "pending" | "downloading" | "completed" | "error";
  error?: string;
}

export function useOfflineManager() {
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isServiceWorkerReady: false,
    cacheStatus: null,
  });

  const [downloadQueue, setDownloadQueue] = useState<DownloadProgress[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Initialize service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          logger.info("Service Worker registered:", registration);
          setOfflineStatus((prev) => ({ ...prev, isServiceWorkerReady: true }));

          // Get initial cache status
          getCacheStatus();
        })
        .catch((error) => {
          logger.error("Service Worker registration failed:", undefined, error);
        });
    }
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOfflineStatus((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setOfflineStatus((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Get cache status from service worker
  const getCacheStatus = useCallback(async (): Promise<CacheStatus | null> => {
    if (!offlineStatus.isServiceWorkerReady) return null;

    try {
      const cacheStatus = await sendMessageToServiceWorker<
        { type: "GET_CACHE_STATUS" },
        CacheStatus
      >({
        type: "GET_CACHE_STATUS",
      });
      setOfflineStatus((prev) => ({ ...prev, cacheStatus }));
      return cacheStatus;
    } catch (error) {
      logger.error("Failed to get cache status:", undefined, error);
      return null;
    }
  }, [offlineStatus.isServiceWorkerReady]);

  // Download story for offline access
  const downloadStory = useCallback(
    async (story: LearningStory): Promise<boolean> => {
      if (!offlineStatus.isServiceWorkerReady) {
        throw new Error("Service worker not ready");
      }

      // Add to download queue
      setDownloadQueue((prev) => [
        ...prev.filter((item) => item.storyId !== story.id),
        { storyId: story.id, progress: 0, status: "pending" },
      ]);

      try {
        setIsDownloading(true);

        // Update progress
        setDownloadQueue((prev) =>
          prev.map((item) =>
            item.storyId === story.id
              ? { ...item, status: "downloading", progress: 10 }
              : item
          )
        );

        // First, fetch the complete story data
        const storyResponse = await fetch(`/api/learning/stories/${story.id}`);
        if (!storyResponse.ok) {
          throw new Error("Failed to fetch story data");
        }

        const storyData: LearningStory = await storyResponse.json();

        // Update progress
        setDownloadQueue((prev) =>
          prev.map((item) =>
            item.storyId === story.id ? { ...item, progress: 30 } : item
          )
        );

        // Cache the story data
        await sendMessageToServiceWorker<
          { type: "CACHE_STORY"; data: LearningStory },
          { success: boolean; error?: string }
        >({
          type: "CACHE_STORY",
          data: storyData,
        });

        // Update progress
        setDownloadQueue((prev) =>
          prev.map((item) =>
            item.storyId === story.id ? { ...item, progress: 60 } : item
          )
        );

        // Download and cache audio if available
        if (storyData.audioUrl) {
          await sendMessageToServiceWorker<
            {
              type: "CACHE_AUDIO";
              data: { url: string; storyId: string };
            },
            { success: boolean; error?: string }
          >({
            type: "CACHE_AUDIO",
            data: { url: storyData.audioUrl, storyId: story.id },
          });
        }

        // Update progress
        setDownloadQueue((prev) =>
          prev.map((item) =>
            item.storyId === story.id ? { ...item, progress: 90 } : item
          )
        );

        // Cache vocabulary audio files
        if (storyData.vocabularies) {
          for (const vocab of storyData.vocabularies) {
            if (vocab.audioUrl) {
              try {
                await sendMessageToServiceWorker<
                  {
                    type: "CACHE_AUDIO";
                    data: { url: string; word: string };
                  },
                  { success: boolean; error?: string }
                >({
                  type: "CACHE_AUDIO",
                  data: { url: vocab.audioUrl, word: vocab.word },
                });
              } catch (error) {
                logger.warn(
                  `Failed to cache audio for word: ${vocab.word}`,
                  error
                );
              }
            }
          }
        }

        // Mark as completed
        setDownloadQueue((prev) =>
          prev.map((item) =>
            item.storyId === story.id
              ? { ...item, status: "completed", progress: 100 }
              : item
          )
        );

        // Refresh cache status
        await getCacheStatus();

        return true;
      } catch (error) {
        logger.error("Failed to download story:", undefined, error);

        setDownloadQueue((prev) =>
          prev.map((item) =>
            item.storyId === story.id
              ? {
                  ...item,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : item
          )
        );

        return false;
      } finally {
        setIsDownloading(false);
      }
    },
    [offlineStatus.isServiceWorkerReady, getCacheStatus]
  );

  // Check if story is available offline
  const isStoryAvailableOffline = useCallback(
    async (storyId: string): Promise<boolean> => {
      if (!offlineStatus.isServiceWorkerReady) return false;

      try {
        // Check if story is cached
        const response = await fetch(`/api/learning/stories/${storyId}`, {
          method: "HEAD",
        });

        return response.headers.get("X-Served-From") === "cache";
      } catch (error) {
        return false;
      }
    },
    [offlineStatus.isServiceWorkerReady]
  );

  // Clear cache
  const clearCache = useCallback(
    async (
      cacheType: "stories" | "audio" | "api" | "all" = "all"
    ): Promise<boolean> => {
      if (!offlineStatus.isServiceWorkerReady) return false;

      try {
        await sendMessageToServiceWorker<
          {
            type: "CLEAR_CACHE";
            data: {
              cacheType: "stories" | "audio" | "api" | "all";
            };
          },
          { success: boolean }
        >({
          type: "CLEAR_CACHE",
          data: { cacheType },
        });

        // Refresh cache status
        await getCacheStatus();

        return true;
      } catch (error) {
        logger.error("Failed to clear cache:", undefined, error);
        return false;
      }
    },
    [offlineStatus.isServiceWorkerReady, getCacheStatus]
  );

  // Get list of offline available stories
  const getOfflineStories = useCallback(async (): Promise<string[]> => {
    if (!offlineStatus.cacheStatus) return [];

    try {
      // This would need to be implemented in the service worker
      // For now, we'll return an empty array
      return [];
    } catch (error) {
      logger.error("Failed to get offline stories:", undefined, error);
      return [];
    }
  }, [offlineStatus.cacheStatus]);

  // Remove download from queue
  const removeFromDownloadQueue = useCallback((storyId: string) => {
    setDownloadQueue((prev) => prev.filter((item) => item.storyId !== storyId));
  }, []);

  return {
    // Status
    isOnline: offlineStatus.isOnline,
    isServiceWorkerReady: offlineStatus.isServiceWorkerReady,
    cacheStatus: offlineStatus.cacheStatus,

    // Download management
    downloadQueue,
    isDownloading,
    downloadStory,
    removeFromDownloadQueue,

    // Cache management
    getCacheStatus,
    clearCache,
    isStoryAvailableOffline,
    getOfflineStories,
  };
}

// Helper function to send messages to service worker
async function sendMessageToServiceWorker<TRequest, TResponse>(
  message: TRequest
): Promise<TResponse> {
  if (!navigator.serviceWorker.controller) {
    throw new Error("No service worker controller available");
  }

  return new Promise<TResponse>((resolve, reject) => {
    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      if ((event.data as any)?.error) {
        reject(new Error((event.data as any).error));
      } else {
        resolve(event.data as TResponse);
      }
    };

    navigator.serviceWorker.controller.postMessage(message, [
      messageChannel.port2,
    ]);
  });
}
