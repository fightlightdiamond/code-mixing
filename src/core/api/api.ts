import { ApiError } from "./errorHandling";
import { tokenManager } from "./tokenManager";

/* ======================================
 * Types
 * ====================================== */
export interface ApiRequestConfig extends RequestInit {
  url: string;
  timeout?: number;
  retries?: number;
}

export type RequestInterceptor = (
  config: ApiRequestConfig
) => ApiRequestConfig | Promise<ApiRequestConfig>;

export type ResponseInterceptor = (
  response: Response
) => Response | Promise<Response>;

export type ErrorInterceptor = (
  error: Error
) => Error | Promise<Error>;

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
    return url;
  }

  async request<T = unknown>(input: RequestInfo, init?: RequestInit): Promise<T> {
    try {
      let config: ApiRequestConfig = {
        ...init,
        url: this.resolveURL(input),
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
        credentials: "include",
        signal: init?.signal,
      };

      for (const i of this.requestInterceptors) {
        config = await i(config);
      }

      let response = await fetch(config.url, config);

      for (const i of this.responseInterceptors) {
        response = await i(response);
      }

      const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");
      const body: unknown = isJson
        ? await response.json().catch(() => undefined)
        : undefined;

      if (!response.ok) {
        type ErrorBody = {
          message?: string;
          error?: string;
          [k: string]: unknown;
        };
        const obj =
          typeof body === "object" && body !== null
            ? (body as ErrorBody)
            : undefined;
        const message = obj?.message || obj?.error || `HTTP ${response.status}`;
        throw new ApiError(message, response.status, body, `HTTP_${response.status}`);
      }

      return (body as T) ?? ((await response.text()) as unknown as T);
    } catch (err) {
      let e = err as Error;
      for (const i of this.errorInterceptors) {
        e = await i(e);
      }
      throw e;
    }
  }
}

export const apiClient = new ApiClient();

/* ======================================
 * Default interceptors
 * ====================================== */
apiClient.addRequestInterceptor(async (config) => {
  const headers = new Headers(config.headers as HeadersInit);

  // attach CSRF for non-GET
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
  if (process.env.NODE_ENV === "development") {
    console.log(`API ${res.status} ${res.url}`);
  }
  return res;
});

apiClient.addErrorInterceptor(async (error) => {
  if (error instanceof ApiError && error.status === 401 && isClient()) {
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  }
  return error;
});

/* ======================================
 * Public API
 * ====================================== */
export const api = <T = unknown,>(input: RequestInfo, init?: RequestInit): Promise<T> =>
  apiClient.request<T>(input, init);

export const setAuthToken = (): void => {
  // Tokens are handled via HttpOnly cookies on the server
};

export const getAuthToken = (): string | null => tokenManager.getAccessTokenSync();
export const getRefreshToken = (): string | null => tokenManager.getRefreshTokenSync();
export const isTokenExpiringSoon = (): boolean => tokenManager.isExpiringSoon();
export const refreshToken = (): Promise<string | null> => tokenManager.refresh();

export const getCSRFTokenForClient = (): Promise<string | null> => getCSRFToken();

export const getTokenStatus = (): {
  hasToken: boolean;
  isExpiringSoon: boolean;
  expiresAt: number | null;
  refreshInFlight: boolean;
} => {
  const access = tokenManager.getAccessTokenSync();
  const refresh = tokenManager.getRefreshTokenSync();
  const expiring = tokenManager.isExpiringSoon();
  return {
    hasToken: !!access || !!refresh,
    isExpiringSoon: expiring,
    expiresAt: null,
    refreshInFlight: tokenManager.getRefreshInFlight() !== null,
  };
};

export { ApiError } from "./errorHandling";

