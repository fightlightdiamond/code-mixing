/**
 * Learning Analytics Utilities
 * 
 * Provides helper functions for tracking learning sessions, progress, and generating insights.
 * Supports comprehensive analytics for the EdTech platform.
 */
import logger from '@/lib/logger';
import { prisma } from "@/core/prisma";

export interface StartLearningSessionData {
  userId: string;
  tenantId: string;
  lessonId?: string;
  storyId?: string;
}

export interface UpdateLearningSessionData {
  endedAt?: Date;
  timeSpentSec?: number;
  interactionCount?: number;
}

/**
 * Start a new learning session
 */
export async function startLearningSession(data: StartLearningSessionData) {
  try {
    return await prisma.learningSession.create({
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        lessonId: data.lessonId || null,
        storyId: data.storyId || null,
        startedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
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
      },
    });
  } catch (error) {
    logger.error('Failed to start learning session', undefined, error);
    throw error;
  }
}

/**
 * Update a learning session (typically when ending)
 */
export async function updateLearningSession(
  sessionId: string,
  data: UpdateLearningSessionData
) {
  try {
    return await prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        endedAt: data.endedAt,
        timeSpentSec: data.timeSpentSec,
        interactionCount: data.interactionCount,
      },
    });
  } catch (error) {
    logger.error('Failed to update learning session', undefined, error);
    throw error;
  }
}

/**
 * End a learning session with automatic duration calculation
 */
export async function endLearningSession(
  sessionId: string,
  interactionCount = 0
) {
  try {
    // Get the session to calculate duration
    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Learning session not found');
    }

    const endedAt = new Date();
    const timeSpentSec = Math.round(
      (endedAt.getTime() - session.startedAt.getTime()) / 1000
    );

    return await updateLearningSession(sessionId, {
      endedAt,
      timeSpentSec,
      interactionCount,
    });
  } catch (error) {
    logger.error('Failed to end learning session', undefined, error);
    throw error;
  }
}

/**
 * Get learning sessions for a user
 */
