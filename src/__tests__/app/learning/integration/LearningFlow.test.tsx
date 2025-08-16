import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LearningPage from "@/app/learning/page";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/learning",
}));

// Mock API calls
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock story data
const mockStoryData = {
  id: "story-1",
  title: "Test Story",
  content: "Test content",
  storyType: "FAIRY_TALE",
  difficulty: "BEGINNER",
  estimatedMinutes: 5,
  wordCount: 100,
  chemRatio: 0.3,
  chunks: [
    {
      id: "chunk-1",
      chunkOrder: 1,
      chunkText: "Xin chào, tôi là một student đang học English.",
      type: "chem",
    },
    {
      id: "chunk-2",
      chunkOrder: 2,
      chunkText: "Đây là một câu bình thường.",
      type: "normal",
    },
  ],
  lesson: {
    id: "lesson-1",
    title: "Test Lesson",
  },
};

const mockExercises = [
  {
    id: "exercise-1",
    type: "fill_blank",
    question: "Complete: I am a ___.",
    correctAnswer: "student",
    vocabulary: ["student", "teacher"],
  },
];

const mockVocabularyData = {
  word: "student",
  meaning: "học sinh, sinh viên",
  pronunciation: "ˈstuːdənt",
  example: "She is a good student.",
};

const mockProgressData = {
  userId: "user-1",
  storiesRead: 5,
  vocabularyLearned: 25,
  totalTimeSpent: 120,
  currentStreak: 3,
  completionPercentage: 75,
};

// Mock audio
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 120,
  volume: 1,
  muted: false,
  playbackRate: 1,
  src: "",
};

Object.defineProperty(window, "HTMLAudioElement", {
  writable: true,
  value: jest.fn().mockImplementation(() => mockAudio),
});

// Test wrapper with QueryClient
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

