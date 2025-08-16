import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import logger from "@/lib/logger";

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

    // In a real implementation, you would:
    // 1. Generate a signed URL for the audio file from your storage service (S3, etc.)
    // 2. Or stream the audio file directly
    // For now, we'll return the audio metadata and storage key

    // TODO: Implement actual audio file serving
    // This could be a redirect to a signed URL or streaming the file
    const audioUrl = `/api/audio/stream/${audio.storageKey}`;

    return NextResponse.json({
      id: audio.id,
      url: audioUrl,
      voiceType: audio.voiceType,
      durationSec: audio.durationSec,
      storyId: storyId,
      storyTitle: story.title,
    });
  } catch (error) {
    logger.error("Error fetching story audio", { storyId: params.id }, error);
    return NextResponse.json(
      { error: "Failed to fetch story audio" },
      { status: 500 }
    );
  }
}
