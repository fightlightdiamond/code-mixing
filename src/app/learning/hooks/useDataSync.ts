import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback, useRef } from "react";
import { useOfflineProgress } from "./useOfflineProgress";
import { useOfflineManager } from "./useOfflineManager";
import type {
  LearningProgress,
  VocabularyProgress,
  ExerciseResult,
  LearningStats,
} from "../types/learning";

interface SyncStatus {
  isActive: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  lastSyncTime: Date | null;
  nextAutoSync: Date | null;
}

type ConflictDataMap = {
  learning_progress: LearningProgress;
  vocabulary_progress: VocabularyProgress;
  exercise_results: ExerciseResult;
  learning_stats: LearningStats;
};

interface SyncConflict<K extends keyof ConflictDataMap> {
  type: K;
  localData: ConflictDataMap[K];
  serverData: ConflictDataMap[K];
  field: string;
  resolution?: "local" | "server" | "merge";
}

type Conflict = {
  [K in keyof ConflictDataMap]: SyncConflict<K>;
}[keyof ConflictDataMap];

interface SyncResult {
  success: boolean;
  conflicts: Conflict[];
  syncedItems: {
    learningProgress: boolean;
    vocabularyProgress: number;
    exerciseResults: number;
    learningStats: boolean;
  };
  error?: string;
}

interface PendingSyncData {
  learningProgress: LearningProgress | null;
  vocabularyProgress: VocabularyProgress[];
  exerciseResults: ExerciseResult[];
  learningStats: LearningStats | null;
  sessions: unknown[];
}

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

