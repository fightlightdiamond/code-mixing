/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useLessonProgress,
  useProgressList,
  useUpsertProgress,
  useUpdateProgress,
  useDeleteProgress,
  type UserProgress as Progress,
} from "@/features/progress/hooks";
import type { UserProgress as Progress } from "@/features/progress/hooks";
import { api } from "@/core/api/api";

// Mock API
jest.mock("@/core/api/api");
const mockApi = api as jest.MockedFunction<typeof api>;

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryClientWrapper";
  return Wrapper;
};

describe("Progress Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches lesson progress", async () => {
    const mockProgress = {
      id: "p1",
      lessonId: "l1",
      userId: "u1",
      status: "in_progress" as const,
      lastViewedAt: new Date().toISOString(),
      tenantId: "t1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockApi.mockResolvedValueOnce(mockProgress);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLessonProgress("l1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApi).toHaveBeenCalledWith(
      "/api/progress?lessonId=l1",
      expect.any(Object),
    );
    expect(result.current.data).toEqual(mockProgress);
  });

  it("lists progress records", async () => {
    const mockList: Progress[] = [];
    mockApi.mockResolvedValueOnce(mockList);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useProgressList({ status: "completed" }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApi).toHaveBeenCalledWith(
      "/api/progress?status=completed",
      expect.any(Object),
    );
    expect(result.current.data).toEqual(mockList);
  });

  it("upserts progress", async () => {
    const mockProgress = {
      id: "p1",
      lessonId: "l1",
      userId: "u1",
      status: "completed" as const,
      lastViewedAt: new Date().toISOString(),
      tenantId: "t1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockApi.mockResolvedValueOnce(mockProgress);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpsertProgress(), { wrapper });

    result.current.mutate({ lessonId: "l1", status: "completed" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApi).toHaveBeenCalledWith("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: "l1", status: "completed" }),
    });
  });

  it("updates progress", async () => {
    const mockProgress = {
      id: "p1",
      lessonId: "l1",
      userId: "u1",
      status: "completed" as const,
      lastViewedAt: new Date().toISOString(),
      tenantId: "t1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockApi.mockResolvedValueOnce(mockProgress);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateProgress(), { wrapper });

    result.current.mutate({ id: "p1", data: { status: "completed" } });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApi).toHaveBeenCalledWith("/api/progress/p1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
  });

  it("deletes progress", async () => {
    mockApi.mockResolvedValueOnce({ success: true });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useDeleteProgress(), { wrapper });

    result.current.mutate({ id: "p1" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApi).toHaveBeenCalledWith("/api/progress/p1", {
      method: "DELETE",
    });
  });
});
