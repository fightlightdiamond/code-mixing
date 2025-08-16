"use client";
import { logger } from '@/lib/logger';

import { useState, useCallback } from "react";
import type { VocabularyData } from "../types/learning";

interface UseVocabularyReturn {
  vocabularyData: VocabularyData | null;
  isLoading: boolean;
  error: string | null;
  fetchVocabulary: (word: string) => Promise<void>;
  clearVocabulary: () => void;
}

export function useVocabulary(): UseVocabularyReturn {
  const [vocabularyData, setVocabularyData] = useState<VocabularyData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVocabulary = useCallback(async (word: string) => {
    if (!word.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // First try to fetch from our API
      const response = await fetch(
        `/api/learning/vocabulary/${encodeURIComponent(word)}`
      );

      if (response.ok) {
        const data = await response.json();
        setVocabularyData(data);
        return;
      }

      // If our API doesn't have the word, try a fallback approach
      // For now, we'll create a simple mock response
      // In a real implementation, you might integrate with external dictionary APIs

      if (response.status === 404) {
        // Create a basic vocabulary entry
        const mockData: VocabularyData = {
          word: word,
          meaning: `Định nghĩa cho từ "${word}" chưa có sẵn. Vui lòng thêm vào từ điển.`,
          pronunciation: word.toLowerCase(),
          example: `Example sentence with "${word}".`,
        };
        setVocabularyData(mockData);
        return;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (err) {
      logger.error("Error fetching vocabulary:", undefined, err as Error);
      setError(
        err instanceof Error ? err.message : "Không thể tải định nghĩa từ vựng"
      );

      // Provide fallback data even on error
      const fallbackData: VocabularyData = {
        word: word,
        meaning: "Không thể tải định nghĩa. Vui lòng thử lại sau.",
        pronunciation: word.toLowerCase(),
      };
      setVocabularyData(fallbackData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearVocabulary = useCallback(() => {
    setVocabularyData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    vocabularyData,
    isLoading,
    error,
    fetchVocabulary,
    clearVocabulary,
  };
}
