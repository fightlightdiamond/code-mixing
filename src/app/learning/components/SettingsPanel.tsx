"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Palette,
  Target,
  Volume2,
  BookOpen,
  Bell,
  Sliders,
} from "lucide-react";
import type {
  UserLearningPreferences,
  SettingsPanelProps,
  ThemePreference,
  ReviewFrequency,
} from "../types/learning";
import { DifficultyLevel, StoryType } from "@prisma/client";

const EMBEDDING_RATIO_OPTIONS = [
  { value: 10, label: "10% - Ít từ chêm" },
  { value: 15, label: "15% - Rất ít" },
  { value: 20, label: "20% - Ít" },
  { value: 25, label: "25% - Vừa phải" },
  { value: 30, label: "30% - Trung bình" },
  { value: 35, label: "35% - Nhiều" },
  { value: 40, label: "40% - Rất nhiều" },
  { value: 45, label: "45% - Cực nhiều" },
  { value: 50, label: "50% - Tối đa" },
];

const DIFFICULTY_LEVELS = [
  {
    value: "beginner" as DifficultyLevel,
    label: "Beginner - Người mới bắt đầu",
  },
  {
    value: "intermediate" as DifficultyLevel,
    label: "Intermediate - Trung cấp",
  },
  { value: "advanced" as DifficultyLevel, label: "Advanced - Nâng cao" },
];

const THEME_OPTIONS = [
  { value: "light" as ThemePreference, label: "Sáng" },
  { value: "dark" as ThemePreference, label: "Tối" },
  { value: "system" as ThemePreference, label: "Theo hệ thống" },
];

const STORY_TYPES = [
  { value: "original" as StoryType, label: "Truyện gốc" },
  { value: "chemdanhtu" as StoryType, label: "Chêm danh từ" },
  { value: "chemdongtu" as StoryType, label: "Chêm động từ" },
  { value: "chemtinhtu" as StoryType, label: "Chêm tính từ" },
  { value: "custom" as StoryType, label: "Tùy chỉnh" },
];

const REVIEW_FREQUENCY_OPTIONS = [
  { value: "daily" as ReviewFrequency, label: "Hàng ngày" },
  { value: "every_other_day" as ReviewFrequency, label: "Cách ngày" },
  { value: "weekly" as ReviewFrequency, label: "Hàng tuần" },
];

const PLAYBACK_SPEED_OPTIONS = [
  { value: 0.5, label: "0.5x - Chậm" },
  { value: 0.75, label: "0.75x - Hơi chậm" },
  { value: 1, label: "1x - Bình thường" },
  { value: 1.25, label: "1.25x - Hơi nhanh" },
  { value: 1.5, label: "1.5x - Nhanh" },
  { value: 2, label: "2x - Rất nhanh" },
];

const DAILY_GOAL_OPTIONS = [
  { value: 10, label: "10 phút/ngày" },
  { value: 15, label: "15 phút/ngày" },
  { value: 20, label: "20 phút/ngày" },
  { value: 30, label: "30 phút/ngày" },
  { value: 45, label: "45 phút/ngày" },
  { value: 60, label: "1 giờ/ngày" },
];

