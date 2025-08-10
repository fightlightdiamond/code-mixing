"use client";
import { makeStore } from "@/core/state/makeStore";
import type { CASLRule } from "@/types/api";

// Define proper types for auth state
interface AuthUser {
    id: string;
    roles: string[];
    tenantId?: string;
    email?: string;
    name?: string;
}

interface AuthPayload {
    user: AuthUser | null;
    rules: CASLRule[];
}

interface AuthState {
    user: AuthUser | null;
    rules: CASLRule[] | null;
    loading: boolean;
    setAuth: (payload: AuthPayload) => void;
    setLoading: (loading: boolean) => void;
    clear: () => void;
}

export const useAuth = makeStore<AuthState>(
    (set) => ({
        user: null,
        rules: null,
        loading: true, // mặc định true cho tới khi load xong
        setAuth: (payload) =>
            set({ user: payload.user, rules: payload.rules, loading: false }),
        setLoading: (loading) => set({ loading }),
        clear: () => set({ user: null, rules: null, loading: false }),
    }),
    { 
        name: "auth", 
        persist: true,
        partialize: (state) => ({ 
            user: state.user, 
            rules: state.rules 
        })
    }
);
