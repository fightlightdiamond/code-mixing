"use client";

import React from "react";
import { StoryReaderContainer } from "./components/StoryReaderContainer";
import type { LearningStory } from "./types/learning";

// Test story data
const testStory: LearningStory = {
  id: "test-story-1",
  title: "Test Story with Embedded Words",
  content: "This is a test story content.",
  storyType: "chem" as any,
  difficulty: "beginner" as any,
  estimatedMinutes: 5,
  wordCount: 50,
  chemRatio: 0.2,
  chunks: [
    {
      id: "chunk-1",
      chunkOrder: 1,
      chunkText: "Xin chào, tôi là một student đang học English.",
      type: "chem" as any,
    },
    {
      id: "chunk-2",
      chunkOrder: 2,
      chunkText: "Hôm nay tôi sẽ đi đến library để đọc sách.",
      type: "chem" as any,
    },
    {
      id: "chunk-3",
      chunkOrder: 3,
      chunkText: "Đây là một câu bình thường không có từ tiếng Anh.",
      type: "normal" as any,
    },
  ],
};

export default function TestStoryReader() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Test Story Reader</h1>
      <StoryReaderContainer story={testStory} />
    </div>
  );
}
