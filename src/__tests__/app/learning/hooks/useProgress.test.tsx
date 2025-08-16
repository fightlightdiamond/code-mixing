import { renderHook, act } from "@testing-library/react";
import { useProgress } from "@/app/learning/hooks/useProgress";

describe("updateVocabularyProgress", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("sends progress data to the server before updating state", async () => {
    let vocabFetchCount = 0;
    const mockFetch = jest.fn((url: RequestInfo) => {
      if (typeof url === "string" && url.includes("/api/learning/vocabulary/progress")) {
        if (url.includes("?")) {
          vocabFetchCount += 1;
          const data =
            vocabFetchCount === 1
              ? { vocabularyProgress: [] }
              : { vocabularyProgress: [{ word: "student" }] };
          return Promise.resolve({ ok: true, json: async () => data }) as any;
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ word: "student", status: "learning" }),
        }) as any;
      }
      return Promise.resolve({ ok: true, json: async () => ({}) }) as any;
    });
    // @ts-ignore
    global.fetch = mockFetch;

    const { result } = renderHook(() =>
      useProgress({ userId: "user1", autoSync: false })
    );
    // Wait for initial loadProgress to complete
    await act(async () => {});

    await act(async () => {
      await result.current.actions.updateVocabularyProgress("student", true, 30);
    });

    // Wait for subsequent loadProgress call to finish
    await act(async () => {});

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/learning/vocabulary/progress",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          userId: "user1",
          word: "student",
          isCorrect: true,
          timeSpent: 30,
        }),
      })
    );
    expect(result.current.error).toBeNull();
  });

  it("notifies the user when the request fails", async () => {
    const mockFetch = jest.fn((url: RequestInfo) => {
      if (typeof url === "string" && url.includes("/api/learning/vocabulary/progress")) {
        return Promise.resolve({ ok: false }) as any;
      }
      return Promise.resolve({ ok: true, json: async () => ({}) }) as any;
    });
    // @ts-ignore
    global.fetch = mockFetch;

    const { result } = renderHook(() =>
      useProgress({ userId: "user1", autoSync: false })
    );

    await act(async () => {
      await result.current.actions.updateVocabularyProgress("student", true, 30);
    });

    expect(result.current.error).toBe("Không thể cập nhật tiến độ từ vựng");
    expect(result.current.vocabularyProgress).toHaveLength(0);
  });
});
