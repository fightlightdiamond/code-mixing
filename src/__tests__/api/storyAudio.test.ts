/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/learning/stories/[id]/audio/route";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { getAudioSignedUrl } from "@/lib/storage";

jest.mock("@/core/prisma", () => ({
  prisma: {
    story: { findUnique: jest.fn() },
    audio: { findFirst: jest.fn() },
  },
}));

jest.mock("@/core/auth/getUser", () => ({
  getUserFromRequest: jest.fn(),
}));

jest.mock("@/core/auth/casl.guard", () => ({
  caslGuardWithPolicies: jest.fn(),
}));

jest.mock("@/lib/storage", () => ({
  getAudioSignedUrl: jest.fn(),
}));

const mockPrisma = prisma as any;
const mockGetUser = getUserFromRequest as jest.MockedFunction<typeof getUserFromRequest>;
const mockCasl = caslGuardWithPolicies as jest.MockedFunction<typeof caslGuardWithPolicies>;
const mockGetSignedUrl = getAudioSignedUrl as jest.MockedFunction<typeof getAudioSignedUrl>;

describe("/api/learning/stories/[id]/audio GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to signed URL", async () => {
    mockGetUser.mockResolvedValue({ sub: "u1", tenantId: "t1" });
    mockCasl.mockResolvedValue({ allowed: true, error: null });
    mockPrisma.story.findUnique.mockResolvedValue({ id: "s1", title: "Story" });
    mockPrisma.audio.findFirst.mockResolvedValue({
      id: "a1",
      storageKey: "story/audio.mp3",
      voiceType: "original",
      durationSec: 30,
    });
    mockGetSignedUrl.mockResolvedValue("https://signed.example.com/audio.mp3");

    const req = new NextRequest("http://localhost:3000/api/learning/stories/s1/audio");
    const res = await GET(req, { params: { id: "s1" } });

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://signed.example.com/audio.mp3"
    );
  });

  it("returns 404 when audio not found", async () => {
    mockGetUser.mockResolvedValue({ sub: "u1", tenantId: "t1" });
    mockCasl.mockResolvedValue({ allowed: true, error: null });
    mockPrisma.story.findUnique.mockResolvedValue({ id: "s1", title: "Story" });
    mockPrisma.audio.findFirst.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/learning/stories/s1/audio");
    const res = await GET(req, { params: { id: "s1" } });

    expect(res.status).toBe(404);
  });
});

