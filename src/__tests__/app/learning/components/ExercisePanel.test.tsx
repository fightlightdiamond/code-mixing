import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExercisePanel from "@/app/learning/components/ExercisePanel";
import type { Exercise } from "@/app/learning/types/learning";

const mockExercises: Exercise[] = [
  {
    id: "exercise-1",
    type: "fill_blank",
    question: "Complete the sentence: I am a ___.",
    correctAnswer: "student",
    explanation: "The correct answer is 'student'.",
    vocabulary: ["student", "teacher", "doctor"],
  },
  {
    id: "exercise-2",
    type: "multiple_choice",
    question: "What does 'hello' mean in Vietnamese?",
    options: ["Xin chào", "Tạm biệt", "Cảm ơn", "Xin lỗi"],
    correctAnswer: "Xin chào",
    explanation: "'Hello' means 'Xin chào' in Vietnamese.",
  },
  {
    id: "exercise-3",
    type: "drag_drop",
    question: "Arrange these words to form a sentence: [are, you, How]",
    options: ["How", "are", "you"],
    correctAnswer: ["How", "are", "you"],
    explanation: "The correct order is 'How are you'.",
  },
];

const mockOnComplete = jest.fn();
const mockOnExerciseResult = jest.fn();

describe("ExercisePanel Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders first exercise correctly", () => {
    render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    expect(screen.getByText("Exercise 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("FILL BLANK")).toBeInTheDocument();
    expect(
      screen.getByText("Complete the sentence: I am a ___.")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Type your answer here...")
    ).toBeInTheDocument();
  });

  it("shows progress bar", () => {
    render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    const progressBar = document.querySelector(".bg-blue-600");
    expect(progressBar).toHaveStyle("width: 33.33333333333333%"); // 1/3 * 100%
  });

  it("handles fill blank exercise submission", async () => {
    const user = userEvent.setup();

    render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    const input = screen.getByPlaceholderText("Type your answer here...");
    const submitButton = screen.getByText("Submit");

    await user.type(input, "student");
    await user.click(submitButton);

    expect(mockOnExerciseResult).toHaveBeenCalledWith({
      exerciseId: "exercise-1",
      userAnswer: "student",
      isCorrect: true,
      timeSpent: expect.any(Number),
      attempts: 1,
    });

    expect(screen.getByText("Correct!")).toBeInTheDocument();
  });

  it("handles incorrect answer with feedback", async () => {
    const user = userEvent.setup();

    render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    const input = screen.getByPlaceholderText("Type your answer here...");
    const submitButton = screen.getByText("Submit");

    await user.type(input, "teacher");
    await user.click(submitButton);

    expect(mockOnExerciseResult).toHaveBeenCalledWith({
      exerciseId: "exercise-1",
      userAnswer: "teacher",
      isCorrect: false,
      timeSpent: expect.any(Number),
      attempts: 1,
    });

    expect(screen.getByText("Incorrect")).toBeInTheDocument();
    expect(
      screen.getByText("The correct answer is 'student'.")
    ).toBeInTheDocument();
    expect(screen.getByText("Correct answer: student")).toBeInTheDocument();
  });

  it("shows vocabulary hints for fill blank exercises", () => {
    render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    expect(screen.getByText("Vocabulary hints:")).toBeInTheDocument();
    expect(screen.getByText("student")).toBeInTheDocument();
    expect(screen.getByText("teacher")).toBeInTheDocument();
    expect(screen.getByText("doctor")).toBeInTheDocument();
  });

  it("handles multiple choice exercise", async () => {
    const user = userEvent.setup();

    render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    // Move to second exercise
    const input = screen.getByPlaceholderText("Type your answer here...");
    await user.type(input, "student");
    await user.click(screen.getByText("Submit"));
    await user.click(screen.getByText("Next"));

    expect(screen.getByText("Exercise 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("MULTIPLE CHOICE")).toBeInTheDocument();
    expect(
      screen.getByText("What does 'hello' mean in Vietnamese?")
    ).toBeInTheDocument();

    // Select correct answer
    const correctOption = screen.getByLabelText("Xin chào");
    await user.click(correctOption);
    await user.click(screen.getByText("Submit"));

    expect(mockOnExerciseResult).toHaveBeenCalledWith({
      exerciseId: "exercise-2",
      userAnswer: "Xin chào",
      isCorrect: true,
      timeSpent: expect.any(Number),
      attempts: 1,
    });
  });

  it("handles drag and drop exercise", async () => {
    const user = userEvent.setup();

    render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    // Navigate to drag and drop exercise
    const input = screen.getByPlaceholderText("Type your answer here...");
    await user.type(input, "student");
    await user.click(screen.getByText("Submit"));
    await user.click(screen.getByText("Next"));

    await user.click(screen.getByLabelText("Xin chào"));
    await user.click(screen.getByText("Submit"));
    await user.click(screen.getByText("Next"));

    expect(screen.getByText("Exercise 3 of 3")).toBeInTheDocument();
    expect(screen.getByText("DRAG DROP")).toBeInTheDocument();
    expect(screen.getByText("Available options:")).toBeInTheDocument();
    expect(screen.getByText("Arrange in correct order:")).toBeInTheDocument();
  });

  it("handles retry functionality", async () => {
    const user = userEvent.setup();

    render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    const input = screen.getByPlaceholderText("Type your answer here...");
    await user.type(input, "wrong");
    await user.click(screen.getByText("Submit"));

    expect(screen.getByText("Retry")).toBeInTheDocument();

    await user.click(screen.getByText("Retry"));

    // Should clear the input and allow new attempt
    expect(input).toHaveValue("");
    expect(screen.queryByText("Incorrect")).not.toBeInTheDocument();
  });

  it("navigates between exercises", async () => {
    const user = userEvent.setup();

    render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    // Complete first exercise
    const input = screen.getByPlaceholderText("Type your answer here...");
    await user.type(input, "student");
    await user.click(screen.getByText("Submit"));
    await user.click(screen.getByText("Next"));

    expect(screen.getByText("Exercise 2 of 3")).toBeInTheDocument();

    // Go back to previous exercise
    await user.click(screen.getByText("Previous"));
    expect(screen.getByText("Exercise 1 of 3")).toBeInTheDocument();
  });

  it("shows completion screen with score", async () => {
    const user = userEvent.setup();

    render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    // Complete all exercises correctly
    // Exercise 1
    await user.type(
      screen.getByPlaceholderText("Type your answer here..."),
      "student"
    );
    await user.click(screen.getByText("Submit"));
    await user.click(screen.getByText("Next"));

    // Exercise 2
    await user.click(screen.getByLabelText("Xin chào"));
    await user.click(screen.getByText("Submit"));
    await user.click(screen.getByText("Next"));

    // Exercise 3 - simulate drag and drop completion
    // This would require more complex simulation of drag and drop
    // For now, we'll just submit without completing the drag and drop
    await user.click(screen.getByText("Submit"));

    // After submitting, should show Next button, then Finish
    await waitFor(() => {
      const nextOrFinishButton =
        screen.queryByText("Next") || screen.queryByText("Finish");
      if (nextOrFinishButton) {
        return user.click(nextOrFinishButton);
      }
    });

    expect(screen.getByText("Exercises Completed!")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument(); // 2/3 correct
    expect(screen.getByText("2 out of 3 correct")).toBeInTheDocument();
    expect(mockOnComplete).toHaveBeenCalled();
  });

  it("disables submit button when no answer is provided", () => {
    render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    const submitButton = screen.getByText("Submit");
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when answer is provided", async () => {
    const user = userEvent.setup();

    render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    const input = screen.getByPlaceholderText("Type your answer here...");
    const submitButton = screen.getByText("Submit");

    expect(submitButton).toBeDisabled();

    await user.type(input, "test");
    expect(submitButton).toBeEnabled();
  });

  it("handles empty exercises array", () => {
    render(
      <ExercisePanel
        storyId="story-1"
        exercises={[]}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    expect(
      screen.getByText("No exercises available for this story.")
    ).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
        className="custom-exercise-panel"
      />
    );

    expect(container.firstChild).toHaveClass("custom-exercise-panel");
  });

  it("tracks multiple attempts for incorrect answers", async () => {
    const user = userEvent.setup();

    render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    const input = screen.getByPlaceholderText("Type your answer here...");

    // First incorrect attempt
    await user.type(input, "wrong1");
    await user.click(screen.getByText("Submit"));

    expect(mockOnExerciseResult).toHaveBeenCalledWith(
      expect.objectContaining({ attempts: 1, isCorrect: false })
    );

    // Retry
    await user.click(screen.getByText("Retry"));
    await user.type(input, "wrong2");
    await user.click(screen.getByText("Submit"));

    expect(mockOnExerciseResult).toHaveBeenCalledWith(
      expect.objectContaining({ attempts: 2, isCorrect: false })
    );
  });

  it("validates answers case-insensitively for fill blank", async () => {
    const user = userEvent.setup();

    render(
      <ExercisePanel
        storyId="story-1"
        exercises={mockExercises}
        onComplete={mockOnComplete}
        onExerciseResult={mockOnExerciseResult}
      />
    );

    const input = screen.getByPlaceholderText("Type your answer here...");
    await user.type(input, "STUDENT");
    await user.click(screen.getByText("Submit"));

    expect(mockOnExerciseResult).toHaveBeenCalledWith(
      expect.objectContaining({ isCorrect: true })
    );
  });
});
