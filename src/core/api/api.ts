import { ApiError } from "./errorHandling";
import logger from "@/lib/logger";
import { getCSRFToken } from "./csrf";
import {
  tokenManager,
  getAuthToken,
  getRefreshToken,
  refreshToken as refreshAuthToken,
  clearAuthToken,
} from "./tokenManager";

/* ======================================
 * Types
 * ====================================== */
// Enhanced request configuration interface
export interface ApiRequestConfig extends RequestInit {
  url: string;
  timeout?: number;
  retries?: number;
}

export type RequestInterceptor = (
  config: ApiRequestConfig
) => ApiRequestConfig | Promise<ApiRequestConfig>;

export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
export type ErrorInterceptor = (error: Error) => Error | Promise<Error>;

/* ======================================
 * Utils
 * ====================================== */
const isClient = () => typeof window !== "undefined";

/* ======================================
 * ApiClient (fetch wrapper + interceptors)
 * ====================================== */
class ApiClient {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(private opts?: { baseURL?: string }) {}

  addRequestInterceptor(i: RequestInterceptor) {
    this.requestInterceptors.push(i);
  }
  addResponseInterceptor(i: ResponseInterceptor) {
    this.responseInterceptors.push(i);
  }
  addErrorInterceptor(i: ErrorInterceptor) {
    this.errorInterceptors.push(i);
  }

  private resolveURL(input: RequestInfo) {
    const url = typeof input === "string" ? input : input.url;
    if (/^https?:\/\//i.test(url)) return url;
    if (this.opts?.baseURL) return `${this.opts.baseURL}${url}`;
    return url; // prefer relative path on client
  }

  async request<T = unknown>(input: RequestInfo, init?: RequestInit): Promise<T> {
    try {
      let config: RequestInit & { url: string } = {
        ...init,
        url: this.resolveURL(input),
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
        signal: init?.signal,
      };

      for (const i of this.requestInterceptors) {
        config = await i(config);
      }

      let response = await fetch(config.url, config);

      for (const i of this.responseInterceptors) {
        response = await i(response);
      }

      const isJson = response.headers.get("content-type")?.includes("application/json");
      const body: unknown = isJson ? await response.json().catch(() => undefined) : undefined;

      if (!response.ok) {
        type ErrorBody = { message?: string; error?: string; [k: string]: unknown };
        const obj = (typeof body === "object" && body !== null) ? (body as ErrorBody) : undefined;
        const message = obj?.message || obj?.error || `HTTP ${response.status}`;
        throw new ApiError(message, response.status, body, `HTTP_${response.status}`);
      }

      return (body as T) ?? (await response.text() as unknown as T);
    } catch (err) {
      let e = err as Error;
      for (const i of this.errorInterceptors) {
        e = await i(e);
      }
      throw e;
    }
  }
}

export const apiClient = new ApiClient({
  // Optional: baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

/* ======================================
 * Default interceptors
 * ====================================== */
apiClient.addRequestInterceptor(async (config) => {
  tokenManager.init();

  const inFlight = tokenManager.getRefreshInFlight();
  if (inFlight) await inFlight;

  if (tokenManager.isExpiringSoon() && getRefreshToken()) {
    await refreshAuthToken();
  }

  const headers = new Headers(config.headers as HeadersInit);

  const access = getAuthToken();
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const method = (config.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = await getCSRFToken();
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }

  headers.set("X-Requested-With", "XMLHttpRequest");
  if (isClient() && "randomUUID" in crypto) {
    headers.set("X-Request-ID", (crypto as Crypto).randomUUID());
  }

  return { ...config, headers };
});

apiClient.addResponseInterceptor(async (res) => {
  const url = res.url.split("?")[0];
  logger.debug(`API ${res.status} ${url}`);
  return res;
});

apiClient.addErrorInterceptor(async (error) => {
  if (!(error instanceof ApiError)) return error;

  if (error.status === 401) {
    const hasRT = !!getRefreshToken();
    if (!hasRT) {
      clearAuthToken();
      if (isClient()) window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      return error;
    }

    const newToken = await refreshAuthToken();
    if (!newToken) {
      clearAuthToken();
      if (isClient()) window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
  }

  return error;
});

/* ======================================
 * Public API (giữ tên export để không vỡ import cũ)
 * ====================================== */
// Note: Use <T,> to avoid JSX parsing issues in environments that parse TS as TSX
export const api = <T = unknown,>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> => apiClient.request<T>(input, init);

// Named exports for advanced usage
export { ApiError } from "./errorHandling";
export {
  tokenManager,
  setAuthToken,
  getAuthToken,
  getRefreshToken,
  isTokenExpiringSoon,
  refreshToken,
  getTokenStatus,
  clearAuthToken,
} from "./tokenManager";

