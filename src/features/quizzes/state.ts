"use client";

import { makeStore } from "@/core/state/makeStore";

// UI State interface for Quizzes feature
interface QuizzesUIState {
  // Filter state
  search: string;
  lessonId: number | null;

  // Modal and selection state
  selectedId: number | null;

  // Actions
  setSearch: (search: string) => void;
  setLessonId: (lessonId: number | null) => void;
  setSelectedId: (id: number | null) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  search: "",
  lessonId: null,
  selectedId: null,
};

// Create the store
export const useQuizzesUI = makeStore<QuizzesUIState>(
  (set) => ({
    ...initialState,

    // Filter actions
    setSearch: (search: string) => set({ search }),
    setLessonId: (lessonId: number | null) => set({ lessonId }),

    // Selection actions
    setSelectedId: (selectedId: number | null) => set({ selectedId }),

    // Reset action
    reset: () => set(initialState),
  }),
  {
    name: "quizzes-ui",
    persist: false,
  }
);

// ✅ Individual selectors - tránh infinite loop
export const useQuizzesSearch = () => useQuizzesUI((state) => state.search);
export const useQuizzesLessonId = () => useQuizzesUI((state) => state.lessonId);
export const useQuizzesSelectedId = () =>
  useQuizzesUI((state) => state.selectedId);

export const useQuizzesSetSearch = () =>
  useQuizzesUI((state) => state.setSearch);
export const useQuizzesSetLessonId = () =>
  useQuizzesUI((state) => state.setLessonId);
export const useQuizzesSetSelectedId = () =>
  useQuizzesUI((state) => state.setSelectedId);
export const useQuizzesReset = () => useQuizzesUI((state) => state.reset);

// ✅ Convenience hooks
export const useQuizzesFilters = () => ({
  search: useQuizzesSearch(),
  lessonId: useQuizzesLessonId(),
});

export const useQuizzesFilterActions = () => ({
  setSearch: useQuizzesSetSearch(),
  setLessonId: useQuizzesSetLessonId(),
  reset: useQuizzesReset(),
});

export const useQuizzesSelection = () => ({
  selectedId: useQuizzesSelectedId(),
  setSelectedId: useQuizzesSetSelectedId(),
});
