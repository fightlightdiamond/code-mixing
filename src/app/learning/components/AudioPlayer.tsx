"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
  Bookmark,
} from "lucide-react";
import { useAudioProgress } from "../hooks/useAudioProgress";
import { BookmarkPanel } from "./BookmarkPanel";
import type { StoryChunk } from "../types/learning";

interface AudioPlayerProps {
  audioUrl: string;
  chunks: StoryChunk[];
  storyId: string;
  onChunkHighlight: (chunkIndex: number) => void;
  className?: string;
}

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentChunk: number;
  isLoading: boolean;
  error: string | null;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
}

const PLAYBACK_RATES = [0.5, 1, 1.5, 2];

// Memoized AudioPlayer component for performance
export const AudioPlayer = React.memo(function AudioPlayer({
  audioUrl,
  chunks,
  storyId,
  onChunkHighlight,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentChunk: 0,
    isLoading: true,
    error: null,
    isMuted: false,
    volume: 1,
    playbackRate: 1,
  });
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Audio progress persistence
  const {
    progress,
    actions: progressActions,
    utils: { formatTime, getProgressPercentage },
  } = useAudioProgress({ storyId });

  // Initialize audio element with preloading optimization
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const handleLoadStart = () => {
      setAudioState((prev) => ({ ...prev, isLoading: true, error: null }));
    };

    const handleLoadedData = () => {
      setAudioState((prev) => ({
        ...prev,
        isLoading: false,
        duration: audio.duration,
      }));

      // Restore saved position
      if (
        progress.currentPosition > 0 &&
        progress.currentPosition < audio.duration
      ) {
        audio.currentTime = progress.currentPosition;
      }
    };

    const handleCanPlayThrough = () => {
      // Audio is ready to play through without buffering
      setAudioState((prev) => ({ ...prev, isLoading: false }));
    };

    const handleError = () => {
      setAudioState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Không thể tải file âm thanh",
      }));
    };

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      setAudioState((prev) => ({
        ...prev,
        currentTime,
      }));

      // Update progress
      progressActions.updatePosition(currentTime);
    };

    const handleEnded = () => {
      setAudioState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
    };

    const handleWaiting = () => {
      setAudioState((prev) => ({ ...prev, isLoading: true }));
    };

    const handleCanPlay = () => {
      setAudioState((prev) => ({ ...prev, isLoading: false }));
    };

    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);
    audio.addEventListener("error", handleError);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);

    // Set initial source with preload optimization
    audio.src = audioUrl;
    audio.preload = "auto"; // Preload the entire audio file
    audio.load();

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [audioUrl, progress.currentPosition, progressActions]);

  // Sync chunk highlighting with audio time
  useEffect(() => {
    if (!chunks.length) return;

    // Simple time-based chunk calculation
    // In a real implementation, you'd have timing data for each chunk
    const chunkDuration = audioState.duration / chunks.length;
    const currentChunkIndex = Math.floor(
      audioState.currentTime / chunkDuration
    );

    if (
      currentChunkIndex !== audioState.currentChunk &&
      currentChunkIndex < chunks.length
    ) {
      setAudioState((prev) => ({ ...prev, currentChunk: currentChunkIndex }));
      onChunkHighlight(currentChunkIndex);
    }
  }, [
    audioState.currentChunk,
    audioState.currentTime,
    audioState.duration,
    chunks,
    onChunkHighlight,
  ]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioState.isPlaying) {
      audio.pause();
      setAudioState((prev) => ({ ...prev, isPlaying: false }));
      // Save position when pausing
      progressActions.updatePosition(audio.currentTime);
    } else {
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
        setAudioState((prev) => ({
          ...prev,
          error: "Không thể phát âm thanh",
        }));
      });
      setAudioState((prev) => ({ ...prev, isPlaying: true }));
    }
  }, [audioState.isPlaying, progressActions]);

  const handleSeek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setAudioState((prev) => ({ ...prev, currentTime: time }));
  }, []);

  const skipBackward = useCallback(() => {
    const newTime = Math.max(0, audioState.currentTime - 10);
    handleSeek(newTime);
  }, [audioState.currentTime, handleSeek]);

  const skipForward = useCallback(() => {
    const newTime = Math.min(audioState.duration, audioState.currentTime + 10);
    handleSeek(newTime);
  }, [audioState.currentTime, audioState.duration, handleSeek]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const newMuted = !audioState.isMuted;
    audio.muted = newMuted;
    setAudioState((prev) => ({ ...prev, isMuted: newMuted }));
  }, [audioState.isMuted]);

  const handleVolumeChange = useCallback((volume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    setAudioState((prev) => ({ ...prev, volume, isMuted: volume === 0 }));
  }, []);

  const changePlaybackRate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentIndex = PLAYBACK_RATES.indexOf(audioState.playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    const newRate = PLAYBACK_RATES[nextIndex];

    audio.playbackRate = newRate;
    setAudioState((prev) => ({ ...prev, playbackRate: newRate }));
  }, [audioState.playbackRate]);

  const resetAudio = useCallback(() => {
    handleSeek(0);
    setAudioState((prev) => ({ ...prev, isPlaying: false }));
    audioRef.current?.pause();
  }, [handleSeek]);

  const addBookmark = useCallback(() => {
    progressActions.addBookmark(audioState.currentTime);
  }, [audioState.currentTime, progressActions]);

  const handleJumpToBookmark = useCallback(
    (bookmarkId: string) => {
      const position = progressActions.jumpToBookmark(bookmarkId);
      if (position !== null) {
        handleSeek(position);
      }
    },
    [progressActions, handleSeek]
  );

  if (audioState.error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-red-600">
            <Volume2 className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{audioState.error}</p>
            <Button
              variant="outline"
              size="sm"
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
    <Card className={className}>
      <CardContent className="p-4">
        <audio ref={audioRef} preload="metadata" />

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{formatTime(audioState.currentTime)}</span>
            <span>{formatTime(audioState.duration)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 cursor-pointer">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  audioState.duration > 0
                    ? (audioState.currentTime / audioState.duration) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Skip Backward */}
            <Button
              variant="ghost"
              size="sm"
              onClick={skipBackward}
              disabled={audioState.isLoading}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            {/* Play/Pause */}
            <Button
              variant="default"
              size="sm"
              onClick={togglePlayPause}
              disabled={audioState.isLoading}
              className="px-3"
            >
              {audioState.isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : audioState.isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            {/* Skip Forward */}
            <Button
              variant="ghost"
              size="sm"
              onClick={skipForward}
              disabled={audioState.isLoading}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            {/* Reset */}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAudio}
              disabled={audioState.isLoading}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            {/* Add Bookmark */}
            <Button
              variant="ghost"
              size="sm"
              onClick={addBookmark}
              disabled={audioState.isLoading}
              title="Thêm bookmark"
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Bookmarks Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBookmarks(!showBookmarks)}
              disabled={audioState.isLoading}
              className={`text-xs px-2 ${showBookmarks ? "bg-blue-100" : ""}`}
            >
              {progress.bookmarks.length} BM
            </Button>

            {/* Playback Speed */}
            <Button
              variant="ghost"
              size="sm"
              onClick={changePlaybackRate}
              disabled={audioState.isLoading}
              className="text-xs px-2"
            >
              {audioState.playbackRate}x
            </Button>

            {/* Volume */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              disabled={audioState.isLoading}
            >
              {audioState.isMuted || audioState.volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Current Chunk Info */}
        {chunks.length > 0 && (
          <div className="mt-3 text-xs text-gray-500 text-center">
            Đoạn {audioState.currentChunk + 1} / {chunks.length}
            {progress.currentPosition > 0 && (
              <span className="ml-2">
                • Tiến độ:{" "}
                {getProgressPercentage(audioState.duration).toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </CardContent>

      {/* Bookmark Panel */}
      {showBookmarks && (
        <div className="mt-4">
          <BookmarkPanel
            bookmarks={progress.bookmarks}
            currentPosition={audioState.currentTime}
            onAddBookmark={progressActions.addBookmark}
            onRemoveBookmark={progressActions.removeBookmark}
            onUpdateBookmarkNote={progressActions.updateBookmarkNote}
            onJumpToBookmark={handleJumpToBookmark}
            formatTime={formatTime}
          />
        </div>
      )}
    </Card>
  );
});
