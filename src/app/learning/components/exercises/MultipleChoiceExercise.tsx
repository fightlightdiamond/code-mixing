"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Volume2, CheckCircle, XCircle } from "lucide-react";
import type { Exercise } from "../../types/learning";

interface MultipleChoiceExerciseProps {
  exercise: Exercise;
  answer: string;
  onAnswerChange: (value: string) => void;
  disabled: boolean;
  showFeedback?: boolean;
  isCorrect?: boolean;
}

export default function MultipleChoiceExercise({
  exercise,
  answer,
  onAnswerChange,
  disabled,
  showFeedback = false,
  isCorrect = false,
}: MultipleChoiceExerciseProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (disabled) return;

      const options = exercise.options || [];
      if (event.key >= "1" && event.key <= "9") {
        const index = parseInt(event.key) - 1;
        if (index < options.length) {
          onAnswerChange(options[index]);
        }
      }
    };

    document.addEventListener("keypress", handleKeyPress);
    return () => document.removeEventListener("keypress", handleKeyPress);
  }, [exercise.options, onAnswerChange, disabled]);

  // Play pronunciation audio
  const playPronunciation = async (text: string) => {
    try {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("Error playing pronunciation:", error);
    }
  };

  // Get option status for feedback
  const getOptionStatus = (option: string) => {
    if (!showFeedback) return "default";

    const isSelected = answer === option;
    const isCorrectAnswer = option === exercise.correctAnswer;

    if (isCorrectAnswer) return "correct";
    if (isSelected && !isCorrectAnswer) return "incorrect";
    return "default";
  };

  // Get option styling
  const getOptionStyling = (option: string, status: string) => {
    const baseClasses =
      "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200";

    switch (status) {
      case "correct":
        return `${baseClasses} border-green-500 bg-green-50 text-green-800`;
      case "incorrect":
        return `${baseClasses} border-red-500 bg-red-50 text-red-800`;
      default:
        if (answer === option) {
          return `${baseClasses} border-blue-500 bg-blue-50 text-blue-800 shadow-sm`;
        }
        if (hoveredOption === option && !disabled) {
          return `${baseClasses} border-gray-300 bg-gray-50 shadow-sm`;
        }
        return `${baseClasses} border-gray-200 hover:border-gray-300 ${disabled ? "cursor-not-allowed opacity-60" : ""}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Question */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium leading-relaxed">
          {exercise.question}
        </h3>
        {!disabled && (
          <p className="text-sm text-muted-foreground">
            Select the best answer or use keyboard shortcuts (1-
            {exercise.options?.length || 0})
          </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {exercise.options?.map((option, index) => {
          const status = getOptionStatus(option);
          const isSelected = answer === option;

          return (
            <Card
              key={index}
              className={getOptionStyling(option, status)}
              onClick={() => !disabled && onAnswerChange(option)}
              onMouseEnter={() => setHoveredOption(option)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div className="flex items-center space-x-3 flex-1">
                {/* Option number */}
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    status === "correct"
                      ? "bg-green-100 text-green-700"
                      : status === "incorrect"
                        ? "bg-red-100 text-red-700"
                        : isSelected
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>

                {/* Radio button */}
                <input
                  type="radio"
                  name={`exercise-${exercise.id}`}
                  value={option}
                  checked={isSelected}
                  onChange={(e) => onAnswerChange(e.target.value)}
                  disabled={disabled}
                  className="text-blue-600 focus:ring-blue-500"
                />

                {/* Option text */}
                <span className="flex-1 text-left">{option}</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2">
                {/* Pronunciation button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    playPronunciation(option);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>

                {/* Feedback icons */}
                {showFeedback && (
                  <>
                    {status === "correct" && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {status === "incorrect" && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Vocabulary hints */}
      {exercise.vocabulary && exercise.vocabulary.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">
            Related vocabulary:
          </span>
          <div className="flex flex-wrap gap-2">
            {exercise.vocabulary.map((word, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {word}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Feedback section */}
      {showFeedback && (
        <div
          className={`p-4 rounded-lg border ${
            isCorrect
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          {isCorrect ? (
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Correct!</p>
                <p className="text-sm opacity-90">
                  Great job! You selected the right answer.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-red-800">
              <XCircle className="h-5 w-5 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium">Not quite right</p>
                <p className="text-sm">
                  The correct answer is:{" "}
                  <strong>{exercise.correctAnswer}</strong>
                </p>
                {exercise.explanation && (
                  <p className="text-sm opacity-90">
                    💡 {exercise.explanation}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
