/**
 * API Validation Configuration
 * Centralized validation rules and constraints
 */

import { VALID_STORY_TYPES, StoryType } from '../business/story-types';
import { LESSON_STATUSES, LESSON_DIFFICULTIES, LessonStatus, LessonDifficulty } from '../business/lesson-config';
import { VALID_USER_ROLES, UserRole } from '../business/user-roles';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: readonly string[];
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

// Story Validation Rules
export const STORY_VALIDATION_RULES: ValidationRules = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 255
  },
  content: {
    required: true,
    minLength: 10,
    maxLength: 50000
  },
  storyType: {
    required: false,
    enum: VALID_STORY_TYPES
  },
  difficulty: {
    required: false,
    enum: LESSON_DIFFICULTIES
  },
  estimatedMinutes: {
    required: false,
    min: 1,
    max: 300
  },
  chemRatio: {
    required: false,
    min: 0,
    max: 1
  }
};

// Lesson Validation Rules
export const LESSON_VALIDATION_RULES: ValidationRules = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 255
  },
  description: {
    required: false,
    maxLength: 1000
  },
  difficulty: {
    required: false,
    enum: LESSON_DIFFICULTIES
  },
  status: {
    required: false,
    enum: LESSON_STATUSES
  },
  estimatedMinutes: {
    required: false,
    min: 1,
    max: 600
  },
  order: {
    required: false,
    min: 0
  }
};

// User Validation Rules
export const USER_VALIDATION_RULES: ValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255
  },
  name: {
    required: true,
    minLength: 1,
    maxLength: 100
  },
  role: {
    required: false,
    enum: VALID_USER_ROLES
  }
};

// Validation Helper Functions
export function validateField(value: unknown, rule: ValidationRule): string[] {
  const errors: string[] = [];

  if (rule.required && (value === undefined || value === null || (typeof value === 'string' && value === ''))) {
    errors.push('This field is required');
    return errors;
  }

  if (value === undefined || value === null || (typeof value === 'string' && value === '')) {
    return errors; // Skip other validations if not required and empty
  }

  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`Minimum length is ${rule.minLength} characters`);
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`Maximum length is ${rule.maxLength} characters`);
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push('Invalid format');
    }
  }

  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      errors.push(`Minimum value is ${rule.min}`);
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push(`Maximum value is ${rule.max}`);
    }
  }

  if (rule.enum) {
    if (typeof value !== 'string' || !rule.enum.includes(value)) {
      errors.push(`Must be one of: ${rule.enum.join(', ')}`);
    }
  }

  return errors;
}

export function validateObject(obj: Record<string, unknown>, rules: ValidationRules): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const fieldErrors = validateField(obj[field], rule);
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }

  return errors;
}

export function hasValidationErrors(errors: Record<string, string[]>): boolean {
  return Object.keys(errors).length > 0;
}
