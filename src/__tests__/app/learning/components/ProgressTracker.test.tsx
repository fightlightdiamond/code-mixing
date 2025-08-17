import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProgressTracker } from "@/app/learning/components/ProgressTracker";
import type {
  LearningProgress,
  LearningStats,
} from "@/app/learning/types/learning";

// Mock the hooks
jest.mock("@/app/learning/hooks/useProgress");
jest.mock("@/app/learning/hooks/useOfflineProgress");
jest.mock("@/app/learning/hooks/useOfflineManager");

// Mock fetch
global.fetch = jest.fn();

const mockProgress: LearningProgress = {
  userId: "user-1",
  storiesRead: 5,
  vocabularyLearned: 50,
  totalTimeSpent: 300, // 5 hours
  currentStreak: 7,
  longestStreak: 15,
  completionPercentage: 65,
  level: 3,
  experiencePoints: 1250,
  achievements: [
    {
      id: "ach-1",
      title: "First Story",
      description: "Complete your first story",
      unlockedAt: new Date("2024-01-01"),
      category: "reading",
    },
    {
      id: "ach-2",
      title: "Vocabulary Master",
      description: "Learn 50 new words",
      unlockedAt: new Date("2024-01-15"),
      category: "vocabulary",
    },
  ],
  lastActivityAt: new Date(),
};

const mockStats: LearningStats = {
  storiesCompleted: 5,
  vocabularyMastered: 50,
  timeSpentToday: 45,
  timeSpentThisWeek: 180,
  timeSpentTotal: 300,
  currentStreak: 7,
  longestStreak: 15,
  averageScore: 0.85,
  completionRate: 0.92,
};

const mockLevelProgress = {
  currentLevel: 3,
  currentXP: 250,
  xpToNextLevel: 250,
  totalXPForCurrentLevel: 500,
  isLevelUnlocked: jest.fn(),
  nextStoryRecommendations: [],
};

// Mock implementations
const mockUseProgress = {
  progress: mockProgress,
  stats: mockStats,
  levelProgress: mockLevelProgress,
  isLoading: false,
  error: null,
  utils: {
    getProgressPercentage: jest.fn((type: string) => {
      switch (type) {
        case "stories":
          return 50;
        case "vocabulary":
          return 75;
        default:
          return 0;
      }
    }),
    getNewAchievements: jest.fn(() => []),
  },
};

const mockUseOfflineManager = {
  isOnline: true,
  isOfflineMode: false,
  toggleOfflineMode: jest.fn(),
};

const mockUseOfflineProgress = {
  offlineData: {
    learningProgress: null,
    learningStats: null,
  },
  hasPendingSync: false,
  syncOfflineData: jest.fn(),
};

