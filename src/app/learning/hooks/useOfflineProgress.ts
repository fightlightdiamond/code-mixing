import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback } from "react";
import type {
  LearningProgress,
  VocabularyProgress,
  ExerciseResult,
  LearningStats,
} from "../types/learning";

interface OfflineProgressData {
  learningProgress: LearningProgress | null;
  vocabularyProgress: VocabularyProgress[];
  exerciseResults: ExerciseResult[];
  learningStats: LearningStats | null;
  lastSyncTime: Date | null;
  pendingSync: boolean;
}

interface LearningSession {
  id: string;
  storyId: string;
  startTime: Date;
  endTime?: Date;
  timeSpent: number; // in seconds
  wordsEncountered: string[];
  exercisesCompleted: ExerciseResult[];
  completed: boolean;
}

// Stored representation of a learning session in localStorage
interface StoredSession {
  id: string;
  storyId: string;
  startTime: string;
  endTime?: string;
  timeSpent: number;
  wordsEncountered: string[];
  exercisesCompleted: ExerciseResult[];
  completed: boolean;
}

const STORAGE_KEYS = {
  LEARNING_PROGRESS: "learning_progress_offline",
  VOCABULARY_PROGRESS: "vocabulary_progress_offline",
  EXERCISE_RESULTS: "exercise_results_offline",
  LEARNING_STATS: "learning_stats_offline",
  LEARNING_SESSIONS: "learning_sessions_offline",
  LAST_SYNC_TIME: "last_sync_time_offline",
  PENDING_SYNC: "pending_sync_offline",
};

const isStoredSession = (session: any): session is StoredSession => {
  return (
    session &&
    typeof session.id === "string" &&
    typeof session.storyId === "string" &&
    typeof session.startTime === "string" &&
    (session.endTime === undefined || typeof session.endTime === "string") &&
    typeof session.timeSpent === "number" &&
    Array.isArray(session.wordsEncountered) &&
    Array.isArray(session.exercisesCompleted) &&
    typeof session.completed === "boolean"
  );
};

const parseStoredSessions = (): StoredSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNING_SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredSession);
  } catch (error) {
    logger.error("Failed to parse stored sessions:", error);
    return [];
  }
};

const toStoredSession = (session: LearningSession): StoredSession => ({
  id: session.id,
  storyId: session.storyId,
  startTime: session.startTime.toISOString(),
  endTime: session.endTime?.toISOString(),
  timeSpent: session.timeSpent,
  wordsEncountered: session.wordsEncountered,
  exercisesCompleted: session.exercisesCompleted,
  completed: session.completed,
});

