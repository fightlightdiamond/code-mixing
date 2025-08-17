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
    /** Aborts the request after the specified milliseconds */
    timeout?: number;
    /** Number of retry attempts for transient failures */
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


  async request<T = unknown>(input: RequestInfo, init?: ApiRequestConfig): Promise<T> {
    try {
      let config: ApiRequestConfig & { url: string } = {
        ...init,
        url: this.resolveURL(input),
        headers,
        signal: init?.signal,
        timeout: init?.timeout,
        retries: init?.retries,
      };

      for (const i of this.requestInterceptors) {
        config = await i(config);
      }

      const retries = config.retries ?? 0;
      let attempt = 0;
      const { url, timeout, signal, retries: _r, ...rest } = config;

      while (true) {
        const controller = new AbortController();
        if (signal) {
          const s = signal as AbortSignal;
          if (s.aborted) controller.abort();
          else s.addEventListener("abort", () => controller.abort(), { once: true });
        }
        const timeoutId =
          typeof timeout === "number"
            ? setTimeout(() => controller.abort(), timeout)
            : undefined;

        try {
          let response = await fetch(url, { ...rest, signal: controller.signal });

          if (timeoutId) clearTimeout(timeoutId);

          for (const i of this.responseInterceptors) {
            response = await i(response);
          }

          const isJson = response.headers.get("content-type")?.includes("application/json");
          const body: unknown = isJson ? await response.json().catch(() => undefined) : undefined;

          if (!response.ok) {
            const shouldRetry =
              attempt < retries && response.status >= 500 && response.status < 600;
            if (shouldRetry) {
              attempt++;
              continue;
            }
            type ErrorBody = { message?: string; error?: string; [k: string]: unknown };
            const obj = (typeof body === "object" && body !== null) ? (body as ErrorBody) : undefined;
            const message = obj?.message || obj?.error || `HTTP ${response.status}`;
            throw new ApiError(message, response.status, body, `HTTP_${response.status}`);
          }

          return (body as T) ?? (await response.text() as unknown as T);
        } catch (err) {
          if (timeoutId) clearTimeout(timeoutId);
          const e = err as Error;
          const isTransient = e.name === "AbortError" || e instanceof TypeError;
          if (attempt < retries && isTransient) {
            attempt++;
            continue;
          }
          throw e;
        }
      }
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
// Note: Use overloads to default text responses to string
export function api(input: RequestInfo, init?: RequestInit): Promise<string>;
export function api<T>(input: RequestInfo, init?: RequestInit): Promise<T>;
export function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    return apiClient.request<T>(input, init);
}

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