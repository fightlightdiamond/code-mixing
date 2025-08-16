import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import logger from "@/lib/logger";

// GET /api/learning/vocabulary/[word] - Get word definition and user progress
export async function GET(
  request: NextRequest,
  { params }: { params: { word: string } }
) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to access vocabulary
    const rules = [{ action: "read", subject: "Vocabulary" }];

    // Check if user has required permissions (RBAC + ABAC)
    const { allowed, error } = await caslGuardWithPolicies(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const word = decodeURIComponent(params.word).toLowerCase();

    // Find vocabulary entry
    const vocabulary = await prisma.vocabulary.findFirst({
      where: {
        word: {
          equals: word,
          mode: "insensitive",
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
        userVocabularyProgress: {
          where: {
            userId: user.id,
          },
          select: {
            status: true,
            lastReviewed: true,
          },
        },
      },
    });

    if (!vocabulary) {
      // If word not found in our database, return a basic structure
      // In a real implementation, you might want to integrate with external dictionary APIs
      return NextResponse.json({
        word: word,
        meaning: "Definition not available",
        example: null,
        audioUrl: null,
        lesson: null,
        userProgress: null,
        isInDatabase: false,
      });
    }

    // Format the response
    const response = {
      id: vocabulary.id,
      word: vocabulary.word,
      meaning: vocabulary.meaning,
      example: vocabulary.example,
      audioUrl: vocabulary.audioUrl,
      lesson: vocabulary.lesson,
      userProgress: vocabulary.userVocabularyProgress[0] || null,
      isInDatabase: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error fetching vocabulary", { word: params.word }, error);
    return NextResponse.json(
      { error: "Failed to fetch vocabulary" },
      { status: 500 }
    );
  }
}
