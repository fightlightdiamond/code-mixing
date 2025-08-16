/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { DELETE } from "@/app/api/progress/[id]/route";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";

jest.mock("@/core/prisma", () => ({
  prisma: {
    userProgress: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("@/core/auth/getUser", () => ({
  getUserFromRequest: jest.fn(),
}));

jest.mock("@/core/auth/casl.guard", () => ({
  caslGuardWithPolicies: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetUser = getUserFromRequest as jest.MockedFunction<
  typeof getUserFromRequest
>;
const mockCasl = caslGuardWithPolicies as jest.MockedFunction<
  typeof caslGuardWithPolicies
>;

describe("/api/progress/[id] DELETE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes progress record", async () => {
    mockGetUser.mockResolvedValue({ sub: "u1", tenantId: "t1" });
    mockCasl.mockResolvedValue({ allowed: true, error: null });
    mockPrisma.userProgress.findFirst.mockResolvedValue({ id: "p1" } as any);
    mockPrisma.userProgress.delete.mockResolvedValue({} as any);

    const request = new NextRequest("http://localhost:3000/api/progress/p1", {
      method: "DELETE",
    });

    const res = await DELETE(request, { params: { id: "p1" } });

    expect(res.status).toBe(200);
    expect(mockPrisma.userProgress.delete).toHaveBeenCalledWith({
      where: { id: "p1" },
    });
  });

  it("returns 404 if record not found", async () => {
    mockGetUser.mockResolvedValue({ sub: "u1", tenantId: "t1" });
    mockCasl.mockResolvedValue({ allowed: true, error: null });
    mockPrisma.userProgress.findFirst.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/progress/p1", {
      method: "DELETE",
    });

    const res = await DELETE(request, { params: { id: "p1" } });

    expect(res.status).toBe(404);
  });
});
