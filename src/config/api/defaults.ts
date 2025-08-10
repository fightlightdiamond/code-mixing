/**
 * API Defaults Configuration
 * Centralized default values for API operations
 */

import { StoryType } from '../business/story-types';
import { LessonDifficulty } from '../business/lesson-config';

export interface StoryDefaults {
  storyType: StoryType;
  difficulty: LessonDifficulty;
  estimatedMinutes: number;
  chemRatio: number;
  status: string;
}

export interface LessonDefaults {
  difficulty: LessonDifficulty;
  estimatedMinutes: number;
  status: string;
  order: number;
}

export interface PaginationDefaults {
  page: number;
  limit: number;
  maxLimit: number;
}

export const STORY_DEFAULTS: StoryDefaults = {
  storyType: 'original',
  difficulty: 'beginner',
  estimatedMinutes: 10,
  chemRatio: 0.3,
  status: 'draft'
};

export const LESSON_DEFAULTS: LessonDefaults = {
  difficulty: 'beginner',
  estimatedMinutes: 30,
  status: 'draft',
  order: 0
};

export const PAGINATION_DEFAULTS: PaginationDefaults = {
  page: 1,
  limit: 10,
  maxLimit: 100
};

// API Response Defaults
export const API_RESPONSE_DEFAULTS = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};

// File Upload Defaults
export const FILE_UPLOAD_DEFAULTS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  allowedDocumentTypes: ['application/pdf', 'text/plain']
};
