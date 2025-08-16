// Learning feature types following project standards
import type {
  ChunkType,
  DifficultyLevel,
  StoryType,
  ContentStatus,
} from "@prisma/client";

// Core learning types
export interface LearningStory {
  id: string;
  title: string;
  content: string;
  storyType: StoryType;
  difficulty: DifficultyLevel;
  estimatedMinutes?: number;
  wordCount?: number;
  chemRatio?: number;
  status: ContentStatus;
  chunks: StoryChunk[];
  lesson?: {
    id: string;
    title: string;
  } | null;
  creator: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    chunks: number;
    learningSessions: number;
  };
}

export interface StoryChunk {
  id: string;
  chunkOrder: number;
  chunkText: string;
  type: ChunkType;
}

export interface VocabularyData {
  word: string;
  meaning: string;
  pronunciation?: string;
  example?: string;
  audioUrl?: string;
}

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

export interface LearningProgress {
  userId: string;
  storiesRead: number;
  vocabularyLearned: number;
  totalTimeSpent: number;
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
  masteryLevel: number;
}

export type VocabularyStatus = "new" | "reviewing" | "mastered";

export interface UserLearningPreferences {
  embeddingRatio: number;
  difficultyLevel: DifficultyLevel;
  theme: ThemePreference;
  topicPreferences: StoryType[];
  audioEnabled: boolean;
  autoPlayAudio: boolean;
  playbackSpeed: number;
  vocabularyReviewFrequency: ReviewFrequency;
  dailyGoal: number;
  notificationsEnabled: boolean;
}

export type ThemePreference = "light" | "dark" | "system";
export type ReviewFrequency = "daily" | "every_other_day" | "weekly";

// API request/response types
export interface CreateLearningSessionData {
  storyId: string;
  startTime: Date;
}

export interface UpdateProgressData {
  storyId: string;
  timeSpent: number;
  wordsLearned: string[];
  exerciseResults: ExerciseResult[];
  completionPercentage: number;
}

export interface VocabularyLookupData {
  word: string;
  storyId: string;
  context?: string;
}

export interface SubmitExerciseData {
  exerciseId: string;
  storyId: string;
  userAnswer: string | string[];
  timeSpent: number;
}

export interface VocabularyUpdate {
  word: string;
  status: "learning" | "mastered";
  storyId?: string;
}

export interface ProgressAnalytics {
  period: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  summary: {
    totalSessions: number;
    totalTimeSpent: number;
    totalInteractions: number;
    activeDays: number;
    averageSessionTime: number;
    lessonsCompleted: number;
    lessonsInProgress: number;
    vocabularyReviewed: number;
    vocabularyMastered: number;
  };
  timeAnalysis: {
    hourlyDistribution: number[];
    dailyDistribution: number[];
    peakLearningHour: number;
    peakLearningDay: string;
    totalTimeByHour: number;
    averageSessionsPerDay: number;
  };
  difficultyAnalysis: Record<
    DifficultyLevel,
    { sessions: number; timeSpent: number; completed: number }
  >;
  vocabularyAnalysis: {
    statusDistribution: Record<VocabularyStatus, number>;
    difficultyDistribution: Record<DifficultyLevel, number>;
    totalWords: number;
    masteryRate: number;
  };
  learningPatterns: {
    consistency: number;
    preferredSessionLength: number;
    learningVelocity: number;
  };
  recommendations: {
    type: string;
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
  }[];
  comparison?: {
    period: string;
    dateRange: {
      start: Date;
      end: Date;
    };
    summary: ProgressAnalytics["summary"];
  };
}
