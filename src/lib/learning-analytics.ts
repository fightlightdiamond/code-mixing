/**
 * Learning Analytics Utilities
 * 
 * Provides helper functions for tracking learning sessions, progress, and generating insights.
 * Supports comprehensive analytics for the EdTech platform.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface StartLearningSessionData {
  userId: string;
  tenantId: string;
  courseId?: string;
  lessonId?: string;
  storyId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateLearningSessionData {
  endTime?: Date;
  durationMinutes?: number;
  activitiesCount?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  metadata?: Record<string, unknown>;
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
        courseId: data.courseId || null,
        lessonId: data.lessonId || null,
        storyId: data.storyId || null,
        startTime: new Date(),
        metadata: data.metadata || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
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
    console.error('Failed to start learning session:', error);
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
        endTime: data.endTime,
        durationMinutes: data.durationMinutes,
        activitiesCount: data.activitiesCount,
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions,
        metadata: data.metadata,
      },
    });
  } catch (error) {
    console.error('Failed to update learning session:', error);
    throw error;
  }
}

/**
 * End a learning session with automatic duration calculation
 */
export async function endLearningSession(
  sessionId: string,
  activitiesCount = 0,
  correctAnswers = 0,
  totalQuestions = 0,
  metadata?: Record<string, unknown>
) {
  try {
    // Get the session to calculate duration
    const session = await prisma.learningSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Learning session not found');
    }

    const endTime = new Date();
    const durationMinutes = Math.round(
      (endTime.getTime() - session.startTime.getTime()) / (1000 * 60)
    );

    return await updateLearningSession(sessionId, {
      endTime,
      durationMinutes,
      activitiesCount,
      correctAnswers,
      totalQuestions,
      metadata,
    });
  } catch (error) {
    console.error('Failed to end learning session:', error);
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
        course: {
          select: {
            id: true,
            title: true,
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
      orderBy: {
        startTime: 'desc',
      },
      take: limit,
      skip: offset,
    });
  } catch (error) {
    console.error('Failed to get user learning sessions:', error);
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
      totalActivities,
      totalQuestions,
      totalCorrect,
      recentSessions,
    ] = await Promise.all([
      prisma.learningSession.count({
        where: { userId, tenantId },
      }),
      prisma.learningSession.count({
        where: { userId, tenantId, endTime: { not: null } },
      }),
      prisma.learningSession.aggregate({
        where: { userId, tenantId, durationMinutes: { not: null } },
        _sum: { durationMinutes: true },
      }),
      prisma.learningSession.aggregate({
        where: { userId, tenantId },
        _sum: { activitiesCount: true },
      }),
      prisma.learningSession.aggregate({
        where: { userId, tenantId },
        _sum: { totalQuestions: true },
      }),
      prisma.learningSession.aggregate({
        where: { userId, tenantId },
        _sum: { correctAnswers: true },
      }),
      prisma.learningSession.findMany({
        where: { userId, tenantId },
        orderBy: { startTime: 'desc' },
        take: 7,
        select: {
          startTime: true,
          durationMinutes: true,
          activitiesCount: true,
        },
      }),
    ]);

    const averageAccuracy = totalQuestions._sum && totalCorrect._sum
      ? (totalCorrect._sum / totalQuestions._sum) * 100
      : 0;

    const averageSessionDuration = completedSessions > 0 && totalDuration._sum
      ? totalDuration._sum / completedSessions
      : 0;

    return {
      totalSessions,
      completedSessions,
      activeSessions: totalSessions - completedSessions,
      totalDurationMinutes: totalDuration._sum || 0,
      averageSessionDuration: Math.round(averageSessionDuration),
      totalActivities: totalActivities._sum || 0,
      totalQuestions: totalQuestions._sum || 0,
      totalCorrectAnswers: totalCorrect._sum || 0,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      recentSessions,
    };
  } catch (error) {
    console.error('Failed to get user learning analytics:', error);
    return {
      totalSessions: 0,
      completedSessions: 0,
      activeSessions: 0,
      totalDurationMinutes: 0,
      averageSessionDuration: 0,
      totalActivities: 0,
      totalQuestions: 0,
      totalCorrectAnswers: 0,
      averageAccuracy: 0,
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
      averageAccuracy,
      completionRate,
    ] = await Promise.all([
      prisma.learningSession.count({
        where: { courseId, tenantId },
      }),
      prisma.learningSession.findMany({
        where: { courseId, tenantId },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.learningSession.aggregate({
        where: { courseId, tenantId, durationMinutes: { not: null } },
        _sum: { durationMinutes: true },
      }),
      prisma.learningSession.aggregate({
        where: { 
          courseId, 
          tenantId, 
          totalQuestions: { gt: 0 },
          correctAnswers: { not: null }
        },
        _avg: {
          correctAnswers: true,
        },
      }),
      prisma.learningSession.count({
        where: { 
          courseId, 
          tenantId, 
          endTime: { not: null }
        },
      }),
    ]);

    return {
      totalSessions,
      uniqueUsers: uniqueUsers.length,
      totalDurationMinutes: totalDuration._sum || 0,
      averageAccuracy: averageAccuracy._avg?.correctAnswers || 0,
      completionRate: totalSessions > 0 ? (completionRate / totalSessions) * 100 : 0,
    };
  } catch (error) {
    console.error('Failed to get course learning analytics:', error);
    return {
      totalSessions: 0,
      uniqueUsers: 0,
      totalDurationMinutes: 0,
      averageAccuracy: 0,
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
      popularCourses,
      dailyActivity,
    ] = await Promise.all([
      prisma.learningSession.count({
        where: { tenantId },
      }),
      prisma.learningSession.findMany({
        where: { 
          tenantId,
          startTime: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      prisma.learningSession.aggregate({
        where: { tenantId, durationMinutes: { not: null } },
        _sum: { durationMinutes: true },
      }),
      prisma.learningSession.groupBy({
        by: ['courseId'],
        where: { tenantId, courseId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.learningSession.groupBy({
        by: ['startTime'],
        where: { 
          tenantId,
          startTime: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        _count: { id: true },
      }),
    ]);

    return {
      totalSessions,
      activeUsers: activeUsers.length,
      totalDurationMinutes: totalDuration._sum || 0,
      popularCourses: popularCourses.map(course => ({
        courseId: course.courseId,
        sessionCount: course._count.id,
      })),
      dailyActivity: dailyActivity.map(day => ({
        date: day.startTime,
        sessionCount: day._count.id,
      })),
    };
  } catch (error) {
    console.error('Failed to get tenant learning analytics:', error);
    return {
      totalSessions: 0,
      activeUsers: 0,
      totalDurationMinutes: 0,
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
        endTime: { not: null },
      },
      select: {
        startTime: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastActivity: null };
    }

    // Calculate streaks by checking consecutive days
    const dates = sessions.map(s => 
      new Date(s.startTime.getFullYear(), s.startTime.getMonth(), s.startTime.getDate())
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
      lastActivity: sessions[0].startTime,
    };
  } catch (error) {
    console.error('Failed to get user learning streak:', error);
    return { currentStreak: 0, longestStreak: 0, lastActivity: null };
  }
}
