"use client";

import React, { useState } from "react";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Settings,
} from "lucide-react";
import { useDataSync } from "../hooks/useDataSync";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SyncStatusPanelProps {
  userId: string;
  className?: string;
  compact?: boolean;
}

export function SyncStatusPanel({
  userId,
  className,
  compact = false,
}: SyncStatusPanelProps) {
  const {
    syncStatus,
    conflicts,
    syncData,
    resolveConflicts,
    canSync,
    hasConflicts,
  } = useDataSync(userId);

  const [showConflictResolution, setShowConflictResolution] = useState(false);
  const [conflictResolutions, setConflictResolutions] = useState<{
    [key: string]: "local" | "server" | "merge";
  }>({});

  const handleManualSync = async () => {
    await syncData(true);
  };

  const handleResolveConflicts = async () => {
    await resolveConflicts(conflictResolutions);
    setShowConflictResolution(false);
    setConflictResolutions({});
  };

  const handleConflictResolutionChange = (
    conflictKey: string,
    resolution: "local" | "server" | "merge"
  ) => {
    setConflictResolutions((prev) => ({
      ...prev,
      [conflictKey]: resolution,
    }));
  };

  const getSyncStatusIcon = () => {
    if (syncStatus.isActive) return Loader2;
    if (syncStatus.error) return AlertTriangle;
    if (hasConflicts) return Settings;
    if (syncStatus.lastSyncTime) return CheckCircle;
    return Cloud;
  };

  const getSyncStatusColor = () => {
    if (syncStatus.isActive) return "text-blue-600";
    if (syncStatus.error) return "text-red-600";
    if (hasConflicts) return "text-yellow-600";
    if (syncStatus.lastSyncTime) return "text-green-600";
    return "text-gray-600";
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "Never";
    return date.toLocaleTimeString();
  };

  if (compact) {
    const Icon = getSyncStatusIcon();
    const colorClass = getSyncStatusColor();

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Icon
          className={`h-4 w-4 ${colorClass} ${syncStatus.isActive ? "animate-spin" : ""}`}
        />

        {syncStatus.isActive ? (
          <span className="text-sm text-gray-600">Syncing...</span>
        ) : syncStatus.error ? (
          <Badge variant="destructive" className="text-xs">
            Sync Error
          </Badge>
        ) : hasConflicts ? (
          <Badge variant="secondary" className="text-xs">
            Conflicts
          </Badge>
        ) : canSync ? (
          <Badge variant="outline" className="text-xs">
            Sync Available
          </Badge>
        ) : (
          <Badge variant="default" className="text-xs">
            Synced
          </Badge>
        )}

        {canSync && !syncStatus.isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualSync}
            disabled={syncStatus.isActive}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Data Synchronization
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <span>Status:</span>
          <div className="flex items-center gap-2">
            {React.createElement(getSyncStatusIcon(), {
              className: `h-4 w-4 ${getSyncStatusColor()} ${syncStatus.isActive ? "animate-spin" : ""}`,
            })}
            <span className="text-sm">
              {syncStatus.isActive
                ? "Syncing"
                : syncStatus.error
                  ? "Error"
                  : hasConflicts
                    ? "Conflicts"
                    : canSync
                      ? "Ready to sync"
                      : "Up to date"}
            </span>
          </div>
        </div>

        {/* Sync Progress */}
        {syncStatus.isActive && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{syncStatus.currentStep}</span>
              <span>{syncStatus.progress}%</span>
            </div>
            <Progress value={syncStatus.progress} className="h-2" />
          </div>
        )}

        {/* Last Sync Time */}
        <div className="flex items-center justify-between">
          <span>Last Sync:</span>
          <span className="text-sm text-gray-600">
            {formatTime(syncStatus.lastSyncTime)}
          </span>
        </div>

        {/* Next Auto Sync */}
        {syncStatus.nextAutoSync && (
          <div className="flex items-center justify-between">
            <span>Next Auto Sync:</span>
            <span className="text-sm text-gray-600">
              {formatTime(syncStatus.nextAutoSync)}
            </span>
          </div>
        )}

        {/* Error Display */}
        {syncStatus.error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{syncStatus.error}</AlertDescription>
          </Alert>
        )}

        {/* Conflicts Alert */}
        {hasConflicts && !showConflictResolution && (
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  {conflicts.length} data conflict
                  {conflicts.length > 1 ? "s" : ""} detected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConflictResolution(true)}
                >
                  Resolve
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Conflict Resolution */}
        {showConflictResolution && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Resolve Data Conflicts</h4>

            {conflicts.map((conflict, index) => {
              const conflictKey = `${conflict.type}_${conflict.field}`;

              return (
                <div key={index} className="space-y-2 p-3 border rounded-lg">
                  <div className="font-medium text-sm">
                    {conflict.type.replace("_", " ")} - {conflict.field}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium">Local:</span>{" "}
                      {JSON.stringify(conflict.localData)}
                    </div>
                    <div>
                      <span className="font-medium">Server:</span>{" "}
                      {JSON.stringify(conflict.serverData)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={
                        conflictResolutions[conflictKey] === "local"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        handleConflictResolutionChange(conflictKey, "local")
                      }
                    >
                      Use Local
                    </Button>
                    <Button
                      variant={
                        conflictResolutions[conflictKey] === "server"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        handleConflictResolutionChange(conflictKey, "server")
                      }
                    >
                      Use Server
                    </Button>
                    <Button
                      variant={
                        conflictResolutions[conflictKey] === "merge"
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        handleConflictResolutionChange(conflictKey, "merge")
                      }
                    >
                      Merge
                    </Button>
                  </div>
                </div>
              );
            })}

            <div className="flex gap-2">
              <Button
                onClick={handleResolveConflicts}
                disabled={
                  Object.keys(conflictResolutions).length !== conflicts.length
                }
              >
                Apply Resolutions
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConflictResolution(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Manual Sync Button */}
        {canSync && !syncStatus.isActive && !hasConflicts && (
          <Button
            onClick={handleManualSync}
            disabled={syncStatus.isActive}
            className="w-full"
          >
            {syncStatus.isActive ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Now
          </Button>
        )}

        {/* Sync Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Data syncs automatically when online</p>
          <p>• Conflicts occur when data changes on multiple devices</p>
          <p>• Your progress is always saved locally first</p>
        </div>
      </CardContent>
    </Card>
  );
}
