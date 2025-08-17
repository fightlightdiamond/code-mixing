"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  User,
  Settings,
  RefreshCw,
  TrendingUp,
  Trophy,
  BookOpen,
  Brain,
} from "lucide-react";
import { ProgressTracker } from "./ProgressTracker";

// Mock user data for demonstration
const mockUsers = [
  {
    id: "user-1",
    name: "Alice Johnson",
    level: 3,
    avatar: "👩‍🎓",
    description: "Active learner with consistent progress",
  },
  {
    id: "user-2",
    name: "Bob Smith",
    level: 1,
    avatar: "👨‍💼",
    description: "New learner just getting started",
  },
  {
    id: "user-3",
    name: "Carol Davis",
    level: 5,
    avatar: "👩‍🏫",
    description: "Advanced learner with multiple achievements",
  },
];

export default function ProgressTrackerExample() {
  const [selectedUser, setSelectedUser] = useState(mockUsers[0]);
  const [showDetailed, setShowDetailed] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleUserChange = (user: (typeof mockUsers)[0]) => {
    setSelectedUser(user);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Progress Tracker Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600 max-w-3xl">
              Comprehensive learning progress tracking with detailed analytics,
              achievements, vocabulary progress, and personalized insights.
              Switch between different user profiles to see various progress
              states.
            </p>

            {/* Demo Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Select User:
                </span>
                <div className="flex gap-2">
                  {mockUsers.map((user) => (
                    <Button
                      key={user.id}
                      variant={
                        selectedUser.id === user.id ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleUserChange(user)}
                      className="flex items-center gap-2"
                    >
                      <span>{user.avatar}</span>
                      <span>{user.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        L{user.level}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">View:</span>
                <Button
                  variant={showDetailed ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowDetailed(!showDetailed)}
                >
                  {showDetailed ? "Detailed" : "Simple"}
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Demo
              </Button>
            </div>

            {/* Selected User Info */}
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{selectedUser.avatar}</div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {selectedUser.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedUser.description}
                  </div>
                </div>
                <Badge variant="outline" className="ml-auto">
                  Level {selectedUser.level}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <div className="font-semibold text-blue-800">
                  Progress Analytics
                </div>
                <div className="text-sm text-blue-600">
                  Comprehensive tracking
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-green-600" />
              <div>
                <div className="font-semibold text-green-800">Achievements</div>
                <div className="text-sm text-green-600">Unlock rewards</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-600" />
              <div>
                <div className="font-semibold text-purple-800">Vocabulary</div>
                <div className="text-sm text-purple-600">Word mastery</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-orange-600" />
              <div>
                <div className="font-semibold text-orange-800">Insights</div>
                <div className="text-sm text-orange-600">
                  AI recommendations
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Progress Tracker */}
      <div className="bg-white rounded-lg border shadow-sm">
        <ProgressTracker
          key={`${selectedUser.id}-${refreshKey}`}
          userId={selectedUser.id}
          showDetailed={showDetailed}
          className="p-6"
        />
      </div>

      {/* Feature Details */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Tracker Features</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="vocabulary">Vocabulary</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Progress Tracking
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Overall learning progress percentage</li>
                    <li>• Level progression with XP tracking</li>
                    <li>• Stories completed and time spent</li>
                    <li>• Learning streak monitoring</li>
                    <li>• Performance metrics and analytics</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Real-time Updates
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Live progress synchronization</li>
                    <li>• Offline data support</li>
                    <li>• Activity timeline tracking</li>
                    <li>• Learning velocity calculations</li>
                    <li>• Consistency score monitoring</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Achievement System
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>
                      • Categorized achievements (reading, vocabulary, streak,
                      etc.)
                    </li>
                    <li>• Progress-based unlocking system</li>
                    <li>• Visual achievement notifications</li>
                    <li>• Achievement history and timestamps</li>
                    <li>• Experience points rewards</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Motivation Features
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Streak tracking and rewards</li>
                    <li>• Level progression system</li>
                    <li>• Performance badges</li>
                    <li>• Milestone celebrations</li>
                    <li>• Social sharing capabilities</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vocabulary" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Vocabulary Analytics
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Word mastery level tracking</li>
                    <li>
                      • Learning status categorization (new, reviewing,
                      mastered)
                    </li>
                    <li>• Spaced repetition scheduling</li>
                    <li>• Accuracy and attempt statistics</li>
                    <li>• Mastery distribution visualization</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Learning Insights
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Recent vocabulary progress</li>
                    <li>• Review scheduling optimization</li>
                    <li>• Difficulty progression tracking</li>
                    <li>• Word encounter frequency</li>
                    <li>• Retention rate analysis</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    AI-Powered Insights
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Personalized learning recommendations</li>
                    <li>• Strong areas identification</li>
                    <li>• Improvement area suggestions</li>
                    <li>• Learning velocity analysis</li>
                    <li>• Consistency score evaluation</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Adaptive Learning
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Difficulty progression recommendations</li>
                    <li>• Content type suggestions</li>
                    <li>• Study time optimization</li>
                    <li>• Learning path customization</li>
                    <li>• Performance prediction</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Technical Implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">
                Data Management
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Real-time progress synchronization</li>
                <li>• Offline data persistence</li>
                <li>• Optimistic updates</li>
                <li>• Background sync</li>
                <li>• Error handling & retry</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Performance</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Lazy loading components</li>
                <li>• Memoized calculations</li>
                <li>• Efficient re-renders</li>
                <li>• Data caching strategies</li>
                <li>• Bundle optimization</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">
                User Experience
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Responsive design</li>
                <li>• Accessibility compliance</li>
                <li>• Loading states</li>
                <li>• Error boundaries</li>
                <li>• Smooth animations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
