import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/core/prisma";
import logger from "@/lib/logger";

// Zod schema for question updates
const questionSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().min(1),
  delete: z.boolean().optional(),
});

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
    logger.error("Error fetching quiz", undefined, error as Error);
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

    const {
      title,
      description,
      lessonId,
      questions: questionsInput,
    } = body;

    // Validate question data if provided
    const parsedQuestions = questionsInput
      ? z.array(questionSchema).safeParse(questionsInput)
      : { success: true, data: [] };

    if (!parsedQuestions.success) {
      return NextResponse.json(
        { error: "Invalid question data", details: parsedQuestions.error.errors },
        { status: 400 }
      );
    }

    const questions = parsedQuestions.data;
    const questionSchema = z.object({
      id: z.string().optional(),
      question: z.string(),
    });

    const updateQuizSchema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      lessonId: z.union([z.string(), z.number()]).optional(),
      questions: z.array(questionSchema).optional(),
    });

    const { title, description, lessonId, questions } =
      updateQuizSchema.parse(body);

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

      // Handle questions: upsert or delete based on input
      if (questions.length > 0) {
        const deleteIds = questions
          .filter((q) => q.id && q.delete)
          .map((q) => q.id as string);

        if (deleteIds.length > 0) {
          await tx.question.deleteMany({
            where: { id: { in: deleteIds }, quizId },
          });
        }

        for (const q of questions.filter((q) => !q.delete)) {
          const id = q.id || randomUUID();
          await tx.question.upsert({
            where: { id },
            update: { question: q.question },
            create: { id, quizId, question: q.question },
          });
        }
      }
      if (questions) {
        const questionIds = questions
          .filter((q) => q.id)
          .map((q) => q.id as string);

        await tx.question.deleteMany({
          where: {
            quizId,
            ...(questionIds.length > 0 && { id: { notIn: questionIds } }),
          },
        });

        for (const q of questions) {
          await tx.question.upsert({
            where: { id: q.id ?? "" },
            update: { question: q.question },
            create: { quizId, question: q.question },
          });
        }
      }

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
    logger.error("Error updating quiz", undefined, error as Error);
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
    logger.error("Error deleting quiz", undefined, error as Error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
