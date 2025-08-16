import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import logger from "@/lib/logger";
import { LearningSession, ProgressStatus, VocabStatus } from "@prisma/client";
import type { User } from "@/types/api";

interface LessonProgressItem {
  id: string;
  lessonId: string;
  status: ProgressStatus;
  lastViewedAt: Date | null;
  updatedAt: Date;
  lesson: {
    id: string;
    title: string;
    difficulty: string;
    estimatedMinutes: number | null;
    course: {
      id: string;
      title: string;
    };
  };
}

interface VocabularyProgressItem {
  id: string;
  vocabulary: {
    id: string;
    word: string;
    meaning: string;
    lesson: {
      id: string;
      title: string;
    };
  };
  status: VocabStatus;
  lastReviewed: Date | null;
}

interface ProgressStats {
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  totalVocabulary: number;
  masteredVocabulary: number;
  reviewingVocabulary: number;
  newVocabulary: number;
  totalTimeSpent: number;
  totalInteractions: number;
  learningStreak: number;
  averageSessionTime: number;
}

interface Achievement {
  type: string;
  title: string;
  description: string;
  earnedAt: Date;
}

interface UserProgressResponse {
  userId: string;
  timeframe: string;
  stats: ProgressStats;
  levelProgression: ReturnType<typeof calculateLevelProgression>;
  recentAchievements: Achievement[];
  lessonProgress?: LessonProgressItem[];
  vocabularyProgress?: VocabularyProgressItem[];
  recentSessions?: LearningSession[];
}

