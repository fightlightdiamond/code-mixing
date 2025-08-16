import { NextRequest, NextResponse } from "next/server";
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";
import { getUserFromRequest } from "@/core/auth/getUser";
import logger from "@/lib/logger";

// GET /api/learning/progress/analytics - Get learning analytics and insights
export async function GET(request: NextRequest) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to access analytics
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
    const period = searchParams.get("period") || "month"; // week, month, quarter, year
    const includeComparison = searchParams.get("includeComparison") === "true";

    // Calculate date ranges
    const now = new Date();
    const dateRanges = calculateDateRanges(period, now);

    // Get learning sessions data
    const currentPeriodSessions = await prisma.learningSession.findMany({
      where: {
        userId: user.id,
        startedAt: {
          gte: dateRanges.current.start,
          lte: dateRanges.current.end,
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
        story: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
      },
    });

    // Get vocabulary progress data
    const vocabularyProgress = await prisma.userVocabularyProgress.findMany({
      where: {
        userId: user.id,
        lastReviewed: {
          gte: dateRanges.current.start,
          lte: dateRanges.current.end,
        },
      },
      include: {
        vocabulary: {
          select: {
            word: true,
            lesson: {
              select: {
                difficulty: true,
              },
            },
          },
        },
      },
    });

    // Get lesson progress data
    const lessonProgress = await prisma.userProgress.findMany({
      where: {
        userId: user.id,
        updatedAt: {
          gte: dateRanges.current.start,
          lte: dateRanges.current.end,
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            estimatedMinutes: true,
          },
        },
      },
    });

    // Calculate analytics
    const analytics = {
      period,
      dateRange: dateRanges.current,
      summary: calculateSummaryStats(
        currentPeriodSessions,
        vocabularyProgress,
        lessonProgress
      ),
      timeAnalysis: calculateTimeAnalysis(currentPeriodSessions),
      difficultyAnalysis: calculateDifficultyAnalysis(
        currentPeriodSessions,
        lessonProgress
      ),
      vocabularyAnalysis: calculateVocabularyAnalysis(vocabularyProgress),
      learningPatterns: calculateLearningPatterns(currentPeriodSessions),
      recommendations: generateRecommendations(
        currentPeriodSessions,
        vocabularyProgress,
        lessonProgress
      ),
    };

    // Add comparison data if requested
    if (includeComparison) {
      const previousPeriodSessions = await prisma.learningSession.findMany({
        where: {
          userId: user.id,
          startedAt: {
            gte: dateRanges.previous.start,
            lte: dateRanges.previous.end,
          },
        },
      });

      const previousVocabularyProgress =
        await prisma.userVocabularyProgress.findMany({
          where: {
            userId: user.id,
            lastReviewed: {
              gte: dateRanges.previous.start,
              lte: dateRanges.previous.end,
            },
          },
        });

      const previousLessonProgress = await prisma.userProgress.findMany({
        where: {
          userId: user.id,
          updatedAt: {
            gte: dateRanges.previous.start,
            lte: dateRanges.previous.end,
          },
        },
      });

      analytics.comparison = {
        period: `Previous ${period}`,
        dateRange: dateRanges.previous,
        summary: calculateSummaryStats(
          previousPeriodSessions,
          previousVocabularyProgress,
          previousLessonProgress
        ),
      };
    }

    return NextResponse.json(analytics);
  } catch (error) {
    logger.error(
      "Error fetching learning analytics",
      { userId: user?.id },
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch learning analytics" },
      { status: 500 }
    );
  }
}

// Calculate date ranges for current and previous periods
function calculateDateRanges(period: string, now: Date) {
  const current = { start: new Date(), end: new Date(now) };
  const previous = { start: new Date(), end: new Date() };

  switch (period) {
    case "week":
      current.start.setDate(now.getDate() - 7);
      previous.start.setDate(now.getDate() - 14);
      previous.end.setDate(now.getDate() - 7);
      break;
    case "month":
      current.start.setMonth(now.getMonth() - 1);
      previous.start.setMonth(now.getMonth() - 2);
      previous.end.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      current.start.setMonth(now.getMonth() - 3);
      previous.start.setMonth(now.getMonth() - 6);
      previous.end.setMonth(now.getMonth() - 3);
      break;
    case "year":
      current.start.setFullYear(now.getFullYear() - 1);
      previous.start.setFullYear(now.getFullYear() - 2);
      previous.end.setFullYear(now.getFullYear() - 1);
      break;
  }

  return { current, previous };
}

