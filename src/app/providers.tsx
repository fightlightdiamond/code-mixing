"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "./get-query-client";
import { AuthProvider } from "@/contexts/AuthContext";
import { Suspense, useEffect, useState } from "react";
import AuthContextBridge from "@/core/auth/AuthContextBridge";
import { TokenRefreshProvider } from "@/components/auth/TokenRefreshProvider";
import { TokenDebugPanel } from "@/components/debug/TokenDebugPanel";
import { tokenManager } from "@/core/api/api";

function DevPanel() {
    if (process.env.NODE_ENV !== "development") return null;
    return (
        <div
            style={{
                position: "fixed",
                top: 10,
                right: 10,
                background: "rgba(0,0,0,0.8)",
                color: "white",
                padding: "8px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                zIndex: 9999,
                fontFamily: "monospace",
            }}
        >
            🚀 Dev Mode
        </div>
    );
}

export default function Providers({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <TokenRefreshProvider>
                    {/* AuthContextBridge sẽ tự động bridge AuthContext với AbilityProvider */}
                    {isClient ? (
                        <AuthContextBridge>
                            {children}
                        </AuthContextBridge>
                    ) : null}
                </TokenRefreshProvider>

                <ReactQueryDevtools initialIsOpen={false} />
                <Suspense fallback={null}>
                    <DevPanel />
                    <TokenDebugPanel />
                </Suspense>
            </AuthProvider>
        </QueryClientProvider>
    );
}
