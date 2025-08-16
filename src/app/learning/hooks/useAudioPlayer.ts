"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { StoryChunk } from "../types/learning";

interface AudioPlayerState {
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

interface UseAudioPlayerOptions {
  chunks: StoryChunk[];
  onChunkHighlight?: (chunkIndex: number) => void;
  onPositionSave?: (position: number) => void;
  initialPosition?: number;
}

export function useAudioPlayer({
  chunks,
  onChunkHighlight,
  onPositionSave,
  initialPosition = 0,
}: UseAudioPlayerOptions) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: initialPosition,
    duration: 0,
    currentChunk: 0,
    isLoading: true,
    error: null,
    isMuted: false,
    volume: 1,
    playbackRate: 1,
  });

  // Save position periodically
  useEffect(() => {
    if (onPositionSave && state.currentTime > 0) {
      const saveInterval = setInterval(() => {
        onPositionSave(state.currentTime);
      }, 5000); // Save every 5 seconds

      return () => clearInterval(saveInterval);
    }
  }, [state.currentTime, onPositionSave]);

  // Restore initial position
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && initialPosition > 0 && state.duration > 0) {
      audio.currentTime = initialPosition;
    }
  }, [initialPosition, state.duration]);

  // Sync chunk highlighting
  useEffect(() => {
    if (!chunks.length || !onChunkHighlight) return;

    // Calculate current chunk based on time
    // This is a simple implementation - in reality you'd have timing data
    const chunkDuration = state.duration / chunks.length;
    const currentChunkIndex = Math.floor(state.currentTime / chunkDuration);

    if (
      currentChunkIndex !== state.currentChunk &&
      currentChunkIndex < chunks.length &&
      currentChunkIndex >= 0
    ) {
      setState((prev) => ({ ...prev, currentChunk: currentChunkIndex }));
      onChunkHighlight(currentChunkIndex);
    }
  }, [
    state.currentTime,
    state.duration,
    chunks,
    onChunkHighlight,
    state.currentChunk,
  ]);

  const loadAudio = useCallback((audioUrl: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const handleLoadStart = () => {
      setState((prev) => ({ ...prev, isLoading: true }));
    };

    const handleLoadedData = () => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        duration: audio.duration,
      }));
    };

    const handleError = () => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Không thể tải file âm thanh",
      }));
    };

    const handleTimeUpdate = () => {
      setState((prev) => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    };

    const handleEnded = () => {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
    };

    // Clean up previous listeners
    audio.removeEventListener("loadstart", handleLoadStart);
    audio.removeEventListener("loadeddata", handleLoadedData);
    audio.removeEventListener("error", handleError);
    audio.removeEventListener("timeupdate", handleTimeUpdate);
    audio.removeEventListener("ended", handleEnded);

    // Add new listeners
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("error", handleError);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    audio.src = audioUrl;
    audio.load();
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setState((prev) => ({ ...prev, isPlaying: true }));
    } catch (error) {
      console.error("Error playing audio:", error);
      setState((prev) => ({
        ...prev,
        error: "Không thể phát âm thanh",
      }));
    }
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setState((prev) => ({ ...prev, isPlaying: false }));

    // Save position when pausing
    if (onPositionSave) {
      onPositionSave(state.currentTime);
    }
  }, [state.currentTime, onPositionSave]);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      const clampedTime = Math.max(0, Math.min(time, state.duration));
      audio.currentTime = clampedTime;
      setState((prev) => ({ ...prev, currentTime: clampedTime }));
    },
    [state.duration]
  );

  const skipBackward = useCallback(
    (seconds: number = 10) => {
      const newTime = Math.max(0, state.currentTime - seconds);
      seek(newTime);
    },
    [state.currentTime, seek]
  );

  const skipForward = useCallback(
    (seconds: number = 10) => {
      const newTime = Math.min(state.duration, state.currentTime + seconds);
      seek(newTime);
    },
    [state.currentTime, state.duration, seek]
  );

  const setVolume = useCallback((volume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));
    audio.volume = clampedVolume;
    setState((prev) => ({
      ...prev,
      volume: clampedVolume,
      isMuted: clampedVolume === 0,
    }));
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const newMuted = !state.isMuted;
    audio.muted = newMuted;
    setState((prev) => ({ ...prev, isMuted: newMuted }));
  }, [state.isMuted]);

  const setPlaybackRate = useCallback((rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    setState((prev) => ({ ...prev, playbackRate: rate }));
  }, []);

  const reset = useCallback(() => {
    seek(0);
    pause();
  }, [seek, pause]);

  return {
    audioRef,
    state,
    actions: {
      loadAudio,
      play,
      pause,
      togglePlayPause,
      seek,
      skipBackward,
      skipForward,
      setVolume,
      toggleMute,
      setPlaybackRate,
      reset,
    },
  };
}