export function SettingsPanel({
  preferences,
  onPreferencesChange,
  onClose,
  className = "",
  isSaving = false,
}: SettingsPanelProps) {
  const [localPreferences, setLocalPreferences] =
    useState<UserLearningPreferences>(preferences);

  const handlePreferenceChange = <K extends keyof UserLearningPreferences>(
    key: K,
    value: UserLearningPreferences[K]
  ) => {
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTopicToggle = (topic: StoryType) => {
    const currentTopics = localPreferences.topicPreferences;
    const newTopics = currentTopics.includes(topic)
      ? currentTopics.filter((t) => t !== topic)
      : [...currentTopics, topic];

    handlePreferenceChange("topicPreferences", newTopics);
  };

  const handleSave = async () => {
    const success = await onPreferencesChange(localPreferences);
    if (success) {
      onClose();
    } else {
      alert("Không thể lưu cài đặt");
    }
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Cài đặt học tập
            </h2>
            <p className="text-gray-600 mt-1">
              Tùy chỉnh trải nghiệm học tập theo sở thích cá nhân
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-8">
            {/* Reading Preferences */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Tùy chỉnh đọc truyện</CardTitle>
                    <CardDescription>
                      Điều chỉnh cách hiển thị và độ khó của truyện
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Embedding Ratio */}
                <div className="space-y-2">
                  <Label htmlFor="embedding-ratio">
                    Tỷ lệ chêm từ tiếng Anh ({localPreferences.embeddingRatio}%)
                  </Label>
                  <div className="space-y-2">
                    <input
                      id="embedding-ratio"
                      type="range"
                      min="10"
                      max="50"
                      step="5"
                      value={localPreferences.embeddingRatio}
                      onChange={(e) =>
                        handlePreferenceChange(
                          "embeddingRatio",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>10% - Ít</span>
                      <span>30% - Vừa</span>
                      <span>50% - Nhiều</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Tỷ lệ từ tiếng Anh được chêm vào trong truyện. Tỷ lệ cao hơn
                    sẽ có nhiều từ vựng hơn để học.
                  </p>
                </div>

                {/* Difficulty Level */}
                <div className="space-y-2">
                  <Label htmlFor="difficulty-level">Cấp độ khó</Label>
                  <Select
                    value={localPreferences.difficultyLevel}
                    onValueChange={(value) =>
                      handlePreferenceChange(
                        "difficultyLevel",
                        value as DifficultyLevel
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn cấp độ khó" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600">
                    Chọn cấp độ khó phù hợp với trình độ hiện tại của bạn.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Theme Preferences */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Palette className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Giao diện</CardTitle>
                    <CardDescription>
                      Tùy chỉnh màu sắc và giao diện ứng dụng
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Chế độ giao diện</Label>
                  <Select
                    value={localPreferences.theme}
                    onValueChange={(value) =>
                      handlePreferenceChange("theme", value as ThemePreference)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn chế độ giao diện" />
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_OPTIONS.map((theme) => (
                        <SelectItem key={theme.value} value={theme.value}>
                          {theme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Topic Preferences */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Chủ đề yêu thích</CardTitle>
                    <CardDescription>
                      Chọn các chủ đề truyện bạn quan tâm để nhận gợi ý phù hợp
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {STORY_TYPES.map((type) => (
                    <div
                      key={type.value}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        localPreferences.topicPreferences.includes(type.value)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleTopicToggle(type.value)}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {type.label}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Chọn nhiều chủ đề để có thêm lựa chọn truyện đa dạng.
                </p>
              </CardContent>
            </Card>

            {/* Audio Preferences */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Volume2 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Cài đặt âm thanh</CardTitle>
                    <CardDescription>
                      Tùy chỉnh trải nghiệm âm thanh khi học
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Audio Enabled */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="audio-enabled">Bật âm thanh</Label>
                    <p className="text-sm text-gray-600">
                      Cho phép phát âm thanh khi đọc truyện và từ vựng
                    </p>
                  </div>
                  <input
                    id="audio-enabled"
                    type="checkbox"
                    checked={localPreferences.audioEnabled}
                    onChange={(e) =>
                      handlePreferenceChange("audioEnabled", e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>

                {/* Auto Play Audio */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-play">Tự động phát âm thanh</Label>
                    <p className="text-sm text-gray-600">
                      Tự động phát âm thanh khi mở truyện mới
                    </p>
                  </div>
                  <input
                    id="auto-play"
                    type="checkbox"
                    checked={localPreferences.autoPlayAudio}
                    onChange={(e) =>
                      handlePreferenceChange("autoPlayAudio", e.target.checked)
                    }
                    disabled={!localPreferences.audioEnabled}
                    className="h-4 w-4 text-blue-600 rounded disabled:opacity-50"
                  />
                </div>

                {/* Playback Speed */}
                <div className="space-y-2">
                  <Label htmlFor="playback-speed">Tốc độ phát âm thanh</Label>
                  <Select
                    value={localPreferences.playbackSpeed.toString()}
                    onValueChange={(value) =>
                      handlePreferenceChange("playbackSpeed", parseFloat(value))
                    }
                    disabled={!localPreferences.audioEnabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tốc độ phát" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAYBACK_SPEED_OPTIONS.map((speed) => (
                        <SelectItem
                          key={speed.value}
                          value={speed.value.toString()}
                        >
                          {speed.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Learning Goals */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Sliders className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <CardTitle>Mục tiêu học tập</CardTitle>
                    <CardDescription>
                      Thiết lập mục tiêu và lịch trình ôn tập
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Daily Goal */}
                <div className="space-y-2">
                  <Label htmlFor="daily-goal">Mục tiêu hàng ngày</Label>
                  <Select
                    value={localPreferences.dailyGoal.toString()}
                    onValueChange={(value) =>
                      handlePreferenceChange("dailyGoal", parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn mục tiêu hàng ngày" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAILY_GOAL_OPTIONS.map((goal) => (
                        <SelectItem
                          key={goal.value}
                          value={goal.value.toString()}
                        >
                          {goal.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Review Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="review-frequency">
                    Tần suất ôn tập từ vựng
                  </Label>
                  <Select
                    value={localPreferences.vocabularyReviewFrequency}
                    onValueChange={(value) =>
                      handlePreferenceChange(
                        "vocabularyReviewFrequency",
                        value as ReviewFrequency
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tần suất ôn tập" />
                    </SelectTrigger>
                    <SelectContent>
                      {REVIEW_FREQUENCY_OPTIONS.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Thông báo nhắc nhở</Label>
                    <p className="text-sm text-gray-600">
                      Nhận thông báo nhắc nhở học tập và ôn tập từ vựng
                    </p>
                  </div>
                  <input
                    id="notifications"
                    type="checkbox"
                    checked={localPreferences.notificationsEnabled}
                    onChange={(e) =>
                      handlePreferenceChange(
                        "notificationsEnabled",
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={handleReset}>
            Khôi phục mặc định
          </Button>
          <div className="space-x-3">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSaving}
            >
              {isSaving ? "Đang lưu..." : "Lưu cài đặt"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
