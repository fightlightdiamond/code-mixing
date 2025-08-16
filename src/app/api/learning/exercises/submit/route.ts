import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import logger from "@/lib/logger";
import { z } from "zod";
import type { User } from "@/types/api";

// Validation schema for exercise submission
const exerciseSubmissionSchema = z.object({
  storyId: z.string().uuid(),
  exerciseId: z.string(),
  questionId: z.string(),
  userAnswer: z.union([z.string(), z.array(z.string())]),
  timeSpent: z.number().optional(),
  attempts: z.number().optional().default(1),
});

const batchSubmissionSchema = z.object({
  submissions: z.array(exerciseSubmissionSchema),
});

export async function POST(request: NextRequest) {
  let user: User | null = null;
  try {
    user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to submit exercises
    const rules = [{ action: "create", subject: "ExerciseResult" }];

    // Check if user has required permissions (RBAC + ABAC)
    const { allowed, error } = await caslGuardWithPolicies(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Check if this is a batch submission or single submission
    let submissions: Array<{
      storyId: string;
      exerciseId: string;
      questionId: string;
      userAnswer: string | string[];
      timeSpent?: number;
      attempts?: number;
    }>;

    if (body.submissions && Array.isArray(body.submissions)) {
      // Batch submission
      const validation = batchSubmissionSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid request data", details: validation.error.errors },
          { status: 400 }
        );
      }
      submissions = validation.data.submissions;
    } else {
      // Single submission
      const validation = exerciseSubmissionSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid request data", details: validation.error.errors },
          { status: 400 }
        );
      }
      submissions = [validation.data];
    }

    const results = [];

    for (const submission of submissions) {
      try {
        // Validate the answer and calculate score
        const validationResult = await validateExerciseAnswer(submission);

        // Update or create learning session
        await updateLearningSession(
          user.id,
          submission.storyId,
          submission.timeSpent || 0
        );

        // Update vocabulary progress if applicable
        if (validationResult.isCorrect && validationResult.vocabularyWords) {
          await updateVocabularyProgress(
            user.id,
            validationResult.vocabularyWords,
            true
          );
        }

        results.push({
          exerciseId: submission.exerciseId,
          questionId: submission.questionId,
          isCorrect: validationResult.isCorrect,
          score: validationResult.score,
          feedback: validationResult.feedback,
          correctAnswer: validationResult.correctAnswer,
          success: true,
        });
      } catch (submissionError) {
        logger.error(
          "Error processing exercise submission",
          {
            userId: user.id,
            exerciseId: submission.exerciseId,
            questionId: submission.questionId,
          },
          submissionError
        );

        results.push({
          exerciseId: submission.exerciseId,
          questionId: submission.questionId,
          success: false,
          error: "Failed to process submission",
        });
      }
    }

    return NextResponse.json({
      message: "Exercise submissions processed",
      results,
      totalSubmissions: submissions.length,
      successfulSubmissions: results.filter((r) => r.success).length,
    });
  } catch (error) {
    logger.error(
      "Error submitting exercise results",
      { userId: user?.id },
      error
    );
    return NextResponse.json(
      { error: "Failed to submit exercise results" },
      { status: 500 }
    );
  }
}

// Validate exercise answer and calculate score
async function validateExerciseAnswer(submission: {
  storyId: string;
  exerciseId: string;
  questionId: string;
  userAnswer: string | string[];
  timeSpent?: number;
  attempts?: number;
}) {
  // Check if this is a dynamic exercise or database exercise
  if (submission.exerciseId.startsWith("dynamic-")) {
    return validateDynamicExercise(submission);
  } else {
    return validateDatabaseExercise(submission);
  }
}

// Validate dynamic exercises generated from story content
async function validateDynamicExercise(submission: any) {
  // For dynamic exercises, we need to reconstruct the correct answer
  // This is a simplified implementation

  if (submission.exerciseId.includes("fill-blank")) {
    // For fill-in-the-blank, we need to check against the original story content
    const story = await prisma.story.findUnique({
      where: { id: submission.storyId },
      include: {
        chunks: {
          where: { type: "chem" },
          orderBy: { chunkOrder: "asc" },
        },
      },
    });

    if (story) {
      // Extract the correct answer from the story chunk
      // This is simplified - in production you'd have more sophisticated logic
      const questionIndex = parseInt(
        submission.questionId.split("-").pop() || "0"
      );
      const chunk = story.chunks[questionIndex];

      if (chunk) {
        const englishWords = extractEnglishWords(chunk.chunkText);
        const correctAnswer = englishWords[0];

        const isCorrect =
          correctAnswer &&
          submission.userAnswer.toString().toLowerCase().trim() ===
            correctAnswer.toLowerCase();

        return {
          isCorrect,
          score: isCorrect ? 1 : 0,
          correctAnswer,
          feedback: isCorrect
            ? "Correct!"
            : `The correct answer is: ${correctAnswer}`,
          vocabularyWords: isCorrect ? [correctAnswer] : undefined,
        };
      }
    }
  }

  return {
    isCorrect: false,
    score: 0,
    correctAnswer: "Unknown",
    feedback: "Unable to validate answer",
  };
}

