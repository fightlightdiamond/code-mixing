/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/users/route";
import { prisma } from "@/core/prisma";

// Mock Prisma
jest.mock("@/core/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock JWT
jest.mock("jsonwebtoken", () => ({
  verify: jest.fn().mockReturnValue({
    userId: 1,
    tenantId: 1,
    role: "admin",
  }),
}));

// Mock CASL guard
jest.mock("@/core/auth/casl.guard", () => ({
  caslGuard: jest.fn().mockReturnValue({ allowed: true, error: null }),
  caslGuardWithPolicies: jest
    .fn()
    .mockResolvedValue({ allowed: true, error: null }),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("/api/users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/users", () => {
    it("should return users list", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "Test User",
          email: "test@example.com",
          role: "student",
          createdAt: new Date().toISOString(),
        },
      ];

      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const request = new NextRequest("http://localhost:3000/api/users", {
        headers: {
          authorization: "Bearer mock-jwt-token",
        },
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        data: mockUsers,
        success: true,
        meta: {
          total: mockUsers.length
        }
      });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { name: "asc" },
      });
    });

    it("should filter users by search term", async () => {
      const mockUsers = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          role: "student",
          createdAt: new Date().toISOString(),
        },
      ];

      (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const request = new NextRequest(
        "http://localhost:3000/api/users?search=john",
        {
          headers: {
            authorization: "Bearer mock-jwt-token",
          },
        }
      );
      const response = await GET(request);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: "john", mode: "insensitive" } },
            { email: { contains: "john", mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("POST /api/users", () => {
    it("should create a new user", async () => {
      const newUser = {
        name: "New User",
        email: "new@example.com",
        role: "student",
      };

      const createdUser = {
        id: 1,
        ...newUser,
        createdAt: new Date().toISOString(),
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(createdUser);

      const request = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify(newUser),
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer mock-jwt-token",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(createdUser);
    });

    it("should return error for duplicate email", async () => {
      const newUser = {
        name: "New User",
        email: "existing@example.com",
        role: "student",
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: "existing@example.com",
      });

      const request = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify(newUser),
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer mock-jwt-token",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Email already exists");
    });

    it("should return error for missing required fields", async () => {
      const invalidUser = {
        email: "test@example.com",
        // missing name
      };

      const request = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify(invalidUser),
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer mock-jwt-token",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Name and email are required");
    });
  });
});
