"use client";

import { makeStore } from "@/core/state/makeStore";

// UI State interface for Stories feature
interface StoriesUIState {
  // Filter state
  search: string;
  lessonId: string | null;
  storyType: string;

  // Selection state
  selectedId: string | null;

  // Actions
  setSearch: (search: string) => void;
  setLessonId: (lessonId: string | null) => void;
  setStoryType: (storyType: string) => void;
  setSelectedId: (id: string | null) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  search: "",
  lessonId: null,
  storyType: "",
  selectedId: null,
};

// Create the store with devtools and no persistence by default
export const useStoriesUI = makeStore<StoriesUIState>(
  (set) => ({
    ...initialState,

    // Filter actions
    setSearch: (search: string) => set({ search }),
    setLessonId: (lessonId: string | null) => set({ lessonId }),
    setStoryType: (storyType: string) => set({ storyType }),

    // Selection actions
    setSelectedId: (selectedId: string | null) => set({ selectedId }),

    // Reset action
    reset: () => set(initialState),
  }),
  {
    name: "stories-ui",
    persist: false, // UI state typically shouldn't persist across sessions
  }
);

// Individual selectors
export const useStoriesSearch = () => useStoriesUI((state) => state.search);
export const useStoriesLessonId = () => useStoriesUI((state) => state.lessonId);
export const useStoriesStoryType = () =>
  useStoriesUI((state) => state.storyType);
export const useStoriesSelectedId = () =>
  useStoriesUI((state) => state.selectedId);

// Action setters
export const useStoriesSetSearch = () =>
  useStoriesUI((state) => state.setSearch);
export const useStoriesSetLessonId = () =>
  useStoriesUI((state) => state.setLessonId);
export const useStoriesSetStoryType = () =>
  useStoriesUI((state) => state.setStoryType);
export const useStoriesSetSelectedId = () =>
  useStoriesUI((state) => state.setSelectedId);
export const useStoriesReset = () => useStoriesUI((state) => state.reset);

// Convenience hooks - combine individual hooks
export const useStoriesFilters = () => ({
  search: useStoriesSearch(),
  lessonId: useStoriesLessonId(),
  storyType: useStoriesStoryType(),
});

export const useStoriesFilterActions = () => ({
  setSearch: useStoriesSetSearch(),
  setLessonId: useStoriesSetLessonId(),
  setStoryType: useStoriesSetStoryType(),
  reset: useStoriesReset(),
});

export const useStoriesSelection = () => ({
  selectedId: useStoriesSelectedId(),
  setSelectedId: useStoriesSetSelectedId(),
});
