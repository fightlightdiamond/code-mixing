"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "./get-query-client";
import { dev, FEATURES } from "@/core/api";
import { AuthProvider } from "@/contexts/AuthContext";
import { Suspense } from "react";

// Development panel component
function DevPanel() {
  // Disable dev panel for now to avoid errors
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999,
        fontFamily: 'monospace',
      }}
    >
      <div style={{ cursor: 'pointer' }}>
        🚀 Dev Mode
      </div>
    </div>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}

        {/* Enhanced DevTools with custom configuration */}
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          toggleButtonProps={{
            style: {
              fontSize: '12px',
              padding: '4px 8px',
              background: '#1f2937',
              color: '#f3f4f6',
              border: 'none',
              borderRadius: '4px',
            }
          }}
          panelProps={{
            style: {
              fontSize: '13px',
            }
          }}
        />

        {/* Custom development panel */}
        <Suspense fallback={null}>
          <DevPanel />
        </Suspense>
      </AuthProvider>
    </QueryClientProvider>
  );
}
