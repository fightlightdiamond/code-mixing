import { renderHook, act } from "@testing-library/react";
import { useVocabularyReview } from "@/app/learning/hooks/useVocabularyReview";
import type {
  UserLearningPreferences,
  VocabularyProgress,
} from "@/app/learning/types/learning";

const preferences: UserLearningPreferences = {
  embeddingRatio: 20,
  difficultyLevel: "beginner" as any,
  theme: "light",
  topicPreferences: ["original" as any],
  audioEnabled: true,
  autoPlayAudio: false,
  playbackSpeed: 1,
  vocabularyReviewFrequency: "daily",
  dailyGoal: 20,
  notificationsEnabled: true,
};

const initialProgress: VocabularyProgress[] = [
  {
    word: "hello",
    status: "reviewing",
    encounters: 1,
    correctAnswers: 1,
    totalAttempts: 1,
    lastReviewed: new Date("2024-01-01"),
    nextReview: new Date("2024-01-02"),
    masteryLevel: 50,
  },
];

describe("updateVocabularyProgress", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("sends progress data and updates state on success", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }) as any;

    const { result } = renderHook(() =>
      useVocabularyReview(preferences, initialProgress)
    );

    await act(async () => {
      await result.current.updateVocabularyProgress("hello", "good");
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/learning/vocabulary/progress",
      expect.objectContaining({ method: "POST" })
    );

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.word).toBe("hello");
    expect(result.current.progress[0].encounters).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it("sets error when request fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any;

    const { result } = renderHook(() =>
      useVocabularyReview(preferences, initialProgress)
    );

    await act(async () => {
      await result.current.updateVocabularyProgress("hello", "good");
    });

    expect(result.current.error).toBe("Không thể cập nhật tiến độ từ vựng");
    expect(result.current.progress[0].encounters).toBe(1);
  });
});
