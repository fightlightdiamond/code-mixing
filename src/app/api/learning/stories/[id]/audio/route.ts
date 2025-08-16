import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import logger from "@/lib/logger";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

// GET /api/learning/stories/[id]/audio - Get audio file for story
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to access audio
    const rules = [{ action: "read", subject: "Story" }];

    // Check if user has required permissions (RBAC + ABAC)
    const { allowed, error } = await caslGuardWithPolicies(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const storyId = params.id;
    const { searchParams } = new URL(request.url);
    const voiceType = searchParams.get("voiceType") || "original";

    // Verify story exists and is published
    const story = await prisma.story.findUnique({
      where: {
        id: storyId,
        status: "published",
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Find audio file for the story
    const audio = await prisma.audio.findFirst({
      where: {
        storyId: storyId,
        voiceType: voiceType,
        status: "published",
      },
      select: {
        id: true,
        storageKey: true,
        voiceType: true,
        durationSec: true,
      },
    });

    if (!audio) {
      return NextResponse.json(
        { error: "Audio not found for this story" },
        { status: 404 }
      );
    }

    // Build S3 command for the audio file
    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      logger.error("AWS_S3_BUCKET is not configured");
      return NextResponse.json(
        { error: "Audio storage not configured" },
        { status: 500 }
      );
    }

    const s3 = new S3Client({ region: process.env.AWS_REGION });
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: audio.storageKey,
    });

    // By default return a redirect to a signed URL
    const useSignedUrl = process.env.AUDIO_STREAM !== "true";

    if (useSignedUrl) {
      const signedUrl = await getSignedUrl(s3, command, {
        expiresIn: 60,
      });
      return NextResponse.redirect(signedUrl);
    }

    // Stream file directly from S3
    const { Body, ContentType } = await s3.send(command);
    const body = Body as Readable;

    return new NextResponse(Readable.toWeb(body), {
      headers: {
        "Content-Type": ContentType || "audio/mpeg",
      },
    });
  } catch (error) {
    logger.error("Error fetching story audio", { storyId: params.id }, error);
    return NextResponse.json(
      { error: "Failed to fetch story audio" },
      { status: 500 }
    );
  }
}
