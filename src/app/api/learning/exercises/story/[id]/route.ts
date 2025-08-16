import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import logger from "@/lib/logger";

interface StoryChunk {
  id: string;
  chunkText: string;
  type: string;
  chunkOrder: number;
}

interface StoryWithChunks {
  id: string;
  chunks: StoryChunk[];
}

interface ExerciseChoice {
  id: string;
  text: string;
}

interface ExerciseQuestion {
  id: string;
  stem: string;
  type: string;
  choices: ExerciseChoice[];
  correctAnswer?: string;
}

interface Exercise {
  id: string;
  type: string;
  difficulty: string;
  questions: ExerciseQuestion[];
  source: string;
}

// GET /api/learning/exercises/story/[id] - Get exercises for a specific story
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

    // Define the rules required to access exercises
    const rules = [{ action: "read", subject: "Exercise" }];

    // Check if user has required permissions (RBAC + ABAC)
    const { allowed, error } = await caslGuardWithPolicies(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const storyId = params.id;

    // Verify story exists and is published
    const story = await prisma.story.findUnique({
      where: {
        id: storyId,
        status: "published",
      },
      select: {
        id: true,
        title: true,
        lessonId: true,
        chunks: {
          select: {
            id: true,
            chunkText: true,
            type: true,
            chunkOrder: true,
          },
          orderBy: {
            chunkOrder: "asc",
          },
        },
      },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    // Get exercises for the story's lesson
    let exercises = [];
    if (story.lessonId) {
      exercises = await prisma.exercise.findMany({
        where: {
          lessonId: story.lessonId,
          status: "published",
        },
        include: {
          questions: {
            include: {
              choices: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    }

    // Generate dynamic exercises based on story content
    const dynamicExercises = generateDynamicExercises(story);

    // Combine database exercises with dynamic exercises
    const allExercises = [
      ...exercises.map((exercise) => ({
        id: exercise.id,
        type: exercise.type,
        difficulty: exercise.difficulty,
        questions: exercise.questions.map((question) => ({
          id: question.id,
          stem: question.stem,
          type: question.type,
          choices: question.choices.map((choice) => ({
            id: choice.id,
            text: choice.text,
            // Don't include isCorrect in the response for security
          })),
        })),
        source: "database",
      })),
      ...dynamicExercises,
    ];

    return NextResponse.json({
      storyId: story.id,
      storyTitle: story.title,
      exercises: allExercises,
      totalExercises: allExercises.length,
    });
  } catch (error) {
    logger.error(
      "Error fetching story exercises",
      { storyId: params.id },
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch story exercises" },
      { status: 500 }
    );
  }
}

// Generate dynamic exercises based on story content
function generateDynamicExercises(story: StoryWithChunks): Exercise[] {
  const exercises: Exercise[] = [];
  const chemChunks = story.chunks.filter((chunk: StoryChunk) => chunk.type === "chem");

  if (chemChunks.length > 0) {
    // Generate fill-in-the-blank exercises from embedded words
    const fillBlankExercise: Exercise = {
      id: `dynamic-fill-blank-${story.id}`,
      type: "fill_blank",
      difficulty: "medium",
      questions: chemChunks
        .slice(0, 5)
        .map((chunk: StoryChunk, index: number): ExerciseQuestion | null => {
          // Extract English words from the chunk (this is a simplified approach)
          const englishWords = extractEnglishWords(chunk.chunkText);
          const targetWord = englishWords[0]; // Use first English word

          if (targetWord) {
            const questionText = chunk.chunkText.replace(targetWord, "______");

            return {
              id: `dynamic-fill-${story.id}-${index}`,
              stem: `Fill in the blank: ${questionText}`,
              type: "fill_blank",
              correctAnswer: targetWord,
              choices: [], // Fill-in-the-blank doesn't need choices
            };
          }
          return null;
        })
        .filter(Boolean) as ExerciseQuestion[],
      source: "dynamic",
    };

    if (fillBlankExercise.questions.length > 0) {
      exercises.push(fillBlankExercise);
    }

    // Generate multiple choice exercises
    const mcqExercise: Exercise = {
      id: `dynamic-mcq-${story.id}`,
      type: "multiple_choice",
      difficulty: "medium",
      questions: chemChunks
        .slice(0, 3)
        .map((chunk: StoryChunk, index: number): ExerciseQuestion | null => {
          const englishWords = extractEnglishWords(chunk.chunkText);
          const targetWord = englishWords[0];

          if (targetWord) {
            return {
              id: `dynamic-mcq-${story.id}-${index}`,
              stem: `What does "${targetWord}" mean in this context: "${chunk.chunkText}"?`,
              type: "MCQ",
              choices: [
                {
                  id: `choice-${index}-1`,
                  text: "Option A (correct answer would be fetched from vocabulary)",
                },
                { id: `choice-${index}-2`, text: "Option B" },
                { id: `choice-${index}-3`, text: "Option C" },
                { id: `choice-${index}-4`, text: "Option D" },
              ],
              correctAnswer: `choice-${index}-1`,
            };
          }
          return null;
        })
        .filter(Boolean) as ExerciseQuestion[],
      source: "dynamic",
    };

    if (mcqExercise.questions.length > 0) {
      exercises.push(mcqExercise);
    }
  }

  return exercises;
}

// Simple function to extract English words (this would be more sophisticated in production)
function extractEnglishWords(text: string): string[] {
  // This is a simplified approach - in production you'd use NLP or predefined patterns
  const englishPattern = /\b[a-zA-Z]+\b/g;
  const words = text.match(englishPattern) || [];

  // Filter out common Vietnamese words that might be in Latin script
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
