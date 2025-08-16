"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProgress } from "../hooks/useProgress";
import { MemoizedVirtualScrollList } from "./VirtualScrollList";
import type { VocabularyProgress, VocabularyStatus } from "../types/learning";

interface VocabularyProgressManagerProps {
  userId: string;
  className?: string;
}

// Memoized component for performance optimization
export const VocabularyProgressManager = React.memo(
  function VocabularyProgressManager({
    userId,
    className,
  }: VocabularyProgressManagerProps) {
    const {
      vocabularyProgress,
      isLoading,
      error,
      actions: { updateVocabularyProgress, markVocabularyMastered },
      utils: { getVocabularyForReview, calculateNextReview },
    } = useProgress({ userId });

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<VocabularyStatus | "all">(
      "all"
    );
    const [sortBy, setSortBy] = useState<
      "word" | "status" | "lastReviewed" | "masteryLevel"
    >("lastReviewed");

    // Filter and sort vocabulary
    const filteredVocabulary = useMemo(() => {
      let filtered = vocabularyProgress;

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter((vocab) =>
          vocab.word.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Apply status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter((vocab) => vocab.status === statusFilter);
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "word":
            return a.word.localeCompare(b.word);
          case "status":
            const statusOrder = { new: 0, reviewing: 1, mastered: 2 };
            return statusOrder[a.status] - statusOrder[b.status];
          case "lastReviewed":
            return (
              new Date(b.lastReviewed).getTime() -
              new Date(a.lastReviewed).getTime()
            );
          case "masteryLevel":
            return b.masteryLevel - a.masteryLevel;
          default:
            return 0;
        }
      });

      return filtered;
    }, [vocabularyProgress, searchQuery, statusFilter, sortBy]);

    // Get vocabulary due for review
    const vocabularyForReview = useMemo(() => {
      return getVocabularyForReview();
    }, [getVocabularyForReview]);

    // Get status counts
    const statusCounts = useMemo(() => {
      return vocabularyProgress.reduce(
        (counts, vocab) => {
          counts[vocab.status] = (counts[vocab.status] || 0) + 1;
          return counts;
        },
        {} as Record<VocabularyStatus, number>
      );
    }, [vocabularyProgress]);

    const handleStartReview = async (word: string) => {
      // This would typically open a review interface
      // For now, we'll just mark it as reviewed
      await updateVocabularyProgress(word, true, 30); // Assume 30 seconds spent
    };

    const handleMarkMastered = async (word: string) => {
      await markVocabularyMastered(word);
    };

    const getStatusColor = (status: VocabularyStatus): string => {
      switch (status) {
        case "new":
          return "bg-blue-100 text-blue-800";
        case "reviewing":
          return "bg-yellow-100 text-yellow-800";
        case "mastered":
          return "bg-green-100 text-green-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    const getStatusText = (status: VocabularyStatus): string => {
      switch (status) {
        case "new":
          return "Mới";
        case "reviewing":
          return "Đang ôn";
        case "mastered":
          return "Đã thuộc";
        default:
          return status;
      }
    };

    const formatDate = (date: Date): string => {
      return new Date(date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    };

    const isOverdue = (nextReview: Date): boolean => {
      return new Date(nextReview) < new Date();
    };

    if (isLoading) {
      return (
        <div className={`space-y-4 ${className}`}>
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <Card className={className}>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Review Alert */}
        {vocabularyForReview.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800 flex items-center gap-2">
                ⏰ Từ vựng cần ôn tập
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 mb-3">
                Bạn có {vocabularyForReview.length} từ cần ôn tập hôm nay
              </p>
              <div className="flex flex-wrap gap-2">
                {vocabularyForReview.slice(0, 10).map((vocab) => (
                  <Button
                    key={vocab.word}
                    variant="outline"
                    size="sm"
                    className="text-orange-800 border-orange-300 hover:bg-orange-100"
                    onClick={() => handleStartReview(vocab.word)}
                  >
                    {vocab.word}
                    {isOverdue(vocab.nextReview) && (
                      <span className="ml-1 text-red-500">!</span>
                    )}
                  </Button>
                ))}
                {vocabularyForReview.length > 10 && (
                  <span className="text-orange-600 text-sm self-center">
                    +{vocabularyForReview.length - 10} từ khác
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {statusCounts.new || 0}
                </div>
                <div className="text-sm text-gray-600">Từ mới</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {statusCounts.reviewing || 0}
                </div>
                <div className="text-sm text-gray-600">Đang ôn</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {statusCounts.mastered || 0}
                </div>
                <div className="text-sm text-gray-600">Đã thuộc</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {vocabularyProgress.length}
                </div>
                <div className="text-sm text-gray-600">Tổng từ</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Quản lý từ vựng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Tìm kiếm từ vựng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as VocabularyStatus | "all")
                }
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="new">Từ mới</SelectItem>
                  <SelectItem value="reviewing">Đang ôn</SelectItem>
                  <SelectItem value="mastered">Đã thuộc</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as typeof sortBy)}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="word">Từ A-Z</SelectItem>
                  <SelectItem value="status">Trạng thái</SelectItem>
                  <SelectItem value="lastReviewed">Ôn gần nhất</SelectItem>
                  <SelectItem value="masteryLevel">Độ thành thạo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vocabulary List with Virtual Scrolling */}
            {filteredVocabulary.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Không tìm thấy từ vựng nào</p>
                <p className="text-sm">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
              </div>
            ) : (
              <MemoizedVirtualScrollList
                items={filteredVocabulary}
                itemHeight={120} // Approximate height of each vocabulary card
                containerHeight={600} // Fixed height for virtual scrolling
                className="border rounded-lg"
                renderItem={(vocab, index) => (
                  <VocabularyCard
                    key={vocab.word}
                    vocab={vocab}
                    onStartReview={handleStartReview}
                    onMarkMastered={handleMarkMastered}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                    formatDate={formatDate}
                    isOverdue={isOverdue}
                  />
                )}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

// Memoized vocabulary card component for virtual scrolling
const VocabularyCard = React.memo(function VocabularyCard({
  vocab,
  onStartReview,
  onMarkMastered,
  getStatusColor,
  getStatusText,
  formatDate,
  isOverdue,
}: {
  vocab: VocabularyProgress;
  onStartReview: (word: string) => void;
  onMarkMastered: (word: string) => void;
  getStatusColor: (status: VocabularyStatus) => string;
  getStatusText: (status: VocabularyStatus) => string;
  formatDate: (date: Date) => string;
  isOverdue: (date: Date) => boolean;
}) {
  return (
    <Card className="p-4 m-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg">{vocab.word}</h3>
            <Badge className={getStatusColor(vocab.status)}>
              {getStatusText(vocab.status)}
            </Badge>
            {vocab.status === "reviewing" && isOverdue(vocab.nextReview) && (
              <Badge variant="destructive" className="text-xs">
                Quá hạn
              </Badge>
            )}
          </div>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Độ thành thạo:</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${vocab.masteryLevel}%` }}
                  ></div>
                </div>
                <span className="text-xs">{vocab.masteryLevel}%</span>
              </div>
            </div>

            <div>
              <span className="font-medium">Lần gặp:</span> {vocab.encounters}
              <br />
              <span className="font-medium">Đúng/Tổng:</span>{" "}
              {vocab.correctAnswers}/{vocab.totalAttempts}
            </div>

            <div>
              <span className="font-medium">Ôn lần cuối:</span>
              <br />
              {formatDate(vocab.lastReviewed)}
              {vocab.status === "reviewing" && (
                <>
                  <br />
                  <span className="font-medium">Ôn tiếp theo:</span>
                  <br />
                  <span
                    className={
                      isOverdue(vocab.nextReview) ? "text-red-600" : ""
                    }
                  >
                    {formatDate(vocab.nextReview)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-4">
          {vocab.status === "reviewing" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStartReview(vocab.word)}
              className={
                isOverdue(vocab.nextReview)
                  ? "border-orange-300 text-orange-700"
                  : ""
              }
            >
              Ôn tập
            </Button>
          )}

          {vocab.status !== "mastered" && vocab.masteryLevel >= 80 && (
            <Button
              size="sm"
              variant="outline"
              className="border-green-300 text-green-700"
              onClick={() => onMarkMastered(vocab.word)}
            >
              Đánh dấu thuộc
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
});
