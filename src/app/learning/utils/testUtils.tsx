/**
 * Test utilities for the learning application
 */

import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AccessibilityProvider } from "../contexts/AccessibilityContext";
import type {
  LearningStory,
  Exercise,
  VocabularyData,
} from "../types/learning";

// Mock data for testing
export const mockStory: LearningStory = {
  id: "test-story-1",
  title: "Test Story",
  content: "This is a test story with some English words embedded.",
  difficulty: "beginner",
  estimatedMinutes: 5,
  wordCount: 100,
  chemRatio: 0.2,
  chunks: [
    {
      id: "chunk-1",
      chunkOrder: 1,
      chunkText:
        "Đây là một câu chuyện test với một số từ English được chêm vào.",
      type: "chem",
    },
    {
      id: "chunk-2",
      chunkOrder: 2,
      chunkText: "Câu thứ hai của story này.",
      type: "chem",
    },
  ],
  audioUrl: "/test-audio.mp3",
  lesson: {
    id: "lesson-1",
    title: "Test Lesson",
  },
};

export const mockExercises: Exercise[] = [
  {
    id: "exercise-1",
    type: "fill_blank",
    question: "Fill in the blank: This is a ___ story.",
    correctAnswer: "test",
    options: ["test", "real", "fake", "good"],
  },
  {
    id: "exercise-2",
    type: "multiple_choice",
    question: "What language is embedded in the story?",
    correctAnswer: "English",
    options: ["English", "French", "German", "Spanish"],
  },
];

export const mockVocabularyData: VocabularyData = {
  word: "test",
  meaning: "kiểm tra, thử nghiệm",
  pronunciation: "/test/",
  example: "This is a test sentence.",
  audioUrl: "/test-pronunciation.mp3",
};

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: "small" | "medium" | "large" | "extra-large";
  keyboardNavigation: boolean;
  screenReaderOptimized: boolean;
}

export interface MockAudio extends Partial<HTMLAudioElement> {
  play: jest.Mock<Promise<void>, []>;
  pause: jest.Mock;
  load: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  currentTime: number;
  duration: number;
  paused: boolean;
  ended: boolean;
  volume: number;
  muted: boolean;
  playbackRate: number;
  src: string;
  preload: string;
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  initialAccessibilitySettings?: AccessibilitySettings;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    }),
    initialAccessibilitySettings,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  if (initialAccessibilitySettings) {
    window.localStorage.setItem(
      "accessibility-settings",
      JSON.stringify(initialAccessibilitySettings)
    );
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AccessibilityProvider>{children}</AccessibilityProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock API responses
export const mockApiResponses = {
  stories: {
    list: {
      stories: [mockStory],
      total: 1,
      page: 1,
      limit: 10,
    },
    single: mockStory,
  },
  exercises: {
    list: {
      exercises: mockExercises,
      storyId: "test-story-1",
    },
    submit: {
      success: true,
      score: 85,
      results: [
        { exerciseId: "exercise-1", correct: true, timeSpent: 5000 },
        { exerciseId: "exercise-2", correct: false, timeSpent: 3000 },
      ],
    },
  },
  vocabulary: {
    single: mockVocabularyData,
    progress: {
      word: "test",
      status: "reviewing",
      encounters: 3,
      lastReviewed: new Date().toISOString(),
      nextReview: new Date(Date.now() + 86400000).toISOString(),
      correctAnswers: 2,
      totalAttempts: 3,
      masteryLevel: 67,
    },
  },
  progress: {
    user: {
      storiesRead: 5,
      vocabularyLearned: 50,
      totalTimeSpent: 3600,
      currentStreak: 7,
      level: 2,
      achievements: ["first_story", "vocabulary_master"],
    },
  },
};

// Mock fetch function
export const mockFetch = (
  responses: Record<string, any> = mockApiResponses
) => {
  global.fetch = jest.fn((url: string, options?: RequestInit) => {
    const urlString = url.toString();

    // Stories API
    if (
      urlString.includes("/api/learning/stories") &&
      !urlString.includes("/exercises")
    ) {
      if (urlString.match(/\/api\/learning\/stories\/[^/]+$/)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(responses.stories.single),
        });
      } else {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(responses.stories.list),
        });
      }
    }

    // Exercises API
    if (urlString.includes("/api/learning/exercises")) {
      if (options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(responses.exercises.submit),
        });
      } else {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(responses.exercises.list),
        });
      }
    }

    // Vocabulary API
    if (urlString.includes("/api/learning/vocabulary")) {
      if (urlString.includes("/progress")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(responses.vocabulary.progress),
        });
      } else {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(responses.vocabulary.single),
        });
      }
    }

    // Progress API
    if (urlString.includes("/api/learning/progress")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responses.progress.user),
      });
    }

    // Default response
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Not found" }),
    });
  }) as jest.Mock;
};

