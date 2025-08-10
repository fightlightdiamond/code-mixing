/**
 * User Roles Configuration
 * Centralized user role definitions and permissions
 */

export type UserRole = 'admin' | 'teacher' | 'student' | 'guest';

export interface RoleConfig {
  id: UserRole;
  label: string;
  description: string;
  permissions: string[];
  priority: number; // Higher number = higher priority
}

export const USER_ROLES: Record<UserRole, RoleConfig> = {
  admin: {
    id: 'admin',
    label: 'Administrator',
    description: 'Full system access and management capabilities',
    permissions: ['*'], // All permissions
    priority: 100
  },
  teacher: {
    id: 'teacher',
    label: 'Teacher',
    description: 'Can create and manage lessons and stories',
    permissions: [
      'lessons:create',
      'lessons:read',
      'lessons:update',
      'lessons:delete',
      'stories:create',
      'stories:read',
      'stories:update',
      'stories:delete',
      'students:read'
    ],
    priority: 50
  },
  student: {
    id: 'student',
    label: 'Student',
    description: 'Can access and complete lessons',
    permissions: [
      'lessons:read',
      'stories:read',
      'progress:create',
      'progress:read',
      'progress:update'
    ],
    priority: 10
  },
  guest: {
    id: 'guest',
    label: 'Guest',
    description: 'Limited read-only access',
    permissions: [
      'lessons:read:public',
      'stories:read:public'
    ],
    priority: 1
  }
};

export const VALID_USER_ROLES: UserRole[] = Object.keys(USER_ROLES) as UserRole[];

// Helper functions
export function isValidUserRole(role: string): role is UserRole {
  return VALID_USER_ROLES.includes(role as UserRole);
}

export function getRoleConfig(role: UserRole): RoleConfig {
  return USER_ROLES[role];
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  const roleConfig = USER_ROLES[userRole];
  
  // Admin has all permissions
  if (roleConfig.permissions.includes('*')) {
    return true;
  }
  
  return roleConfig.permissions.includes(permission);
}

export function getRolesByPriority(): UserRole[] {
  return VALID_USER_ROLES.sort((a, b) => USER_ROLES[b].priority - USER_ROLES[a].priority);
}
