"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import type {
  Exercise,
  ExerciseResult,
  ExercisePanelProps,
  ExerciseState,
} from "../types/learning";

// Memoized ExercisePanel component for performance
const ExercisePanel = React.memo(function ExercisePanel({
  storyId,
  exercises,
  onComplete,
  onExerciseResult,
  className = "",
}: ExercisePanelProps) {
  const [state, setState] = useState<ExerciseState>({
    currentExercise: 0,
    answers: {},
    results: [],
    startTime: Date.now(),
    isCompleted: false,
    showFeedback: false,
  });

  const currentExercise = exercises[state.currentExercise];
  const currentAnswer = state.answers[currentExercise?.id] || "";
  const currentResult = state.results.find(
    (r) => r.exerciseId === currentExercise?.id
  );

  // Handle answer submission
  const handleSubmitAnswer = useCallback(() => {
    if (!currentExercise || !currentAnswer) return;

    const isCorrect = validateAnswer(currentExercise, currentAnswer);
    const timeSpent = Date.now() - state.startTime;
    const existingResult = state.results.find(
      (r) => r.exerciseId === currentExercise.id
    );
    const attempts = existingResult ? existingResult.attempts + 1 : 1;

    const result: ExerciseResult = {
      exerciseId: currentExercise.id,
      userAnswer: currentAnswer,
      isCorrect,
      timeSpent,
      attempts,
    };

    setState((prev) => ({
      ...prev,
      results: prev.results
        .filter((r) => r.exerciseId !== currentExercise.id)
        .concat(result),
      showFeedback: true,
    }));

    onExerciseResult(result);
  }, [
    currentExercise,
    currentAnswer,
    state.startTime,
    state.results,
    onExerciseResult,
  ]);

  // Validate answer based on exercise type
  const validateAnswer = (
    exercise: Exercise,
    answer: string | string[]
  ): boolean => {
    switch (exercise.type) {
      case "fill_blank":
        return (
          typeof answer === "string" &&
          typeof exercise.correctAnswer === "string" &&
          answer.toLowerCase().trim() ===
            exercise.correctAnswer.toLowerCase().trim()
        );

      case "multiple_choice":
        return answer === exercise.correctAnswer;

      case "drag_drop":
        if (Array.isArray(answer) && Array.isArray(exercise.correctAnswer)) {
          return (
            answer.length === exercise.correctAnswer.length &&
            answer.every(
              (item, index) => item === exercise.correctAnswer[index]
            )
          );
        }
        return false;

      default:
        return false;
    }
  };

  // Handle next exercise
  const handleNext = () => {
    if (state.currentExercise < exercises.length - 1) {
      setState((prev) => ({
        ...prev,
        currentExercise: prev.currentExercise + 1,
        showFeedback: false,
        startTime: Date.now(),
      }));
    } else {
      setState((prev) => ({ ...prev, isCompleted: true }));
      onComplete(state.results);
    }
  };

  // Handle previous exercise
  const handlePrevious = () => {
    if (state.currentExercise > 0) {
      setState((prev) => ({
        ...prev,
        currentExercise: prev.currentExercise - 1,
        showFeedback: false,
      }));
    }
  };

  // Handle retry
  const handleRetry = () => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [currentExercise.id]: "" },
      showFeedback: false,
      startTime: Date.now(),
    }));
  };

  // Handle answer change
  const handleAnswerChange = (value: string | string[]) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [currentExercise.id]: value },
    }));
  };

  if (!exercises.length) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            No exercises available for this story.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (state.isCompleted) {
    const correctAnswers = state.results.filter((r) => r.isCorrect).length;
    const totalQuestions = exercises.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Exercises Completed!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{score}%</div>
            <p className="text-muted-foreground">
              {correctAnswers} out of {totalQuestions} correct
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Exercise {state.currentExercise + 1} of {exercises.length}
          </CardTitle>
          <Badge variant="outline">
            {currentExercise.type.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((state.currentExercise + 1) / exercises.length) * 100}%`,
            }}
          />
        </div>

        {/* Exercise content */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{currentExercise.question}</h3>

          {/* Render exercise based on type */}
          {currentExercise.type === "fill_blank" && (
            <FillBlankExercise
              exercise={currentExercise}
              answer={currentAnswer as string}
              onAnswerChange={handleAnswerChange}
              disabled={state.showFeedback}
            />
          )}

          {currentExercise.type === "multiple_choice" && (
            <MultipleChoiceExercise
              exercise={currentExercise}
              answer={currentAnswer as string}
              onAnswerChange={handleAnswerChange}
              disabled={state.showFeedback}
            />
          )}

          {currentExercise.type === "drag_drop" && (
            <DragDropExercise
              exercise={currentExercise}
              answer={currentAnswer as string[]}
              onAnswerChange={handleAnswerChange}
              disabled={state.showFeedback}
            />
          )}
        </div>

        {/* Feedback */}
        {state.showFeedback && currentResult && (
          <div
            className={`p-4 rounded-lg ${
              currentResult.isCorrect
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {currentResult.isCorrect ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span
                className={`font-medium ${
                  currentResult.isCorrect ? "text-green-800" : "text-red-800"
                }`}
              >
                {currentResult.isCorrect ? "Correct!" : "Incorrect"}
              </span>
            </div>
            {!currentResult.isCorrect && currentExercise.explanation && (
              <p className="text-sm text-red-700 mb-3">
                {currentExercise.explanation}
              </p>
            )}
            {!currentResult.isCorrect && (
              <p className="text-sm text-red-700 mb-3">
                Correct answer:{" "}
                {Array.isArray(currentExercise.correctAnswer)
                  ? currentExercise.correctAnswer.join(", ")
                  : currentExercise.correctAnswer}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={state.currentExercise === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {state.showFeedback && !currentResult?.isCorrect && (
              <Button variant="outline" onClick={handleRetry}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}

            {!state.showFeedback ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={
                  !currentAnswer ||
                  (Array.isArray(currentAnswer) && currentAnswer.length === 0)
                }
              >
                Submit
              </Button>
            ) : (
              <Button onClick={handleNext}>
                {state.currentExercise === exercises.length - 1
                  ? "Finish"
                  : "Next"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Fill-in-the-blank exercise component
function FillBlankExercise({
  exercise,
  answer,
  onAnswerChange,
  disabled,
}: {
  exercise: Exercise;
  answer: string;
  onAnswerChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Input
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Type your answer here..."
        disabled={disabled}
        className="text-lg"
      />
      {exercise.vocabulary && exercise.vocabulary.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">
            Vocabulary hints:
          </span>
          {exercise.vocabulary.map((word, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {word}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Multiple choice exercise component
function MultipleChoiceExercise({
  exercise,
  answer,
  onAnswerChange,
  disabled,
}: {
  exercise: Exercise;
  answer: string;
  onAnswerChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      {exercise.options?.map((option, index) => (
        <label
          key={index}
          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            answer === option
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <input
            type="radio"
            name={`exercise-${exercise.id}`}
            value={option}
            checked={answer === option}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={disabled}
            className="text-blue-600"
          />
          <span className="flex-1">{option}</span>
        </label>
      ))}
    </div>
  );
}

// Drag and drop exercise component
function DragDropExercise({
  exercise,
  answer,
  onAnswerChange,
  disabled,
}: {
  exercise: Exercise;
  answer: string[];
  onAnswerChange: (value: string[]) => void;
  disabled: boolean;
}) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const availableOptions = exercise.options || [];
  const currentAnswer = answer || [];

  const handleDragStart = (item: string) => {
    if (!disabled) {
      setDraggedItem(item);
    }
  };

  const handleDrop = (index: number) => {
    if (!disabled && draggedItem) {
      const newAnswer = [...currentAnswer];
      newAnswer[index] = draggedItem;
      onAnswerChange(newAnswer);
      setDraggedItem(null);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (!disabled) {
      const newAnswer = [...currentAnswer];
      newAnswer.splice(index, 1);
      onAnswerChange(newAnswer);
    }
  };

  return (
    <div className="space-y-4">
      {/* Available options */}
      <div>
        <p className="text-sm font-medium mb-2">Available options:</p>
        <div className="flex flex-wrap gap-2">
          {availableOptions
            .filter((option) => !currentAnswer.includes(option))
            .map((option, index) => (
              <div
                key={index}
                draggable={!disabled}
                onDragStart={() => handleDragStart(option)}
                className={`px-3 py-2 bg-gray-100 border rounded-lg cursor-move select-none ${
                  disabled
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-gray-200"
                }`}
              >
                {option}
              </div>
            ))}
        </div>
      </div>

      {/* Drop zones */}
      <div>
        <p className="text-sm font-medium mb-2">Arrange in correct order:</p>
        <div className="space-y-2">
          {Array.from({ length: Math.max(3, currentAnswer.length + 1) }).map(
            (_, index) => (
              <div
                key={index}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                className={`min-h-[50px] p-3 border-2 border-dashed rounded-lg flex items-center justify-between ${
                  currentAnswer[index]
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                {currentAnswer[index] ? (
                  <>
                    <span>{currentAnswer[index]}</span>
                    {!disabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400">Drop item here</span>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default ExercisePanel;
