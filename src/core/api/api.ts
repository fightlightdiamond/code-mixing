import { ApiError } from "./errorHandling";
import logger from "@/lib/logger";
import { getCSRFToken } from "./csrf";
import {
  tokenManager,
  setAuthToken,
  getAuthToken,
  getRefreshToken,
  isTokenExpiringSoon,
  refreshToken,
  getTokenStatus,
} from "./tokenManager";
export type { TokenStatus } from "./tokenManager";

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

  async request(input: RequestInfo, init?: RequestInit): Promise<string>;
  async request<T>(input: RequestInfo, init?: RequestInit): Promise<T>;
  async request<T>(input: RequestInfo, init?: RequestInit): Promise<T | string> {
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
        const obj = (typeof body === "object" && body !== null)
          ? (body as ErrorBody)
          : undefined;
        const message = obj?.message || obj?.error || `HTTP ${response.status}`;
        throw new ApiError<ErrorBody | undefined>(
          message,
          response.status,
          obj,
          `HTTP_${response.status}`
        );
      }

      if (isJson) return body as T;
      const text = await response.text();
      return text;
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
  // ensure token loaded (sync)
  tokenManager.init();

  // wait in-flight refresh if any
  const inFlight = tokenManager.getRefreshInFlight();
  if (inFlight) await inFlight;

  // proactive refresh if expiring soon and we have RT
  if (isTokenExpiringSoon() && getRefreshToken()) {
    await refreshToken();
  }

  const headers = new Headers(config.headers as HeadersInit);

  // attach access token
  const access = getAuthToken();
  if (access) headers.set("Authorization", `Bearer ${access}`);

  // attach CSRF for non-GET
  const method = (config.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = await getCSRFToken();
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }

  // tracing & security
  headers.set("X-Requested-With", "XMLHttpRequest");
  if (isClient() && "randomUUID" in crypto) {
    // TS types available if lib "DOM" is enabled
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
      tokenManager.clear();
      if (isClient()) window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      return error;
    }

    const newToken = await refreshToken();
    if (!newToken) {
      tokenManager.clear();
      if (isClient()) window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
  }

  return error;
});

/* ======================================
 * Public API (giữ tên export để không vỡ import cũ)
 * ====================================== */
// Note: Use <T,> to avoid JSX parsing issues in environments that parse TS as TSX
export const api = <T = unknown,>(input: RequestInfo, init?: RequestInit): Promise<T> =>
    apiClient.request<T>(input, init);

export {
  tokenManager,
  setAuthToken,
  getAuthToken,
  getRefreshToken,
  isTokenExpiringSoon,
  refreshToken,
  getTokenStatus,
};

// Named exports for advanced usage
export { ApiError } from "./errorHandling";