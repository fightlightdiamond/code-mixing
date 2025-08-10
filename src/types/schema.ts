// Type definitions for Prisma schema enums and types
// This allows gradual migration from string literals to proper enums

// Content Status enum - matches Prisma schema
export enum ContentStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  REJECTED = 'rejected'
}

// Progress Status enum - matches Prisma schema
export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAUSED = 'paused'
}

// Difficulty Level enum - matches Prisma schema
export enum DifficultyLevel {
  BEGINNER = 'beginner',
  ELEMENTARY = 'elementary',
  INTERMEDIATE = 'intermediate',
  UPPER_INTERMEDIATE = 'upper_intermediate',
  ADVANCED = 'advanced',
  PROFICIENT = 'proficient'
}

// Notification Type enum - matches Prisma schema
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

// Type unions for backward compatibility
export type ContentStatusType = ContentStatus | 'draft' | 'in_review' | 'published' | 'archived' | 'rejected';
export type ProgressStatusType = ProgressStatus | 'not_started' | 'in_progress' | 'completed' | 'paused';
export type DifficultyLevelType = DifficultyLevel | 'beginner' | 'elementary' | 'intermediate' | 'upper_intermediate' | 'advanced' | 'proficient';

// Helper functions for conversion
export const ContentStatusHelpers = {
  fromString: (status: string): ContentStatus => {
    switch (status) {
      case 'draft': return ContentStatus.DRAFT;
      case 'in_review': return ContentStatus.IN_REVIEW;
      case 'published': return ContentStatus.PUBLISHED;
      case 'archived': return ContentStatus.ARCHIVED;
      case 'rejected': return ContentStatus.REJECTED;
      default: return ContentStatus.DRAFT;
    }
  },
  
  toString: (status: ContentStatus): string => status.valueOf(),
  
  isValid: (status: string): boolean => {
    return Object.values(ContentStatus).includes(status as ContentStatus);
  },
  
  getAllValues: (): string[] => Object.values(ContentStatus)
};

export const ProgressStatusHelpers = {
  fromString: (status: string): ProgressStatus => {
    switch (status) {
      case 'not_started': return ProgressStatus.NOT_STARTED;
      case 'in_progress': return ProgressStatus.IN_PROGRESS;
      case 'completed': return ProgressStatus.COMPLETED;
      case 'paused': return ProgressStatus.PAUSED;
      default: return ProgressStatus.NOT_STARTED;
    }
  },
  
  toString: (status: ProgressStatus): string => status.valueOf(),
  
  isValid: (status: string): boolean => {
    return Object.values(ProgressStatus).includes(status as ProgressStatus);
  },
  
  getAllValues: (): string[] => Object.values(ProgressStatus)
};

// Constants for commonly used values
export const CONTENT_STATUS_VALUES = {
  DRAFT: 'draft' as const,
  IN_REVIEW: 'in_review' as const,
  PUBLISHED: 'published' as const,
  ARCHIVED: 'archived' as const,
  REJECTED: 'rejected' as const
} as const;

export const PROGRESS_STATUS_VALUES = {
  NOT_STARTED: 'not_started' as const,
  IN_PROGRESS: 'in_progress' as const,
  COMPLETED: 'completed' as const,
  PAUSED: 'paused' as const
} as const;

// Type guards
export const isContentStatus = (value: unknown): value is ContentStatus => {
  return typeof value === 'string' && Object.values(ContentStatus).includes(value as ContentStatus);
};

export const isProgressStatus = (value: unknown): value is ProgressStatus => {
  return typeof value === 'string' && Object.values(ProgressStatus).includes(value as ProgressStatus);
};
