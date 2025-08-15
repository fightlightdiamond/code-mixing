import { ApiError } from "./errorHandling";

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

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
  tokenType: "Bearer";
}

/* ======================================
 * Utils
 * ====================================== */
const isClient = () => typeof window !== "undefined";
const now = () => Date.now();

/* ======================================
 * TokenStorage (localStorage only, SSR-safe)
 * ====================================== */
const TOKEN_KEY = "auth_token_data";

const TokenStorage = {
  load(): TokenData | null {
    if (!isClient()) return null;
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    try {
      const json = typeof atob === "function" ? atob(raw) : raw;
      return JSON.parse(json) as TokenData;
    } catch {
      return null;
    }
  },
  save(data: TokenData | null) {
    if (!isClient()) return;
    if (!data) {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    const json = JSON.stringify(data);
    const encoded = typeof btoa === "function" ? btoa(json) : json;
    localStorage.setItem(TOKEN_KEY, encoded);
  },
  clear() {
    if (!isClient()) return;
    localStorage.removeItem(TOKEN_KEY);
  },
};

/* ======================================
 * TokenManager (singleton)
 * ====================================== */
class TokenManager {
  private static _instance: TokenManager | null = null;
  static getInstance(): TokenManager {
    if (!this._instance) this._instance = new TokenManager();
    return this._instance;
  }

  private cached: TokenData | null = null;
  private _initialized = false;

  private refreshing = false;
  private _refreshPromise: Promise<string | null> | null = null;
  private readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  /** Expose refresh in-flight safely (read-only) */
  getRefreshInFlight(): Promise<string | null> | null {
    return this._refreshPromise;
  }

  /** Sync init to avoid race */
  init(): void {
    if (this._initialized) return;
    if (isClient()) {
      this.cached = TokenStorage.load();
    }
    this._initialized = true;
  }

  isInitialized(): boolean {
    return this._initialized;
  }

  set(accessToken: string, expiresInSec = 3600, refreshToken?: string) {
    this.init();
    this.cached = {
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresAt: now() + expiresInSec * 1000,
    };
    TokenStorage.save(this.cached);
  }

  clear() {
    this.cached = null;
    TokenStorage.clear();
  }

  getAccessTokenSync(): string | null {
    this.init();
    if (!this.cached) return null;
    if (now() >= this.cached.expiresAt) {
      this.clear();
      return null;
    }
    return this.cached.accessToken;
  }

  getRefreshTokenSync(): string | null {
    this.init();
    return this.cached?.refreshToken ?? null;
  }

  getExpiresAtSync(): number | null {
    this.init();
    return this.cached?.expiresAt ?? null;
  }

  isExpiringSoon(): boolean {
    this.init();
    if (!this.cached) return false;
    return now() >= this.cached.expiresAt - this.REFRESH_THRESHOLD;
  }

  /** Single-flight refresh. Caller supplies actual refresh fetcher */
  async refresh(
      fetcher: (refreshToken: string) => Promise<{
        accessToken: string;
        expiresIn: number;
        refreshToken?: string;
      } | null>
  ): Promise<string | null> {
    if (this.refreshing && this._refreshPromise) return this._refreshPromise;

    const rt = this.getRefreshTokenSync();
    if (!rt) return null;

    this.refreshing = true;
    this._refreshPromise = (async () => {
      try {
        const result = await fetcher(rt);
        if (!result) {
          this.clear();
          if (isClient()) {
            window.dispatchEvent(new CustomEvent("auth:token-refresh-failed"));
          }
          return null;
        }
        this.set(result.accessToken, result.expiresIn, result.refreshToken);
        return result.accessToken;
      } catch {
        this.clear();
        if (isClient()) {
          window.dispatchEvent(new CustomEvent("auth:token-refresh-failed"));
        }
        return null;
      } finally {
        this.refreshing = false;
        this._refreshPromise = null;
      }
    })();

    return this._refreshPromise;
  }
}

export const tokenManager = TokenManager.getInstance();

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
        const externalSignal = rest.signal;
        if (externalSignal) {
          if (externalSignal.aborted) controller.abort();
          else externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
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
 * Refresh fetcher (customize theo API của bạn)
 * ====================================== */
const performRefresh = async (refreshToken: string) => {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    accessToken: string;
    expiresIn?: number;
    refreshToken?: string;
  };
  return {
    accessToken: data.accessToken,
    expiresIn: data.expiresIn ?? 3600,
    refreshToken: data.refreshToken,
  };
};

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
  if (tokenManager.isExpiringSoon() && tokenManager.getRefreshTokenSync()) {
    await tokenManager.refresh(performRefresh);
  }

  const headers = new Headers(config.headers as HeadersInit);

  // attach access token
  const access = tokenManager.getAccessTokenSync();
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
    const hasRT = !!tokenManager.getRefreshTokenSync();
    if (!hasRT) {
      tokenManager.clear();
      if (isClient()) window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      return error;
    }

    const newToken = await tokenManager.refresh(performRefresh);
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

export const setAuthToken = (
    token: string | null,
    expiresIn?: number,
    refreshToken?: string
): void => {
  if (token) tokenManager.set(token, expiresIn, refreshToken);
  else tokenManager.clear();
};

export const getAuthToken = (): string | null => tokenManager.getAccessTokenSync();
export const getRefreshToken = (): string | null => tokenManager.getRefreshTokenSync();
export const isTokenExpiringSoon = (): boolean => tokenManager.isExpiringSoon();

export const refreshToken = (): Promise<string | null> => tokenManager.refresh(performRefresh);

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
    expiresAt: tokenManager.getExpiresAtSync(),
    refreshInFlight: tokenManager.getRefreshInFlight() !== null,
  };
};

// Named exports for advanced usage
export { ApiError } from "./errorHandling";