// Calculate summary statistics
function calculateSummaryStats(
  sessions: any[],
  vocabularyProgress: any[],
  lessonProgress: any[]
) {
  const totalTimeSpent = sessions.reduce(
    (sum, session) => sum + (session.timeSpentSec || 0),
    0
  );
  const totalInteractions = sessions.reduce(
    (sum, session) => sum + (session.interactionCount || 0),
    0
  );
  const uniqueDays = new Set(
    sessions.map((session) => new Date(session.startedAt).toDateString())
  ).size;

  return {
    totalSessions: sessions.length,
    totalTimeSpent,
    totalInteractions,
    activeDays: uniqueDays,
    averageSessionTime:
      sessions.length > 0 ? Math.round(totalTimeSpent / sessions.length) : 0,
    lessonsCompleted: lessonProgress.filter((p) => p.status === "completed")
      .length,
    lessonsInProgress: lessonProgress.filter((p) => p.status === "in_progress")
      .length,
    vocabularyReviewed: vocabularyProgress.length,
    vocabularyMastered: vocabularyProgress.filter(
      (v) => v.status === "mastered"
    ).length,
  };
}

// Calculate time-based analysis
function calculateTimeAnalysis(sessions: any[]) {
  const hourlyDistribution = new Array(24).fill(0);
  const dailyDistribution = new Array(7).fill(0);

  sessions.forEach((session) => {
    const date = new Date(session.startedAt);
    const hour = date.getHours();
    const day = date.getDay();

    hourlyDistribution[hour] += session.timeSpentSec || 0;
    dailyDistribution[day] += session.timeSpentSec || 0;
  });

  // Find peak learning times
  const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
  const peakDay = dailyDistribution.indexOf(Math.max(...dailyDistribution));

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return {
    hourlyDistribution,
    dailyDistribution,
    peakLearningHour: peakHour,
    peakLearningDay: dayNames[peakDay],
    totalTimeByHour: hourlyDistribution.reduce((sum, time) => sum + time, 0),
    averageSessionsPerDay:
      sessions.length /
      Math.max(
        1,
        new Set(sessions.map((s) => new Date(s.startedAt).toDateString())).size
      ),
  };
}

// Calculate difficulty-based analysis
function calculateDifficultyAnalysis(sessions: any[], lessonProgress: any[]) {
  const difficultyStats = {
    beginner: { sessions: 0, timeSpent: 0, completed: 0 },
    elementary: { sessions: 0, timeSpent: 0, completed: 0 },
    intermediate: { sessions: 0, timeSpent: 0, completed: 0 },
    upper_intermediate: { sessions: 0, timeSpent: 0, completed: 0 },
    advanced: { sessions: 0, timeSpent: 0, completed: 0 },
    proficient: { sessions: 0, timeSpent: 0, completed: 0 },
  };

  sessions.forEach((session) => {
    const difficulty =
      session.lesson?.difficulty || session.story?.difficulty || "intermediate";
    if (difficultyStats[difficulty]) {
      difficultyStats[difficulty].sessions++;
      difficultyStats[difficulty].timeSpent += session.timeSpentSec || 0;
    }
  });

  lessonProgress.forEach((progress) => {
    const difficulty = progress.lesson?.difficulty || "intermediate";
    if (difficultyStats[difficulty] && progress.status === "completed") {
      difficultyStats[difficulty].completed++;
    }
  });

  return difficultyStats;
}

// Calculate vocabulary analysis
function calculateVocabularyAnalysis(vocabularyProgress: any[]) {
  const statusDistribution = {
    new: 0,
    reviewing: 0,
    mastered: 0,
  };

  const difficultyDistribution = {
    beginner: 0,
    elementary: 0,
    intermediate: 0,
    upper_intermediate: 0,
    advanced: 0,
    proficient: 0,
  };

  vocabularyProgress.forEach((progress) => {
    statusDistribution[progress.status]++;

    const difficulty =
      progress.vocabulary?.lesson?.difficulty || "intermediate";
    if (difficultyDistribution[difficulty] !== undefined) {
      difficultyDistribution[difficulty]++;
    }
  });

  return {
    statusDistribution,
    difficultyDistribution,
    totalWords: vocabularyProgress.length,
    masteryRate:
      vocabularyProgress.length > 0
        ? (statusDistribution.mastered / vocabularyProgress.length) * 100
        : 0,
  };
}

