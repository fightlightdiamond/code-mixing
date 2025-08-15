import { ApiError } from "./errorHandling";
import {
  tokenManager,
  setAuthToken,
  getAuthToken,
  refreshToken,
  getRefreshToken,
  isTokenExpiringSoon,
  getExpiresAt,
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
 * CSRF (simple cache)
 * ====================================== */
let csrfToken: string | null = null;

export const getCSRFToken = async (): Promise<string | null> => {
  if (csrfToken) return csrfToken;
  try {
    const res = await fetch("/api/csrf", { credentials: "same-origin" });
    if (!res.ok) return null;
    const data = (await res.json()) as { csrfToken?: string };
    csrfToken = data?.csrfToken ?? null;
    return csrfToken;
  } catch {
    return null;
  }
};

export const clearCSRFToken = () => {
  csrfToken = null;
};

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
    const { timeout, retries = 0, ...rest } = init ?? {};
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= retries) {
      const controller = new AbortController();
      const timer = timeout ? setTimeout(() => controller.abort(), timeout) : undefined;

      try {
        // track the listener so we can clean it up
        let abortListener: (() => void) | undefined;
        const externalSignal = rest.signal;
        if (externalSignal) {
          if (externalSignal.aborted) {
            controller.abort();
          } else {
            abortListener = () => controller.abort();
            externalSignal.addEventListener("abort", abortListener, { once: true });
          }
        }
      } finally {
        if (timer) clearTimeout(timer);
        if (abortListener && externalSignal) {
          externalSignal.removeEventListener("abort", abortListener);
        }
      }

        let config: ApiRequestConfig & { url: string } = {
          ...rest,
          url: this.resolveURL(input),
          headers: {
            "Content-Type": "application/json",
            ...(rest.headers || {}),
          },
          signal: controller.signal,
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
        lastError = err as Error;
        if (attempt < retries) {
          const backoff = 2 ** attempt * 100;
          await new Promise((r) => setTimeout(r, backoff));
          attempt++;
          continue;
        }

        let e = lastError;
        for (const i of this.errorInterceptors) {
          e = await i(e);
        }
        throw e;
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    // Should never reach here
    throw lastError!;
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
  if (process.env.NODE_ENV === "development") {
    console.log(`API ${res.status} ${res.url}`);
  }
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
export const api = <T = unknown,>(input: RequestInfo, init?: ApiRequestConfig): Promise<T> =>
    apiClient.request<T>(input, init);

export { setAuthToken, getAuthToken, getRefreshToken, isTokenExpiringSoon, refreshToken };

export const getCSRFTokenForClient = (): Promise<string | null> => getCSRFToken();

export const getTokenStatus = (): {
  hasToken: boolean;
  isExpiringSoon: boolean;
  expiresAt: number | null;
  refreshInFlight: boolean;
} => {
  const access = getAuthToken();
  const refresh = getRefreshToken();
  const expiring = isTokenExpiringSoon();
  return {
    hasToken: !!access || !!refresh,
    isExpiringSoon: expiring,
    expiresAt: getExpiresAt(),
    refreshInFlight: tokenManager.getRefreshInFlight() !== null,
  };
};

// Named exports for advanced usage
export { ApiError } from "./errorHandling";
