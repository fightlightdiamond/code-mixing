"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import AbilityProvider from "./AbilityProvider";
import { Component, ErrorInfo, ReactNode } from "react";

interface AuthContextBridgeProps {
  children: React.ReactNode;
}

// Error Boundary để catch lỗi trong AbilityProvider
class AuthErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🚨 AuthContextBridge Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            background: "#fee",
            border: "1px solid #f00",
          }}
        >
          <h3>Auth Error</h3>
          <p>Error: {this.state.error?.message}</p>
          <details>
            <summary>Stack Trace</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          {this.props.children}
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AuthContextBridge({
  children,
}: AuthContextBridgeProps) {
  // React Hooks must be called at top level, not in try-catch
  const { user, isLoading, isAuthenticated } = useAuth();

  // Add useEffect to track auth state changes
  React.useEffect(() => {
    console.log("🔄 AuthContextBridge: Auth state changed", {
      hasUser: !!user,
      userRole: user?.role,
      isLoading,
      isAuthenticated,
      timestamp: new Date().toISOString(),
    });
  }, [user, isLoading, isAuthenticated]);

  try {
    console.log("🔗 AuthContextBridge Debug:", {
      hasUser: !!user,
      userRole: user?.role,
      isLoading,
      isAuthenticated,
      userObject: user,
    });

    // Always provide AbilityProvider, even during loading
    // This prevents the "useAbility must be used within an AbilityProvider" error

    // Transform user data để match AbilityProvider interface
    const abilityUser = user
      ? {
          id: user.id,
          roles: user.role ? [user.role] : [],
          tenantId: user.tenantId,
        }
      : null;

    console.log("🎯 AuthContextBridge: Rendering with AbilityProvider", {
      abilityUser,
      isLoading,
      hasUser: !!user,
    });

    return (
      <AuthErrorBoundary>
        <AbilityProvider rules={null} user={abilityUser}>
          {children}
        </AbilityProvider>
      </AuthErrorBoundary>
    );
  } catch (error) {
    console.error("🚨 AuthContextBridge Render Error:", error);
    return (
      <div
        style={{
          padding: "20px",
          background: "#fee",
          border: "1px solid #f00",
        }}
      >
        <h3>AuthContextBridge Render Error</h3>
        <p>Error: {error instanceof Error ? error.message : String(error)}</p>
        {children}
      </div>
    );
  }
}
