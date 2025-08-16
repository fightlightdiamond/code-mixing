import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import logger from "@/lib/logger";
import { z } from "zod";

// Validation schema for vocabulary progress update
const vocabularyProgressSchema = z.object({
  vocabularyId: z.string().uuid(),
  status: z.enum(["new", "reviewing", "mastered"]),
  word: z.string().optional(),
});

const batchVocabularyProgressSchema = z.object({
  updates: z.array(vocabularyProgressSchema),
});

// POST /api/learning/vocabulary/progress - Update vocabulary learning progress
export async function POST(request: NextRequest) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to update vocabulary progress
    const rules = [{ action: "update", subject: "UserVocabularyProgress" }];

    // Check if user has required permissions (RBAC + ABAC)
    const { allowed, error } = await caslGuardWithPolicies(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if this is a batch update or single update
    let updates: Array<{
      vocabularyId: string;
      status: "new" | "reviewing" | "mastered";
      word?: string;
    }>;

    if (body.updates && Array.isArray(body.updates)) {
      // Batch update
      const validation = batchVocabularyProgressSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid request data", details: validation.error.errors },
          { status: 400 }
        );
      }
      updates = validation.data.updates;
    } else {
      // Single update
      const validation = vocabularyProgressSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid request data", details: validation.error.errors },
          { status: 400 }
        );
      }
      updates = [validation.data];
    }

    // Verify all vocabulary IDs exist
    const vocabularyIds = updates.map((update) => update.vocabularyId);
    const vocabularies = await prisma.vocabulary.findMany({
      where: {
        id: { in: vocabularyIds },
      },
      select: {
        id: true,
        word: true,
      },
    });

    if (vocabularies.length !== vocabularyIds.length) {
      return NextResponse.json(
        { error: "One or more vocabulary IDs not found" },
        { status: 404 }
      );
    }

    // Process updates
    const results = [];

    for (const update of updates) {
      try {
        const result = await prisma.userVocabularyProgress.upsert({
          where: {
            userId_vocabularyId: {
              userId: user.id,
              vocabularyId: update.vocabularyId,
            },
          },
          update: {
            status: update.status,
            lastReviewed: new Date(),
          },
          create: {
            userId: user.id,
            vocabularyId: update.vocabularyId,
            status: update.status,
            lastReviewed: new Date(),
          },
          include: {
            vocabulary: {
              select: {
                word: true,
                meaning: true,
              },
            },
          },
        });

        results.push({
          vocabularyId: update.vocabularyId,
          word: result.vocabulary.word,
          status: result.status,
          lastReviewed: result.lastReviewed,
          success: true,
        });
      } catch (updateError) {
        logger.error(
          "Error updating vocabulary progress",
          {
            userId: user.id,
            vocabularyId: update.vocabularyId,
          },
          updateError
        );

        results.push({
          vocabularyId: update.vocabularyId,
          word: update.word || "unknown",
          success: false,
          error: "Failed to update progress",
        });
      }
    }

    return NextResponse.json({
      message: "Vocabulary progress updated",
      results,
      totalUpdates: updates.length,
      successfulUpdates: results.filter((r) => r.success).length,
    });
  } catch (error) {
    logger.error(
      "Error updating vocabulary progress",
      { userId: user?.id },
      error
    );
    return NextResponse.json(
      { error: "Failed to update vocabulary progress" },
      { status: 500 }
    );
  }
}
