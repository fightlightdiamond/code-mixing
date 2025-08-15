import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/core/prisma";
import logger from "@/lib/logger";

// PUT /api/vocabularies/[id] - Cập nhật vocabulary
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vocabularyId = params.id;
    const body = await request.json();

    if (!vocabularyId) {
      return NextResponse.json(
        { error: "Invalid vocabulary ID" },
        { status: 400 }
      );
    }

    const { lessonId, word, meaning, example, audioUrl } = body;

    // Check if vocabulary exists
    const existingVocabulary = await prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
    });

    if (!existingVocabulary) {
      return NextResponse.json(
        { error: "Vocabulary not found" },
        { status: 404 }
      );
    }

    // Check if word is being changed and already exists in the same lesson
    if (word && word !== existingVocabulary.word) {
      const wordExists = await prisma.vocabulary.findFirst({
        where: {
          word: { equals: word, mode: "insensitive" },
          lessonId: existingVocabulary.lessonId,
          NOT: { id: vocabularyId },
        },
      });

      if (wordExists) {
        return NextResponse.json(
          { error: "Vocabulary word already exists in this lesson" },
          { status: 409 }
        );
      }
    }

    // Update vocabulary
    const vocabulary = await prisma.vocabulary.update({
      where: { id: vocabularyId },
      data: {
        ...(lessonId !== undefined && { lessonId }),
        ...(word !== undefined && { word }),
        ...(meaning !== undefined && { meaning }),
        ...(example !== undefined && { example }),
        ...(audioUrl !== undefined && { audioUrl }),
      },
      select: {
        id: true,
        lessonId: true,
        word: true,
        meaning: true,
        example: true,
        audioUrl: true,
      },
    });

    return NextResponse.json(vocabulary);
  } catch (error) {
    logger.error("Error updating vocabulary", undefined, error);
    return NextResponse.json(
      { error: "Failed to update vocabulary" },
      { status: 500 }
    );
  }
}

// DELETE /api/vocabularies/[id] - Xóa vocabulary
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vocabularyId = params.id;
    if (!vocabularyId) {
      return NextResponse.json(
        { error: "Invalid vocabulary ID" },
        { status: 400 }
      );
    }

    // Check if vocabulary exists
    const existingVocabulary = await prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
    });

    if (!existingVocabulary) {
      return NextResponse.json(
        { error: "Vocabulary not found" },
        { status: 404 }
      );
    }

    // Delete vocabulary
    await prisma.vocabulary.delete({
      where: { id: vocabularyId },
    });

    return NextResponse.json({ message: "Vocabulary deleted successfully" });
  } catch (error) {
    logger.error("Error deleting vocabulary", undefined, error);
    return NextResponse.json(
      { error: "Failed to delete vocabulary" },
      { status: 500 }
    );
  }
}
