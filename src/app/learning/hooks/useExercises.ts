"use client";
import { logger } from '@/lib/logger';

import { useState, useEffect } from "react";
import type { Exercise, ExerciseResult } from "../types/learning";

interface UseExercisesReturn {
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;
  submitExerciseResult: (result: ExerciseResult) => Promise<void>;
  refetch: () => void;
}

export function useExercises(storyId: string): UseExercisesReturn {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = async () => {
    if (!storyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/learning/exercises/story/${storyId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch exercises: ${response.statusText}`);
      }

      const data = await response.json();
      setExercises(data.exercises || []);
    } catch (err) {
      logger.error("Error fetching exercises:", undefined, err);
      setError(err instanceof Error ? err.message : "Failed to load exercises");

      // Fallback to mock exercises for development
      setExercises(generateMockExercises(storyId));
    } finally {
      setIsLoading(false);
    }
  };

  const submitExerciseResult = async (
    result: ExerciseResult
  ): Promise<void> => {
    try {
      const response = await fetch("/api/learning/exercises/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyId,
          ...result,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to submit exercise result: ${response.statusText}`
        );
      }

      const data = await response.json();
      logger.info("Exercise result submitted:", data);
    } catch (err) {
      logger.error("Error submitting exercise result:", undefined, err);
      // Don't throw error to avoid breaking user experience
      // Results will be cached locally and can be synced later
    }
  };

  const refetch = () => {
    fetchExercises();
  };

  useEffect(() => {
    fetchExercises();
  }, [storyId]);

  return {
    exercises,
    isLoading,
    error,
    submitExerciseResult,
    refetch,
  };
}

// Generate mock exercises for development and fallback
function generateMockExercises(storyId: string): Exercise[] {
  return [
    {
      id: `${storyId}-ex-1`,
      type: "fill_blank",
      question: 'Complete the sentence: "The cat was sitting on the ____."',
      correctAnswer: "chair",
      explanation:
        'The word "chair" fits the context of where a cat might sit.',
      vocabulary: ["chair", "table", "floor"],
    },
    {
      id: `${storyId}-ex-2`,
      type: "multiple_choice",
      question: 'What does "beautiful" mean?',
      options: ["Very ugly", "Very pretty", "Very big", "Very small"],
      correctAnswer: "Very pretty",
      explanation:
        "Beautiful means having qualities that give pleasure to the senses, especially sight.",
    },
    {
      id: `${storyId}-ex-3`,
      type: "drag_drop",
      question: "Arrange these words to form a correct sentence:",
      options: ["The", "dog", "is", "running", "fast"],
      correctAnswer: ["The", "dog", "is", "running", "fast"],
      explanation:
        "The correct order follows English sentence structure: Subject + Verb + Adverb.",
    },
  ];
}
