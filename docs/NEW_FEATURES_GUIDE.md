# New Schema Features - Usage Guide

## 🚀 Quick Start Guide

This guide shows how to use the new features added to the Prisma schema after the migration.

## 📊 Audit Logging

### Basic Usage

```typescript
import { auditCreate, auditUpdate, auditDelete } from '@/lib/audit';

// When creating a new course
const course = await prisma.course.create({
  data: { title: "Advanced English", tenantId: user.tenantId }
});

// Log the creation
await auditCreate('Course', course.id, course, user.id, user.tenantId);
```

### Advanced Usage

```typescript
// When updating with change tracking
const oldCourse = await prisma.course.findUnique({ where: { id: courseId } });

const updatedCourse = await prisma.course.update({
  where: { id: courseId },
  data: { title: "Updated Title", isPublished: true }
});

// Log the update with before/after values
await auditUpdate(
  'Course', 
  courseId, 
  oldCourse, 
  updatedCourse, 
  user.id, 
  user.tenantId,
  { reason: 'Content review completed' }
);
```

## 🔔 Notifications

### Creating Notifications

```typescript
import { 
  createCourseUpdateNotification,
  createQuizResultNotification,
  createAchievementNotification 
} from '@/lib/notifications';

// Notify users about course updates
await createCourseUpdateNotification(
  course.id,
  course.title,
  "New lesson added to the course",
  user.id,
  user.tenantId
);

// Notify about quiz completion
await createQuizResultNotification(
  quiz.id,
  quiz.title,
  8, // correct answers
  10, // total questions
  user.id,
  user.tenantId
);
```

### Reading Notifications

```typescript
import { getUnreadNotifications, markNotificationAsRead } from '@/lib/notifications';

// Get unread notifications
const notifications = await getUnreadNotifications(user.id, user.tenantId);

// Mark as read
await markNotificationAsRead(notificationId, user.id, user.tenantId);
```

## 📈 Learning Analytics

### Tracking Learning Sessions

```typescript
import { 
  startLearningSession, 
  endLearningSession,
  getUserLearningAnalytics 
} from '@/lib/learning-analytics';

// Start a learning session
const session = await startLearningSession({
  userId: user.id,
  tenantId: user.tenantId,
  courseId: course.id,
  lessonId: lesson.id
});

// End the session with results
await endLearningSession(
  session.id,
  5, // activities completed
  8, // correct answers
  10 // total questions
);
```

### Getting Analytics

```typescript
// Get user analytics
const analytics = await getUserLearningAnalytics(user.id, user.tenantId);
console.log(`Total study time: ${analytics.totalDurationMinutes} minutes`);
console.log(`Accuracy: ${analytics.averageAccuracy}%`);

// Get learning streak
const streak = await getUserLearningStreak(user.id, user.tenantId);
console.log(`Current streak: ${streak.currentStreak} days`);
```

## 🎯 Using New Enums

### Content Status Management

```typescript
import { ContentStatus, ProgressStatus, DifficultyLevel } from '@/types/schema';

// Create content with proper status
const story = await prisma.story.create({
  data: {
    title: "The Adventure Begins",
    content: "Once upon a time...",
    status: ContentStatus.DRAFT, // Type-safe enum
    difficulty: DifficultyLevel.BEGINNER,
    tenantId: user.tenantId
  }
});

// Update status through workflow
await prisma.story.update({
  where: { id: story.id },
  data: { status: ContentStatus.IN_REVIEW }
});

// Publish when ready
await prisma.story.update({
  where: { id: story.id },
  data: { 
    status: ContentStatus.PUBLISHED,
    publishedAt: new Date()
  }
});
```

### Progress Tracking

```typescript
// Track user progress
const progress = await prisma.userProgress.create({
  data: {
    userId: user.id,
    courseId: course.id,
    status: ProgressStatus.NOT_STARTED,
    tenantId: user.tenantId
  }
});

// Update progress as user advances
await prisma.userProgress.update({
  where: { id: progress.id },
  data: { 
    status: ProgressStatus.IN_PROGRESS,
    progressPercentage: 25
  }
});

// Mark as completed
await prisma.userProgress.update({
  where: { id: progress.id },
  data: { 
    status: ProgressStatus.COMPLETED,
    progressPercentage: 100,
    completedAt: new Date()
  }
});
```

## 🔍 Advanced Queries with New Indexes

### Optimized Queries

```typescript
// Fast user lookup (indexed)
const activeUsers = await prisma.user.findMany({
  where: { 
    isActive: true, // Uses index
    tenantId: user.tenantId // Uses index
  }
});

// Fast content filtering (indexed)
const publishedCourses = await prisma.course.findMany({
  where: {
    isPublished: true, // Uses index
    difficulty: DifficultyLevel.BEGINNER, // Uses index
    tenantId: user.tenantId
  },
  orderBy: { createdAt: 'desc' } // Uses index
});

// Fast notification queries (indexed)
const recentNotifications = await prisma.notification.findMany({
  where: {
    userId: user.id, // Uses index
    isRead: false, // Uses index
    type: NotificationType.COURSE_UPDATE // Uses index
  },
  orderBy: { createdAt: 'desc' } // Uses index
});
```