export async function getUserLearningSessions(
  userId: string,
  tenantId: string,
  limit = 50,
  offset = 0
) {
  try {
    return await prisma.learningSession.findMany({
      where: {
        userId,
        tenantId,
      },
      include: {
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
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  } catch (error) {
    logger.error('Failed to get user learning sessions', undefined, error);
    return [];
  }
}

/**
 * Get learning analytics for a user
 */
export async function getUserLearningAnalytics(userId: string, tenantId: string) {
  try {
    const [
      totalSessions,
      completedSessions,
      totalDuration,
      recentSessions,
    ] = await Promise.all([
      prisma.learningSession.count({
        where: { userId, tenantId },
      }),
      prisma.learningSession.count({
        where: { userId, tenantId, endedAt: { not: null } },
      }),
      prisma.learningSession.aggregate({
        where: { userId, tenantId, timeSpentSec: { not: null } },
        _sum: { timeSpentSec: true },
      }),
      prisma.learningSession.findMany({
        where: { userId, tenantId },
        orderBy: { startedAt: 'desc' },
        take: 7,
        select: {
          startedAt: true,
          timeSpentSec: true,
          interactionCount: true,
        },
      }),
    ]);

    const totalDurationSec = totalDuration._sum?.timeSpentSec ?? 0;
    const averageSessionDuration = completedSessions > 0
      ? totalDurationSec / completedSessions
      : 0;

    return {
      totalSessions,
      completedSessions,
      activeSessions: totalSessions - completedSessions,
      totalDurationSeconds: totalDurationSec,
      averageSessionDurationSeconds: Math.round(averageSessionDuration),
      recentSessions,
    };
  } catch (error) {
    logger.error('Failed to get user learning analytics', undefined, error);
    return {
      totalSessions: 0,
      completedSessions: 0,
      activeSessions: 0,
      totalDurationSeconds: 0,
      averageSessionDurationSeconds: 0,
      recentSessions: [],
    };
  }
}

/**
 * Get course learning analytics
 */
export async function getCourseLearningAnalytics(courseId: string, tenantId: string) {
  try {
    const [
      totalSessions,
      uniqueUsers,
      totalDuration,
      completedSessions,
    ] = await Promise.all([
      prisma.learningSession.count({
        where: { tenantId, lesson: { courseId } },
      }),
      prisma.learningSession.findMany({
        where: { tenantId, lesson: { courseId } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.learningSession.aggregate({
        where: { tenantId, lesson: { courseId }, timeSpentSec: { not: null } },
        _sum: { timeSpentSec: true },
      }),
      prisma.learningSession.count({
        where: { tenantId, lesson: { courseId }, endedAt: { not: null } },
      }),
    ]);

    return {
      totalSessions,
      uniqueUsers: uniqueUsers.length,
      totalDurationSeconds: totalDuration._sum?.timeSpentSec ?? 0,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
    };
  } catch (error) {
    logger.error('Failed to get course learning analytics', undefined, error);
    return {
      totalSessions: 0,
      uniqueUsers: 0,
      totalDurationSeconds: 0,
      completionRate: 0,
    };
  }
}

/**
 * Get tenant-wide learning analytics
 */
export async function getTenantLearningAnalytics(tenantId: string) {
  try {
    const [
      totalSessions,
      activeUsers,
      totalDuration,
      sessionsForPopularCourses,
      dailyActivity,
    ] = await Promise.all([
      prisma.learningSession.count({
        where: { tenantId },
      }),
      prisma.learningSession.findMany({
        where: { 
          tenantId,
          startedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.learningSession.aggregate({
        where: { tenantId, timeSpentSec: { not: null } },
        _sum: { timeSpentSec: true },
      }),
      prisma.learningSession.findMany({
        where: { tenantId, lessonId: { not: null } },
        select: { lesson: { select: { courseId: true } } },
        orderBy: { startedAt: 'desc' },
        take: 1000,
      }),
      prisma.learningSession.groupBy({
        by: ['startedAt'],
        where: { 
          tenantId,
          startedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        _count: { id: true },
      }),
    ]);

    // Aggregate popular courses in code from recent sessions (limited)
    const courseCounts = new Map<string, number>();
    for (const s of sessionsForPopularCourses) {
      const cid = s.lesson?.courseId ?? null;
      if (!cid) continue;
      courseCounts.set(cid, (courseCounts.get(cid) ?? 0) + 1);
    }
    const popularCourses = Array.from(courseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([courseId, count]) => ({ courseId, sessionCount: count }));

    return {
      totalSessions,
      activeUsers: activeUsers.length,
      totalDurationSeconds: totalDuration._sum?.timeSpentSec ?? 0,
      popularCourses,
      dailyActivity: dailyActivity.map(day => ({
        date: day.startedAt,
        sessionCount: day._count.id,
      })),
    };
  } catch (error) {
    logger.error('Failed to get tenant learning analytics', undefined, error);
    return {
      totalSessions: 0,
      activeUsers: 0,
      totalDurationSeconds: 0,
      popularCourses: [],
      dailyActivity: [],
    };
  }
}

/**
 * Get learning streaks for a user
 */
export async function getUserLearningStreak(userId: string, tenantId: string) {
  try {
    const sessions = await prisma.learningSession.findMany({
      where: {
        userId,
        tenantId,
        endedAt: { not: null },
      },
      select: {
        startedAt: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastActivity: null };
    }

    // Calculate streaks by checking consecutive days
    const dates = sessions.map(s => 
      new Date(s.startedAt.getFullYear(), s.startedAt.getMonth(), s.startedAt.getDate())
    );
    
    const uniqueDates = [...new Set(dates.map(d => d.getTime()))].sort((a, b) => b - a);
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if user was active today or yesterday for current streak
    const mostRecentDate = new Date(uniqueDates[0]);
    const daysDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) {
      currentStreak = 1;
      
      // Calculate current streak
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    // Calculate longest streak
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
    
    return {
      currentStreak,
      longestStreak,
      lastActivity: sessions[0].startedAt,
    };
  } catch (error) {
    logger.error('Failed to get user learning streak', undefined, error);
    return { currentStreak: 0, longestStreak: 0, lastActivity: null };
  }
}
