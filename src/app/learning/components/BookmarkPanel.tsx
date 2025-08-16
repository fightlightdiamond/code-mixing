"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Bookmark,
  BookmarkPlus,
  Play,
  Trash2,
  Edit3,
  Check,
  X,
} from "lucide-react";
import type { AudioBookmark } from "../hooks/useAudioProgress";

interface BookmarkPanelProps {
  bookmarks: AudioBookmark[];
  currentPosition: number;
  onAddBookmark: (position: number, note?: string) => void;
  onRemoveBookmark: (bookmarkId: string) => void;
  onUpdateBookmarkNote: (bookmarkId: string, note: string) => void;
  onJumpToBookmark: (bookmarkId: string) => void;
  formatTime: (seconds: number) => string;
  className?: string;
}

export function BookmarkPanel({
  bookmarks,
  currentPosition,
  onAddBookmark,
  onRemoveBookmark,
  onUpdateBookmarkNote,
  onJumpToBookmark,
  formatTime,
  className,
}: BookmarkPanelProps) {
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [newBookmarkNote, setNewBookmarkNote] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddBookmark = () => {
    onAddBookmark(currentPosition, newBookmarkNote.trim() || undefined);
    setNewBookmarkNote("");
    setShowAddForm(false);
  };

  const handleStartEdit = (bookmark: AudioBookmark) => {
    setEditingBookmark(bookmark.id);
    setEditNote(bookmark.note || "");
  };

  const handleSaveEdit = () => {
    if (editingBookmark) {
      onUpdateBookmarkNote(editingBookmark, editNote.trim());
      setEditingBookmark(null);
      setEditNote("");
    }
  };

  const handleCancelEdit = () => {
    setEditingBookmark(null);
    setEditNote("");
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Bookmark ({bookmarks.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1"
          >
            <BookmarkPlus className="h-4 w-4" />
            Thêm
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Add Bookmark Form */}
        {showAddForm && (
          <div className="mb-4 p-3 border rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">
                Vị trí: {formatTime(currentPosition)}
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ghi chú (tùy chọn)"
                value={newBookmarkNote}
                onChange={(e) => setNewBookmarkNote(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddBookmark();
                  } else if (e.key === "Escape") {
                    setShowAddForm(false);
                    setNewBookmarkNote("");
                  }
                }}
              />
              <Button size="sm" onClick={handleAddBookmark}>
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewBookmarkNote("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Bookmarks List */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Chưa có bookmark nào</p>
            <p className="text-xs mt-1">
              Thêm bookmark để đánh dấu những phần quan trọng
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks
              .sort((a, b) => a.position - b.position)
              .map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-blue-600">
                        {formatTime(bookmark.position)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {bookmark.timestamp.toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    {editingBookmark === bookmark.id ? (
                      <div className="flex gap-1">
                        <Input
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Ghi chú"
                          className="text-xs h-7"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit();
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          className="h-7 px-2"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-7 px-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600">
                        {bookmark.note || "Không có ghi chú"}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onJumpToBookmark(bookmark.id)}
                      className="h-7 w-7 p-0"
                      title="Chuyển đến vị trí này"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(bookmark)}
                      className="h-7 w-7 p-0"
                      title="Chỉnh sửa ghi chú"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveBookmark(bookmark.id)}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      title="Xóa bookmark"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
