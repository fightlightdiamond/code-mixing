"use client";

import { makeStore, shallow } from "@/core/state/makeStore";

// UI State interface for Lessons feature
interface LessonsUIState {
  // Filter and pagination state
  search: string;
  level: string;

  // Modal and selection state
  selectedId: number | null;

  // Actions
  setSearch: (search: string) => void;
  setLevel: (level: string) => void;
  setSelectedId: (id: number | null) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  search: "",
  level: "",
  selectedId: null,
};

// Create the store
export const useLessonsUI = makeStore<LessonsUIState>(
  (set, get) => ({
    ...initialState,

    // Filter actions
    setSearch: (search: string) => set({ search }),
    setLevel: (level: string) => set({ level }),

    // Selection actions
    setSelectedId: (selectedId: number | null) => set({ selectedId }),

    // Reset action
    reset: () => set(initialState),
  }),
  {
    name: "lessons-ui",
    persist: false,
  }
);

// Simple selectors
export const useLessonsFilters = () =>
  useLessonsUI(
    (state) => ({
      search: state.search,
      level: state.level,
    }),
    shallow
  );

export const useLessonsFilterActions = () =>
  useLessonsUI(
    (state) => ({
      setSearch: state.setSearch,
      setLevel: state.setLevel,
      reset: state.reset,
    }),
    shallow
  );

export const useLessonsSelection = () =>
  useLessonsUI(
    (state) => ({
      selectedId: state.selectedId,
      setSelectedId: state.setSelectedId,
    }),
    shallow
  );