export function useOfflineProgress(userId: string) {
  const [offlineData, setOfflineData] = useState<OfflineProgressData>({
    learningProgress: null,
    vocabularyProgress: [],
    exerciseResults: [],
    learningStats: null,
    lastSyncTime: null,
    pendingSync: false,
  });

  const [currentSession, setCurrentSession] = useState<LearningSession | null>(
    null
  );

  // Load offline data from localStorage on mount
  useEffect(() => {
    loadOfflineData();
  }, [userId]);

  // Save data to localStorage whenever offlineData changes
  useEffect(() => {
    saveOfflineData();
  }, [offlineData]);

  const loadOfflineData = useCallback(() => {
    try {
      const learningProgress = localStorage.getItem(
        STORAGE_KEYS.LEARNING_PROGRESS
      );
      const vocabularyProgress = localStorage.getItem(
        STORAGE_KEYS.VOCABULARY_PROGRESS
      );
      const exerciseResults = localStorage.getItem(
        STORAGE_KEYS.EXERCISE_RESULTS
      );
      const learningStats = localStorage.getItem(STORAGE_KEYS.LEARNING_STATS);
      const lastSyncTime = localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
      const pendingSync = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);

      setOfflineData({
        learningProgress: learningProgress
          ? JSON.parse(learningProgress)
          : null,
        vocabularyProgress: vocabularyProgress
          ? JSON.parse(vocabularyProgress)
          : [],
        exerciseResults: exerciseResults ? JSON.parse(exerciseResults) : [],
        learningStats: learningStats ? JSON.parse(learningStats) : null,
        lastSyncTime: lastSyncTime ? new Date(lastSyncTime) : null,
        pendingSync: pendingSync === "true",
      });
    } catch (error) {
      logger.error("Failed to load offline progress data:", error);
    }
  }, []);

  const saveOfflineData = useCallback(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.LEARNING_PROGRESS,
        JSON.stringify(offlineData.learningProgress)
      );
      localStorage.setItem(
        STORAGE_KEYS.VOCABULARY_PROGRESS,
        JSON.stringify(offlineData.vocabularyProgress)
      );
      localStorage.setItem(
        STORAGE_KEYS.EXERCISE_RESULTS,
        JSON.stringify(offlineData.exerciseResults)
      );
      localStorage.setItem(
        STORAGE_KEYS.LEARNING_STATS,
        JSON.stringify(offlineData.learningStats)
      );
      localStorage.setItem(
        STORAGE_KEYS.LAST_SYNC_TIME,
        offlineData.lastSyncTime?.toISOString() || ""
      );
      localStorage.setItem(
        STORAGE_KEYS.PENDING_SYNC,
        offlineData.pendingSync.toString()
      );
    } catch (error) {
      logger.error("Failed to save offline progress data:", error);
    }
  }, [offlineData]);

  // Start a new learning session
  const startLearningSession = useCallback((storyId: string) => {
    const session: LearningSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      storyId,
      startTime: new Date(),
      timeSpent: 0,
      wordsEncountered: [],
      exercisesCompleted: [],
      completed: false,
    };

    setCurrentSession(session);
    return session;
  }, []);

  // Update current session
  const updateCurrentSession = useCallback(
    (updates: Partial<LearningSession>) => {
      if (!currentSession) return;

      const updatedSession = { ...currentSession, ...updates };
      setCurrentSession(updatedSession);

      // Save session to localStorage
      const sessions = parseStoredSessions();
      const stored = toStoredSession(updatedSession);
      const sessionIndex = sessions.findIndex((s) => s.id === stored.id);

      if (sessionIndex >= 0) {
        sessions[sessionIndex] = stored;
      } else {
        sessions.push(stored);
      }

      localStorage.setItem(
        STORAGE_KEYS.LEARNING_SESSIONS,
        JSON.stringify(sessions)
      );
    },
    [currentSession]
  );

  // End current learning session
  const endLearningSession = useCallback(() => {
    if (!currentSession) return;

    const endTime = new Date();
    const totalTimeSpent = Math.floor(
      (endTime.getTime() - currentSession.startTime.getTime()) / 1000
    );

    const completedSession = {
      ...currentSession,
      endTime,
      timeSpent: totalTimeSpent,
      completed: true,
    };

    updateCurrentSession(completedSession);

    // Update overall progress
    updateLearningProgress({
      totalTimeSpent:
        (offlineData.learningProgress?.totalTimeSpent || 0) +
        Math.floor(totalTimeSpent / 60),
      lastActivityAt: endTime,
    });

    setCurrentSession(null);
    return completedSession;
  }, [currentSession, offlineData.learningProgress, updateCurrentSession]);

  // Update learning progress
  const updateLearningProgress = useCallback(
    (updates: Partial<LearningProgress>) => {
      const currentProgress = offlineData.learningProgress || {
        userId,
        storiesRead: 0,
        vocabularyLearned: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        longestStreak: 0,
        completionPercentage: 0,
        level: 1,
        experiencePoints: 0,
        achievements: [],
        lastActivityAt: new Date(),
      };

      const updatedProgress = { ...currentProgress, ...updates };

      setOfflineData((prev) => ({
        ...prev,
        learningProgress: updatedProgress,
        pendingSync: true,
      }));
    },
    [offlineData.learningProgress, userId]
  );

  // Update vocabulary progress
  const updateVocabularyProgress = useCallback(
    (word: string, updates: Partial<VocabularyProgress>) => {
      const currentVocabProgress = [...offlineData.vocabularyProgress];
      const existingIndex = currentVocabProgress.findIndex(
        (v) => v.word === word
      );

      if (existingIndex >= 0) {
        currentVocabProgress[existingIndex] = {
          ...currentVocabProgress[existingIndex],
          ...updates,
        };
      } else {
        const newVocabProgress: VocabularyProgress = {
          word,
          status: "new",
          encounters: 1,
          correctAnswers: 0,
          totalAttempts: 0,
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
          masteryLevel: 0,
          ...updates,
        };
        currentVocabProgress.push(newVocabProgress);
      }

      setOfflineData((prev) => ({
        ...prev,
        vocabularyProgress: currentVocabProgress,
        pendingSync: true,
      }));

      // Update current session if active
      if (currentSession && !currentSession.wordsEncountered.includes(word)) {
        updateCurrentSession({
          wordsEncountered: [...currentSession.wordsEncountered, word],
        });
      }
    },
    [offlineData.vocabularyProgress, currentSession, updateCurrentSession]
  );

  // Add exercise result
  const addExerciseResult = useCallback(
    (result: ExerciseResult) => {
      const updatedResults = [...offlineData.exerciseResults, result];

      setOfflineData((prev) => ({
        ...prev,
        exerciseResults: updatedResults,
        pendingSync: true,
      }));

      // Update current session if active
      if (currentSession) {
        updateCurrentSession({
          exercisesCompleted: [...currentSession.exercisesCompleted, result],
        });
      }

      // Update vocabulary progress if exercise involves vocabulary
      if (result.isCorrect && typeof result.userAnswer === "string") {
        // Assume the exercise is vocabulary-related
        updateVocabularyProgress(result.userAnswer, {
          correctAnswers: 1,
          totalAttempts: 1,
          lastReviewed: new Date(),
          masteryLevel: Math.min(100, 30), // Increase mastery
        });
      }
    },
    [
      offlineData.exerciseResults,
      currentSession,
      updateCurrentSession,
      updateVocabularyProgress,
    ]
  );

  // Update learning stats
  const updateLearningStats = useCallback(
    (updates: Partial<LearningStats>) => {
      const currentStats = offlineData.learningStats || {
        storiesCompleted: 0,
        vocabularyMastered: 0,
        timeSpentToday: 0,
        timeSpentThisWeek: 0,
        timeSpentTotal: 0,
        currentStreak: 0,
        longestStreak: 0,
        averageScore: 0,
        completionRate: 0,
      };

      const updatedStats = { ...currentStats, ...updates };

      setOfflineData((prev) => ({
        ...prev,
        learningStats: updatedStats,
        pendingSync: true,
      }));
    },
    [offlineData.learningStats]
  );

  // Mark story as completed
  const markStoryCompleted = useCallback(
    (storyId: string) => {
      const currentProgress = offlineData.learningProgress;
      if (!currentProgress) return;

      updateLearningProgress({
        storiesRead: currentProgress.storiesRead + 1,
        experiencePoints: currentProgress.experiencePoints + 100, // Award XP
        completionPercentage: Math.min(
          100,
          currentProgress.completionPercentage + 5
        ),
      });

      updateLearningStats({
        storiesCompleted:
          (offlineData.learningStats?.storiesCompleted || 0) + 1,
      });
    },
    [
      offlineData.learningProgress,
      offlineData.learningStats,
      updateLearningProgress,
      updateLearningStats,
    ]
  );

  // Get pending sync data
  const getPendingSyncData = useCallback(() => {
    if (!offlineData.pendingSync) return null;

    return {
      learningProgress: offlineData.learningProgress,
      vocabularyProgress: offlineData.vocabularyProgress,
      exerciseResults: offlineData.exerciseResults,
      learningStats: offlineData.learningStats,
      sessions: parseStoredSessions(),
    };
  }, [offlineData]);

  // Mark data as synced
  const markAsSynced = useCallback(() => {
    setOfflineData((prev) => ({
      ...prev,
      lastSyncTime: new Date(),
      pendingSync: false,
    }));

    // Clear synced sessions
    localStorage.removeItem(STORAGE_KEYS.LEARNING_SESSIONS);
  }, []);

  // Clear all offline data
  const clearOfflineData = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });

    setOfflineData({
      learningProgress: null,
      vocabularyProgress: [],
      exerciseResults: [],
      learningStats: null,
      lastSyncTime: null,
      pendingSync: false,
    });

    setCurrentSession(null);
  }, []);

  // Get vocabulary words that need review
  const getVocabularyForReview = useCallback(() => {
    const now = new Date();
    return offlineData.vocabularyProgress.filter(
      (vocab) => vocab.nextReview <= now && vocab.status !== "mastered"
    );
  }, [offlineData.vocabularyProgress]);

  // Calculate learning streak
  const calculateStreak = useCallback(() => {
    const sessions = parseStoredSessions();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const hasSessionOnDay = sessions.some((session) => {
        const sessionDate = new Date(session.startTime);
        return (
          sessionDate >= dayStart && sessionDate <= dayEnd && session.completed
        );
      });

      if (hasSessionOnDay) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, []);

  return {
    // Data
    offlineData,
    currentSession,

    // Session management
    startLearningSession,
    updateCurrentSession,
    endLearningSession,

    // Progress updates
    updateLearningProgress,
    updateVocabularyProgress,
    addExerciseResult,
    updateLearningStats,
    markStoryCompleted,

    // Sync management
    getPendingSyncData,
    markAsSynced,

    // Utilities
    getVocabularyForReview,
    calculateStreak,
    clearOfflineData,

    // Status
    hasPendingSync: offlineData.pendingSync,
    lastSyncTime: offlineData.lastSyncTime,
  };
}