describe("Learning Flow Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it("completes a full story reading session", async () => {
    const user = userEvent.setup();

    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stories: [mockStoryData] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoryData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockExercises,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgressData,
      } as Response);

    render(
      <TestWrapper>
        <LearningPage />
      </TestWrapper>
    );

    // Wait for stories to load
    await waitFor(() => {
      expect(screen.getByText("Test Story")).toBeInTheDocument();
    });

    // Select a story
    const storyCard = screen.getByText("Test Story");
    await user.click(storyCard);

    // Wait for story content to load
    await waitFor(() => {
      expect(
        screen.getByText("Xin chào, tôi là một student đang học English.")
      ).toBeInTheDocument();
    });

    // Click on an embedded word
    const studentWord = screen.getByRole("button", { name: /student/i });
    await user.click(studentWord);

    // Vocabulary popup should appear
    await waitFor(() => {
      expect(screen.getByText("học sinh, sinh viên")).toBeInTheDocument();
    });

    // Close vocabulary popup
    const closeButton = screen.getByTitle("Đóng");
    await user.click(closeButton);

    // Start audio playback
    const playButton = screen.getByRole("button", { name: /play/i });
    await user.click(playButton);

    expect(mockAudio.play).toHaveBeenCalled();

    // Complete reading and move to exercises
    // This would typically be triggered by reaching the end of the story
    // For testing, we'll simulate the exercise loading
    await waitFor(() => {
      expect(screen.getByText("Exercise 1 of 1")).toBeInTheDocument();
    });
  });

  it("handles audio-text synchronization", async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stories: [mockStoryData] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoryData,
      } as Response);

    render(
      <TestWrapper>
        <LearningPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Story")).toBeInTheDocument();
    });

    const storyCard = screen.getByText("Test Story");
    await user.click(storyCard);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
    });

    // Simulate audio loaded
    const loadedDataCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "loadeddata"
    )?.[1];
    if (loadedDataCallback) loadedDataCallback();

    // Start playback
    const playButton = screen.getByRole("button", { name: /play/i });
    await user.click(playButton);

    // Simulate time update to trigger chunk highlighting
    mockAudio.currentTime = 30;
    const timeUpdateCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "timeupdate"
    )?.[1];
    if (timeUpdateCallback) timeUpdateCallback();

    // Check that chunk highlighting is working
    const chunks = document.querySelectorAll("[data-chunk-index]");
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("completes exercise flow and updates progress", async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stories: [mockStoryData] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoryData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockExercises,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockProgressData, storiesRead: 6 }),
      } as Response);

    render(
      <TestWrapper>
        <LearningPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Story")).toBeInTheDocument();
    });

    const storyCard = screen.getByText("Test Story");
    await user.click(storyCard);

    // Navigate to exercises
    await waitFor(() => {
      expect(screen.getByText("Exercise 1 of 1")).toBeInTheDocument();
    });

    // Complete the exercise
    const input = screen.getByPlaceholderText("Type your answer here...");
    await user.type(input, "student");

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    // Should show correct feedback
    await waitFor(() => {
      expect(screen.getByText("Correct!")).toBeInTheDocument();
    });

    // Finish exercises
    const finishButton = screen.getByText("Finish");
    await user.click(finishButton);

    // Should show completion screen
    await waitFor(() => {
      expect(screen.getByText("Exercises Completed!")).toBeInTheDocument();
    });

    // Verify progress update API call
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/learning/progress/update"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
      })
    );
  });

  it("handles vocabulary lookup and progress tracking", async () => {
    const user = userEvent.setup();

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stories: [mockStoryData] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoryData,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVocabularyData,
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
      expect(screen.getByText("Test Story")).toBeInTheDocument();
    });

    const storyCard = screen.getByText("Test Story");
    await user.click(storyCard);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /student/i })
      ).toBeInTheDocument();
    });

    // Click on vocabulary word
    const studentWord = screen.getByRole("button", { name: /student/i });
    await user.click(studentWord);

    // Wait for vocabulary data to load
    await waitFor(() => {
      expect(screen.getByText("học sinh, sinh viên")).toBeInTheDocument();
    });

    // Mark word as learning
    const learningButton = screen.getByText("Đang học");
    await user.click(learningButton);

    // Verify vocabulary progress API call
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/learning/vocabulary/progress"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.stringContaining("student"),
      })
    );
  });

  it("handles offline functionality and data sync", async () => {
    const user = userEvent.setup();

    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    // Mock service worker
    Object.defineProperty(navigator, "serviceWorker", {
      value: {
        register: jest.fn().mockResolvedValue({}),
        ready: Promise.resolve({
          active: {
            postMessage: jest.fn(),
          },
        }),
      },
      writable: true,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stories: [mockStoryData] }),
    } as Response);

    render(
      <TestWrapper>
        <LearningPage />
      </TestWrapper>
    );

    // Should show offline indicator
    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });

    // Should still be able to access cached content
    await waitFor(() => {
      expect(screen.getByText("Test Story")).toBeInTheDocument();
    });

    // Simulate going back online
    Object.defineProperty(navigator, "onLine", {
      value: true,
    });

    // Trigger online event
    fireEvent(window, new Event("online"));

    // Should attempt to sync data
    await waitFor(() => {
      expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
    });
  });

  it("handles error states gracefully", async () => {
    const user = userEvent.setup();

    // Mock API error
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <TestWrapper>
        <LearningPage />
      </TestWrapper>
    );

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    // Should provide retry option
    const retryButton = screen.getByText(/retry/i);
    expect(retryButton).toBeInTheDocument();

    // Mock successful retry
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stories: [mockStoryData] }),
    } as Response);

    await user.click(retryButton);

    // Should load content after retry
    await waitFor(() => {
      expect(screen.getByText("Test Story")).toBeInTheDocument();
    });
  });

  it("persists audio position across sessions", async () => {
    const user = userEvent.setup();

    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest
        .fn()
        .mockReturnValue(JSON.stringify({ currentPosition: 45 })),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stories: [mockStoryData] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStoryData,
      } as Response);

    render(
      <TestWrapper>
        <LearningPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Test Story")).toBeInTheDocument();
    });

    const storyCard = screen.getByText("Test Story");
    await user.click(storyCard);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
    });

    // Simulate audio loaded
    const loadedDataCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "loadeddata"
    )?.[1];
    if (loadedDataCallback) loadedDataCallback();

    // Should restore saved position
    expect(mockAudio.currentTime).toBe(45);
  });
});
