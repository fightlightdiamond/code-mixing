"use client";

import React from "react";
import { AudioPlayer } from "./AudioPlayer";
import type { StoryChunk } from "../types/learning";

// Example usage of compound AudioPlayer
export function AudioPlayerExample() {
  const mockChunks: StoryChunk[] = [
    {
      id: "1",
      chunkOrder: 0,
      chunkText: "Hôm nay tôi đi đến office để meeting với team.",
      type: "chem",
    },
    {
      id: "2",
      chunkOrder: 1,
      chunkText: "Chúng tôi thảo luận về project mới và deadline.",
      type: "chem",
    },
  ];

  const handleChunkHighlight = (chunkIndex: number) => {
    console.log(`Highlighting chunk ${chunkIndex}`);
  };

  const handleStateChange = (state: any) => {
    console.log("Audio state changed:", state);
  };

  return (
    <div className="space-y-8">
      {/* Default AudioPlayer (backward compatible) */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Default AudioPlayer</h3>
        <AudioPlayer
          audioUrl="/audio/sample.mp3"
          chunks={mockChunks}
          storyId="story-1"
          onChunkHighlight={handleChunkHighlight}
        />
      </div>

      {/* Compound AudioPlayer with custom layout */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Compound AudioPlayer - Custom Layout
        </h3>
        <AudioPlayer
          audioUrl="/audio/sample.mp3"
          chunks={mockChunks}
          storyId="story-2"
          onChunkHighlight={handleChunkHighlight}
          onStateChange={handleStateChange}
          enableAdvancedFeatures={true}
        >
          <div className="bg-white rounded-lg shadow-lg p-6">
            <AudioPlayer.Progress />

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-3">
                <AudioPlayer.SkipButton direction="backward" seconds={15} />
                <AudioPlayer.PlayPauseButton />
                <AudioPlayer.SkipButton direction="forward" seconds={15} />
              </div>

              <div className="flex items-center space-x-3">
                <AudioPlayer.VolumeSlider />
                <AudioPlayer.PlaybackRateButton />
                <AudioPlayer.BookmarkButton />
              </div>
            </div>

            <AudioPlayer.Info />
          </div>
        </AudioPlayer>
      </div>

      {/* Minimal AudioPlayer */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Minimal AudioPlayer</h3>
        <AudioPlayer
          audioUrl="/audio/sample.mp3"
          chunks={mockChunks}
          storyId="story-3"
          onChunkHighlight={handleChunkHighlight}
        >
          <div className="flex items-center space-x-4 bg-gray-100 rounded-full px-6 py-3">
            <AudioPlayer.PlayPauseButton />
            <div className="flex-1">
              <AudioPlayer.Progress />
            </div>
            <AudioPlayer.VolumeButton />
          </div>
        </AudioPlayer>
      </div>

      {/* Advanced AudioPlayer with all features */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Advanced AudioPlayer</h3>
        <AudioPlayer
          audioUrl="/audio/sample.mp3"
          chunks={mockChunks}
          storyId="story-4"
          onChunkHighlight={handleChunkHighlight}
          enableAdvancedFeatures={true}
        >
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            {/* Waveform visualization */}
            <AudioPlayer.Waveform />

            {/* Progress with enhanced features */}
            <div className="mt-4">
              <AudioPlayer.Progress />
            </div>

            {/* Main controls */}
            <div className="flex items-center justify-center space-x-4 mt-6">
              <AudioPlayer.SkipButton direction="backward" seconds={30} />
              <AudioPlayer.ResetButton />
              <AudioPlayer.PlayPauseButton />
              <AudioPlayer.SkipButton direction="forward" seconds={30} />
              <AudioPlayer.BookmarkButton />
            </div>

            {/* Advanced controls */}
            <AudioPlayer.Advanced>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume
                  </label>
                  <AudioPlayer.VolumeSlider />
                </div>

                <div className="flex items-center justify-center">
                  <AudioPlayer.PlaybackRateButton />
                </div>

                <div className="flex items-center justify-center space-x-2">
                  <AudioPlayer.BookmarkToggle />
                  <AudioPlayer.SettingsButton />
                </div>
              </div>
            </AudioPlayer.Advanced>

            {/* Info and bookmarks */}
            <div className="mt-4">
              <AudioPlayer.Info />
              <AudioPlayer.Bookmarks />
            </div>
          </div>
        </AudioPlayer>
      </div>
    </div>
  );
}

export default AudioPlayerExample;
