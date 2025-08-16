import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/core/prisma";
import logger from "@/lib/logger";

// GET /api/quizzes/[id] - Lấy chi tiết quiz
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id;

    if (!quizId) {
      return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
        questions: {
          select: {
            id: true,
            question: true,
          },
          orderBy: { id: "asc" },
        },
        _count: {
          select: {
            questions: true,
            quizResults: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    logger.error("Error fetching quiz", undefined, error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

// PUT /api/quizzes/[id] - Cập nhật quiz
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id;
    const body = await request.json();

    if (!quizId) {
      return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
    }

    const { title, description, lessonId } = body;

    // Check if quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!existingQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Check if lesson exists (if provided)
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: String(lessonId) },
      });

      if (!lesson) {
        return NextResponse.json(
          { error: "Lesson not found" },
          { status: 404 }
        );
      }
    }

    // Update quiz with questions in a transaction
    const quiz = await prisma.$transaction(async (tx) => {
      // Update quiz
      await tx.quiz.update({
        where: { id: quizId },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(lessonId !== undefined && { lessonId: String(lessonId) }),
        },
      });

      // TODO: Align question updates to Prisma schema if needed

      return tx.quiz.findUnique({
        where: { id: quizId },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
            },
          },
          questions: {
            select: {
              id: true,
              question: true,
            },
            orderBy: { id: "asc" },
          },
          _count: {
            select: {
              questions: true,
              quizResults: true,
            },
          },
        },
      });
    });

    return NextResponse.json(quiz);
  } catch (error) {
    logger.error("Error updating quiz", undefined, error);
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    );
  }
}

// DELETE /api/quizzes/[id] - Xóa quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id;

    if (!quizId) {
      return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
    }

    // Check if quiz exists
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!existingQuiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Delete quiz (cascade will handle questions and results)
    await prisma.quiz.delete({
      where: { id: quizId },
    });

    return NextResponse.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    logger.error("Error deleting quiz", undefined, error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
