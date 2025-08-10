/**
 * Lesson Configuration
 * Centralized lesson-related configurations
 */

export type LessonStatus = 'published' | 'draft' | 'archived';
export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface LessonConfig {
  status: LessonStatus;
  difficulty: LessonDifficulty;
  defaultEstimatedMinutes: number;
  maxStoriesPerLesson: number;
}

export const LESSON_STATUSES: LessonStatus[] = ['published', 'draft', 'archived'];
export const LESSON_DIFFICULTIES: LessonDifficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export const LESSON_DEFAULTS: LessonConfig = {
  status: 'draft',
  difficulty: 'beginner',
  defaultEstimatedMinutes: 30,
  maxStoriesPerLesson: 10
};

export const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  published: 'Published',
  draft: 'Draft',
  archived: 'Archived'
};

export const LESSON_DIFFICULTY_LABELS: Record<LessonDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert'
};

// Helper functions
export function isValidLessonStatus(status: string): status is LessonStatus {
  return LESSON_STATUSES.includes(status as LessonStatus);
}

export function isValidLessonDifficulty(difficulty: string): difficulty is LessonDifficulty {
  return LESSON_DIFFICULTIES.includes(difficulty as LessonDifficulty);
}

export function getLessonStatusLabel(status: LessonStatus): string {
  return LESSON_STATUS_LABELS[status];
}

export function getLessonDifficultyLabel(difficulty: LessonDifficulty): string {
  return LESSON_DIFFICULTY_LABELS[difficulty];
}
