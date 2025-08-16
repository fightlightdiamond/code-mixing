/**
 * Notification System Utilities
 * 
 * Provides helper functions for creating and managing user notifications.
 * Supports different notification types and delivery methods.
 */

import { NotificationType } from '@prisma/client';
import { prisma } from "@/core/prisma";
import logger from '@/lib/logger';

export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  tenantId: string;
}

/**
 * Create a new notification for a user
 */
export async function createNotification(data: CreateNotificationData) {
  try {
    return await prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId,
        tenantId: data.tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error('Failed to create notification', undefined, error);
    throw error;
  }
}

/**
 * Create system notification
 */
export async function createSystemNotification(
  title: string,
  message: string,
  userId: string,
  tenantId: string,
) {
  return createNotification({
    type: NotificationType.info,
    title,
    message,
    userId,
    tenantId,
  });
}

/**
 * Create course update notification
 */
export async function createCourseUpdateNotification(
  courseId: string,
  courseName: string,
  updateMessage: string,
  userId: string,
  tenantId: string
) {
  return createNotification({
    type: NotificationType.info,
    title: `Course Updated: ${courseName}`,
    message: updateMessage,
    userId,
    tenantId,
  });
}

/**
 * Create quiz result notification
 */
export async function createQuizResultNotification(
  quizId: string,
  quizTitle: string,
  score: number,
  totalQuestions: number,
  userId: string,
  tenantId: string
) {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  return createNotification({
    type: NotificationType.success,
    title: `Quiz Completed: ${quizTitle}`,
    message: `You scored ${score}/${totalQuestions} (${percentage}%) on the quiz.`,
    userId,
    tenantId,
  });
}

/**
 * Create achievement notification
 */
export async function createAchievementNotification(
  achievementName: string,
  achievementDescription: string,
  userId: string,
  tenantId: string,
) {
  return createNotification({
    type: NotificationType.success,
    title: `Achievement Unlocked: ${achievementName}`,
    message: achievementDescription,
    userId,
    tenantId,
  });
}

/**
 * Create reminder notification
 */
export async function createReminderNotification(
  title: string,
  message: string,
  userId: string,
  tenantId: string,
) {
  return createNotification({
    type: NotificationType.warning,
    title,
    message,
    userId,
    tenantId,
  });
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: string, tenantId: string) {
  try {
    return await prisma.notification.findMany({
      where: {
        userId,
        tenantId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  } catch (error) {
    logger.error('Failed to get unread notifications', undefined, error);
    return [];
  }
}

/**
 * Get all notifications for a user (with pagination)
 */
export async function getUserNotifications(
  userId: string,
  tenantId: string,
  page = 1,
  limit = 20
) {
  try {
    const skip = (page - 1) * limit;
    
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          tenantId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: {
          userId,
          tenantId,
        },
      }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error('Failed to get user notifications', undefined, error);
    return {
      notifications: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
  tenantId: string
) {
  try {
    return await prisma.notification.update({
      where: {
        id: notificationId,
        userId,
        tenantId,
      },
      data: {
        isRead: true,
      },
    });
  } catch (error) {
    logger.error('Failed to mark notification as read', undefined, error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string, tenantId: string) {
  try {
    return await prisma.notification.updateMany({
      where: {
        userId,
        tenantId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  } catch (error) {
    logger.error('Failed to mark all notifications as read', undefined, error);
    throw error;
  }
}

/**
 * Delete old notifications (for cleanup)
 */
export async function deleteOldNotifications(
  tenantId: string,
  olderThanDays = 90
) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.notification.deleteMany({
      where: {
        tenantId,
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true,
      },
    });

    return result.count;
  } catch (error) {
    logger.error('Failed to delete old notifications', undefined, error);
    return 0;
  }
}

/**
 * Get notification statistics for a user
 */
export async function getNotificationStats(userId: string, tenantId: string) {
  try {
    const [total, unread, byType] = await Promise.all([
      prisma.notification.count({
        where: { userId, tenantId },
      }),
      prisma.notification.count({
        where: { userId, tenantId, isRead: false },
      }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { userId, tenantId },
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      total,
      unread,
      read: total - unread,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  } catch (error) {
    logger.error('Failed to get notification stats', undefined, error);
    return {
      total: 0,
      unread: 0,
      read: 0,
      byType: {},
    };
  }
}
