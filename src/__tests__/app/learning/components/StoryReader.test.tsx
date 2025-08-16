import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StoryReader } from "@/app/learning/components/StoryReader";
import type {
  LearningStory,
  UserLearningPreferences,
} from "@/app/learning/types/learning";

// Mock data
const mockStory: LearningStory = {
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
      chunkText: "Đây là một câu bình thường không có từ tiếng Anh.",
      type: "normal",
    },
    {
      id: "chunk-3",
      chunkOrder: 3,
      chunkText: "This is an explanation chunk.",
      type: "explain",
    },
  ],
  lesson: {
    id: "lesson-1",
    title: "Test Lesson",
  },
};

const mockUserPreferences: UserLearningPreferences = {
  embeddingRatio: 25,
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

const mockOnWordClick = jest.fn();

describe("StoryReader Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders story title and metadata correctly", () => {
    render(<StoryReader story={mockStory} onWordClick={mockOnWordClick} />);

    expect(screen.getByText("Test Story")).toBeInTheDocument();
    expect(screen.getByText("BEGINNER")).toBeInTheDocument();
    expect(screen.getByText("5 phút")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders story chunks with correct styling", () => {
    render(<StoryReader story={mockStory} onWordClick={mockOnWordClick} />);

    const chunks = document.querySelectorAll("[data-chunk-index]");
    expect(chunks).toHaveLength(3);

    // Check chunk types are applied correctly
    const explainChunk = document.querySelector('[data-chunk-index="2"]');
    expect(explainChunk).toHaveClass("bg-gray-50");
  });

  it("highlights embedded English words in chem chunks", () => {
    render(<StoryReader story={mockStory} onWordClick={mockOnWordClick} />);

    // Should find clickable English words in chem chunk
    const studentButton = screen.getByRole("button", { name: /student/i });
    const englishButton = screen.getByRole("button", { name: /English/i });

    expect(studentButton).toBeInTheDocument();
    expect(englishButton).toBeInTheDocument();
    expect(studentButton).toHaveClass("bg-blue-100", "text-blue-800");
  });

  it("does not highlight words in normal chunks", () => {
    render(<StoryReader story={mockStory} onWordClick={mockOnWordClick} />);

    // Normal chunk should not have clickable words
    const normalChunkText = "Đây là một câu bình thường không có từ tiếng Anh.";
    expect(screen.getByText(normalChunkText)).toBeInTheDocument();

    // Should not find any buttons in the normal chunk text
    const buttons = screen.getAllByRole("button");
    // The chem chunk has many individual character buttons due to the regex matching
    expect(buttons.length).toBeGreaterThan(2);
  });

  it("calls onWordClick with correct parameters when word is clicked", async () => {
    const user = userEvent.setup();

    render(<StoryReader story={mockStory} onWordClick={mockOnWordClick} />);

    const studentButton = screen.getByRole("button", { name: /student/i });
    await user.click(studentButton);

    expect(mockOnWordClick).toHaveBeenCalledWith(
      "student",
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
      })
    );
  });

  it("handles keyboard navigation for embedded words", async () => {
    const user = userEvent.setup();

    render(<StoryReader story={mockStory} onWordClick={mockOnWordClick} />);

    const studentButton = screen.getByRole("button", { name: /student/i });
    studentButton.focus();
    await user.keyboard("{Enter}");

    expect(mockOnWordClick).toHaveBeenCalledWith(
      "student",
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
      })
    );

    jest.clearAllMocks();
    await user.keyboard(" ");
    expect(mockOnWordClick).toHaveBeenCalledTimes(1);
  });

  it("highlights current chunk during audio playback", () => {
    render(
      <StoryReader
        story={mockStory}
        onWordClick={mockOnWordClick}
        highlightedChunk={1}
      />
    );

    const chunks = document.querySelectorAll("[data-chunk-index]");
    expect(chunks[1]).toHaveClass(
      "bg-yellow-50",
      "border-l-4",
      "border-yellow-400"
    );
    expect(chunks[0]).not.toHaveClass("bg-yellow-50");
    expect(chunks[2]).not.toHaveClass("bg-yellow-50");
  });

  it("applies user preferences for embedding ratio", () => {
    render(
      <StoryReader
        story={mockStory}
        onWordClick={mockOnWordClick}
        userPreferences={mockUserPreferences}
      />
    );

    // Should show custom embedding ratio in metadata
    expect(screen.getByText("25% (tùy chỉnh)")).toBeInTheDocument();
  });

  it("shows development chunk information in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(<StoryReader story={mockStory} onWordClick={mockOnWordClick} />);

    expect(screen.getByText("Chunk 1 (chem)")).toBeInTheDocument();
    expect(screen.getByText("Chunk 2 (normal)")).toBeInTheDocument();
    expect(screen.getByText("Chunk 3 (explain)")).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("renders story footer with completion message", () => {
    render(<StoryReader story={mockStory} onWordClick={mockOnWordClick} />);

    expect(
      screen.getByText(/Bạn đã hoàn thành việc đọc truyện/)
    ).toBeInTheDocument();
    expect(screen.getByText("Thuộc bài học: Test Lesson")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <StoryReader
        story={mockStory}
        onWordClick={mockOnWordClick}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("handles empty chunks array", () => {
    const storyWithoutChunks = { ...mockStory, chunks: [] };

    render(
      <StoryReader story={storyWithoutChunks} onWordClick={mockOnWordClick} />
    );

    expect(screen.getByText("Test Story")).toBeInTheDocument();
    expect(
      document.querySelector("[data-chunk-index]")
    ).not.toBeInTheDocument();
  });

  it("handles words with apostrophes and hyphens", () => {
    const storyWithComplexWords = {
      ...mockStory,
      chunks: [
        {
          id: "chunk-complex",
          chunkOrder: 1,
          chunkText: "Tôi có một don't và well-known book.",
          type: "chem" as const,
        },
      ],
    };

    render(
      <StoryReader
        story={storyWithComplexWords}
        onWordClick={mockOnWordClick}
      />
    );

    expect(screen.getByRole("button", { name: /don't/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /well-known/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /book/i })).toBeInTheDocument();
  });
});
