/**
 * UI Status Color Configuration
 * Centralized color mappings for various status types
 */

export type StatusColorConfig = {
  background: string;
  text: string;
  border?: string;
};

export type StatusColorMap<T extends string> = Record<T, StatusColorConfig>;

// Lesson Status Colors
export type LessonStatus = 'published' | 'draft' | 'archived';

export const LESSON_STATUS_COLORS: StatusColorMap<LessonStatus> = {
  published: {
    background: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  draft: {
    background: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  archived: {
    background: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200'
  }
};

// Story Status Colors
export type StoryStatus = 'published' | 'draft' | 'in_review' | 'archived';

export const STORY_STATUS_COLORS: StatusColorMap<StoryStatus> = {
  published: {
    background: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  draft: {
    background: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  in_review: {
    background: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200'
  },
  archived: {
    background: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200'
  }
};

// User Role Colors
export type UserRole = 'admin' | 'teacher' | 'student' | 'guest';

export const USER_ROLE_COLORS: StatusColorMap<UserRole> = {
  admin: {
    background: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  teacher: {
    background: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200'
  },
  student: {
    background: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  guest: {
    background: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200'
  }
};

// Difficulty Level Colors
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export const DIFFICULTY_COLORS: StatusColorMap<DifficultyLevel> = {
  beginner: {
    background: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  intermediate: {
    background: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  advanced: {
    background: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200'
  },
  expert: {
    background: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  }
};

/**
 * Helper function to get status color configuration
 */
export function getStatusColors<T extends string>(
  statusMap: StatusColorMap<T>,
  status: T,
  fallback: StatusColorConfig = LESSON_STATUS_COLORS.draft
): StatusColorConfig {
  return statusMap[status] ?? fallback;
}

/**
 * Helper function to generate Tailwind CSS classes for status
 */
export function getStatusClasses<T extends string>(
  statusMap: StatusColorMap<T>,
  status: T,
  includeBase: boolean = true
): string {
  const config = getStatusColors(statusMap, status);
  const baseClasses = includeBase ? 'inline-flex px-2 py-1 text-xs font-semibold rounded-full' : '';
  
  return `${baseClasses} ${config.background} ${config.text}`.trim();
}
