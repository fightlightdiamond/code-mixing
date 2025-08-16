// Enhanced error handling with custom error types
export class ApiError<T = unknown> extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: T,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError<T = unknown> extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: T
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Enhanced retry logic with exponential backoff
export const retryConfig = {
  attempts: 3,
  delay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  retryCondition: (error: Error) => {
    if (error instanceof ApiError) {
      // Don't retry client errors (4xx), but retry server errors (5xx)
      return error.status >= 500;
    }
    if (error instanceof NetworkError) {
      return true; // Retry network errors
    }
    return false;
  },
};

// Global error handler
export const handleApiError = (error: unknown): never => {
  if (error instanceof Response) {
    throw new ApiError(
      `HTTP ${error.status}`,
      error.status,
      undefined,
      `HTTP_${error.status}`
    );
  }
  
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new NetworkError('Network connection failed', error);
  }
  
  if (error instanceof Error) {
    throw error;
  }
  
  throw new ApiError('Unknown error occurred', 500, error, 'UNKNOWN_ERROR');
};

// Error boundary helper
export const isRetryableError = (error: Error): boolean => {
  return retryConfig.retryCondition(error);
};
