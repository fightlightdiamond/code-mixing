import type { ChunkType, DifficultyLevel, StoryType } from "@prisma/client";
import type { ReactNode } from "react";

// Story-related types
export interface LearningStory {
  id: string;
  title: string;
  content: string;
  storyType: StoryType;
  difficulty: DifficultyLevel;
  estimatedMinutes?: number;
  wordCount?: number;
  chemRatio?: number;
  chunks: StoryChunk[];
  lesson?: {
    id: string;
    title: string;
  };
}

export interface StoryChunk {
  id: string;
  chunkOrder: number;
  chunkText: string;
  type: ChunkType;
  processedText?: ReactNode;
}

// Vocabulary-related types
export interface VocabularyData {
  id?: string;
  word: string;
  meaning: string;
  pronunciation?: string;
  example?: string;
  audioUrl?: string;
  userProgress?: {
    status: "new" | "reviewing" | "mastered";
  };
}

// Component props
export interface StoryReaderProps {
  story: LearningStory;
  onWordClick: (word: string, position: { x: number; y: number }) => void;
  highlightedChunk?: number;
  className?: string;
}

export interface VocabularyPopupProps {
  word: string;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  vocabularyData?: VocabularyData;
  isLoading?: boolean;
}

// Audio-related types
export interface AudioPlayerProps {
  audioUrl: string;
  chunks: StoryChunk[];
  onChunkHighlight: (chunkIndex: number) => void;
  className?: string;
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentChunk: number;
  isLoading: boolean;
  error: string | null;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
}

// Story selection types
export interface StoryListProps {
  stories: LearningStory[];
  onStorySelect: (story: LearningStory) => void;
  selectedLevel?: DifficultyLevel;
  searchQuery?: string;
  className?: string;
}

export interface StoryCardProps {
  story: LearningStory;
  onSelect: (story: LearningStory) => void;
  className?: string;
}

// Filter types
export interface StoryFilters {
  level?: DifficultyLevel;
  storyType?: StoryType;
  search?: string;
  minWordCount?: number;
  maxWordCount?: number;
}

// Exercise-related types
export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  vocabulary?: string[];
}

export type ExerciseType = "fill_blank" | "multiple_choice" | "drag_drop";

export interface ExerciseResult {
  exerciseId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  timeSpent: number;
  attempts: number;
}

export interface ExercisePanelProps {
  storyId: string;
  exercises: Exercise[];
  onComplete: (results: ExerciseResult[]) => void;
  onExerciseResult: (result: ExerciseResult) => void;
  className?: string;
}

export interface ExerciseState {
  currentExercise: number;
  answers: Record<string, string | string[]>;
  results: ExerciseResult[];
  startTime: number;
  isCompleted: boolean;
  showFeedback: boolean;
}

// Progress tracking types
export interface LearningProgress {
  userId: string;
  storiesRead: number;
  vocabularyLearned: number;
  totalTimeSpent: number; // in minutes
  currentStreak: number;
  longestStreak: number;
  completionPercentage: number;
  level: number;
  experiencePoints: number;
  achievements: Achievement[];
  lastActivityAt: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconUrl?: string;
  unlockedAt: Date;
  category: AchievementCategory;
}

export type AchievementCategory =
  | "reading"
  | "vocabulary"
  | "streak"
  | "time"
  | "level";

export interface VocabularyProgress {
  word: string;
  status: VocabularyStatus;
  encounters: number;
  correctAnswers: number;
  totalAttempts: number;
  lastReviewed: Date;
  nextReview: Date;
  masteryLevel: number; // 0-100
}

export type VocabularyStatus = "new" | "reviewing" | "mastered";

export interface LevelProgress {
  currentLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXPForCurrentLevel: number;
  isLevelUnlocked: (level: number) => boolean;
  nextStoryRecommendations: LearningStory[];
}

export interface ProgressTrackerProps {
  userId: string;
  className?: string;
}

export interface LearningStats {
  storiesCompleted: number;
  vocabularyMastered: number;
  timeSpentToday: number;
  timeSpentThisWeek: number;
  timeSpentTotal: number;
  currentStreak: number;
  longestStreak: number;
  averageScore: number;
  completionRate: number;
}

// User preferences types
export interface UserLearningPreferences {
  embeddingRatio: number; // 10-50%
  difficultyLevel: DifficultyLevel;
  theme: ThemePreference;
  topicPreferences: StoryType[];
  audioEnabled: boolean;
  autoPlayAudio: boolean;
  playbackSpeed: number;
  vocabularyReviewFrequency: ReviewFrequency;
  dailyGoal: number; // minutes per day
  notificationsEnabled: boolean;
}

export type ThemePreference = "light" | "dark" | "system";
export type ReviewFrequency = "daily" | "every_other_day" | "weekly";

export interface SettingsPanelProps {
  preferences: UserLearningPreferences;
  onPreferencesChange: (
    preferences: UserLearningPreferences
  ) => Promise<boolean>;
  onClose: () => void;
  className?: string;
  isSaving?: boolean;
}

export interface PreferenceSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}
