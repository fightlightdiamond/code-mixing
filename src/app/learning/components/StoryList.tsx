"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { StoryCard } from "./StoryCard";
import type {
  StoryListProps,
  StoryFilters,
  UserLearningPreferences,
} from "../types/learning";
import type { DifficultyLevel, StoryType } from "@prisma/client";

interface ExtendedStoryListProps extends StoryListProps {
  userPreferences?: UserLearningPreferences;
  showRecommended?: boolean;
}

export function StoryList({
  stories,
  onStorySelect,
  selectedLevel,
  searchQuery = "",
  className,
  userPreferences,
  showRecommended = false,
}: ExtendedStoryListProps) {
  const [filters, setFilters] = useState<StoryFilters>({
    level: selectedLevel || userPreferences?.difficultyLevel,
    search: searchQuery,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort stories based on current filters and user preferences
  const filteredStories = useMemo(() => {
    let filtered = stories.filter((story) => {
      // Level filter
      if (filters.level && story.difficulty !== filters.level) {
        return false;
      }

      // Story type filter
      if (filters.storyType && story.storyType !== filters.storyType) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = story.title.toLowerCase().includes(searchLower);
        const matchesContent = story.content
          .toLowerCase()
          .includes(searchLower);
        const matchesLesson = story.lesson?.title
          .toLowerCase()
          .includes(searchLower);

        if (!matchesTitle && !matchesContent && !matchesLesson) {
          return false;
        }
      }

      // Word count filters
      if (
        filters.minWordCount &&
        story.wordCount &&
        story.wordCount < filters.minWordCount
      ) {
        return false;
      }
      if (
        filters.maxWordCount &&
        story.wordCount &&
        story.wordCount > filters.maxWordCount
      ) {
        return false;
      }

      return true;
    });

    // Sort stories based on user preferences
    if (userPreferences && showRecommended) {
      filtered = filtered.sort((a, b) => {
        // Calculate recommendation score for each story
        const scoreA = calculateRecommendationScore(a, userPreferences);
        const scoreB = calculateRecommendationScore(b, userPreferences);
        return scoreB - scoreA; // Higher score first
      });
    }

    return filtered;
  }, [stories, filters, userPreferences, showRecommended]);

  // Calculate how well a story matches user preferences
  const calculateRecommendationScore = (
    story: any,
    preferences: UserLearningPreferences
  ): number => {
    let score = 0;

    // Difficulty level match (highest priority)
    if (story.difficulty === preferences.difficultyLevel) {
      score += 50;
    }

    // Topic preferences match
    if (preferences.topicPreferences.includes(story.storyType)) {
      score += 30;
    }

    // Embedding ratio match (if available)
    if (story.chemRatio && preferences.embeddingRatio) {
      const ratioDiff = Math.abs(story.chemRatio - preferences.embeddingRatio);
      if (ratioDiff <= 5) score += 20;
      else if (ratioDiff <= 10) score += 10;
      else if (ratioDiff <= 15) score += 5;
    }

    return score;
  };

  const updateFilter = (key: keyof StoryFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== "" && value !== null
  );

  const difficultyLevels: { value: DifficultyLevel; label: string }[] = [
    { value: "beginner", label: "Mới bắt đầu" },
    { value: "elementary", label: "Cơ bản" },
    { value: "intermediate", label: "Trung cấp" },
    { value: "upper_intermediate", label: "Trung cấp cao" },
    { value: "advanced", label: "Nâng cao" },
    { value: "proficient", label: "Thành thạo" },
  ];

  const storyTypes: { value: StoryType; label: string }[] = [
    { value: "original", label: "Truyện gốc" },
    { value: "chemdanhtu", label: "Chêm danh từ" },
    { value: "chemdongtu", label: "Chêm động từ" },
    { value: "chemtinhtu", label: "Chêm tính từ" },
    { value: "custom", label: "Tùy chỉnh" },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search and Filter Header */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm truyện theo tên, nội dung hoặc bài học..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        {/* Filter Toggle and Active Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Bộ lọc
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1 text-gray-600"
              >
                <X className="h-3 w-3" />
                Xóa bộ lọc
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-600">
            {filteredStories.length} truyện
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.level && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Cấp độ:{" "}
                {difficultyLevels.find((d) => d.value === filters.level)?.label}
                <button
                  onClick={() => updateFilter("level", undefined)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.storyType && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Loại:{" "}
                {storyTypes.find((t) => t.value === filters.storyType)?.label}
                <button
                  onClick={() => updateFilter("storyType", undefined)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Expandable Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            {/* Difficulty Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cấp độ
              </label>
              <Select
                value={filters.level || ""}
                onValueChange={(value) =>
                  updateFilter("level", value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn cấp độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  {difficultyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Story Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại truyện
              </label>
              <Select
                value={filters.storyType || ""}
                onValueChange={(value) =>
                  updateFilter("storyType", value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  {storyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Min Word Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số từ tối thiểu
              </label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minWordCount || ""}
                onChange={(e) =>
                  updateFilter(
                    "minWordCount",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
              />
            </div>

            {/* Max Word Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số từ tối đa
              </label>
              <Input
                type="number"
                placeholder="1000"
                value={filters.maxWordCount || ""}
                onChange={(e) =>
                  updateFilter(
                    "maxWordCount",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Stories Grid */}
      {filteredStories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <StoryCard key={story.id} story={story} onSelect={onStorySelect} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không tìm thấy truyện nào
          </h3>
          <p className="text-gray-600 mb-4">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Xóa tất cả bộ lọc
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
