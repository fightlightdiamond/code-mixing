"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Zap } from "lucide-react";
import type { StoryCardProps } from "../types/learning";

export function StoryCard({ story, onSelect, className }: StoryCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200";
      case "elementary":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "upper_intermediate":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200";
      case "proficient":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStoryTypeLabel = (storyType: string) => {
    switch (storyType) {
      case "original":
        return "Gốc";
      case "chemdanhtu":
        return "Chêm danh từ";
      case "chemdongtu":
        return "Chêm động từ";
      case "chemtinhtu":
        return "Chêm tính từ";
      case "custom":
        return "Tùy chỉnh";
      default:
        return "Khác";
    }
  };

  const formatDifficulty = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "Mới bắt đầu";
      case "elementary":
        return "Cơ bản";
      case "intermediate":
        return "Trung cấp";
      case "upper_intermediate":
        return "Trung cấp cao";
      case "advanced":
        return "Nâng cao";
      case "proficient":
        return "Thành thạo";
      default:
        return difficulty;
    }
  };

  // Extract preview text from story content (first 150 characters)
  const previewText =
    story.content.length > 150
      ? story.content.substring(0, 150) + "..."
      : story.content;

  return (
    <Card
      className={cn(
        "h-full transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer",
        "border-gray-200 hover:border-blue-300",
        className
      )}
      onClick={() => onSelect(story)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
            {story.title}
          </CardTitle>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 text-xs",
              getDifficultyColor(story.difficulty)
            )}
          >
            {formatDifficulty(story.difficulty)}
          </Badge>
        </div>

        {/* Story metadata */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          {story.estimatedMinutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{story.estimatedMinutes} phút</span>
            </div>
          )}
          {story.wordCount && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>{story.wordCount} từ</span>
            </div>
          )}
          {story.chemRatio && (
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>{Math.round(story.chemRatio * 100)}% chêm</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Story preview */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{previewText}</p>

        {/* Story type and lesson info */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary" className="text-xs">
            {getStoryTypeLabel(story.storyType)}
          </Badge>
          {story.lesson && (
            <span className="text-xs text-gray-500">
              Bài: {story.lesson.title}
            </span>
          )}
        </div>

        {/* Action button */}
        <Button
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(story);
          }}
        >
          Đọc truyện
        </Button>
      </CardContent>
    </Card>
  );
}