export function useDataSync(userId: string) {
  const { isOnline } = useOfflineManager();
  const {
    getPendingSyncData,
    markAsSynced,
    offlineData,
    updateLearningProgress,
    updateVocabularyProgress,
    updateLearningStats,
  } = useOfflineProgress(userId);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isActive: false,
    progress: 0,
    currentStep: "",
    error: null,
    lastSyncTime: null,
    nextAutoSync: null,
  });

  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && offlineData.pendingSync) {
      // Delay sync slightly to ensure connection is stable
      const timer = setTimeout(() => {
        syncData();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, offlineData.pendingSync]);

  // Set up periodic sync
  useEffect(() => {
    if (!isOnline) return;

    const scheduleNextSync = () => {
      const nextSync = new Date(Date.now() + SYNC_INTERVAL);
      setSyncStatus((prev) => ({ ...prev, nextAutoSync: nextSync }));

      syncTimeoutRef.current = setTimeout(() => {
        if (offlineData.pendingSync) {
          syncData();
        }
        scheduleNextSync();
      }, SYNC_INTERVAL);
    };

    scheduleNextSync();

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, offlineData.pendingSync]);

  // Main sync function
  const syncData = useCallback(
    async (forceSync = false): Promise<SyncResult> => {
      if (!isOnline && !forceSync) {
        return {
          success: false,
          conflicts: [],
          syncedItems: {
            learningProgress: false,
            vocabularyProgress: 0,
            exerciseResults: 0,
            learningStats: false,
          },
          error: "No internet connection",
        };
      }

      const pendingData = getPendingSyncData();
      if (!pendingData && !forceSync) {
        return {
          success: true,
          conflicts: [],
          syncedItems: {
            learningProgress: false,
            vocabularyProgress: 0,
            exerciseResults: 0,
            learningStats: false,
          },
        };
      }

      setSyncStatus((prev) => ({
        ...prev,
        isActive: true,
        progress: 0,
        currentStep: "Starting sync...",
        error: null,
      }));

      try {
        const result = await performSync(pendingData as PendingSyncData);

        if (result.success && result.conflicts.length === 0) {
          markAsSynced();
          setSyncStatus((prev) => ({
            ...prev,
            isActive: false,
            progress: 100,
            currentStep: "Sync completed",
            lastSyncTime: new Date(),
            error: null,
          }));
          retryCountRef.current = 0;
        } else if (result.conflicts.length > 0) {
          setConflicts(result.conflicts);
          setSyncStatus((prev) => ({
            ...prev,
            isActive: false,
            progress: 50,
            currentStep: "Conflicts detected",
            error: "Data conflicts need resolution",
          }));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown sync error";

        setSyncStatus((prev) => ({
          ...prev,
          isActive: false,
          progress: 0,
          currentStep: "Sync failed",
          error: errorMessage,
        }));

        // Retry logic
        if (retryCountRef.current < MAX_RETRY_ATTEMPTS) {
          retryCountRef.current++;
          setTimeout(() => {
            syncData();
          }, RETRY_DELAY * retryCountRef.current);
        }

        return {
          success: false,
          conflicts: [],
          syncedItems: {
            learningProgress: false,
            vocabularyProgress: 0,
            exerciseResults: 0,
            learningStats: false,
          },
          error: errorMessage,
        };
      }
    },
    [isOnline, getPendingSyncData, markAsSynced]
  );

  // Perform the actual sync operations
  const performSync = async (
    pendingData: PendingSyncData
  ): Promise<SyncResult> => {
    const result: SyncResult = {
      success: true,
      conflicts: [],
      syncedItems: {
        learningProgress: false,
        vocabularyProgress: 0,
        exerciseResults: 0,
        learningStats: false,
      },
    };

    if (!pendingData) return result;

    // Step 1: Sync learning progress
    setSyncStatus((prev) => ({
      ...prev,
      progress: 10,
      currentStep: "Syncing learning progress...",
    }));

    if (pendingData.learningProgress) {
      try {
        const serverProgress = await fetchServerLearningProgress(userId);
        const conflicts = detectLearningProgressConflicts(
          pendingData.learningProgress,
          serverProgress
        );

        if (conflicts.length > 0) {
          result.conflicts.push(...conflicts);
        } else {
          await uploadLearningProgress(pendingData.learningProgress);
          result.syncedItems.learningProgress = true;
        }
      } catch (error) {
        logger.error("Failed to sync learning progress:", undefined, error as Error);
      }
    }

    // Step 2: Sync vocabulary progress
    setSyncStatus((prev) => ({
      ...prev,
      progress: 30,
      currentStep: "Syncing vocabulary progress...",
    }));

    if (
      pendingData.vocabularyProgress &&
      pendingData.vocabularyProgress.length > 0
    ) {
      try {
        const serverVocab = await fetchServerVocabularyProgress(userId);
        const { conflicts: vocabConflicts, merged } = mergeVocabularyProgress(
          pendingData.vocabularyProgress,
          serverVocab
        );

        if (vocabConflicts.length > 0) {
          result.conflicts.push(...vocabConflicts);
        } else {
          await uploadVocabularyProgress(merged);
          result.syncedItems.vocabularyProgress = merged.length;
        }
      } catch (error) {
        logger.error("Failed to sync vocabulary progress:", undefined, error as Error);
      }
    }

    // Step 3: Sync exercise results
    setSyncStatus((prev) => ({
      ...prev,
      progress: 60,
      currentStep: "Syncing exercise results...",
    }));

    if (pendingData.exerciseResults && pendingData.exerciseResults.length > 0) {
      try {
        await uploadExerciseResults(pendingData.exerciseResults);
        result.syncedItems.exerciseResults = pendingData.exerciseResults.length;
      } catch (error) {
        logger.error("Failed to sync exercise results:", undefined, error as Error);
      }
    }

    // Step 4: Sync learning stats
    setSyncStatus((prev) => ({
      ...prev,
      progress: 80,
      currentStep: "Syncing learning stats...",
    }));

    if (pendingData.learningStats) {
      try {
        const serverStats = await fetchServerLearningStats(userId);
        const mergedStats = mergeLearningStats(
          pendingData.learningStats,
          serverStats
        );

        await uploadLearningStats(mergedStats);
        result.syncedItems.learningStats = true;
      } catch (error) {
        logger.error("Failed to sync learning stats:", undefined, error as Error);
      }
    }

    // Step 5: Sync learning sessions
    setSyncStatus((prev) => ({
      ...prev,
      progress: 90,
      currentStep: "Syncing learning sessions...",
    }));

    if (pendingData.sessions && pendingData.sessions.length > 0) {
      try {
        await uploadLearningSessions(pendingData.sessions);
      } catch (error) {
        logger.error("Failed to sync learning sessions:", undefined, error as Error);
      }
    }

    setSyncStatus((prev) => ({
      ...prev,
      progress: 100,
      currentStep: "Finalizing sync...",
    }));

    return result;
  };

  // Resolve conflicts
  const resolveConflicts = useCallback(
    async (resolutions: { [key: string]: "local" | "server" | "merge" }) => {
      for (const conflict of conflicts) {
        const resolution = resolutions[`${conflict.type}_${conflict.field}`];

        if (resolution === "local") {
          // Keep local data, upload to server
          await uploadConflictResolution(conflict, conflict.localData);
        } else if (resolution === "server") {
          // Use server data, update local
          await updateLocalData(conflict, conflict.serverData);
        } else if (resolution === "merge") {
          // Merge data intelligently
          const mergedData = mergeConflictData(conflict);
          await uploadConflictResolution(conflict, mergedData);
          await updateLocalData(conflict, mergedData);
        }
      }

      setConflicts([]);
      markAsSynced();

      setSyncStatus((prev) => ({
        ...prev,
        lastSyncTime: new Date(),
        error: null,
      }));
    },
    [conflicts, markAsSynced]
  );

  // Helper functions for API calls
  const fetchServerLearningProgress = async (
    userId: string
  ): Promise<LearningProgress | null> => {
    const response = await fetch(
      `/api/learning/progress/user?userId=${userId}`
    );
    if (!response.ok) throw new Error("Failed to fetch server progress");
    return response.json();
  };

  const fetchServerVocabularyProgress = async (
    userId: string
  ): Promise<VocabularyProgress[]> => {
    const response = await fetch(
      `/api/learning/vocabulary/progress?userId=${userId}`
    );
    if (!response.ok) throw new Error("Failed to fetch server vocabulary");
    return response.json();
  };

  const fetchServerLearningStats = async (
    userId: string
  ): Promise<LearningStats | null> => {
    const response = await fetch(`/api/learning/stats/user?userId=${userId}`);
    if (!response.ok) throw new Error("Failed to fetch server stats");
    return response.json();
  };

  const uploadLearningProgress = async (progress: LearningProgress) => {
    const response = await fetch("/api/learning/progress/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(progress),
    });
    if (!response.ok) throw new Error("Failed to upload learning progress");
  };

  const uploadVocabularyProgress = async (vocabulary: VocabularyProgress[]) => {
    const response = await fetch("/api/learning/vocabulary/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vocabulary }),
    });
    if (!response.ok) throw new Error("Failed to upload vocabulary progress");
  };

  const uploadExerciseResults = async (results: ExerciseResult[]) => {
    const response = await fetch("/api/learning/exercises/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results }),
    });
    if (!response.ok) throw new Error("Failed to upload exercise results");
  };

  const uploadLearningStats = async (stats: LearningStats) => {
    const response = await fetch("/api/learning/stats/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(stats),
    });
    if (!response.ok) throw new Error("Failed to upload learning stats");
  };

  const uploadLearningSessions = async (sessions: unknown[]) => {
    const response = await fetch("/api/learning/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessions }),
    });
    if (!response.ok) throw new Error("Failed to upload learning sessions");
  };

  // Conflict detection and resolution helpers
  const detectLearningProgressConflicts = (
    local: LearningProgress,
    server: LearningProgress | null
  ): SyncConflict<'learning_progress'>[] => {
    if (!server) return [];

    const conflicts: SyncConflict<'learning_progress'>[] = [];

    // Check for conflicts in key fields
    if (local.storiesRead !== server.storiesRead) {
      conflicts.push({
        type: "learning_progress",
        localData: local,
        serverData: server,
        field: "storiesRead",
      });
    }

    if (local.vocabularyLearned !== server.vocabularyLearned) {
      conflicts.push({
        type: "learning_progress",
        localData: local,
        serverData: server,
        field: "vocabularyLearned",
      });
    }

    return conflicts;
  };

  const mergeVocabularyProgress = (
    local: VocabularyProgress[],
    server: VocabularyProgress[]
  ): {
    conflicts: SyncConflict<'vocabulary_progress'>[];
    merged: VocabularyProgress[];
  } => {
    const conflicts: SyncConflict<'vocabulary_progress'>[] = [];
    const merged: VocabularyProgress[] = [];
    const serverMap = new Map(server.map((v) => [v.word, v]));

    for (const localVocab of local) {
      const serverVocab = serverMap.get(localVocab.word);

      if (!serverVocab) {
        merged.push(localVocab);
      } else {
        // Merge vocabulary progress intelligently
        const mergedVocab: VocabularyProgress = {
          ...localVocab,
          encounters: Math.max(localVocab.encounters, serverVocab.encounters),
          correctAnswers: Math.max(
            localVocab.correctAnswers,
            serverVocab.correctAnswers
          ),
          totalAttempts: Math.max(
            localVocab.totalAttempts,
            serverVocab.totalAttempts
          ),
          lastReviewed: new Date(
            Math.max(
              new Date(localVocab.lastReviewed).getTime(),
              new Date(serverVocab.lastReviewed).getTime()
            )
          ),
          masteryLevel: Math.max(
            localVocab.masteryLevel,
            serverVocab.masteryLevel
          ),
        };

        merged.push(mergedVocab);
        serverMap.delete(localVocab.word);
      }
    }

    // Add remaining server vocabulary
    for (const serverVocab of serverMap.values()) {
      merged.push(serverVocab);
    }

    return { conflicts, merged };
  };

  const mergeLearningStats = (
    local: LearningStats,
    server: LearningStats | null
  ): LearningStats => {
    if (!server) return local;

    return {
      storiesCompleted: Math.max(
        local.storiesCompleted,
        server.storiesCompleted
      ),
      vocabularyMastered: Math.max(
        local.vocabularyMastered,
        server.vocabularyMastered
      ),
      timeSpentToday: local.timeSpentToday, // Use local for today's time
      timeSpentThisWeek: Math.max(
        local.timeSpentThisWeek,
        server.timeSpentThisWeek
      ),
      timeSpentTotal: Math.max(local.timeSpentTotal, server.timeSpentTotal),
      currentStreak: Math.max(local.currentStreak, server.currentStreak),
      longestStreak: Math.max(local.longestStreak, server.longestStreak),
      averageScore: (local.averageScore + server.averageScore) / 2, // Average the scores
      completionRate: Math.max(local.completionRate, server.completionRate),
    };
  };

  const uploadConflictResolution = async <K extends keyof ConflictDataMap>(
    conflict: SyncConflict<K>,
    data: ConflictDataMap[K]
  ) => {
    // Implementation depends on conflict type
    logger.info("Uploading conflict resolution", { conflict, data });
  };

  const updateLocalData = async <K extends keyof ConflictDataMap>(
    conflict: SyncConflict<K>,
    data: ConflictDataMap[K]
  ) => {
    // Update local data based on conflict type
    if (conflict.type === "learning_progress") {
      updateLearningProgress({
        [conflict.field]: data[
          conflict.field as keyof LearningProgress
        ],
      } as Partial<LearningProgress>);
    } else if (conflict.type === "vocabulary_progress") {
      updateVocabularyProgress(conflict.field, data);
    } else if (conflict.type === "learning_stats") {
      updateLearningStats({
        [conflict.field]: data[
          conflict.field as keyof LearningStats
        ],
      } as Partial<LearningStats>);
    }
  };

  const mergeConflictData = <K extends keyof ConflictDataMap>(
    conflict: SyncConflict<K>
  ): ConflictDataMap[K] => {
    // Intelligent merging based on conflict type and field
    if (
      conflict.type === "learning_progress" &&
      (conflict.field === "storiesRead" ||
        conflict.field === "vocabularyLearned")
    ) {
      const localValue = conflict.localData[
        conflict.field as keyof LearningProgress
      ];
      const serverValue = conflict.serverData[
        conflict.field as keyof LearningProgress
      ];

      if (
        typeof localValue === "number" &&
        typeof serverValue === "number"
      ) {
        return {
          ...conflict.localData,
          [conflict.field]: Math.max(localValue, serverValue),
        } as ConflictDataMap[K];
      }
    }
    return conflict.localData;
  };

  return {
    // Status
    syncStatus,
    conflicts,

    // Actions
    syncData,
    resolveConflicts,

    // Utilities
    canSync: isOnline && offlineData.pendingSync,
    hasConflicts: conflicts.length > 0,
  };
}