// Calculate learning patterns
function calculateLearningPatterns(sessions: any[]) {
  if (sessions.length === 0) {
    return {
      consistency: 0,
      preferredSessionLength: 0,
      learningVelocity: 0,
    };
  }

  // Calculate consistency (how regularly the user learns)
  const sessionDates = sessions.map((s) =>
    new Date(s.startedAt).toDateString()
  );
  const uniqueDates = new Set(sessionDates);
  const consistency = (uniqueDates.size / sessionDates.length) * 100;

  // Calculate preferred session length
  const sessionLengths = sessions.map((s) => s.timeSpentSec || 0);
  const preferredSessionLength =
    sessionLengths.reduce((sum, length) => sum + length, 0) /
    sessionLengths.length;

  // Calculate learning velocity (interactions per minute)
  const totalTime = sessions.reduce((sum, s) => sum + (s.timeSpentSec || 0), 0);
  const totalInteractions = sessions.reduce(
    (sum, s) => sum + (s.interactionCount || 0),
    0
  );
  const learningVelocity =
    totalTime > 0 ? totalInteractions / (totalTime / 60) : 0;

  return {
    consistency: Math.round(consistency),
    preferredSessionLength: Math.round(preferredSessionLength),
    learningVelocity: Math.round(learningVelocity * 100) / 100,
  };
}

// Generate personalized recommendations
function generateRecommendations(
  sessions: any[],
  vocabularyProgress: any[],
  lessonProgress: any[]
) {
  const recommendations = [];

  // Time-based recommendations
  if (sessions.length > 0) {
    const avgSessionTime =
      sessions.reduce((sum, s) => sum + (s.timeSpentSec || 0), 0) /
      sessions.length;

    if (avgSessionTime < 300) {
      // Less than 5 minutes
      recommendations.push({
        type: "time_management",
        title: "Extend Your Learning Sessions",
        description:
          "Try to study for at least 10-15 minutes per session for better retention.",
        priority: "medium",
      });
    }
  }

  // Vocabulary recommendations
  const reviewingWords = vocabularyProgress.filter(
    (v) => v.status === "reviewing"
  ).length;
  if (reviewingWords > 20) {
    recommendations.push({
      type: "vocabulary_review",
      title: "Review Your Vocabulary",
      description: `You have ${reviewingWords} words in review. Spend some time practicing them.`,
      priority: "high",
    });
  }

  // Consistency recommendations
  const uniqueDays = new Set(
    sessions.map((s) => new Date(s.startedAt).toDateString())
  ).size;
  if (sessions.length > 0 && uniqueDays / sessions.length < 0.5) {
    recommendations.push({
      type: "consistency",
      title: "Build a Learning Habit",
      description:
        "Try to study a little bit every day rather than long sessions occasionally.",
      priority: "high",
    });
  }

  // Difficulty progression recommendations
  const completedLessons = lessonProgress.filter(
    (p) => p.status === "completed"
  );
  const currentDifficulties = completedLessons
    .map((p) => p.lesson?.difficulty)
    .filter(Boolean);

  if (currentDifficulties.length > 5) {
    const mostCommonDifficulty = currentDifficulties.reduce((a, b, i, arr) =>
      arr.filter((v) => v === a).length >= arr.filter((v) => v === b).length
        ? a
        : b
    );

    const difficultyOrder = [
      "beginner",
      "elementary",
      "intermediate",
      "upper_intermediate",
      "advanced",
      "proficient",
    ];
    const currentIndex = difficultyOrder.indexOf(mostCommonDifficulty);

    if (currentIndex < difficultyOrder.length - 1) {
      recommendations.push({
        type: "difficulty_progression",
        title: "Ready for the Next Level?",
        description: `You've mastered ${mostCommonDifficulty} level. Consider trying ${difficultyOrder[currentIndex + 1]} content.`,
        priority: "medium",
      });
    }
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
}