// Validate database exercises
async function validateDatabaseExercise(submission: unknown) {
  const question = await prisma.question.findUnique({
    where: { id: submission.questionId },
    include: {
      choices: true,
    },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  let isCorrect = false;
  let correctAnswer = "";

  if (question.type === "MCQ") {
    const correctChoice = question.choices.find((choice) => choice.isCorrect);
    correctAnswer = correctChoice?.text || "";
    isCorrect = question.choices.some(
      (choice) => choice.id === submission.userAnswer && choice.isCorrect
    );
  } else if (question.type === "fill_blank") {
    // For fill-in-the-blank, the correct answer would be stored in the question or choices
    const correctChoice = question.choices.find((choice) => choice.isCorrect);
    correctAnswer = correctChoice?.text || "";
    isCorrect =
      submission.userAnswer.toString().toLowerCase().trim() ===
      correctAnswer.toLowerCase().trim();
  }

  return {
    isCorrect,
    score: isCorrect ? 1 : 0,
    correctAnswer,
    feedback: isCorrect
      ? "Correct!"
      : `The correct answer is: ${correctAnswer}`,
  };
}

// Update learning session with exercise activity
async function updateLearningSession(
  userId: string,
  storyId: string,
  timeSpent: number
) {
  // Find or create learning session for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingSession = await prisma.learningSession.findFirst({
    where: {
      userId,
      storyId,
      startedAt: {
        gte: today,
      },
    },
  });

  if (existingSession) {
    // Update existing session
    await prisma.learningSession.update({
      where: { id: existingSession.id },
      data: {
        timeSpentSec: (existingSession.timeSpentSec || 0) + timeSpent,
        interactionCount: (existingSession.interactionCount || 0) + 1,
        endedAt: new Date(),
      },
    });
  } else {
    // Create new session
    await prisma.learningSession.create({
      data: {
        userId,
        storyId,
        startedAt: new Date(),
        endedAt: new Date(),
        timeSpentSec: timeSpent,
        interactionCount: 1,
        tenantId: "default", // You might want to get this from the user context
      },
    });
  }
}

// Update vocabulary progress for learned words
async function updateVocabularyProgress(
  userId: string,
  words: string[],
  isCorrect: boolean
) {
  for (const word of words) {
    try {
      // Check if vocabulary exists
      const vocabulary = await prisma.vocabulary.findFirst({
        where: {
          word: {
            equals: word.toLowerCase(),
            mode: "insensitive",
          },
        },
      });

      if (!vocabulary) continue;

      // Update or create vocabulary progress
      await prisma.userVocabularyProgress.upsert({
        where: {
          userId_vocabularyId: {
            userId,
            vocabularyId: vocabulary.id,
          },
        },
        update: {
          status: isCorrect ? "reviewing" : "new",
          lastReviewed: new Date(),
        },
        create: {
          userId,
          vocabularyId: vocabulary.id,
          status: isCorrect ? "reviewing" : "new",
          lastReviewed: new Date(),
        },
      });
    } catch (error) {
      logger.error(
        "Error updating vocabulary progress for word",
        { word, userId },
        error
      );
      // Continue with other words even if one fails
    }
  }
}

// Extract English words from text (helper function)
function extractEnglishWords(text: string): string[] {
  const englishPattern = /\b[a-zA-Z]+\b/g;
  const words = text.match(englishPattern) || [];

  const commonVietnamese = [
    "va",
    "la",
    "cua",
    "trong",
    "nay",
    "co",
    "khong",
    "den",
    "tu",
    "voi",
  ];

  return words.filter(
    (word) =>
      word.length > 2 &&
      !commonVietnamese.includes(word.toLowerCase()) &&
      /^[a-zA-Z]+$/.test(word)
  );
}
