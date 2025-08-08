import { ApiError, NetworkError, handleApiError } from "./errorHandling";

// Request/Response interceptor types
type RequestInterceptor = (
  config: RequestInit & { url: string }
) => (RequestInit & { url: string }) | Promise<RequestInit & { url: string }>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
type ErrorInterceptor = (error: Error) => Error | Promise<Error>;

class ApiClient {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  // Add interceptors
  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor);
  }

  async request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    try {
      // Prepare request config
      const url = typeof input === "string" ? input : input.url;
      const fullUrl = url.startsWith("http")
        ? url
        : `${process.env.NEXTAUTH_URL || "http://localhost:3000"}${url}`;

      let config: RequestInit & { url: string } = {
        ...init,
        url: fullUrl,
        headers: {
          "Content-Type": "application/json",
          ...init?.headers,
        },
        // Support AbortSignal from TanStack Query
        signal: init?.signal,
      };

      // Apply request interceptors
      for (const interceptor of this.requestInterceptors) {
        config = await interceptor(config);
      }

      // Make the request
      let response = await fetch(config.url, config);

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response);
      }

      // Handle response
      const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");
      const body = isJson
        ? await response.json().catch(() => undefined)
        : undefined;

      if (!response.ok) {
        const message = body?.message || `HTTP ${response.status}`;
        throw new ApiError(
          message,
          response.status,
          body,
          `HTTP_${response.status}`
        );
      }

      return (body ?? (await response.text())) as T;
    } catch (error) {
      // Apply error interceptors
      let processedError = error as Error;
      for (const interceptor of this.errorInterceptors) {
        processedError = await interceptor(processedError);
      }
      throw processedError;
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Add default interceptors
apiClient.addRequestInterceptor(async (config) => {
  // Add auth token if available
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  // Add request ID for tracing
  config.headers = {
    ...config.headers,
    "X-Request-ID": crypto.randomUUID(),
  };

  return config;
});

apiClient.addResponseInterceptor(async (response) => {
  // Log response for debugging
  if (process.env.NODE_ENV === "development") {
    console.log(`API Response: ${response.status} ${response.url}`);
  }
  return response;
});

apiClient.addErrorInterceptor(async (error) => {
  // Log errors
  if (process.env.NODE_ENV === "development") {
    console.error("API Error:", error);
  }

  // Handle auth errors
  if (error instanceof ApiError && error.status === 401) {
    // Clear auth token and redirect to login
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      // Could dispatch a logout action here
    }
  }

  return error;
});

// Export the main API function
export const api = <T>(input: RequestInfo, init?: RequestInit): Promise<T> =>
  apiClient.request<T>(input, init);

// Export client for advanced usage
export { apiClient };
