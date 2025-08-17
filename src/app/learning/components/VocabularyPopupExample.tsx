"use client";

import React, { useState } from "react";
import { VocabularyPopup, VocabularyLookup } from "./VocabularyPopup";
import { Button } from "@/components/ui/button";
import type { VocabularyData } from "../types/learning";

// Example usage of enhanced VocabularyPopup with render props pattern
export function VocabularyPopupExample() {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const mockVocabularyData: VocabularyData = {
    word: "programming",
    meaning: "the process of creating computer programs",
    pronunciation: "ˈproʊɡræmɪŋ",
    example: "I love programming in TypeScript.",
    audioUrl: "/audio/programming.mp3",
  };

  const handleWordClick = (
    word: string,
    position: { x: number; y: number }
  ) => {
    setSelectedWord(word);
    setPopupPosition(position);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedWord(null);
  };

  return (
    <div className="space-y-8 p-8">
      {/* Example 1: Default VocabularyPopup (backward compatible) */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Default VocabularyPopup</h3>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-lg">
            I love{" "}
            <button
              className="vocabulary-word bg-blue-100 text-blue-800 px-2 py-1 rounded"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleWordClick("programming", {
                  x: rect.left + rect.width / 2,
                  y: rect.bottom + 5,
                });
              }}
            >
              programming
            </button>{" "}
            in TypeScript.
          </p>
        </div>

        {selectedWord && (
          <VocabularyPopup
            word={selectedWord}
            isOpen={isPopupOpen}
            onClose={handleClosePopup}
            position={popupPosition}
            vocabularyData={mockVocabularyData}
          />
        )}
      </div>

      {/* Example 2: Render Props Pattern */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          VocabularyLookup with Render Props
        </h3>
        <VocabularyLookup word="programming" storyContext="I love programming">
          {({ data, progress, isLoading, error, updateProgress }) => (
            <div className="bg-white border rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold mb-2">Word: programming</h4>

              {isLoading && <p className="text-gray-500">Loading...</p>}

              {error && <p className="text-red-500">Error: {error}</p>}

              {data && (
                <div className="space-y-2">
                  <p>
                    <strong>Meaning:</strong> {data.meaning}
                  </p>
                  {data.example && (
                    <p>
                      <strong>Example:</strong> {data.example}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant={
                        progress?.status === "reviewing" ? "default" : "outline"
                      }
                      onClick={() => updateProgress("reviewing")}
                    >
                      Learning
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        progress?.status === "mastered" ? "default" : "outline"
                      }
                      onClick={() => updateProgress("mastered")}
                    >
                      Mastered
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </VocabularyLookup>
      </div>

      {/* Example 3: Compound Components */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Compound VocabularyPopup</h3>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-lg">
            Click on{" "}
            <button
              className="vocabulary-word bg-blue-100 text-blue-800 px-2 py-1 rounded"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setSelectedWord("development");
                setPopupPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.bottom + 5,
                });
                setIsPopupOpen(true);
              }}
            >
              development
            </button>{" "}
            for compound popup.
          </p>
        </div>

        {selectedWord === "development" && (
          <VocabularyPopup
            word="development"
            isOpen={isPopupOpen}
            onClose={handleClosePopup}
            position={popupPosition}
            vocabularyData={{
              word: "development",
              meaning: "the process of developing or being developed",
              pronunciation: "dɪˈveləpmənt",
              example: "Software development requires continuous learning.",
              audioUrl: "/audio/development.mp3",
            }}
          >
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
              <VocabularyPopup.Header />

              <div className="mt-4">
                <VocabularyPopup.Content />
              </div>

              <div className="mt-4">
                <VocabularyPopup.Actions />
              </div>

              <div className="mt-4">
                <VocabularyPopup.Advanced />
              </div>
            </div>
          </VocabularyPopup>
        )}
      </div>

      {/* Example 4: Minimal Compound Layout */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Minimal Compound Layout</h3>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-lg">
            Simple{" "}
            <button
              className="vocabulary-word bg-blue-100 text-blue-800 px-2 py-1 rounded"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setSelectedWord("simple");
                setPopupPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.bottom + 5,
                });
                setIsPopupOpen(true);
              }}
            >
              simple
            </button>{" "}
            popup layout.
          </p>
        </div>

        {selectedWord === "simple" && (
          <VocabularyPopup
            word="simple"
            isOpen={isPopupOpen}
            onClose={handleClosePopup}
            position={popupPosition}
            vocabularyData={{
              word: "simple",
              meaning: "easily understood or done; presenting no difficulty",
              pronunciation: "ˈsɪmpəl",
              example: "The solution was surprisingly simple.",
            }}
          >
            <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-blue-800">simple</h4>
                <button
                  onClick={handleClosePopup}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <VocabularyPopup.Definition />

              <div className="mt-3">
                <VocabularyPopup.Actions />
              </div>
            </div>
          </VocabularyPopup>
        )}
      </div>

      {/* Example 5: Custom Render Props Usage */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Custom Render Props Usage
        </h3>
        <VocabularyLookup word="typescript" storyContext="Learning TypeScript">
          {({ data, progress, isLoading, updateProgress }) => (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-purple-800">TypeScript</h4>
                {progress && (
                  <span className={`status-badge ${progress.status}`}>
                    {progress.status}
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-purple-200 rounded mb-2"></div>
                  <div className="h-4 bg-purple-200 rounded w-3/4"></div>
                </div>
              ) : data ? (
                <div>
                  <p className="text-sm text-purple-700 mb-3">{data.meaning}</p>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateProgress("reviewing")}
                      className="flex-1"
                    >
                      📚 Learning
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateProgress("mastered")}
                      className="flex-1"
                    >
                      ⭐ Mastered
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-purple-600">No definition found</p>
              )}
            </div>
          )}
        </VocabularyLookup>
      </div>
    </div>
  );
}

export default VocabularyPopupExample;
