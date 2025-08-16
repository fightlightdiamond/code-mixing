import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AudioPlayer } from "@/app/learning/components/AudioPlayer";
import type { StoryChunk } from "@/app/learning/types/learning";

// Mock the audio progress hook
jest.mock("@/app/learning/hooks/useAudioProgress", () => ({
  useAudioProgress: () => ({
    progress: {
      currentPosition: 0,
      bookmarks: [
        {
          id: "bookmark-1",
          position: 30,
          note: "Important part",
          createdAt: new Date(),
        },
      ],
    },
    actions: {
      updatePosition: jest.fn(),
      addBookmark: jest.fn(),
      removeBookmark: jest.fn(),
      updateBookmarkNote: jest.fn(),
      jumpToBookmark: jest.fn().mockReturnValue(30),
    },
    utils: {
      formatTime: (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      },
      getProgressPercentage: (duration: number) => 0,
    },
  }),
}));

// Mock HTML5 Audio
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 120,
  volume: 1,
  muted: false,
  playbackRate: 1,
  src: "",
};

// Create a more realistic audio mock
Object.defineProperty(window, "HTMLAudioElement", {
  writable: true,
  value: jest.fn().mockImplementation(() => {
    const audio = { ...mockAudio };
    // Simulate immediate loading
    setTimeout(() => {
      const loadedDataCall = audio.addEventListener.mock.calls.find(
        (call) => call[0] === "loadeddata"
      );
      if (loadedDataCall) {
        loadedDataCall[1]();
      }
    }, 0);
    return audio;
  }),
});

const mockChunks: StoryChunk[] = [
  {
    id: "chunk-1",
    chunkOrder: 1,
    chunkText: "First chunk of the story.",
    type: "normal",
  },
  {
    id: "chunk-2",
    chunkOrder: 2,
    chunkText: "Second chunk with English words.",
    type: "chem",
  },
  {
    id: "chunk-3",
    chunkOrder: 3,
    chunkText: "Final chunk of the story.",
    type: "normal",
  },
];

const mockOnChunkHighlight = jest.fn();

