"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, BookOpen, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { useOfflineManager } from "../hooks/useOfflineManager";
import type { LearningStory } from "../types/learning";

export default function OfflinePage() {
  const { isOnline, getOfflineStories } = useOfflineManager();
  const [offlineStories, setOfflineStories] = useState<string[]>([]);

  useEffect(() => {
    const loadOfflineStories = async () => {
      const stories = await getOfflineStories();
      setOfflineStories(stories);
    };

    loadOfflineStories();
  }, [getOfflineStories]);

  const handleGoOnline = () => {
    if (isOnline) {
      window.location.href = "/learning";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <WifiOff className="h-16 w-16 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">You're Offline</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Don't worry! You can continue learning with your downloaded stories.
            Your progress will sync automatically when you're back online.
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex justify-center">
          <OfflineIndicator showDetails={false} />
        </div>

        {/* Offline Content */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Available Stories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Available Stories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {offlineStories.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    You have {offlineStories.length} stories available for
                    offline reading.
                  </p>
                  <Button
                    onClick={() => (window.location.href = "/learning")}
                    className="w-full"
                  >
                    Continue Learning
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <Download className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-600">
                    No stories downloaded for offline reading.
                  </p>
                  <p className="text-xs text-gray-500">
                    Download stories when you're online to read them offline.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Storage Info */}
          <Card>
            <CardHeader>
              <CardTitle>Offline Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <OfflineIndicator showDetails={true} />
            </CardContent>
          </Card>
        </div>

        {/* Tips for Offline Learning */}
        <Card>
          <CardHeader>
            <CardTitle>Offline Learning Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">What works offline:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Reading downloaded stories</li>
                  <li>• Viewing cached vocabulary definitions</li>
                  <li>• Playing downloaded audio</li>
                  <li>• Completing exercises</li>
                  <li>• Tracking progress locally</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">What requires internet:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Downloading new stories</li>
                  <li>• Syncing progress to cloud</li>
                  <li>• Loading new vocabulary</li>
                  <li>• Accessing leaderboards</li>
                  <li>• Getting new recommendations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Online Button */}
        {isOnline && (
          <div className="text-center">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <p className="text-green-800 font-medium">
                    🎉 You're back online!
                  </p>
                  <p className="text-sm text-green-700">
                    Your progress will sync automatically. You can now access
                    all features.
                  </p>
                  <Button
                    onClick={handleGoOnline}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Return to Learning
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
