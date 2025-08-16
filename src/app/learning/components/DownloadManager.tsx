"use client";
import { logger } from '@/lib/logger';

import React, { useState } from "react";
import {
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useOfflineManager } from "../hooks/useOfflineManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { LearningStory } from "../types/learning";

interface DownloadManagerProps {
  stories: LearningStory[];
  className?: string;
}

export function DownloadManager({ stories, className }: DownloadManagerProps) {
  const {
    downloadQueue,
    isDownloading,
    downloadStory,
    removeFromDownloadQueue,
    isServiceWorkerReady,
    isOnline,
  } = useOfflineManager();

  const [selectedStories, setSelectedStories] = useState<Set<string>>(
    new Set()
  );

  const handleStorySelect = (storyId: string, selected: boolean) => {
    const newSelection = new Set(selectedStories);
    if (selected) {
      newSelection.add(storyId);
    } else {
      newSelection.delete(storyId);
    }
    setSelectedStories(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedStories.size === stories.length) {
      setSelectedStories(new Set());
    } else {
      setSelectedStories(new Set(stories.map((story) => story.id)));
    }
  };

  const handleDownloadSelected = async () => {
    for (const storyId of selectedStories) {
      const story = stories.find((s) => s.id === storyId);
      if (story) {
        try {
          await downloadStory(story);
        } catch (error) {
          logger.error(`Failed to download story ${storyId}:`, error);
        }
      }
    }
    setSelectedStories(new Set());
  };

  const getStoryDownloadStatus = (storyId: string) => {
    return downloadQueue.find((item) => item.storyId === storyId);
  };

  const formatFileSize = (story: LearningStory): string => {
    // Estimate file size based on content length and audio
    const textSize = story.content.length * 2; // Rough estimate for UTF-8
    const audioSize = story.estimatedMinutes
      ? story.estimatedMinutes * 1024 * 1024
      : 0; // ~1MB per minute
    const totalSize = textSize + audioSize;

    if (totalSize < 1024) return `${totalSize} B`;
    if (totalSize < 1024 * 1024) return `${Math.round(totalSize / 1024)} KB`;
    return `${Math.round(totalSize / (1024 * 1024))} MB`;
  };

  if (!isServiceWorkerReady) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Offline functionality is not available. Please refresh the page to
          enable offline downloads.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Download for Offline Reading
        </CardTitle>

        {!isOnline && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You're currently offline. Downloads will start when connection is
              restored.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bulk Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                selectedStories.size === stories.length && stories.length > 0
              }
              onChange={handleSelectAll}
              className="rounded"
            />
            <span className="text-sm">
              Select All ({selectedStories.size} of {stories.length} selected)
            </span>
          </div>

          <Button
            onClick={handleDownloadSelected}
            disabled={selectedStories.size === 0 || isDownloading || !isOnline}
            size="sm"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download Selected
          </Button>
        </div>

        {/* Story List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {stories.map((story) => {
            const downloadStatus = getStoryDownloadStatus(story.id);
            const isSelected = selectedStories.has(story.id);

            return (
              <div
                key={story.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) =>
                    handleStorySelect(story.id, e.target.checked)
                  }
                  disabled={downloadStatus?.status === "downloading"}
                  className="rounded"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{story.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {story.difficulty}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{story.wordCount} words</span>
                    <span>{story.estimatedMinutes} min</span>
                    <span>{formatFileSize(story)}</span>
                  </div>

                  {/* Download Progress */}
                  {downloadStatus && (
                    <div className="mt-2">
                      {downloadStatus.status === "downloading" && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Downloading...</span>
                            <span>{downloadStatus.progress}%</span>
                          </div>
                          <Progress
                            value={downloadStatus.progress}
                            className="h-1"
                          />
                        </div>
                      )}

                      {downloadStatus.status === "completed" && (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>Downloaded</span>
                        </div>
                      )}

                      {downloadStatus.status === "error" && (
                        <div className="flex items-center gap-1 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>Error: {downloadStatus.error}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Individual Actions */}
                <div className="flex items-center gap-1">
                  {downloadStatus?.status === "completed" ? (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Downloaded
                    </Badge>
                  ) : downloadStatus?.status === "downloading" ? (
                    <Badge variant="secondary" className="text-xs">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Downloading
                    </Badge>
                  ) : downloadStatus?.status === "error" ? (
                    <div className="flex gap-1">
                      <Badge variant="destructive" className="text-xs">
                        Error
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromDownloadQueue(story.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadStory(story)}
                      disabled={isDownloading || !isOnline}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Download Queue Summary */}
        {downloadQueue.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Download Queue</h4>
            <div className="space-y-2">
              {downloadQueue.map((item) => {
                const story = stories.find((s) => s.id === item.storyId);
                return (
                  <div
                    key={item.storyId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="truncate">
                      {story?.title || item.storyId}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.status === "downloading" && (
                        <>
                          <Progress
                            value={item.progress}
                            className="w-16 h-1"
                          />
                          <span className="text-xs">{item.progress}%</span>
                        </>
                      )}
                      <Badge
                        variant={
                          item.status === "completed"
                            ? "default"
                            : item.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {item.status}
                      </Badge>
                      {item.status !== "downloading" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromDownloadQueue(item.storyId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
