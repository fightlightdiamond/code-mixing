import { NextRequest, NextResponse } from "next/server";
import { caslGuard, RequiredRule } from "@/core/auth/casl.guard";
import jwt from "jsonwebtoken";

import { prisma } from "@/core/prisma";

// Helper function to get user from request
async function getUserFromRequest(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as {
      userId: string;
      email: string;
      role: string;
      tenantId?: string;
    };

    return {
      sub: decoded.userId,
      tenantId: decoded.tenantId,
      roles: [decoded.role],
    };
  } catch (error) {
    return null;
  }
}

// GET /api/dashboard/stats - Lấy thống kê tổng quan hệ thống
export async function GET(request: NextRequest) {
  try {
    // Get user from request
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define the rules required to access this endpoint
    const rules: RequiredRule[] = [{ action: "read", subject: "User" }]; // Changed from Dashboard to User

    // Check if user has required permissions
    const { allowed, error } = caslGuard(rules, user);

    if (!allowed) {
      return NextResponse.json(
        { error: error || "Forbidden" },
        { status: 403 }
      );
    }

    // Parallel queries for better performance
    const [
      usersStats,
      lessonsStats,
      vocabulariesStats,
      storiesStats,
      quizzesStats,
      recentActivity,
    ] = await Promise.all([
      // Users statistics
      prisma.user.count().then(async (total) => {
        const activeUsers = await prisma.user.count({
          where: {
            updatedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        });
        return { total, active: activeUsers };
      }),

      // Lessons statistics
      prisma.lesson.count().then(async (total) => {
        const byStatus = await prisma.lesson.groupBy({
          by: ["status"],
          _count: { id: true },
        });
        return {
          total,
          byStatus: byStatus.reduce((acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
          }, {} as Record<string, number>),
        };
      }),

      // Vocabularies statistics
      prisma.vocabulary.count().then(async (total) => {
        return { total };
      }),

      // Stories statistics
      prisma.story.count().then(async (total) => {
        const byType = await prisma.story.groupBy({
          by: ["storyType"],
          _count: { id: true },
        });
        const totalChunks = await prisma.storyChunk.count();
        return {
          total,
          totalChunks,
          byType: byType.reduce((acc, item) => {
            acc[item.storyType] = item._count.id;
            return acc;
          }, {} as Record<string, number>),
        };
      }),

      // Quizzes statistics
      prisma.quiz.count().then(async (total) => {
        const totalQuestions = await prisma.question.count();
        const totalResults = await prisma.userResult.count();
        return {
          total,
          totalQuestions,
          totalResults,
        };
      }),

      // Recent activity (last 10 items)
      Promise.all([
        prisma.user
          .findMany({
            select: {
              id: true,
              name: true,
              email: true,
              updatedAt: true,
            },
            orderBy: { updatedAt: "desc" },
            take: 5,
          })
          .then((users) => users.map((u) => ({ ...u, type: "user" }))),

        prisma.lesson
          .findMany({
            select: {
              id: true,
              title: true,
              status: true,
              updatedAt: true,
            },
            orderBy: { updatedAt: "desc" },
            take: 5,
          })
          .then((lessons) => lessons.map((l) => ({ ...l, type: "lesson" }))),

        prisma.story
          .findMany({
            select: {
              id: true,
              title: true,
              storyType: true,
              updatedAt: true,
            },
            orderBy: { updatedAt: "desc" },
            take: 5,
          })
          .then((stories) => stories.map((s) => ({ ...s, type: "story" }))),

        prisma.quiz
          .findMany({
            select: {
              id: true,
              title: true,
              updatedAt: true,
            },
            orderBy: { updatedAt: "desc" },
            take: 5,
          })
          .then((quizzes) => quizzes.map((q) => ({ ...q, type: "quiz" }))),
      ]).then((activities) => {
        return activities
          .flat()
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          .slice(0, 10);
      }),
    ]);

    const stats = {
      users: usersStats,
      lessons: lessonsStats,
      vocabularies: vocabulariesStats,
      stories: storiesStats,
      quizzes: quizzesStats,
      recentActivity,
      summary: {
        totalContent:
          lessonsStats.total +
          vocabulariesStats.total +
          storiesStats.total +
          quizzesStats.total,
        totalInteractions: quizzesStats.totalResults,
        activeUsers: usersStats.active,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