describe("ProgressTracker", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementations
    require("@/app/learning/hooks/useProgress").useProgress.mockReturnValue(
      mockUseProgress
    );
    require("@/app/learning/hooks/useOfflineManager").useOfflineManager.mockReturnValue(
      mockUseOfflineManager
    );
    require("@/app/learning/hooks/useOfflineProgress").useOfflineProgress.mockReturnValue(
      mockUseOfflineProgress
    );

    // Mock fetch responses
    (fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/progress/user/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              progress: mockProgress,
              streakData: {
                currentStreak: 7,
                longestStreak: 15,
                streakStartDate: new Date(),
                lastActivityDate: new Date(),
                streakHistory: [],
              },
              levelProgress: mockLevelProgress,
            }),
        });
      }

      if (url.includes("/vocabulary/progress")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              vocabulary: [
                {
                  word: "hello",
                  status: "mastered",
                  encounters: 5,
                  correctAnswers: 5,
                  totalAttempts: 5,
                  lastReviewed: new Date(),
                  nextReview: new Date(),
                  masteryLevel: 100,
                },
              ],
            }),
        });
      }

      if (url.includes("/activity")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              activities: [
                {
                  id: "act-1",
                  userId: "user-1",
                  action: "Completed story reading",
                  timestamp: new Date(),
                  metadata: { timeSpent: 600000 },
                },
              ],
            }),
        });
      }

      if (url.includes("/achievements")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              achievements: mockProgress.achievements,
            }),
        });
      }

      if (url.includes("/insights")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              insights: {
                strongAreas: ["Reading Comprehension", "Vocabulary"],
                improvementAreas: ["Grammar", "Pronunciation"],
                recommendedActions: ["Practice more grammar exercises"],
                learningVelocity: 2.5,
                consistencyScore: 0.8,
                difficultyProgression: ["beginner", "intermediate"],
              },
              recommendations: [
                {
                  id: "rec-1",
                  type: "story",
                  title: "Try intermediate stories",
                  description: "Challenge yourself with more complex content",
                  priority: "medium",
                  estimatedTime: 15,
                },
              ],
            }),
        });
      }

      return Promise.reject(new Error("Unknown URL"));
    });
  });

  it("renders progress tracker with basic information", async () => {
    render(<ProgressTracker userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Learning Progress")).toBeInTheDocument();
    });

    expect(screen.getByText("Level 3")).toBeInTheDocument();
    expect(screen.getByText("65%")).toBeInTheDocument(); // Overall progress
    expect(screen.getByText("5")).toBeInTheDocument(); // Stories read
    expect(screen.getByText("50")).toBeInTheDocument(); // Words learned
    expect(screen.getByText("7")).toBeInTheDocument(); // Current streak
    expect(screen.getByText("5h")).toBeInTheDocument(); // Total time
  });

  it("displays loading state initially", () => {
    const loadingMock = {
      ...mockUseProgress,
      isLoading: true,
    };
    require("@/app/learning/hooks/useProgress").useProgress.mockReturnValue(
      loadingMock
    );

    render(<ProgressTracker userId="user-1" />);

    expect(
      screen.getByTestId("loading-skeleton") ||
        document.querySelector(".animate-pulse")
    ).toBeInTheDocument();
  });

  it("displays error state when there is an error", async () => {
    const errorMock = {
      ...mockUseProgress,
      error: "Failed to load progress",
    };
    require("@/app/learning/hooks/useProgress").useProgress.mockReturnValue(
      errorMock
    );

    render(<ProgressTracker userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load progress")).toBeInTheDocument();
    });

    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("shows new achievements notification", async () => {
    const achievementMock = {
      ...mockUseProgress,
      utils: {
        ...mockUseProgress.utils,
        getNewAchievements: jest.fn(() => [
          {
            id: "new-ach",
            title: "Week Warrior",
            description: "Learn for 7 consecutive days",
            unlockedAt: new Date(),
            category: "streak",
          },
        ]),
      },
    };
    require("@/app/learning/hooks/useProgress").useProgress.mockReturnValue(
      achievementMock
    );

    render(<ProgressTracker userId="user-1" />);

    await waitFor(() => {
      expect(
        screen.getByText("New Achievements Unlocked!")
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Week Warrior")).toBeInTheDocument();
  });

  it("displays offline warning when offline with pending sync", async () => {
    const offlineMock = {
      ...mockUseOfflineManager,
      isOnline: false,
    };
    const pendingSyncMock = {
      ...mockUseOfflineProgress,
      hasPendingSync: true,
    };

    require("@/app/learning/hooks/useOfflineManager").useOfflineManager.mockReturnValue(
      offlineMock
    );
    require("@/app/learning/hooks/useOfflineProgress").useOfflineProgress.mockReturnValue(
      pendingSyncMock
    );

    render(<ProgressTracker userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Showing offline data")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Progress will sync when you're back online")
    ).toBeInTheDocument();
  });

  it("handles refresh functionality", async () => {
    const user = userEvent.setup();
    render(<ProgressTracker userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Learning Progress")).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    await user.click(refreshButton);

    // Should show loading state during refresh
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/learning/progress/user/user-1");
    });
  });

  it("switches between tabs when showDetailed is true", async () => {
    const user = userEvent.setup();
    render(<ProgressTracker userId="user-1" showDetailed={true} />);

    await waitFor(() => {
      expect(screen.getByText("Overview")).toBeInTheDocument();
    });

    // Switch to Achievements tab
    const achievementsTab = screen.getByText("Achievements");
    await user.click(achievementsTab);

    await waitFor(() => {
      expect(screen.getByText("Achievements Unlocked")).toBeInTheDocument();
    });

    // Switch to Vocabulary tab
    const vocabularyTab = screen.getByText("Vocabulary");
    await user.click(vocabularyTab);

    await waitFor(() => {
      expect(screen.getByText("Mastered")).toBeInTheDocument();
    });

    // Switch to Insights tab
    const insightsTab = screen.getByText("Insights");
    await user.click(insightsTab);

    await waitFor(() => {
      expect(screen.getByText("Strong Areas")).toBeInTheDocument();
    });
  });

  it("does not show detailed tabs when showDetailed is false", async () => {
    render(<ProgressTracker userId="user-1" showDetailed={false} />);

    await waitFor(() => {
      expect(screen.getByText("Learning Progress")).toBeInTheDocument();
    });

    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Achievements")).not.toBeInTheDocument();
    expect(screen.queryByText("Vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByText("Insights")).not.toBeInTheDocument();
  });

  it("displays empty state when no progress data", async () => {
    const emptyMock = {
      ...mockUseProgress,
      progress: null,
      stats: null,
    };
    require("@/app/learning/hooks/useProgress").useProgress.mockReturnValue(
      emptyMock
    );

    render(<ProgressTracker userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("No Progress Data Yet")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Start reading stories to track your learning progress!")
    ).toBeInTheDocument();
  });

  it("calculates and displays streak data correctly", async () => {
    render(<ProgressTracker userId="user-1" showDetailed={true} />);

    await waitFor(() => {
      expect(screen.getByText("Learning Progress")).toBeInTheDocument();
    });

    // Check if streak information is displayed
    expect(screen.getByText("7")).toBeInTheDocument(); // Current streak
    expect(screen.getByText("Day Streak")).toBeInTheDocument();
  });

  it("displays performance metrics correctly", async () => {
    render(<ProgressTracker userId="user-1" showDetailed={true} />);

    await waitFor(() => {
      expect(screen.getByText("Performance Metrics")).toBeInTheDocument();
    });

    expect(screen.getByText("85%")).toBeInTheDocument(); // Average score
    expect(screen.getByText("92%")).toBeInTheDocument(); // Completion rate
  });

  it("handles API errors gracefully", async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error("API Error"));

    render(<ProgressTracker userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });
  });

  it("displays recent activity when available", async () => {
    render(<ProgressTracker userId="user-1" showDetailed={true} />);

    await waitFor(() => {
      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    });

    expect(screen.getByText("Completed story reading")).toBeInTheDocument();
  });

  it("shows vocabulary progress breakdown", async () => {
    render(<ProgressTracker userId="user-1" showDetailed={true} />);

    await waitFor(() => {
      expect(screen.getByText("Learning Progress")).toBeInTheDocument();
    });

    // Switch to vocabulary tab
    const vocabularyTab = screen.getByText("Vocabulary");
    await userEvent.setup().click(vocabularyTab);

    await waitFor(() => {
      expect(screen.getByText("hello")).toBeInTheDocument();
    });
  });
});
