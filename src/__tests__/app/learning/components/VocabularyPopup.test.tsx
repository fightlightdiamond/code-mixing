import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VocabularyPopup } from "@/app/learning/components/VocabularyPopup";
import type { VocabularyData } from "@/app/learning/types/learning";

// Mock the vocabulary audio hook
jest.mock("@/app/learning/hooks/useVocabularyAudio", () => ({
  useVocabularyAudio: () => ({
    audioState: {
      isPlaying: false,
      isLoading: false,
      error: null,
    },
    playPronunciation: jest.fn(),
    stopPronunciation: jest.fn(),
  }),
}));

const mockVocabularyData: VocabularyData = {
  word: "student",
  meaning: "học sinh, sinh viên",
  pronunciation: "ˈstuːdənt",
  example: "She is a good student.",
  audioUrl: "https://example.com/audio/student.mp3",
};

const mockOnClose = jest.fn();

describe("VocabularyPopup Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 320,
      height: 200,
      top: 100,
      left: 100,
      bottom: 300,
      right: 420,
      x: 100,
      y: 100,
      toJSON: jest.fn(),
    }));
  });

  it("does not render when isOpen is false", () => {
    render(
      <VocabularyPopup
        word="test"
        isOpen={false}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
      />
    );

    expect(screen.queryByText("test")).not.toBeInTheDocument();
  });

  it("renders popup with word and vocabulary data when open", () => {
    render(
      <VocabularyPopup
        word="student"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
        vocabularyData={mockVocabularyData}
      />
    );

    expect(screen.getByText("student")).toBeInTheDocument();
    expect(screen.getByText("/ˈstuːdənt/")).toBeInTheDocument();
    expect(screen.getByText("học sinh, sinh viên")).toBeInTheDocument();
    expect(screen.getByText('"She is a good student."')).toBeInTheDocument();
  });

  it("shows loading state when isLoading is true", () => {
    render(
      <VocabularyPopup
        word="student"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
        isLoading={true}
      />
    );

    expect(screen.getByText("Đang tải định nghĩa...")).toBeInTheDocument();
    expect(
      screen
        .getByText("Đang tải định nghĩa...")
        .nextElementSibling?.querySelector(".animate-spin")
    ).toBeInTheDocument();
  });

  it("shows no definition message when vocabularyData is not provided", () => {
    render(
      <VocabularyPopup
        word="unknown"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
      />
    );

    expect(
      screen.getByText('Không tìm thấy định nghĩa cho từ "unknown"')
    ).toBeInTheDocument();
    expect(screen.getByText("Thêm vào danh sách từ vựng")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <VocabularyPopup
        word="student"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
        vocabularyData={mockVocabularyData}
      />
    );

    const closeButton = screen.getByTitle("Đóng");
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking outside the popup", async () => {
    render(
      <VocabularyPopup
        word="student"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
        vocabularyData={mockVocabularyData}
      />
    );

    // Click on the backdrop
    const backdrop = document.querySelector(".fixed.inset-0");
    fireEvent.mouseDown(backdrop!);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    render(
      <VocabularyPopup
        word="student"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
        vocabularyData={mockVocabularyData}
      />
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("renders pronunciation button when audio is available", () => {
    render(
      <VocabularyPopup
        word="student"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
        vocabularyData={mockVocabularyData}
      />
    );

    const pronunciationButton = screen.getByTitle("Phát âm");
    expect(pronunciationButton).toBeInTheDocument();
  });

  it("renders pronunciation button even without audioUrl when speech synthesis is available", () => {
    // Mock speechSynthesis
    Object.defineProperty(window, "speechSynthesis", {
      value: {},
      writable: true,
    });

    const dataWithoutAudio = { ...mockVocabularyData, audioUrl: undefined };

    render(
      <VocabularyPopup
        word="student"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
        vocabularyData={dataWithoutAudio}
      />
    );

    const pronunciationButton = screen.getByTitle("Phát âm");
    expect(pronunciationButton).toBeInTheDocument();
  });

  it("renders action buttons for vocabulary status", () => {
    render(
      <VocabularyPopup
        word="student"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
        vocabularyData={mockVocabularyData}
      />
    );

    expect(screen.getByText("Đang học")).toBeInTheDocument();
    expect(screen.getByText("Đã thuộc")).toBeInTheDocument();
  });

  it("positions popup correctly within viewport", () => {
    // Mock window dimensions
    Object.defineProperty(window, "innerWidth", {
      value: 1024,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 768,
      writable: true,
    });

    const { container } = render(
      <VocabularyPopup
        word="student"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 900, y: 600 }} // Near edge of viewport
        vocabularyData={mockVocabularyData}
      />
    );

    const popup = container.querySelector(".fixed.z-50");
    expect(popup).toBeInTheDocument();
  });

  it("handles missing example in vocabulary data", () => {
    const dataWithoutExample = { ...mockVocabularyData, example: undefined };

    render(
      <VocabularyPopup
        word="student"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
        vocabularyData={dataWithoutExample}
      />
    );

    expect(screen.getByText("học sinh, sinh viên")).toBeInTheDocument();
    expect(screen.queryByText("Ví dụ:")).not.toBeInTheDocument();
  });

  it("handles missing pronunciation in vocabulary data", () => {
    const dataWithoutPronunciation = {
      ...mockVocabularyData,
      pronunciation: undefined,
    };

    render(
      <VocabularyPopup
        word="student"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
        vocabularyData={dataWithoutPronunciation}
      />
    );

    expect(screen.getByText("student")).toBeInTheDocument();
    expect(screen.queryByText(/ˈstuːdənt/)).not.toBeInTheDocument();
  });

  it("shows arrow pointing to the word", () => {
    const { container } = render(
      <VocabularyPopup
        word="student"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
        vocabularyData={mockVocabularyData}
      />
    );

    const arrow = container.querySelector(".absolute.w-0.h-0");
    expect(arrow).toBeInTheDocument();
    expect(arrow).toHaveClass("border-t-blue-200");
  });

  it("handles audio error state", () => {
    // Mock the hook to return error state
    const mockUseVocabularyAudio =
      require("@/app/learning/hooks/useVocabularyAudio").useVocabularyAudio;
    mockUseVocabularyAudio.mockReturnValue({
      audioState: {
        isPlaying: false,
        isLoading: false,
        error: "Audio playback failed",
      },
      playPronunciation: jest.fn(),
      stopPronunciation: jest.fn(),
    });

    render(
      <VocabularyPopup
        word="student"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
        vocabularyData={mockVocabularyData}
      />
    );

    expect(screen.getByText("Audio playback failed")).toBeInTheDocument();
  });

  it("shows loading spinner on pronunciation button when audio is loading", () => {
    // Mock the hook to return loading state
    const mockUseVocabularyAudio =
      require("@/app/learning/hooks/useVocabularyAudio").useVocabularyAudio;
    mockUseVocabularyAudio.mockReturnValue({
      audioState: {
        isPlaying: false,
        isLoading: true,
        error: null,
      },
      playPronunciation: jest.fn(),
      stopPronunciation: jest.fn(),
    });

    render(
      <VocabularyPopup
        word="student"
        isOpen={true}
        onClose={mockOnClose}
        position={{ x: 100, y: 100 }}
        vocabularyData={mockVocabularyData}
      />
    );

    const pronunciationButton = screen.getByTitle("Phát âm");
    expect(pronunciationButton).toBeDisabled();
    expect(
      pronunciationButton.querySelector(".animate-spin")
    ).toBeInTheDocument();
  });
});