// Mock audio elements
export const mockAudioElement = (): MockAudio => {
  const mockAudio: MockAudio = {
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    load: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentTime: 0,
    duration: 100,
    paused: true,
    ended: false,
    volume: 1,
    muted: false,
    playbackRate: 1,
    src: "",
    preload: "metadata",
  };

  (global as unknown as { HTMLAudioElement: { new (): HTMLAudioElement } }).HTMLAudioElement = jest.fn(
    () => mockAudio as unknown as HTMLAudioElement
  );
  return mockAudio;
};

// Mock intersection observer
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  global.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
};

// Mock resize observer
export const mockResizeObserver = () => {
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  });
  global.ResizeObserver = mockResizeObserver;
  return mockResizeObserver;
};

// Mock local storage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  global.localStorage = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    length: 0,
    key: jest.fn(),
  };

  return store;
};

// Mock service worker
export const mockServiceWorker = () => {
  const mockServiceWorker = {
    register: jest.fn(() =>
      Promise.resolve({
        installing: null,
        waiting: null,
        active: null,
        addEventListener: jest.fn(),
        update: jest.fn(() => Promise.resolve()),
      })
    ),
    controller: null,
    ready: Promise.resolve(),
    addEventListener: jest.fn(),
  };

  global.navigator = {
    ...global.navigator,
    serviceWorker: mockServiceWorker,
  };

  return mockServiceWorker;
};

// Test helpers
export const testHelpers = {
  // Wait for async operations
  waitFor: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  // Simulate user typing
  simulateTyping: async (
    element: HTMLElement,
    text: string,
    delay: number = 50
  ) => {
    for (const char of text) {
      element.focus();
      // Simulate keydown, keypress, input, keyup events
      const keydownEvent = new KeyboardEvent("keydown", { key: char });
      const keypressEvent = new KeyboardEvent("keypress", { key: char });
      const inputEvent = new Event("input", { bubbles: true });
      const keyupEvent = new KeyboardEvent("keyup", { key: char });

      element.dispatchEvent(keydownEvent);
      element.dispatchEvent(keypressEvent);
      (element as HTMLInputElement).value += char;
      element.dispatchEvent(inputEvent);
      element.dispatchEvent(keyupEvent);

      await testHelpers.waitFor(delay);
    }
  },

  // Simulate audio playback
  simulateAudioPlayback: (
    audioElement: HTMLAudioElement | MockAudio,
    duration: number = 1000
  ) => {
    audioElement.currentTime = 0;
    audioElement.paused = false;

    const interval = setInterval(() => {
      audioElement.currentTime += 0.1;
      if (audioElement.currentTime >= audioElement.duration) {
        audioElement.paused = true;
        audioElement.ended = true;
        clearInterval(interval);
      }
    }, 100);

    return interval;
  },
};

// Accessibility testing helpers
export const a11yHelpers = {
  // Check if element has proper ARIA attributes
  hasProperAria: (element: HTMLElement) => {
    const requiredAttributes = [
      "aria-label",
      "aria-labelledby",
      "aria-describedby",
    ];
    return requiredAttributes.some((attr) => element.hasAttribute(attr));
  },

  // Check if element is keyboard accessible
  isKeyboardAccessible: (element: HTMLElement) => {
    const tabIndex = element.getAttribute("tabindex");
    return (
      element.tagName === "BUTTON" ||
      element.tagName === "A" ||
      element.tagName === "INPUT" ||
      element.tagName === "SELECT" ||
      element.tagName === "TEXTAREA" ||
      (tabIndex !== null && tabIndex !== "-1")
    );
  },

  // Check color contrast (simplified)
  hasGoodContrast: (element: HTMLElement) => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // This is a simplified check - in real tests you'd use a proper contrast checker
    return color !== backgroundColor;
  },
};

export * from "@testing-library/react";
export { renderWithProviders as render };
