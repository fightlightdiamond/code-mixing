import { cookies } from "next/headers";
import type { RefreshTokenResponse } from "./types";

/* ======================================
 * Cookie-based TokenManager
 * ====================================== */
const ACCESS_COOKIE = "auth_token";
const REFRESH_COOKIE = "refresh_token";

const isServer = () => typeof window === "undefined";

const readCookie = (name: string): string | null => {
  if (!isServer()) return null;
  try {
    return cookies().get(name)?.value ?? null;
  } catch {
    return null;
  }
};

class TokenManager {
  /** Initialization is unnecessary for cookie-based storage */
  init(): void {}

  isInitialized(): boolean {
    return true;
  }

  /** Tokens are managed via HttpOnly cookies on the server */
  set(): void {}

  clear(): void {}

  getAccessTokenSync(): string | null {
    return readCookie(ACCESS_COOKIE);
  }

  getRefreshTokenSync(): string | null {
    return readCookie(REFRESH_COOKIE);
  }

  isExpiringSoon(): boolean {
    return false;
  }

  getRefreshInFlight(): Promise<string | null> | null {
    return null;
  }

  async refresh(
    _fetcher?: (refreshToken: string) => Promise<RefreshTokenResponse | null>
  ): Promise<string | null> {
    return null;
  }
}

export const tokenManager = new TokenManager();

