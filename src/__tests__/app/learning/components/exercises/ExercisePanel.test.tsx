import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExercisePanel from "@/app/learning/components/ExercisePanel";
import type { Exercise, ExerciseResult } from "@/app/learning/types/learning";

// Mock fetch
global.fetch = jest.fn();

// Mock speech synthesis
Object.defineProperty(window, "speechSynthesis", {
  writable: true,
  value: {
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getVoices: jest.fn(() => []),
  },
});

const mockExercises: Exercise[] = [
  {
    id: "1",
    type: "fill_blank",
    question: "The cat is _____ the table.",
    correctAnswer: "under",
    explanation: 'Use "under" to indicate position below something.',
    vocabulary: ["under", "on", "above"],
  },
  {
    id: "2",
    type: "multiple_choice",
    question: 'What is the past tense of "go"?',
    options: ["went", "goed", "gone", "going"],
    correctAnswer: "went",
    explanation: 'The past tense of "go" is "went".',
  },
  {
    id: "3",
    type: "drag_drop",
    question: "Arrange these words to form a sentence:",
    options: ["I", "love", "reading", "books"],
    correctAnswer: ["I", "love", "reading", "books"],
    explanation: 'The correct order forms: "I love reading books".',
  },
];

describe("ExercisePanel", () => {
  const defaultProps = {
    storyId: "story-1",
    exercises: mockExercises,
    onComplete: jest.fn(),
    onExerciseResult: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  it("renders exercise panel with first exercise", () => {
    render(<ExercisePanel {...defaultProps} />);

    expect(screen.getByText("Exercise 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("FILL BLANK")).toBeInTheDocument();
    expect(screen.getByText("The cat is _____ the table.")).toBeInTheDocument();
  });

  it("displays progress bar and stats", () => {
    render(<ExercisePanel {...defaultProps} />);

    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument(); // 1/3 exercises
    expect(screen.getByText("0")).toBeInTheDocument(); // Correct answers
    expect(screen.getByText("3")).toBeInTheDocument(); // Remaining
  });

  it("displays timer", () => {
    render(<ExercisePanel {...defaultProps} />);

    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("handles fill blank exercise submission", async () => {
    const user = userEvent.setup();
    render(<ExercisePanel {...defaultProps} />);

    const input = screen.getByPlaceholderText("Type your answer here...");
    await user.type(input, "under");

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("✅ Excellent! Your answer is correct.")
      ).toBeInTheDocument();
    });

    expect(defaultProps.onExerciseResult).toHaveBeenCalledWith(
      expect.objectContaining({
        exerciseId: "1",
        userAnswer: "under",
        isCorrect: true,
        attempts: 1,
      })
    );
  });

  it("handles incorrect answer with retry", async () => {
    const user = userEvent.setup();
    render(<ExercisePanel {...defaultProps} />);

    const input = screen.getByPlaceholderText("Type your answer here...");
    await user.type(input, "on");

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("❌ Not quite right. The correct answer is: under")
      ).toBeInTheDocument();
    });

    // Test retry functionality
    const retryButton = screen.getByText("Retry");
    await user.click(retryButton);

    expect(screen.getByDisplayValue("")).toBeInTheDocument(); // Input should be cleared
  });

  it("navigates to next exercise", async () => {
    const user = userEvent.setup();
    render(<ExercisePanel {...defaultProps} />);

    // Answer first exercise
    const input = screen.getByPlaceholderText("Type your answer here...");
    await user.type(input, "under");
    await user.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Next")).toBeInTheDocument();
    });

    // Go to next exercise
    await user.click(screen.getByText("Next"));

    expect(screen.getByText("Exercise 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("MULTIPLE CHOICE")).toBeInTheDocument();
    expect(
      screen.getByText('What is the past tense of "go"?')
    ).toBeInTheDocument();
  });

  it("handles multiple choice exercise", async () => {
    const user = userEvent.setup();
    const props = {
      ...defaultProps,
      exercises: [mockExercises[1]], // Only multiple choice exercise
    };

    render(<ExercisePanel {...props} />);

    // Select correct answer
    const correctOption = screen.getByLabelText("went");
    await user.click(correctOption);

    await user.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Correct!")).toBeInTheDocument();
    });
  });

  it("handles drag and drop exercise", async () => {
    const user = userEvent.setup();
    const props = {
      ...defaultProps,
      exercises: [mockExercises[2]], // Only drag drop exercise
    };

    render(<ExercisePanel {...props} />);

    expect(
      screen.getByText("Arrange these words to form a sentence:")
    ).toBeInTheDocument();
    expect(screen.getByText("Available Options:")).toBeInTheDocument();

    // Test that all options are available
    expect(screen.getByText("I")).toBeInTheDocument();
    expect(screen.getByText("love")).toBeInTheDocument();
    expect(screen.getByText("reading")).toBeInTheDocument();
    expect(screen.getByText("books")).toBeInTheDocument();
  });

  it("completes all exercises and shows results", async () => {
    const user = userEvent.setup();
    render(<ExercisePanel {...defaultProps} />);

    // Complete first exercise
    await user.type(
      screen.getByPlaceholderText("Type your answer here..."),
      "under"
    );
    await user.click(screen.getByText("Submit"));
    await waitFor(() => screen.getByText("Next"));
    await user.click(screen.getByText("Next"));

    // Complete second exercise
    await user.click(screen.getByLabelText("went"));
    await user.click(screen.getByText("Submit"));
    await waitFor(() => screen.getByText("Next"));
    await user.click(screen.getByText("Next"));

    // Skip third exercise for now (drag-drop is complex to test)
    await user.click(screen.getByText("Submit")); // Submit empty answer
    await waitFor(() => screen.getByText("Finish"));
    await user.click(screen.getByText("Finish"));

    // Check completion screen
    await waitFor(() => {
      expect(screen.getByText("Exercises Completed!")).toBeInTheDocument();
      expect(screen.getByText("Total Time")).toBeInTheDocument();
      expect(screen.getByText("Avg Time")).toBeInTheDocument();
    });

    expect(defaultProps.onComplete).toHaveBeenCalled();
  });

  it("handles navigation between exercises", async () => {
    const user = userEvent.setup();
    render(<ExercisePanel {...defaultProps} />);

    // Answer first exercise and go to second
    await user.type(
      screen.getByPlaceholderText("Type your answer here..."),
      "under"
    );
    await user.click(screen.getByText("Submit"));
    await waitFor(() => screen.getByText("Next"));
    await user.click(screen.getByText("Next"));

    expect(screen.getByText("Exercise 2 of 3")).toBeInTheDocument();

    // Go back to first exercise
    await user.click(screen.getByText("Previous"));

    expect(screen.getByText("Exercise 1 of 3")).toBeInTheDocument();
    expect(screen.getByDisplayValue("under")).toBeInTheDocument(); // Answer should be preserved
  });

  it("saves exercise results to backend", async () => {
    const user = userEvent.setup();
    render(<ExercisePanel {...defaultProps} />);

    await user.type(
      screen.getByPlaceholderText("Type your answer here..."),
      "under"
    );
    await user.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/learning/exercises/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyId: "story-1",
          exerciseResult: expect.objectContaining({
            exerciseId: "1",
            userAnswer: "under",
            isCorrect: true,
          }),
        }),
      });
    });
  });

  it("handles empty exercises array", () => {
    const props = {
      ...defaultProps,
      exercises: [],
    };

    render(<ExercisePanel {...props} />);

    expect(
      screen.getByText("No exercises available for this story.")
    ).toBeInTheDocument();
  });

  it("tracks exercise attempts correctly", async () => {
    const user = userEvent.setup();
    render(<ExercisePanel {...defaultProps} />);

    // First attempt (incorrect)
    await user.type(
      screen.getByPlaceholderText("Type your answer here..."),
      "on"
    );
    await user.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    // Retry
    await user.click(screen.getByText("Retry"));
    await user.type(
      screen.getByPlaceholderText("Type your answer here..."),
      "under"
    );
    await user.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "💪 You got it on attempt #2! Keep practicing to improve your speed."
        )
      ).toBeInTheDocument();
    });

    expect(defaultProps.onExerciseResult).toHaveBeenLastCalledWith(
      expect.objectContaining({
        attempts: 2,
        isCorrect: true,
      })
    );
  });

  it("displays vocabulary hints for fill blank exercises", () => {
    render(<ExercisePanel {...defaultProps} />);

    expect(screen.getByText("Show hints")).toBeInTheDocument();
  });

  it("updates stats as exercises are completed", async () => {
    const user = userEvent.setup();
    render(<ExercisePanel {...defaultProps} />);

    // Initially 0 correct, 3 remaining
    expect(screen.getByText("0")).toBeInTheDocument(); // Correct
    expect(screen.getByText("3")).toBeInTheDocument(); // Remaining

    // Complete first exercise
    await user.type(
      screen.getByPlaceholderText("Type your answer here..."),
      "under"
    );
    await user.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument(); // Correct should be 1
      expect(screen.getByText("2")).toBeInTheDocument(); // Remaining should be 2
    });
  });
});
