/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@/features/users/hooks";
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

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("Users Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useCreateUser", () => {
    it("should create user successfully", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        role: "student" as const,
        createdAt: new Date().toISOString(),
      };

      mockApi.mockResolvedValue(mockUser);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateUser(), { wrapper });

      const userData = {
        name: "Test User",
        email: "test@example.com",
        role: "student" as const,
      };

      result.current.mutate(userData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi).toHaveBeenCalledWith("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
    });

    it("should handle create user error", async () => {
      const error = new Error("Email already exists");
      mockApi.mockRejectedValue(error);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateUser(), { wrapper });

      result.current.mutate({
        name: "Test User",
        email: "existing@example.com",
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });
  });

  describe("useUpdateUser", () => {
    it("should update user successfully", async () => {
      const mockUser = {
        id: 1,
        name: "Updated User",
        email: "updated@example.com",
        role: "coach" as const,
        createdAt: new Date().toISOString(),
      };

      mockApi.mockResolvedValue(mockUser);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateUser(), { wrapper });

      const updateData = {
        id: 1,
        data: {
          name: "Updated User",
          role: "coach" as const,
        },
      };

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi).toHaveBeenCalledWith("/api/users/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData.data),
      });
    });
  });

  describe("useDeleteUser", () => {
    it("should delete user successfully", async () => {
      mockApi.mockResolvedValue({ message: "User deleted successfully" });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDeleteUser(), { wrapper });

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi).toHaveBeenCalledWith("/api/users/1", {
        method: "DELETE",
      });
    });
  });
});
