// Prisma type extensions for gradual migration
import { Prisma } from '@prisma/client';
import { ContentStatusType, ProgressStatusType, DifficultyLevelType } from './schema';

// Extended types that support both old string literals and new enums
export interface ExtendedCourse extends Omit<Prisma.CourseCreateInput, 'status' | 'difficulty'> {
  status?: ContentStatusType;
  difficulty?: DifficultyLevelType;
}

export interface ExtendedLesson extends Omit<Prisma.LessonCreateInput, 'status'> {
  status?: ContentStatusType;
}

export interface ExtendedStory extends Omit<Prisma.StoryCreateInput, 'status' | 'difficulty'> {
  status?: ContentStatusType;
  difficulty?: DifficultyLevelType;
}

export interface ExtendedUserProgress extends Omit<Prisma.UserProgressCreateInput, 'status'> {
  status?: ProgressStatusType;
}

// Update input types
export interface CourseUpdateInput extends Omit<Prisma.CourseUpdateInput, 'status' | 'difficulty'> {
  status?: ContentStatusType;
  difficulty?: DifficultyLevelType;
}

export interface LessonUpdateInput extends Omit<Prisma.LessonUpdateInput, 'status'> {
  status?: ContentStatusType;
}

export interface StoryUpdateInput extends Omit<Prisma.StoryUpdateInput, 'status' | 'difficulty'> {
  status?: ContentStatusType;
  difficulty?: DifficultyLevelType;
}

export interface UserProgressUpdateInput extends Omit<Prisma.UserProgressUpdateInput, 'status'> {
  status?: ProgressStatusType;
}

// Where clause extensions for filtering
export interface ContentWhereInput {
  status?: {
    equals?: ContentStatusType;
    in?: ContentStatusType[];
    notIn?: ContentStatusType[];
    not?: ContentStatusType;
  };
}

export interface ProgressWhereInput {
  status?: {
    equals?: ProgressStatusType;
    in?: ProgressStatusType[];
    notIn?: ProgressStatusType[];
    not?: ProgressStatusType;
  };
}

// Helper type for database operations
export type DatabaseOperation<T> = {
  create: (data: T) => Promise<unknown>;
  update: (where: Record<string, unknown>, data: Partial<T>) => Promise<unknown>;
  findMany: (args?: Record<string, unknown>) => Promise<unknown[]>;
  findUnique: (where: Record<string, unknown>) => Promise<unknown>;
  delete: (where: Record<string, unknown>) => Promise<unknown>;
};

// Migration utilities
export const MigrationUtils = {
  // Convert old status strings to new enum values for database operations
  normalizeContentStatus: (status: ContentStatusType): string => {
    if (typeof status === 'string') return status;
    return String(status);
  },

  normalizeProgressStatus: (status: ProgressStatusType): string => {
    if (typeof status === 'string') return status;
    return String(status);
  },

  // Validate status values before database operations
  validateContentStatus: (status: unknown): boolean => {
    const validStatuses = ['draft', 'in_review', 'published', 'archived', 'rejected'];
    return typeof status === 'string' && validStatuses.includes(status);
  },

  validateProgressStatus: (status: unknown): boolean => {
    const validStatuses = ['not_started', 'in_progress', 'completed', 'paused'];
    return typeof status === 'string' && validStatuses.includes(status);
  }
};
