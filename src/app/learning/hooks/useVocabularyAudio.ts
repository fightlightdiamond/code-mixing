"use client";

import { useState, useCallback, useRef } from "react";

interface VocabularyAudioState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseVocabularyAudioOptions {
  cacheSize?: number;
}

export function useVocabularyAudio(options: UseVocabularyAudioOptions = {}) {
  const { cacheSize = 50 } = options;
  const [audioState, setAudioState] = useState<VocabularyAudioState>({
    isPlaying: false,
    isLoading: false,
    error: null,
  });

  // Audio cache to store loaded audio files
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  const playPronunciation = useCallback(
    async (word: string, audioUrl?: string) => {
      setAudioState({ isPlaying: false, isLoading: true, error: null });

      try {
        let audio: HTMLAudioElement;

        // Check if we have a cached audio for this word
        if (audioCache.current.has(word)) {
          audio = audioCache.current.get(word)!;
        } else if (audioUrl) {
          // Create new audio element
          audio = new Audio(audioUrl);

          // Cache the audio (with size limit)
          if (audioCache.current.size >= cacheSize) {
            // Remove oldest entry
            const firstKey = audioCache.current.keys().next().value;
            audioCache.current.delete(firstKey);
          }
          audioCache.current.set(word, audio);

          // Preload the audio
          audio.preload = "auto";
        } else {
          // Fallback to text-to-speech
          if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = "en-US";
            utterance.rate = 0.8;
            utterance.volume = 0.8;

            utterance.onstart = () => {
              setAudioState({ isPlaying: true, isLoading: false, error: null });
            };

            utterance.onend = () => {
              setAudioState({
                isPlaying: false,
                isLoading: false,
                error: null,
              });
            };

            utterance.onerror = () => {
              setAudioState({
                isPlaying: false,
                isLoading: false,
                error: "Không thể phát âm từ này",
              });
            };

            speechSynthesis.speak(utterance);
            return;
          } else {
            throw new Error(
              "Không có âm thanh và trình duyệt không hỗ trợ text-to-speech"
            );
          }
        }

        // Stop current audio if playing
        if (currentAudio.current && !currentAudio.current.paused) {
          currentAudio.current.pause();
          currentAudio.current.currentTime = 0;
        }

        currentAudio.current = audio;

        // Set up event listeners
        const handlePlay = () => {
          setAudioState({ isPlaying: true, isLoading: false, error: null });
        };

        const handleEnded = () => {
          setAudioState({ isPlaying: false, isLoading: false, error: null });
        };

        const handleError = () => {
          setAudioState({
            isPlaying: false,
            isLoading: false,
            error: "Không thể phát âm từ này",
          });
        };

        const handleLoadStart = () => {
          setAudioState({ isPlaying: false, isLoading: true, error: null });
        };

        audio.addEventListener("play", handlePlay);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);
        audio.addEventListener("loadstart", handleLoadStart);

        // Play the audio
        await audio.play();

        // Clean up listeners after playing
        setTimeout(() => {
          audio.removeEventListener("play", handlePlay);
          audio.removeEventListener("ended", handleEnded);
          audio.removeEventListener("error", handleError);
          audio.removeEventListener("loadstart", handleLoadStart);
        }, 1000);
      } catch (error) {
        console.error("Error playing pronunciation:", error);

        // Try fallback to text-to-speech
        if ("speechSynthesis" in window && audioUrl) {
          try {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = "en-US";
            utterance.rate = 0.8;
            utterance.volume = 0.8;

            utterance.onstart = () => {
              setAudioState({ isPlaying: true, isLoading: false, error: null });
            };

            utterance.onend = () => {
              setAudioState({
                isPlaying: false,
                isLoading: false,
                error: null,
              });
            };

            speechSynthesis.speak(utterance);
          } catch (ttsError) {
            setAudioState({
              isPlaying: false,
              isLoading: false,
              error: "Không thể phát âm từ này",
            });
          }
        } else {
          setAudioState({
            isPlaying: false,
            isLoading: false,
            error: "Không thể phát âm từ này",
          });
        }
      }
    },
    [cacheSize]
  );

  const stopPronunciation = useCallback(() => {
    if (currentAudio.current && !currentAudio.current.paused) {
      currentAudio.current.pause();
      currentAudio.current.currentTime = 0;
    }

    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
    }

    setAudioState({ isPlaying: false, isLoading: false, error: null });
  }, []);

  const preloadAudio = useCallback(
    async (word: string, audioUrl: string) => {
      if (audioCache.current.has(word)) return;

      try {
        const audio = new Audio(audioUrl);
        audio.preload = "auto";

        // Cache the audio (with size limit)
        if (audioCache.current.size >= cacheSize) {
          const firstKey = audioCache.current.keys().next().value;
          audioCache.current.delete(firstKey);
        }

        audioCache.current.set(word, audio);
      } catch (error) {
        console.error("Error preloading audio:", error);
      }
    },
    [cacheSize]
  );

  const clearCache = useCallback(() => {
    audioCache.current.clear();
  }, []);

  return {
    audioState,
    playPronunciation,
    stopPronunciation,
    preloadAudio,
    clearCache,
  };
}
