/**
 * Core API types and interfaces
 */

/* ======================================
 * Interceptor Types
 * ====================================== */
export type RequestInterceptor = (
  config: RequestInit & { url: string }
) => (RequestInit & { url: string }) | Promise<RequestInit & { url: string }>;

export type ResponseInterceptor = (
  response: Response
) => Response | Promise<Response>;

export type ErrorInterceptor = (error: Error) => Error | Promise<Error>;

/* ======================================
 * Authentication Types
 * ====================================== */
export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
  tokenType: "Bearer";
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn?: number;
  refreshToken?: string;
}

export interface CSRFResponse {
  csrfToken?: string;
}

/* ======================================
 * API Client Configuration
 * ====================================== */
export interface RetryConfig {
  attempts: number;
  delay: (attemptIndex: number) => number;
  retryCondition: (error: Error) => boolean;
}

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryConfig?: RetryConfig;
}

/* ======================================
 * Response Types
 * ====================================== */
export interface ErrorResponseBody {
  message?: string;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

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

/* ======================================
 * Utility Types
 * ====================================== */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface RequestConfig extends RequestInit {
  url: string;
  method?: HttpMethod;
}

export interface TokenStatus {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  isExpiringSoon: boolean;
  accessTokenLength: number;
  refreshTokenLength: number;
}
