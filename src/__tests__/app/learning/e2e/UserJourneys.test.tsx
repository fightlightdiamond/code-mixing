import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LearningPage from "@/app/learning/page";

// Mock Next.js
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/learning",
}));

// Mock IndexedDB for offline storage
const mockIndexedDB = {
  open: jest.fn().mockReturnValue({
    onsuccess: null,
    onerror: null,
    result: {
      transaction: jest.fn().mockReturnValue({
        objectStore: jest.fn().mockReturnValue({
          add: jest.fn(),
          get: jest.fn(),
          put: jest.fn(),
          delete: jest.fn(),
        }),
      }),
    },
  }),
};

Object.defineProperty(window, "indexedDB", { value: mockIndexedDB });

// Mock service worker
Object.defineProperty(navigator, "serviceWorker", {
  value: {
    register: jest.fn().mockResolvedValue({
      active: {
        postMessage: jest.fn(),
      },
    }),
    ready: Promise.resolve({
      active: {
        postMessage: jest.fn(),
      },
    }),
  },
  writable: true,
});

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock data
const mockUser = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
};

const mockStories = [
  {
    id: "story-1",
    title: "Beginner Story",
    difficulty: "BEGINNER",
    storyType: "FAIRY_TALE",
    estimatedMinutes: 5,
    wordCount: 100,
    chunks: [
      {
        id: "chunk-1",
        chunkOrder: 1,
        chunkText: "Once upon a time, có một cô gái tên là Alice.",
        type: "chem",
      },
    ],
  },
  {
    id: "story-2",
    title: "Intermediate Story",
    difficulty: "INTERMEDIATE",
    storyType: "ADVENTURE",
    estimatedMinutes: 10,
    wordCount: 200,
    chunks: [
      {
        id: "chunk-2",
        chunkOrder: 1,
        chunkText: "The adventure begins when the hero meets a dragon.",
        type: "chem",
      },
    ],
  },
];

const mockProgress = {
  userId: "user-1",
  storiesRead: 0,
  vocabularyLearned: 0,
  totalTimeSpent: 0,
  currentStreak: 0,
  completionPercentage: 0,
  level: 1,
  experiencePoints: 0,
};

