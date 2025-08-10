import type { CSRFResponse } from "./types";

/* ======================================
 * CSRF Token Management
 * ====================================== */
let csrfToken: string | null = null;

export const getCSRFToken = async (): Promise<string | null> => {
  if (csrfToken) return csrfToken;
  try {
    const res = await fetch("/api/csrf", { credentials: "same-origin" });
    if (!res.ok) return null;
    const data = (await res.json()) as CSRFResponse;
    csrfToken = data?.csrfToken ?? null;
    return csrfToken;
  } catch {
    return null;
  }
};

export const clearCSRFToken = () => {
  csrfToken = null;
};
