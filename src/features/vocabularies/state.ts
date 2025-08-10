"use client";

import { makeStore } from "@/core/state/makeStore";

// UI State interface for Vocabularies feature
interface VocabulariesUIState {
  // Filter state
  search: string;
  level: string;

  // Selection state
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

// Create the store with devtools and no persistence by default
export const useVocabulariesUI = makeStore<VocabulariesUIState>(
  (set) => ({
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
    name: "vocabularies-ui",
    persist: false, // UI state typically shouldn't persist across sessions
  }
);

// Individual selectors
export const useVocabulariesSearch = () =>
  useVocabulariesUI((state) => state.search);
export const useVocabulariesLevel = () =>
  useVocabulariesUI((state) => state.level);
export const useVocabulariesSelectedId = () =>
  useVocabulariesUI((state) => state.selectedId);

// Action setters
export const useVocabulariesSetSearch = () =>
  useVocabulariesUI((state) => state.setSearch);
export const useVocabulariesSetLevel = () =>
  useVocabulariesUI((state) => state.setLevel);
export const useVocabulariesSetSelectedId = () =>
  useVocabulariesUI((state) => state.setSelectedId);
export const useVocabulariesReset = () =>
  useVocabulariesUI((state) => state.reset);

// Convenience hooks - combine individual hooks
export const useVocabulariesFilters = () => ({
  search: useVocabulariesSearch(),
  level: useVocabulariesLevel(),
});

export const useVocabulariesFilterActions = () => ({
  setSearch: useVocabulariesSetSearch(),
  setLevel: useVocabulariesSetLevel(),
  reset: useVocabulariesReset(),
});

export const useVocabulariesSelection = () => ({
  selectedId: useVocabulariesSelectedId(),
  setSelectedId: useVocabulariesSetSelectedId(),
});