const mockPreferences = {
  embeddingRatio: 30,
  difficultyLevel: "BEGINNER",
  theme: "light",
  topicPreferences: ["FAIRY_TALE"],
  audioEnabled: true,
  autoPlayAudio: false,
  playbackSpeed: 1,
  vocabularyReviewFrequency: "daily",
  dailyGoal: 30,
  notificationsEnabled: true,
};

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("End-to-End User Journeys", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();

    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", { value: mockLocalStorage });
  });

  it("completes a full learning session from story selection to completion", async () => {
    const user = userEvent.setup();

    // Mock API responses for complete flow
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stories: mockStories }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgress,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreferences,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStories[0],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "exercise-1",
            type: "fill_blank",
            question: "Complete: Once upon a ___",
            correctAnswer: "time",
          },
        ],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockProgress,
          storiesRead: 1,
          experiencePoints: 100,
        }),
      } as Response);

    render(
      <TestWrapper>
        <LearningPage />
      </TestWrapper>
    );

    // 1. Story Selection Phase
    await waitFor(() => {
      expect(screen.getByText("Beginner Story")).toBeInTheDocument();
    });

    // Filter by difficulty
    const beginnerFilter = screen.getByText("BEGINNER");
    await user.click(beginnerFilter);

    // Select a story
    const storyCard = screen.getByText("Beginner Story");
    await user.click(storyCard);

    // 2. Story Reading Phase
    await waitFor(() => {
      expect(
        screen.getByText("Once upon a time, có một cô gái tên là Alice.")
      ).toBeInTheDocument();
    });

    // Interact with embedded words
    const timeWord = screen.getByRole("button", { name: /time/i });
    await user.click(timeWord);

    // Vocabulary popup should appear
    await waitFor(() => {
      expect(screen.getByText("time")).toBeInTheDocument();
    });

    // Close popup
    const closeButton = screen.getByTitle("Đóng");
    await user.click(closeButton);

    // 3. Audio Interaction Phase
    const playButton = screen.getByRole("button", { name: /play/i });
    await user.click(playButton);

    // Test audio controls
    const speedButton = screen.getByText("1x");
    await user.click(speedButton);
    expect(screen.getByText("1.5x")).toBeInTheDocument();

    // Add bookmark
    const bookmarkButton = screen.getByTitle("Thêm bookmark");
    await user.click(bookmarkButton);

    // 4. Exercise Phase
    await waitFor(() => {
      expect(screen.getByText("Exercise 1 of 1")).toBeInTheDocument();
    });

    // Complete exercise
    const exerciseInput = screen.getByPlaceholderText(
      "Type your answer here..."
    );
    await user.type(exerciseInput, "time");

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    // Verify correct answer
    await waitFor(() => {
      expect(screen.getByText("Correct!")).toBeInTheDocument();
    });

    // Finish exercises
    const finishButton = screen.getByText("Finish");
    await user.click(finishButton);

    // 5. Completion Phase
    await waitFor(() => {
      expect(screen.getByText("Exercises Completed!")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    // Verify all API calls were made
    expect(mockFetch).toHaveBeenCalledTimes(7);
  });

  it("tracks progress across multiple learning sessions", async () => {
    const user = userEvent.setup();

    // Session 1: Complete first story
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stories: mockStories }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgress,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStories[0],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockProgress,
          storiesRead: 1,
          vocabularyLearned: 5,
          experiencePoints: 100,
        }),
      } as Response);

    const { rerender } = render(
      <TestWrapper>
        <LearningPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Beginner Story")).toBeInTheDocument();
    });

    // Complete first story (simplified)
    const storyCard = screen.getByText("Beginner Story");
    await user.click(storyCard);

    // Session 2: Start second story with updated progress
    const updatedProgress = {
      ...mockProgress,
      storiesRead: 1,
      vocabularyLearned: 5,
      experiencePoints: 100,
      level: 2,
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stories: mockStories }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedProgress,
      } as Response);

    rerender(
      <TestWrapper>
        <LearningPage />
      </TestWrapper>
    );

    // Should show updated progress
    await waitFor(() => {
      expect(screen.getByText("Level 2")).toBeInTheDocument();
      expect(screen.getByText("1 stories completed")).toBeInTheDocument();
    });
  });

  it("handles settings changes and their effects on learning experience", async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stories: mockStories }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgress,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreferences,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStories[0],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

    render(
      <TestWrapper>
        <LearningPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Beginner Story")).toBeInTheDocument();
    });

    // Open settings
    const settingsButton = screen.getByRole("button", { name: /settings/i });
    await user.click(settingsButton);

    // Change embedding ratio
    const embeddingSlider = screen.getByRole("slider", {
      name: /embedding ratio/i,
    });
    fireEvent.change(embeddingSlider, { target: { value: "40" } });

    // Change difficulty level
    const difficultySelect = screen.getByRole("combobox", {
      name: /difficulty/i,
    });
    await user.selectOptions(difficultySelect, "INTERMEDIATE");

    // Enable dark theme
    const themeToggle = screen.getByRole("switch", { name: /dark theme/i });
    await user.click(themeToggle);

    // Save settings
    const saveButton = screen.getByText("Save Settings");
    await user.click(saveButton);

    // Verify settings API call
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/learning/preferences"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("40"), // embedding ratio
      })
    );

    // Select story and verify settings are applied
    const storyCard = screen.getByText("Beginner Story");
    await user.click(storyCard);

    await waitFor(() => {
      expect(screen.getByText("40% (tùy chỉnh)")).toBeInTheDocument();
    });

    // Verify dark theme is applied
    expect(document.body).toHaveClass("dark");
  });

  it("handles offline learning and synchronization scenarios", async () => {
    const user = userEvent.setup();

    // Start online
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stories: mockStories }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStories[0],
      } as Response);

    render(
      <TestWrapper>
        <LearningPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Beginner Story")).toBeInTheDocument();
    });

    // Download story for offline use
    const downloadButton = screen.getByRole("button", { name: /download/i });
    await user.click(downloadButton);

    // Go offline
    Object.defineProperty(navigator, "onLine", {
      value: false,
    });

    // Trigger offline event
    fireEvent(window, new Event("offline"));

    // Should show offline indicator
    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });

    // Should still be able to access downloaded content
    const storyCard = screen.getByText("Beginner Story");
    await user.click(storyCard);

    await waitFor(() => {
      expect(
        screen.getByText("Once upon a time, có một cô gái tên là Alice.")
      ).toBeInTheDocument();
    });

    // Complete some learning activities offline
    const timeWord = screen.getByRole("button", { name: /time/i });
    await user.click(timeWord);

    // Mark word as learned (should be stored locally)
    const learningButton = screen.getByText("Đang học");
    await user.click(learningButton);

    // Go back online
    Object.defineProperty(navigator, "onLine", {
      value: true,
    });

    // Mock sync API call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ synced: true }),
    } as Response);

    // Trigger online event
    fireEvent(window, new Event("online"));

    // Should show sync in progress
    await waitFor(() => {
      expect(screen.getByText(/syncing/i)).toBeInTheDocument();
    });

    // Should complete sync
    await waitFor(() => {
      expect(screen.getByText(/synced/i)).toBeInTheDocument();
    });

    // Verify sync API call
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/learning/sync"),
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("handles vocabulary review and spaced repetition", async () => {
    const user = userEvent.setup();

    const vocabularyProgress = [
      {
        word: "time",
        status: "reviewing",
        nextReview: new Date(Date.now() - 86400000), // Due for review
        encounters: 3,
        masteryLevel: 60,
      },
      {
        word: "story",
        status: "new",
        nextReview: new Date(),
        encounters: 1,
        masteryLevel: 20,
      },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stories: mockStories }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgress,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => vocabularyProgress,
      } as Response);

    render(
      <TestWrapper>
        <LearningPage />
      </TestWrapper>
    );

    // Navigate to vocabulary review
    const reviewButton = screen.getByText("Review Vocabulary");
    await user.click(reviewButton);

    // Should show words due for review
    await waitFor(() => {
      expect(screen.getByText("time")).toBeInTheDocument();
      expect(screen.getByText("Due for review")).toBeInTheDocument();
    });

    // Start review session
    const startReviewButton = screen.getByText("Start Review");
    await user.click(startReviewButton);

    // Complete review for "time"
    const reviewInput = screen.getByPlaceholderText("Enter meaning...");
    await user.type(reviewInput, "thời gian");

    const checkButton = screen.getByText("Check");
    await user.click(checkButton);

    // Should show feedback
    await waitFor(() => {
      expect(screen.getByText("Correct!")).toBeInTheDocument();
    });

    // Continue to next word
    const nextButton = screen.getByText("Next");
    await user.click(nextButton);

    // Should update vocabulary progress
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/learning/vocabulary/progress"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("time"),
      })
    );
  });

  it("handles level progression and achievement unlocking", async () => {
    const user = userEvent.setup();

    const progressNearLevelUp = {
      ...mockProgress,
      level: 1,
      experiencePoints: 950, // Close to level 2 (1000 XP)
      storiesRead: 9,
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stories: mockStories }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => progressNearLevelUp,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStories[0],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: "exercise-1",
            type: "fill_blank",
            question: "Complete: Once upon a ___",
            correctAnswer: "time",
          },
        ],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...progressNearLevelUp,
          level: 2,
          experiencePoints: 1050,
          storiesRead: 10,
          achievements: [
            {
              id: "level-2",
              title: "Level Up!",
              description: "Reached level 2",
              category: "level",
              unlockedAt: new Date(),
            },
            {
              id: "ten-stories",
              title: "Story Master",
              description: "Completed 10 stories",
              category: "reading",
              unlockedAt: new Date(),
            },
          ],
        }),
      } as Response);

    render(
      <TestWrapper>
        <LearningPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Level 1")).toBeInTheDocument();
      expect(screen.getByText("950 / 1000 XP")).toBeInTheDocument();
    });

    // Complete a story to trigger level up
    const storyCard = screen.getByText("Beginner Story");
    await user.click(storyCard);

    // Complete exercise
    await waitFor(() => {
      expect(screen.getByText("Exercise 1 of 1")).toBeInTheDocument();
    });

    const exerciseInput = screen.getByPlaceholderText(
      "Type your answer here..."
    );
    await user.type(exerciseInput, "time");
    await user.click(screen.getByText("Submit"));
    await user.click(screen.getByText("Finish"));

    // Should show level up animation and achievements
    await waitFor(() => {
      expect(screen.getByText("Level Up!")).toBeInTheDocument();
      expect(screen.getByText("Reached level 2")).toBeInTheDocument();
      expect(screen.getByText("Story Master")).toBeInTheDocument();
    });

    // Should unlock new content
    await waitFor(() => {
      expect(screen.getByText("New stories unlocked!")).toBeInTheDocument();
    });
  });
});
