/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/learning/stories/[id]/audio/route";
import { getUserFromRequest } from "@/core/auth/getUser";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

jest.mock("@/core/auth/getUser", () => ({
  getUserFromRequest: jest.fn(),
}));

jest.mock("@/core/auth/casl.guard", () => ({
  caslGuardWithPolicies: jest.fn(),
}));

jest.mock("@/core/prisma", () => ({
  prisma: {
    story: { findUnique: jest.fn() },
    audio: { findFirst: jest.fn() },
  },
}));

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(),
  GetObjectCommand: jest.fn(),
}));

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

const mockGetUser = getUserFromRequest as jest.MockedFunction<
  typeof getUserFromRequest
>;
const mockCasl = caslGuardWithPolicies as jest.MockedFunction<
  typeof caslGuardWithPolicies
>;
const mockPrisma = prisma as any;
const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<
  typeof getSignedUrl
>;

describe("/api/learning/stories/[id]/audio GET", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUDIO_STREAM = ""; // ensure signed URL path
    process.env.AWS_S3_BUCKET = "test-bucket";
    process.env.AWS_REGION = "us-east-1";
  });

  it("redirects to signed URL when audio exists", async () => {
    mockGetUser.mockResolvedValue({ id: "u1" });
    mockCasl.mockResolvedValue({ allowed: true, error: null });
    mockPrisma.story.findUnique.mockResolvedValue({
      id: "1",
      title: "Test",
    });
    mockPrisma.audio.findFirst.mockResolvedValue({
      id: "a1",
      storageKey: "file.mp3",
      voiceType: "original",
      durationSec: 10,
    });
    mockGetSignedUrl.mockResolvedValue("https://signed-url/");

    const req = new NextRequest(
      "http://localhost:3000/api/learning/stories/1/audio"
    );

    const res = await GET(req, { params: { id: "1" } });

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://signed-url/");
  });
});