describe("AudioPlayer Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAudio.currentTime = 0;
    mockAudio.duration = 120;
    mockAudio.volume = 1;
    mockAudio.muted = false;
    mockAudio.playbackRate = 1;
  });

  it("renders audio player with initial state", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    // Should render time displays
    expect(screen.getByText("0:00")).toBeInTheDocument();
    // Should render control buttons (they may not have accessible names initially)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("shows loading state initially", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    // Should show loading spinner in the main play button
    const loadingSpinner = document.querySelector(".animate-spin");
    expect(loadingSpinner).toBeInTheDocument();

    // Buttons should be disabled during loading
    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("toggles play/pause when play button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    // Simulate audio loaded
    const loadedDataCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "loadeddata"
    )[1];
    loadedDataCallback();

    const playButton = screen.getByRole("button", { name: /play/i });
    await user.click(playButton);

    expect(mockAudio.play).toHaveBeenCalledTimes(1);
  });

  it("handles skip backward and forward", async () => {
    const user = userEvent.setup();

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    // Simulate audio loaded
    const loadedDataCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "loadeddata"
    )[1];
    loadedDataCallback();

    mockAudio.currentTime = 30;

    const skipBackButton = screen.getAllByRole("button")[0]; // First button is skip back
    const skipForwardButton = screen.getAllByRole("button")[2]; // Third button is skip forward

    await user.click(skipBackButton);
    expect(mockAudio.currentTime).toBe(20); // 30 - 10

    await user.click(skipForwardButton);
    expect(mockAudio.currentTime).toBe(40); // 20 + 10 + 10
  });

  it("handles volume toggle", async () => {
    const user = userEvent.setup();

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    // Simulate audio loaded
    const loadedDataCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "loadeddata"
    )[1];
    loadedDataCallback();

    const volumeButton = screen.getByRole("button", { name: /volume/i });
    await user.click(volumeButton);

    expect(mockAudio.muted).toBe(true);
  });

  it("changes playback rate when speed button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    // Simulate audio loaded
    const loadedDataCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "loadeddata"
    )[1];
    loadedDataCallback();

    const speedButton = screen.getByText("1x");
    await user.click(speedButton);

    expect(mockAudio.playbackRate).toBe(1.5);
    expect(screen.getByText("1.5x")).toBeInTheDocument();
  });

  it("resets audio when reset button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    // Simulate audio loaded
    const loadedDataCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "loadeddata"
    )[1];
    loadedDataCallback();

    mockAudio.currentTime = 60;

    const resetButton = screen.getByRole("button", { name: /reset/i });
    await user.click(resetButton);

    expect(mockAudio.currentTime).toBe(0);
    expect(mockAudio.pause).toHaveBeenCalled();
  });

  it("updates progress bar based on current time", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    // Simulate audio loaded and time update
    const loadedDataCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "loadeddata"
    )[1];
    loadedDataCallback();

    mockAudio.currentTime = 60; // 50% of 120 seconds
    const timeUpdateCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "timeupdate"
    )[1];
    timeUpdateCallback();

    const progressBar = document.querySelector(".bg-blue-600");
    expect(progressBar).toHaveStyle("width: 50%");
  });

  it("highlights current chunk based on audio time", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    // Simulate audio loaded and time update
    const loadedDataCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "loadeddata"
    )[1];
    loadedDataCallback();

    mockAudio.currentTime = 80; // Should be in chunk 2 (80/120 * 3 = 2)
    const timeUpdateCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "timeupdate"
    )[1];
    timeUpdateCallback();

    expect(mockOnChunkHighlight).toHaveBeenCalledWith(2);
  });

  it("displays current chunk information", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    expect(screen.getByText("Đoạn 1 / 3")).toBeInTheDocument();
  });

  it("shows bookmark count", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    expect(screen.getByText("1 BM")).toBeInTheDocument();
  });

  it("adds bookmark when bookmark button is clicked", async () => {
    const user = userEvent.setup();
    const mockAddBookmark =
      require("@/app/learning/hooks/useAudioProgress").useAudioProgress()
        .actions.addBookmark;

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    // Simulate audio loaded
    const loadedDataCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "loadeddata"
    )[1];
    loadedDataCallback();

    mockAudio.currentTime = 45;

    const bookmarkButton = screen.getByTitle("Thêm bookmark");
    await user.click(bookmarkButton);

    expect(mockAddBookmark).toHaveBeenCalledWith(45);
  });

  it("shows error state when audio fails to load", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    // Simulate audio error
    const errorCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "error"
    )[1];
    errorCallback();

    expect(screen.getByText("Không thể tải file âm thanh")).toBeInTheDocument();
    expect(screen.getByText("Thử lại")).toBeInTheDocument();
  });

  it("handles audio ended event", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    // Simulate audio ended
    const endedCallback = mockAudio.addEventListener.mock.calls.find(
      (call) => call[0] === "ended"
    )[1];
    endedCallback();

    // Should reset to beginning
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
  });

  it("toggles bookmark panel visibility", async () => {
    const user = userEvent.setup();

    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    const bookmarkToggle = screen.getByText("1 BM");
    await user.click(bookmarkToggle);

    // BookmarkPanel should be visible (we'll need to check for its content)
    // This would require the BookmarkPanel component to be properly rendered
  });

  it("applies custom className", () => {
    const { container } = render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={mockChunks}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
        className="custom-audio-player"
      />
    );

    expect(container.firstChild).toHaveClass("custom-audio-player");
  });

  it("handles empty chunks array", () => {
    render(
      <AudioPlayer
        audioUrl="https://example.com/audio.mp3"
        chunks={[]}
        storyId="story-1"
        onChunkHighlight={mockOnChunkHighlight}
      />
    );

    // Should still render basic controls
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
    expect(screen.queryByText(/Đoạn/)).not.toBeInTheDocument();
  });
});
