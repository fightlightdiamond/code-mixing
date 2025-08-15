/**
 * Audit Logging Utilities
 * 
 * Provides helper functions for creating audit logs throughout the application.
 * Tracks user actions, data changes, and system events for compliance and debugging.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import logger from '@/lib/logger';

const prisma = new PrismaClient();

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ACCESS';

export interface AuditLogData {
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Prisma.InputJsonValue | null;
  newValues?: Prisma.InputJsonValue | null;
  userId: string;
  tenantId: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    return await prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues ?? Prisma.JsonNull,
        newValues: data.newValues ?? Prisma.JsonNull,
        userId: data.userId,
        tenantId: data.tenantId,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log', undefined, error);
    // Don't throw - audit logging should not break main functionality
    return null;
  }
}

/**
 * Create audit log for entity creation
 */
export async function auditCreate(
  entityType: string,
  entityId: string,
  newValues: Prisma.InputJsonValue,
  userId: string,
  tenantId: string,
) {
  return createAuditLog({
    action: 'CREATE',
    entityType,
    entityId,
    newValues,
    userId,
    tenantId,
  });
}

/**
 * Create audit log for entity updates
 */
export async function auditUpdate(
  entityType: string,
  entityId: string,
  oldValues: Prisma.InputJsonValue,
  newValues: Prisma.InputJsonValue,
  userId: string,
  tenantId: string,
) {
  return createAuditLog({
    action: 'UPDATE',
    entityType,
    entityId,
    oldValues,
    newValues,
    userId,
    tenantId,
  });
}

/**
 * Create audit log for entity deletion
 */
export async function auditDelete(
  entityType: string,
  entityId: string,
  oldValues: Prisma.InputJsonValue,
  userId: string,
  tenantId: string,
) {
  return createAuditLog({
    action: 'DELETE',
    entityType,
    entityId,
    oldValues,
    userId,
    tenantId,
  });
}

/**
 * Create audit log for user authentication events
 */
export async function auditAuth(
  action: 'LOGIN' | 'LOGOUT',
  userId: string,
  tenantId: string,
) {
  return createAuditLog({
    action,
    entityType: 'User',
    entityId: userId,
    userId,
    tenantId,
  });
}

/**
 * Create audit log for access events
 */
export async function auditAccess(
  entityType: string,
  entityId: string,
  userId: string,
  tenantId: string,
) {
  return createAuditLog({
    action: 'ACCESS',
    entityType,
    entityId,
    userId,
    tenantId,
  });
}

/**
 * Get audit logs for an entity
 */
export async function getAuditLogs(
  entityType: string,
  entityId: string,
  tenantId: string,
  limit = 50
) {
  try {
    return await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
        tenantId,
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
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  } catch (error) {
    logger.error('Failed to get audit logs', undefined, error);
    return [];
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  tenantId: string,
  limit = 100
) {
  try {
    return await prisma.auditLog.findMany({
      where: {
        userId,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  } catch (error) {
    logger.error('Failed to get user audit logs', undefined, error);
    return [];
  }
}

/**
 * Clean up old audit logs (for maintenance)
 */
export async function cleanupAuditLogs(
  tenantId: string,
  olderThanDays = 365
) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        tenantId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    logger.error('Failed to cleanup audit logs', undefined, error);
    return 0;
  }
}
