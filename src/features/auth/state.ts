"use client";
import { makeStore } from "@/core/state/makeStore";

type AuthState = {
    user: { id: string; roles: string[]; tenantId?: string } | null;
    rules: any[] | null;
    loading: boolean;
    setAuth: (payload: { user: AuthState["user"]; rules: any[] }) => void;
    setLoading: (loading: boolean) => void;
    clear: () => void;
};

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
