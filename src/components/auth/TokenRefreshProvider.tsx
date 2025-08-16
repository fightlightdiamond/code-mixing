"use client";
import { logger } from '@/lib/logger';

import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface TokenRefreshProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that handles automatic token refresh
 * Should be placed inside AuthProvider but outside of other providers
 */
export function TokenRefreshProvider({ children }: TokenRefreshProviderProps) {
  const { isAuthenticated } = useAuth();

  // Set up automatic token refresh
  useTokenRefresh({
    checkInterval: 60000, // Check every minute
    autoRefresh: true,
    onRefreshSuccess: () => {
      logger.info("🔄 Token refreshed successfully");
    },
    onRefreshError: (error) => {
      logger.error("🔄 Token refresh failed:", error);
    },
  });

  // Handle page visibility change to refresh token when page becomes visible
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        logger.info("📱 Page became visible, checking token status...");
        // Just log for now, the main useTokenRefresh hook will handle refresh
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
