"use client";

import React from "react";
import { Cloud, CloudOff, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useOfflineProgress } from "../hooks/useOfflineProgress";
import { useOfflineManager } from "../hooks/useOfflineManager";
import { SyncStatusPanel } from "./SyncStatusPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OfflineProgressIndicatorProps {
  userId: string;
  className?: string;
  showDetails?: boolean;
}

export function OfflineProgressIndicator({
  userId,
  className,
  showDetails = false,
}: OfflineProgressIndicatorProps) {
  const { isOnline } = useOfflineManager();
  const { hasPendingSync, lastSyncTime, offlineData, currentSession } =
    useOfflineProgress(userId);

  const formatLastSync = (date: Date | null): string => {
    if (!date) return "Never";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getSyncStatus = () => {
    if (!isOnline) {
      return {
        icon: CloudOff,
        text: "Offline",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
      };
    }

    if (hasPendingSync) {
      return {
        icon: Clock,
        text: "Sync Pending",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      };
    }

    return {
      icon: CheckCircle,
      text: "Synced",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    };
  };

  const syncStatus = getSyncStatus();
  const Icon = syncStatus.icon;

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge
          variant="outline"
          className={`${syncStatus.color} ${syncStatus.bgColor} ${syncStatus.borderColor}`}
        >
          <Icon className="h-3 w-3 mr-1" />
          {syncStatus.text}
        </Badge>

        {currentSession && (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Learning session active
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${syncStatus.color}`} />
          Progress Sync Status
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <span>Status:</span>
          <Badge
            variant="outline"
            className={`${syncStatus.color} ${syncStatus.bgColor} ${syncStatus.borderColor}`}
          >
            {syncStatus.text}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span>Last Sync:</span>
          <span className="text-sm text-gray-600">
            {formatLastSync(lastSyncTime)}
          </span>
        </div>

        {/* Current Session */}
        {currentSession && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Current Learning Session</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Story ID:</span>
                <span className="text-gray-600">{currentSession.storyId}</span>
              </div>
              <div className="flex justify-between">
                <span>Started:</span>
                <span className="text-gray-600">
                  {currentSession.startTime.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Words Encountered:</span>
                <span className="text-gray-600">
                  {currentSession.wordsEncountered.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Exercises Completed:</span>
                <span className="text-gray-600">
                  {currentSession.exercisesCompleted.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Offline Progress Summary */}
        {offlineData.learningProgress && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Offline Progress</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-blue-600">
                  {offlineData.learningProgress.storiesRead}
                </div>
                <div className="text-gray-600">Stories Read</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">
                  {offlineData.vocabularyProgress.length}
                </div>
                <div className="text-gray-600">Words Learned</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-purple-600">
                  {offlineData.exerciseResults.length}
                </div>
                <div className="text-gray-600">Exercises Done</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-orange-600">
                  {offlineData.learningProgress.totalTimeSpent}m
                </div>
                <div className="text-gray-600">Time Spent</div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Sync Warning */}
        {hasPendingSync && !isOnline && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-800">Sync Pending</p>
                <p className="text-orange-700">
                  Your progress will sync automatically when you&apos;re back
                  online.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sync Status */}
        <div className="border-t pt-4">
          <SyncStatusPanel userId={userId} compact={true} />
        </div>
      </CardContent>
    </Card>
  );
}
