"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { setAuthToken, getAuthToken, refreshToken } from "@/core/api/tokenManager";
import { clearCSRFToken } from "@/core/api/csrf";
import logger from "@/lib/logger";

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "coach" | "admin";
  tenantId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (
    name: string,
    email: string,
    password: string,
    role?: "student" | "coach"
  ) => Promise<{ success: boolean; error?: string }>;
  refreshUserToken: () => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Define logout function first
  const logout = useCallback(() => {
    setAuthToken(null);
    clearCSRFToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  // Handle auth events
  useEffect(() => {
    const handleUnauthorized = () => {
      logger.info("Unauthorized event received - logging out");
      // Only logout if not already on login page
      if (window.location.pathname !== "/login") {
        logout();
      }
    };

    const handleTokenRefreshFailed = () => {
      logger.info("Token refresh failed - logging out");
      // Only logout if not already on login page
      if (window.location.pathname !== "/login") {
        logout();
      }
    };

    const handleLogout = () => {
      logger.info("Logout event received");
      logout();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    window.addEventListener(
      "auth:token-refresh-failed",
      handleTokenRefreshFailed
    );
    window.addEventListener("auth:logout", handleLogout);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener(
        "auth:token-refresh-failed",
        handleTokenRefreshFailed
      );
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, [logout]);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = useCallback(async () => {
    logger.debug("AuthContext: checkAuth started");
    try {
      const token = getAuthToken();
      logger.debug("AuthContext: token check", { hasToken: !!token });

      if (!token) {
        logger.debug("AuthContext: No token, setting isLoading = false");
        setIsLoading(false);
        return;
      }

      logger.debug("AuthContext: Verifying token with /api/auth/me");
      // Verify token with API
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      logger.debug("AuthContext: API response status", { status: response.status });
      
      if (response.ok) {
        const apiResponse = await response.json();
        logger.debug("AuthContext: API response received");

        // Extract user data from response.data
        const userData = apiResponse.data || apiResponse;
        logger.debug("AuthContext: Extracted user data", { userId: userData?.id });
        setUser(userData);
      } else {
        logger.info("AuthContext: Token invalid, clearing auth");
        // Token is invalid, remove it
        setAuthToken(null);
        setUser(null);
      }
    } catch (error) {
      logger.error("AuthContext: Auth check failed", undefined, error as Error);
      setAuthToken(null);
      setUser(null);
    } finally {
      logger.debug("AuthContext: Setting isLoading = false");
      setIsLoading(false);
    }
  }, []);

  const refreshUserToken = useCallback(async (): Promise<boolean> => {
    try {
      const newToken = await refreshToken();
      if (newToken) {
        // Re-check auth with new token - we'll call checkAuth directly
        return true;
      }
      return false;
    } catch (error) {
      logger.error("Token refresh failed", undefined, error as Error);
      return false;
    }
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens with proper expiry
        setAuthToken(data.accessToken, data.expiresIn, data.refreshToken);
        setUser(data.user);

        // Redirect based on role
        const redirectPath =
          data.user.role === "admin"
            ? "/admin"
            : data.user.role === "coach"
            ? "/coach"
            : "/dashboard";
        router.push(redirectPath);

        return { success: true };
      } else {
        return { success: false, error: data.message || "Login failed" };
      }
    } catch (error) {
      logger.error("Login error", undefined, error as Error);
      return { success: false, error: "Network error. Please try again." };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: "student" | "coach" = "student"
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto login after successful registration
        return await login(email, password);
      } else {
        return { success: false, error: data.message || "Registration failed" };
      }
    } catch (error) {
      logger.error("Registration error", undefined, error as Error);
      return { success: false, error: "Network error. Please try again." };
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    register,
    refreshUserToken,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// HOC for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: ("student" | "coach" | "admin")[]
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!user) {
          router.push("/login");
          return;
        }

        if (allowedRoles && !allowedRoles.includes(user.role)) {
          router.push("/unauthorized");
          return;
        }
      }
    }, [user, isLoading, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return null;
    }

    return <Component {...props} />;
  };
}