// GET /api/learning/progress/user - Get comprehensive user learning progress
export async function GET(
  request: NextRequest
): Promise<NextResponse<UserProgressResponse>> {

  let user: User | null = null;

  try {
    // Get user from request
    user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to access user progress
    const rules = [{ action: "read", subject: "UserProgress" }];

    // Check if user has required permissions (RBAC + ABAC)
    const { allowed, error } = await caslGuardWithPolicies(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get("includeDetails") === "true";
    const timeframe = searchParams.get("timeframe") || "all"; // all, week, month, year

    // Calculate date range based on timeframe
    let dateFilter = {};
    if (timeframe !== "all") {
      const now = new Date();
      let startDate = new Date();

      switch (timeframe) {
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      dateFilter = {
        updatedAt: {
          gte: startDate,
        },
      };
    }

    // Get lesson progress
    const lessonProgress: LessonProgressItem[] =
      await prisma.userProgress.findMany({
      where: {
        userId: user.id,
        ...dateFilter,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            estimatedMinutes: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Get vocabulary progress
    const vocabularyProgress: VocabularyProgressItem[] =
      await prisma.userVocabularyProgress.findMany({
      where: {
        userId: user.id,
        ...(timeframe !== "all" && {
          lastReviewed: {
            gte: dateFilter.updatedAt?.gte,
          },
        }),
      },
      include: {
        vocabulary: {
          select: {
            id: true,
            word: true,
            meaning: true,
            lesson: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastReviewed: "desc",
      },
    });

    // Get learning sessions
    const learningSessions = await prisma.learningSession.findMany({
      where: {
        userId: user.id,
        ...dateFilter,
      },
      include: includeDetails
        ? {
            lesson: {
              select: {
                id: true,
                title: true,
              },
            },
            story: {
              select: {
                id: true,
                title: true,
              },
            },
          }
        : {},
      orderBy: {
        startedAt: "desc",
      },
      take: includeDetails ? 50 : 10, // Limit results
    });

    // Calculate summary statistics
    const stats: ProgressStats = {
      totalLessons: lessonProgress.length,
      completedLessons: lessonProgress.filter((p) => p.status === "completed")
        .length,
      inProgressLessons: lessonProgress.filter(
        (p) => p.status === "in_progress"
      ).length,
      totalVocabulary: vocabularyProgress.length,
      masteredVocabulary: vocabularyProgress.filter(
        (v) => v.status === "mastered"
      ).length,
      reviewingVocabulary: vocabularyProgress.filter(
        (v) => v.status === "reviewing"
      ).length,
      newVocabulary: vocabularyProgress.filter((v) => v.status === "new")
        .length,
      totalTimeSpent: learningSessions.reduce(
        (sum, session) => sum + (session.timeSpentSec || 0),
        0
      ),
      totalInteractions: learningSessions.reduce(
        (sum, session) => sum + (session.interactionCount || 0),
        0
      ),
      learningStreak: await calculateLearningStreak(user.id),
      averageSessionTime:
        learningSessions.length > 0
          ? Math.round(
              learningSessions.reduce(
                (sum, session) => sum + (session.timeSpentSec || 0),
                0
              ) / learningSessions.length
            )
          : 0,
    };

    // Calculate level progression
    const levelProgression = calculateLevelProgression(
      lessonProgress,
      vocabularyProgress
    );

    // Get recent achievements (simplified)
    const recentAchievements: Achievement[] = getRecentAchievements(
      lessonProgress,
      vocabularyProgress,
      stats
    );

    const response: UserProgressResponse = {
      userId: user.id,
      timeframe,
      stats,
      levelProgression,
      recentAchievements,
      ...(includeDetails && {
        lessonProgress: lessonProgress.map((progress) => ({
          id: progress.id,
          lessonId: progress.lessonId,
          lesson: progress.lesson,
          status: progress.status,
          lastViewedAt: progress.lastViewedAt,
          updatedAt: progress.updatedAt,
        })),
        vocabularyProgress: vocabularyProgress.map((vocab) => ({
          id: vocab.id,
          vocabulary: vocab.vocabulary,
          status: vocab.status,
          lastReviewed: vocab.lastReviewed,
        })),
        recentSessions: learningSessions.slice(0, 10),
      }),
    };

    return NextResponse.json<UserProgressResponse>(response);
  } catch (error) {
    logger.error("Error fetching user progress", { userId: user?.id }, error);
    return NextResponse.json(
      { error: "Failed to fetch user progress" },
      { status: 500 }
    );
  }
}

// Calculate learning streak (consecutive days with learning activity)
async function calculateLearningStreak(userId: string): Promise<number> {
  const sessions = await prisma.learningSession.findMany({
    where: {
      userId,
    },
    select: {
      startedAt: true,
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  if (sessions.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Group sessions by date
  const sessionDates = new Set(
    sessions.map((session) => {
      const date = new Date(session.startedAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  // Count consecutive days
  while (sessionDates.has(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

// Calculate level progression based on completed lessons and vocabulary
function calculateLevelProgression(
  lessonProgress: LessonProgressItem[],
  vocabularyProgress: VocabularyProgressItem[]
) {
  const completedLessons = lessonProgress.filter(
    (p) => p.status === "completed"
  ).length;
  const masteredVocabulary = vocabularyProgress.filter(
    (v) => v.status === "mastered"
  ).length;

  // Simple level calculation (this could be more sophisticated)
  const totalPoints = completedLessons * 10 + masteredVocabulary * 2;
  const currentLevel = Math.floor(totalPoints / 100) + 1;
  const pointsToNextLevel = 100 - (totalPoints % 100);

  return {
    currentLevel,
    totalPoints,
    pointsToNextLevel,
    completedLessons,
    masteredVocabulary,
  };
}

// Get recent achievements
function getRecentAchievements(
  lessonProgress: LessonProgressItem[],
  vocabularyProgress: VocabularyProgressItem[],
  stats: ProgressStats
): Achievement[] {
  const achievements: Achievement[] = [];

  // Check for milestone achievements
  if (stats.completedLessons >= 10 && stats.completedLessons % 10 === 0) {
    achievements.push({
      type: "lesson_milestone",
      title: `${stats.completedLessons} Lessons Completed!`,
      description: `You've completed ${stats.completedLessons} lessons. Keep up the great work!`,
      earnedAt: new Date(),
    });
  }

  if (stats.masteredVocabulary >= 50 && stats.masteredVocabulary % 50 === 0) {
    achievements.push({
      type: "vocabulary_milestone",
      title: `${stats.masteredVocabulary} Words Mastered!`,
      description: `You've mastered ${stats.masteredVocabulary} vocabulary words. Excellent progress!`,
      earnedAt: new Date(),
    });
  }

  if (stats.learningStreak >= 7) {
    achievements.push({
      type: "streak_achievement",
      title: `${stats.learningStreak} Day Streak!`,
      description: `You've been learning consistently for ${stats.learningStreak} days in a row!`,
      earnedAt: new Date(),
    });
  }

  return achievements.slice(0, 5); // Return up to 5 recent achievements
}
