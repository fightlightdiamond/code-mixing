"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, RotateCcw, Play } from "lucide-react";
import ExercisePanel from "./ExercisePanel";
import type { Exercise, ExerciseResult } from "../types/learning";

// Sample exercises for demonstration
const sampleExercises: Exercise[] = [
  {
    id: "ex1",
    type: "fill_blank",
    question: "The quick brown fox _____ over the lazy dog.",
    correctAnswer: "jumps",
    explanation: "The verb 'jumps' is in present tense, third person singular.",
    vocabulary: ["jumps", "runs", "leaps", "hops"],
  },
  {
    id: "ex2",
    type: "multiple_choice",
    question: "Which word is a synonym for 'happy'?",
    options: ["sad", "joyful", "angry", "tired"],
    correctAnswer: "joyful",
    explanation: "Joyful means feeling or expressing great happiness.",
    vocabulary: ["joyful", "cheerful", "delighted"],
  },
  {
    id: "ex3",
    type: "drag_drop",
    question: "Arrange these words to form a grammatically correct sentence:",
    options: ["She", "reads", "books", "every", "day"],
    correctAnswer: ["She", "reads", "books", "every", "day"],
    explanation:
      "The correct sentence structure is: Subject + Verb + Object + Time expression.",
    vocabulary: ["reads", "books", "every", "day"],
  },
  {
    id: "ex4",
    type: "fill_blank",
    question: "I _____ to the store yesterday to buy some groceries.",
    correctAnswer: "went",
    explanation: "Use 'went' as the past tense of 'go'.",
    vocabulary: ["went", "go", "going", "gone"],
  },
  {
    id: "ex5",
    type: "multiple_choice",
    question: "What is the plural form of 'child'?",
    options: ["childs", "children", "childes", "child"],
    correctAnswer: "children",
    explanation: "'Children' is the irregular plural form of 'child'.",
    vocabulary: ["child", "children", "kids"],
  },
];

export default function ExercisePanelExample() {
  const [isStarted, setIsStarted] = useState(false);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleExerciseResult = (result: ExerciseResult) => {
    console.log("Exercise result:", result);
    setResults((prev) => [
      ...prev.filter((r) => r.exerciseId !== result.exerciseId),
      result,
    ]);
  };

  const handleComplete = (allResults: ExerciseResult[]) => {
    console.log("All exercises completed:", allResults);
    setResults(allResults);
    setIsCompleted(true);
  };

  const handleReset = () => {
    setIsStarted(false);
    setResults([]);
    setIsCompleted(false);
  };

  const handleStart = () => {
    setIsStarted(true);
    setIsCompleted(false);
  };

  if (!isStarted) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              Exercise Panel Demo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Story-Based Learning Exercises
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Practice your English skills with interactive exercises based on
                the story you just read. Complete fill-in-the-blank, multiple
                choice, and drag-and-drop exercises to reinforce your learning.
              </p>
            </div>

            {/* Exercise Types Preview */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">Ab</span>
                  </div>
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Fill in the Blank
                  </h3>
                  <p className="text-sm text-blue-700">
                    Complete sentences by filling in missing words
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <h3 className="font-semibold text-green-800 mb-2">
                    Multiple Choice
                  </h3>
                  <p className="text-sm text-green-700">
                    Select the correct answer from multiple options
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold">⇄</span>
                  </div>
                  <h3 className="font-semibold text-purple-800 mb-2">
                    Drag & Drop
                  </h3>
                  <p className="text-sm text-purple-700">
                    Arrange words or phrases in the correct order
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Exercise Stats */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                What you'll practice:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {sampleExercises.length}
                  </div>
                  <div className="text-sm text-gray-600">Exercises</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {sampleExercises.filter((ex) => ex.vocabulary).length}
                  </div>
                  <div className="text-sm text-gray-600">With Vocabulary</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">3</div>
                  <div className="text-sm text-gray-600">Exercise Types</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">~5</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Features:</h3>
              <div className="grid md:grid-cols-2 gap-2">
                {[
                  "⏱️ Real-time timer tracking",
                  "🔄 Retry incorrect answers",
                  "💡 Vocabulary hints and pronunciation",
                  "📊 Progress tracking and statistics",
                  "♿ Full accessibility support",
                  "🎯 Immediate feedback and explanations",
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Button onClick={handleStart} size="lg" className="px-8">
                <Play className="h-5 w-5 mr-2" />
                Start Exercises
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    const correctAnswers = results.filter((r) => r.isCorrect).length;
    const totalTime = results.reduce((sum, r) => sum + r.timeSpent, 0);
    const averageTime = Math.round(totalTime / results.length / 1000);
    const score = Math.round((correctAnswers / results.length) * 100);

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              Exercise Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="text-6xl font-bold text-green-600">{score}%</div>
              <h2 className="text-2xl font-bold text-gray-800">
                Great job! You completed all exercises.
              </h2>
              <p className="text-gray-600">
                {correctAnswers} out of {results.length} exercises answered
                correctly
              </p>
            </div>

            {/* Performance Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.floor(totalTime / 60000)}:
                    {((totalTime % 60000) / 1000).toFixed(0).padStart(2, "0")}
                  </div>
                  <div className="text-sm text-blue-700">Total Time</div>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {averageTime}s
                  </div>
                  <div className="text-sm text-green-700">
                    Average per Exercise
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {results.reduce((sum, r) => sum + r.attempts, 0)}
                  </div>
                  <div className="text-sm text-purple-700">Total Attempts</div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Results */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">
                Exercise Breakdown:
              </h3>
              {results.map((result, index) => {
                const exercise = sampleExercises.find(
                  (ex) => ex.id === result.exerciseId
                );
                return (
                  <Card
                    key={result.exerciseId}
                    className="border-l-4 border-l-gray-200"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              result.isCorrect
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">
                              {exercise?.type.replace("_", " ").toUpperCase()}{" "}
                              Exercise
                            </div>
                            <div className="text-sm text-gray-600 truncate max-w-md">
                              {exercise?.question}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <Badge
                            variant={
                              result.isCorrect ? "default" : "destructive"
                            }
                          >
                            {result.isCorrect ? "Correct" : "Incorrect"}
                          </Badge>
                          <span className="text-gray-500">
                            {Math.round(result.timeSpent / 1000)}s
                          </span>
                          {result.attempts > 1 && (
                            <Badge variant="outline">
                              {result.attempts} attempts
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center">
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="px-8"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ExercisePanel
        storyId="demo-story"
        exercises={sampleExercises}
        onComplete={handleComplete}
        onExerciseResult={handleExerciseResult}
        className="shadow-lg"
      />

      {/* Reset button for demo */}
      <div className="mt-6 text-center">
        <Button onClick={handleReset} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Demo
        </Button>
      </div>
    </div>
  );
}
