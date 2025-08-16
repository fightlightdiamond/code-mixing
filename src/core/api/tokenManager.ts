"use client";

// Client-side token management using localStorage; avoids server-only APIs.
import type { TokenData, RefreshTokenResponse } from "./types";

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
    fetcher: (refreshToken: string) => Promise<RefreshTokenResponse | null>
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
        this.set(
          result.accessToken,
          result.expiresIn ?? 3600,
          result.refreshToken
        );
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
 * Public helpers
 * ====================================== */

export const setAuthToken = (
  token: string | null,
  expiresInSec?: number,
  refreshToken?: string
): void => {
  if (token) tokenManager.set(token, expiresInSec, refreshToken);
  else tokenManager.clear();
};

export const getAuthToken = (): string | null =>
  tokenManager.getAccessTokenSync();

export const getRefreshToken = (): string | null =>
  tokenManager.getRefreshTokenSync();

export const isTokenExpiringSoon = (): boolean => tokenManager.isExpiringSoon();

export const getExpiresAt = (): number | null => tokenManager.getExpiresAtSync();

const performRefresh = async (
  refreshToken: string
): Promise<RefreshTokenResponse | null> => {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as RefreshTokenResponse;
  return {
    accessToken: data.accessToken,
    expiresIn: data.expiresIn ?? 3600,
    refreshToken: data.refreshToken,
  };
};

export const refreshToken = (): Promise<string | null> =>
  tokenManager.refresh(performRefresh);

export const clearAuthToken = (): void => tokenManager.clear();
