"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  GripVertical,
  RotateCcw,
  CheckCircle,
  XCircle,
  Volume2,
  Shuffle,
} from "lucide-react";
import type { Exercise } from "../../types/learning";

interface DragDropExerciseProps {
  exercise: Exercise;
  answer: string[];
  onAnswerChange: (value: string[]) => void;
  disabled: boolean;
  showFeedback?: boolean;
  isCorrect?: boolean;
}

export default function DragDropExercise({
  exercise,
  answer,
  onAnswerChange,
  disabled,
  showFeedback = false,
  isCorrect = false,
}: DragDropExerciseProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedFromIndex, setDraggedFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  const dragRef = useRef<HTMLDivElement>(null);
  const availableOptions = exercise.options || [];
  const currentAnswer = answer || [];

  // Initialize shuffled options
  useEffect(() => {
    if (availableOptions.length > 0) {
      const shuffled = [...availableOptions].sort(() => Math.random() - 0.5);
      setShuffledOptions(shuffled);
    }
  }, [availableOptions]);

  // Handle drag start
  const handleDragStart = (item: string, fromIndex?: number) => {
    if (disabled) return;
    setDraggedItem(item);
    setDraggedFromIndex(fromIndex ?? null);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (!draggedItem || disabled) return;

    const newAnswer = [...currentAnswer];

    // If dragging from answer area, remove from original position
    if (draggedFromIndex !== null) {
      newAnswer.splice(draggedFromIndex, 1);
      // Adjust drop index if needed
      if (dropIndex > draggedFromIndex) {
        dropIndex--;
      }
    }

    // Insert at new position
    newAnswer.splice(dropIndex, 0, draggedItem);

    onAnswerChange(newAnswer);

    // Reset drag state
    setDraggedItem(null);
    setDraggedFromIndex(null);
    setDragOverIndex(null);
  };

  // Handle drop in answer area
  const handleDropInAnswer = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (!draggedItem || disabled) return;

    const newAnswer = [...currentAnswer];

    // If dragging from answer area, reorder
    if (draggedFromIndex !== null) {
      const [removed] = newAnswer.splice(draggedFromIndex, 1);
      newAnswer.splice(index, 0, removed);
    } else {
      // If dragging from options, insert
      newAnswer.splice(index, 0, draggedItem);
    }

    onAnswerChange(newAnswer);

    // Reset drag state
    setDraggedItem(null);
    setDraggedFromIndex(null);
    setDragOverIndex(null);
  };

  // Remove item from answer
  const handleRemoveItem = (index: number) => {
    if (disabled) return;
    const newAnswer = [...currentAnswer];
    newAnswer.splice(index, 1);
    onAnswerChange(newAnswer);
  };

  // Clear all answers
  const handleClearAll = () => {
    if (disabled) return;
    onAnswerChange([]);
  };

  // Shuffle available options
  const handleShuffle = () => {
    if (disabled) return;
    const shuffled = [...shuffledOptions].sort(() => Math.random() - 0.5);
    setShuffledOptions(shuffled);
  };

  // Play pronunciation
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

  // Get available options (not in answer)
  const getAvailableOptions = () => {
    return shuffledOptions.filter((option) => !currentAnswer.includes(option));
  };

  // Get feedback for each position
  const getPositionFeedback = (index: number) => {
    if (!showFeedback || !Array.isArray(exercise.correctAnswer))
      return "default";

    const userItem = currentAnswer[index];
    const correctItem = exercise.correctAnswer[index];

    if (!userItem) return "empty";
    if (userItem === correctItem) return "correct";
    return "incorrect";
  };

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium leading-relaxed">
          {exercise.question}
        </h3>
        <p className="text-sm text-muted-foreground">
          Drag and drop the items to arrange them in the correct order
        </p>
      </div>

      {/* Available Options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            Available Options:
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShuffle}
            disabled={disabled}
            className="text-xs"
          >
            <Shuffle className="h-3 w-3 mr-1" />
            Shuffle
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {getAvailableOptions().map((option, index) => (
            <Card
              key={`${option}-${index}`}
              draggable={!disabled}
              onDragStart={() => handleDragStart(option)}
              className={`p-3 cursor-move select-none transition-all duration-200 ${
                disabled
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:shadow-md hover:bg-gray-50"
              } ${draggedItem === option ? "opacity-50 scale-95" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{option}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      playPronunciation(option);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Volume2 className="h-3 w-3" />
                  </Button>
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {getAvailableOptions().length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            All options have been used
          </div>
        )}
      </div>

      {/* Drop Zones / Answer Area */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            Arrange in correct order:
          </h4>
          {currentAnswer.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={disabled}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {Array.from({
            length: Math.max(
              3,
              currentAnswer.length + 1,
              Array.isArray(exercise.correctAnswer)
                ? exercise.correctAnswer.length
                : 3
            ),
          }).map((_, index) => {
            const item = currentAnswer[index];
            const feedback = getPositionFeedback(index);
            const isDragOver = dragOverIndex === index;

            return (
              <div
                key={index}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDropInAnswer(e, index)}
                className={`min-h-[60px] p-4 border-2 border-dashed rounded-lg flex items-center justify-between transition-all duration-200 ${
                  isDragOver
                    ? "border-blue-400 bg-blue-50"
                    : feedback === "correct"
                      ? "border-green-400 bg-green-50"
                      : feedback === "incorrect"
                        ? "border-red-400 bg-red-50"
                        : item
                          ? "border-gray-300 bg-gray-50"
                          : "border-gray-200 bg-gray-25"
                }`}
              >
                {item ? (
                  <>
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                          feedback === "correct"
                            ? "bg-green-100 text-green-700"
                            : feedback === "incorrect"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {index + 1}
                      </div>

                      <span
                        draggable={!disabled}
                        onDragStart={() => handleDragStart(item, index)}
                        className={`flex-1 cursor-move ${disabled ? "cursor-not-allowed" : ""}`}
                      >
                        {item}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Feedback icons */}
                      {showFeedback && (
                        <>
                          {feedback === "correct" && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {feedback === "incorrect" && (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </>
                      )}

                      {/* Remove button */}
                      {!disabled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                        >
                          ×
                        </Button>
                      )}

                      <GripVertical className="h-4 w-4 text-gray-400" />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <span className="text-sm">Drop item here</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
                <p className="font-medium">Perfect!</p>
                <p className="text-sm opacity-90">
                  You arranged all items in the correct order.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-red-800">
              <XCircle className="h-5 w-5 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium">Not quite right</p>
                <p className="text-sm">
                  The correct order is:{" "}
                  <strong>
                    {Array.isArray(exercise.correctAnswer)
                      ? exercise.correctAnswer.join(" → ")
                      : exercise.correctAnswer}
                  </strong>
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