## 🛡️ Best Practices

### 1. Always Use Transactions for Related Operations

```typescript
await prisma.$transaction(async (tx) => {
  // Update the entity
  const updatedCourse = await tx.course.update({
    where: { id: courseId },
    data: { title: newTitle }
  });

  // Create audit log
  await tx.auditLog.create({
    data: {
      action: 'UPDATE',
      entityType: 'Course',
      entityId: courseId,
      newValues: updatedCourse,
      userId: user.id,
      tenantId: user.tenantId
    }
  });

  // Send notification
  await tx.notification.create({
    data: {
      type: NotificationType.COURSE_UPDATE,
      title: 'Course Updated',
      message: `${updatedCourse.title} has been updated`,
      userId: user.id,
      tenantId: user.tenantId
    }
  });
});
```

### 2. Use Enum Validation

```typescript
import { isContentStatus, isProgressStatus } from '@/types/schema';

// Validate before database operations
function updateContentStatus(id: string, status: string) {
  if (!isContentStatus(status)) {
    throw new Error(`Invalid content status: ${status}`);
  }
  
  return prisma.story.update({
    where: { id },
    data: { status }
  });
}
```

### 3. Implement Proper Error Handling

```typescript
import { createAuditLog } from '@/lib/audit';

async function updateCourseWithAudit(courseId: string, data: any, userId: string, tenantId: string) {
  try {
    const oldCourse = await prisma.course.findUnique({ where: { id: courseId } });
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data
    });

    // Audit logging should not fail the main operation
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Course',
      entityId: courseId,
      oldValues: oldCourse,
      newValues: updatedCourse,
      userId,
      tenantId
    }).catch(error => {
      console.error('Audit logging failed:', error);
      // Continue without throwing
    });

    return updatedCourse;
  } catch (error) {
    console.error('Course update failed:', error);
    throw error;
  }
}
```

### 4. Use Analytics for Insights

```typescript
// Create a learning dashboard
async function getLearningDashboard(userId: string, tenantId: string) {
  const [analytics, streak, recentSessions] = await Promise.all([
    getUserLearningAnalytics(userId, tenantId),
    getUserLearningStreak(userId, tenantId),
    getUserLearningSessions(userId, tenantId, 10)
  ]);

  return {
    totalStudyTime: analytics.totalDurationMinutes,
    accuracy: analytics.averageAccuracy,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    recentActivity: recentSessions,
    achievements: analytics.totalActivities > 100 ? ['Study Master'] : []
  };
}
```

## 🎨 Frontend Integration Examples

### React Hook for Notifications

```typescript
// hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useNotifications(userId: string, tenantId: string) {
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => getUnreadNotifications(userId, tenantId)
  });

  const markAsRead = useMutation({
    mutationFn: (notificationId: string) => 
      markNotificationAsRead(notificationId, userId, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    }
  });

  return {
    notifications: notifications || [],
    unreadCount: notifications?.length || 0,
    markAsRead: markAsRead.mutate
  };
}
```

### Learning Analytics Dashboard Component

```typescript
// components/LearningDashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { getUserLearningAnalytics } from '@/lib/learning-analytics';

export function LearningDashboard({ userId, tenantId }: Props) {
  const { data: analytics } = useQuery({
    queryKey: ['learning-analytics', userId],
    queryFn: () => getUserLearningAnalytics(userId, tenantId)
  });

  if (!analytics) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard 
        title="Study Time" 
        value={`${analytics.totalDurationMinutes} min`} 
      />
      <StatCard 
        title="Accuracy" 
        value={`${analytics.averageAccuracy}%`} 
      />
      <StatCard 
        title="Sessions" 
        value={analytics.totalSessions} 
      />
      <StatCard 
        title="Activities" 
        value={analytics.totalActivities} 
      />
    </div>
  );
}
```

## 🔄 Migration from Old Code

### Before (String-based status)

```typescript
// Old way
const course = await prisma.course.create({
  data: {
    title: "My Course",
    status: "draft" // String literal
  }
});
```

### After (Enum-based status)

```typescript
// New way
import { ContentStatus } from '@/types/schema';

const course = await prisma.course.create({
  data: {
    title: "My Course",
    status: ContentStatus.DRAFT // Type-safe enum
  }
});
```

## 📋 Checklist for New Features

- [ ] Use proper enums instead of string literals
- [ ] Add audit logging for important operations
- [ ] Implement notifications for user actions
- [ ] Track learning sessions for analytics
- [ ] Use transactions for related operations
- [ ] Handle errors gracefully
- [ ] Validate enum values before database operations
- [ ] Use indexes for optimized queries
- [ ] Test new features thoroughly

## 🎯 Next Steps

1. **Implement in existing features**: Gradually migrate existing code to use new enums and features
2. **Add monitoring**: Set up monitoring for audit logs and learning analytics
3. **Create dashboards**: Build admin dashboards using the new analytics data
4. **Optimize performance**: Monitor query performance with new indexes
5. **Add more features**: Consider additional analytics and notification types

---

**Happy coding with the enhanced schema! 🚀**
