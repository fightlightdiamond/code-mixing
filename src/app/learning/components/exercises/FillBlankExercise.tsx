"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Volume2 } from "lucide-react";
import type { Exercise } from "../../types/learning";

interface FillBlankExerciseProps {
  exercise: Exercise;
  answer: string;
  onAnswerChange: (value: string) => void;
  disabled: boolean;
  showFeedback?: boolean;
  isCorrect?: boolean;
}

export default function FillBlankExercise({
  exercise,
  answer,
  onAnswerChange,
  disabled,
  showFeedback = false,
  isCorrect = false,
}: FillBlankExerciseProps) {
  const [showHint, setShowHint] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Auto-focus input when component mounts
  useEffect(() => {
    if (!disabled) {
      const input = document.querySelector(
        "input[data-exercise-input]"
      ) as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }
  }, [disabled]);

  // Play pronunciation audio if available
  const playPronunciation = async (word: string) => {
    try {
      // Use Web Speech API for pronunciation
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = "en-US";
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("Error playing pronunciation:", error);
    }
  };

  // Extract blanks from question text
  const renderQuestionWithBlanks = () => {
    const parts = exercise.question.split("_____");
    if (parts.length === 1) {
      return (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed">{exercise.question}</p>
          <Input
            data-exercise-input
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            disabled={disabled}
            className={`text-lg p-4 ${
              showFeedback
                ? isCorrect
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
                : inputFocused
                  ? "border-blue-500"
                  : ""
            }`}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
        </div>
      );
    }

    return (
      <div className="text-lg leading-relaxed">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index < parts.length - 1 && (
              <Input
                data-exercise-input
                value={answer}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder="..."
                disabled={disabled}
                className={`inline-block w-32 mx-2 text-center ${
                  showFeedback
                    ? isCorrect
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                    : inputFocused
                      ? "border-blue-500"
                      : ""
                }`}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Question with blanks */}
      {renderQuestionWithBlanks()}

      {/* Vocabulary hints */}
      {exercise.vocabulary && exercise.vocabulary.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Vocabulary hints:
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHint(!showHint)}
              className="text-xs"
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              {showHint ? "Hide" : "Show"} hints
            </Button>
          </div>

          {showHint && (
            <div className="flex flex-wrap gap-2">
              {exercise.vocabulary.map((word, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-secondary/80"
                    onClick={() => onAnswerChange(word)}
                  >
                    {word}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playPronunciation(word)}
                    className="h-6 w-6 p-0"
                  >
                    <Volume2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Character count and validation */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{answer.length} characters</span>
        {answer.length > 0 && !disabled && (
          <span className="text-blue-600">Press Enter to submit</span>
        )}
      </div>

      {/* Feedback section */}
      {showFeedback && (
        <div
          className={`p-3 rounded-lg border ${
            isCorrect
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {isCorrect ? (
            <p className="text-sm">✅ Excellent! Your answer is correct.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm">
                ❌ Not quite right. The correct answer is:{" "}
                <strong>{exercise.correctAnswer}</strong>
              </p>
              {exercise.explanation && (
                <p className="text-xs opacity-90">💡 {exercise.explanation}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
