/**
 * Type-safe API interfaces to replace 'any' types throughout the codebase
 */

// JWT Token Types
export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Database Query Types
export interface DatabaseWhereClause {
  [key: string]: string | number | boolean | object | undefined;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QueryParams extends PaginationParams, SortParams {
  [key: string]: string | number | boolean | undefined;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
  details?: Record<string, unknown>;
}

// Quiz Types
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizCreateRequest {
  title: string;
  description?: string;
  questions: Omit<QuizQuestion, 'id'>[];
}

export interface QuizUpdateRequest extends Partial<QuizCreateRequest> {
  id: string;
}

// Story Types
export interface Story {
  id: string;
  title: string;
  content: string;
  level: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StoryCreateRequest {
  title: string;
  content: string;
  level: string;
  tags?: string[];
}

export interface StoryUpdateRequest extends Partial<StoryCreateRequest> {
  id: string;
}

// Lesson Types
export interface Lesson {
  id: string;
  title: string;
  content: string;
  level: string;
  courseId?: string;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LessonCreateRequest {
  title: string;
  content: string;
  level: string;
  courseId?: string;
  order?: number;
}

export interface LessonUpdateRequest extends Partial<LessonCreateRequest> {
  id: string;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId?: string; // Optional for compatibility
  isActive?: boolean;
  isEmailVerified?: boolean;
  createdAt: string | Date; // Allow both string and Date
  updatedAt?: string | Date; // Optional and allow both types
}

export interface UserCreateRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
  tenantId?: string;
}

export interface UserUpdateRequest extends Partial<Omit<UserCreateRequest, 'password'>> {
  id: string;
}

// Query Client Types
export interface QueryClientData<T = any> {
  pages?: T[];
  pageParams?: any[];
  data?: T;
}

export interface OptimisticUpdateContext<T = any> {
  previousData?: T;
  newData: T;
  queryKey: string[];
}

// CASL Types
export interface CASLRule {
  action: string;
  subject: string;
  conditions?: Record<string, unknown>;
  fields?: string[];
  inverted?: boolean;
  reason?: string;
}

export interface RequiredRule {
  action: string;
  subject: string;
}

export interface CASLContext {
  userId: string;
  tenantId: string;
  role: string;
  permissions?: string[];
}

// Form Types
export interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => boolean | string;
  };
}

export interface FormData {
  [key: string]: string | number | boolean | string[] | undefined;
}

// State Management Types
export interface StoreState {
  [key: string]: unknown;
}

export interface StoreActions {
  [key: string]: (...args: unknown[]) => void;
}

export interface StoreSlice<T extends StoreState, A extends StoreActions> {
  state: T;
  actions: A;
}

// Monitoring Types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: string;
  context?: Record<string, any>;
}

export interface QueryMetrics {
  queryKey: string[];
  duration: number;
  cacheHit: boolean;
  error?: string;
  timestamp: string;
}

// Environment Types
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  JWT_SECRET: string;
  CSRF_SECRET: string;
  NEXT_PUBLIC_APP_URL?: string;
  PORT?: string;
  HOST?: string;
  VERCEL_URL?: string;
  ENABLE_AUTH_LOGGING?: string;
}

// Export utility type helpers
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

export type StringKeys<T> = Extract<keyof T, string>;

export type ValueOf<T> = T[keyof T];
