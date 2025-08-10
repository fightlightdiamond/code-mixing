import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/core/prisma";

// GET /api/quizzes/[id] - Lấy chi tiết quiz
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = parseInt(params.id);

    if (isNaN(quizId)) {
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
            questionText: true,
            questionType: true,
            options: true,
            correctAnswer: true,
            explanation: true,
          },
          orderBy: { id: "asc" },
        },
        _count: {
          select: {
            questions: true,
            userResults: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
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
    const quizId = parseInt(params.id);
    const body = await request.json();

    if (isNaN(quizId)) {
      return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
    }

    const { title, description, lessonId, questions } = body;

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
        where: { id: lessonId },
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
      const updatedQuiz = await tx.quiz.update({
        where: { id: quizId },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(lessonId !== undefined && { lessonId }),
        },
      });

      // Update questions if provided
      if (questions && Array.isArray(questions)) {
        // Delete existing questions
        await tx.quizQuestion.deleteMany({
          where: { quizId },
        });

        // Create new questions
        await tx.quizQuestion.createMany({
          data: questions.map((question: any) => ({
            quizId,
            questionText: question.questionText,
            questionType: question.questionType || "multiple_choice",
            options: question.options || [],
            correctAnswer: question.correctAnswer,
            explanation: question.explanation || "",
          })),
        });
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
              questionText: true,
              questionType: true,
              options: true,
              correctAnswer: true,
              explanation: true,
            },
            orderBy: { id: "asc" },
          },
          _count: {
            select: {
              questions: true,
              userResults: true,
            },
          },
        },
      });
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error updating quiz:", error);
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
    const quizId = parseInt(params.id);

    if (isNaN(quizId)) {
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
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
