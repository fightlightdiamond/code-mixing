"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, VolumeX, X, Loader2 } from "lucide-react";
import { useVocabularyAudio } from "../hooks/useVocabularyAudio";
import type { VocabularyPopupProps } from "../types/learning";

export function VocabularyPopup({
  word,
  isOpen,
  onClose,
  position,
  vocabularyData,
  isLoading = false,
}: VocabularyPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const { audioState, playPronunciation, stopPronunciation } =
    useVocabularyAudio();

  // Adjust popup position to stay within viewport
  useEffect(() => {
    if (!isOpen || !popupRef.current) return;

    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newX = position.x;
    let newY = position.y;

    // Adjust horizontal position
    if (newX + rect.width > viewportWidth - 20) {
      newX = viewportWidth - rect.width - 20;
    }
    if (newX < 20) {
      newX = 20;
    }

    // Adjust vertical position (show above the word if not enough space below)
    if (newY + rect.height > viewportHeight - 20) {
      newY = position.y - rect.height - 10;
    }
    if (newY < 20) {
      newY = 20;
    }

    setAdjustedPosition({ x: newX, y: newY });
  }, [isOpen, position]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle pronunciation playback
  const handlePlayPronunciation = async () => {
    if (audioState.isPlaying) {
      stopPronunciation();
    } else {
      await playPronunciation(word, vocabularyData?.audioUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" />

      {/* Popup */}
      <div
        ref={popupRef}
        className="fixed z-50 w-80 max-w-sm"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          transform: "translateX(-50%)",
        }}
      >
        <Card className="shadow-lg border-2 border-blue-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
                {word}
                {vocabularyData?.pronunciation && (
                  <span className="text-sm font-normal text-gray-600">
                    /{vocabularyData.pronunciation}/
                  </span>
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                {(vocabularyData?.audioUrl || "speechSynthesis" in window) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlayPronunciation}
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                    title={audioState.isPlaying ? "Dừng phát âm" : "Phát âm"}
                    disabled={audioState.isLoading}
                  >
                    {audioState.isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                    ) : audioState.isPlaying ? (
                      <VolumeX className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-blue-600" />
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  title="Đóng"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Audio Error Display */}
            {audioState.error && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                {audioState.error}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-sm text-gray-600">
                  Đang tải định nghĩa...
                </span>
              </div>
            ) : vocabularyData ? (
              <div className="space-y-3">
                {/* Meaning */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">
                    Nghĩa:
                  </h4>
                  <p className="text-sm text-gray-800">
                    {vocabularyData.meaning}
                  </p>
                </div>

                {/* Example */}
                {vocabularyData.example && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">
                      Ví dụ:
                    </h4>
                    <p className="text-sm text-gray-600 italic">
                      "{vocabularyData.example}"
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      // TODO: Mark as learning/reviewing
                      console.log("Mark as learning:", word);
                    }}
                  >
                    Đang học
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      // TODO: Mark as mastered
                      console.log("Mark as mastered:", word);
                    }}
                  >
                    Đã thuộc
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Không tìm thấy định nghĩa cho từ "{word}"
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Add to vocabulary list for manual definition
                    console.log("Add to vocabulary list:", word);
                  }}
                >
                  Thêm vào danh sách từ vựng
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Arrow pointing to the word */}
        <div
          className="absolute w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-blue-200"
          style={{ left: "50%", top: "-8px", transform: "translateX(-50%)" }}
        />
      </div>
    </>
  );
}
