"use client";

import { makeStore } from "@/core/state/makeStore";

// UI State interface for Lessons feature
interface LessonsUIState {
  // Filter and pagination state
  search: string;
  status: string;

  // Modal and selection state
  selectedId: string | null;

  // Actions
  setSearch: (search: string) => void;
  setStatus: (status: string) => void;
  setSelectedId: (id: string | null) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  search: "",
  status: "",
  selectedId: null,
};

// Create the store
export const useLessonsUI = makeStore<LessonsUIState>(
  (set) => ({
    ...initialState,

    // Filter actions
    setSearch: (search: string) => set({ search }),
    setStatus: (status: string) => set({ status }),

    // Selection actions
    setSelectedId: (selectedId: string | null) => set({ selectedId }),

    // Reset action
    reset: () => set(initialState),
  }),
  {
    name: "lessons-ui",
    persist: false,
  }
);

// Simple selectors
export const useLessonsFilters = () => ({
  search: useLessonsUI((state) => state.search),
  status: useLessonsUI((state) => state.status),
});

export const useLessonsFilterActions = () => ({
  setSearch: useLessonsUI((state) => state.setSearch),
  setStatus: useLessonsUI((state) => state.setStatus),
  reset: useLessonsUI((state) => state.reset),
});

export const useLessonsSelection = () => ({
  selectedId: useLessonsUI((state) => state.selectedId),
  setSelectedId: useLessonsUI((state) => state.setSelectedId),
});
