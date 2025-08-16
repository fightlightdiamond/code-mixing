"use client";

import React from "react";
import { Wifi, WifiOff, Download, HardDrive } from "lucide-react";
import { useOfflineManager } from "../hooks/useOfflineManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineIndicator({
  className,
  showDetails = false,
}: OfflineIndicatorProps) {
  const {
    isOnline,
    isServiceWorkerReady,
    cacheStatus,
    getCacheStatus,
    clearCache,
  } = useOfflineManager();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStorageUsagePercentage = (used: number, max: number): number => {
    return Math.round((used / max) * 100);
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isOnline ? (
          <div className="flex items-center gap-1 text-green-600">
            <Wifi className="h-4 w-4" />
            <span className="text-sm">Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-orange-600">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm">Offline</span>
          </div>
        )}

        {isServiceWorkerReady && cacheStatus && (
          <Badge variant="secondary" className="text-xs">
            <HardDrive className="h-3 w-3 mr-1" />
            {cacheStatus.cachedStories} stories cached
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-orange-600" />
          )}
          Connection Status
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span>Network Status:</span>
          <Badge variant={isOnline ? "default" : "secondary"}>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span>Offline Support:</span>
          <Badge variant={isServiceWorkerReady ? "default" : "destructive"}>
            {isServiceWorkerReady ? "Ready" : "Not Available"}
          </Badge>
        </div>

        {/* Cache Status */}
        {isServiceWorkerReady && cacheStatus && (
          <>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Offline Storage
              </h4>

              <div className="space-y-3">
                {/* Stories Cache */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Stories ({cacheStatus.cachedStories} items)</span>
                    <span>{formatBytes(cacheStatus.storyCacheSize)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${getStorageUsagePercentage(
                          cacheStatus.storyCacheSize,
                          cacheStatus.maxSizes.story
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Audio Cache */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Audio ({cacheStatus.cachedAudioFiles} files)</span>
                    <span>{formatBytes(cacheStatus.audioCacheSize)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${getStorageUsagePercentage(
                          cacheStatus.audioCacheSize,
                          cacheStatus.maxSizes.audio
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* API Cache */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>
                      API Data ({cacheStatus.cachedApiResponses} responses)
                    </span>
                    <span>{formatBytes(cacheStatus.apiCacheSize)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${getStorageUsagePercentage(
                          cacheStatus.apiCacheSize,
                          cacheStatus.maxSizes.api
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Total Usage */}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total Storage Used:</span>
                    <span>{formatBytes(cacheStatus.totalSize)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={getCacheStatus}
                className="flex-1"
              >
                Refresh Status
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => clearCache("all")}
                className="flex-1"
              >
                Clear Cache
              </Button>
            </div>
          </>
        )}

        {/* Offline Learning Tip */}
        {!isOnline && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <strong>Offline Mode:</strong> You can continue learning with
              downloaded stories. Your progress will sync when you're back
              online.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
