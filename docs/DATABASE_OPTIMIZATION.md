# Database Optimization Guide

## Overview

This guide provides comprehensive database optimization strategies for the EdTech platform's PostgreSQL database with Prisma ORM. The optimizations focus on query performance, indexing strategies, connection management, and scaling considerations.

## Table of Contents

1. [Indexing Strategies](#indexing-strategies)
2. [Query Optimization](#query-optimization)
3. [Connection Pool Management](#connection-pool-management)
4. [Database Scaling](#database-scaling)
5. [Performance Monitoring](#performance-monitoring)
6. [Maintenance and Optimization](#maintenance-and-optimization)

## Indexing Strategies

### Core Performance Indexes

```sql
-- User-related indexes for authentication and tenant isolation
CREATE INDEX CONCURRENTLY idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX CONCURRENTLY idx_users_tenant_active ON users(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_users_last_login ON users(last_login_at DESC) WHERE last_login_at IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at DESC);

-- Story-related indexes for content discovery
CREATE INDEX CONCURRENTLY idx_stories_tenant_published ON stories(tenant_id, published) WHERE published = true;
CREATE INDEX CONCURRENTLY idx_stories_level_difficulty ON stories(level, difficulty_score);
CREATE INDEX CONCURRENTLY idx_stories_featured_created ON stories(featured DESC, created_at DESC);
CREATE INDEX CONCURRENTLY idx_stories_view_count ON stories(view_count DESC);
CREATE INDEX CONCURRENTLY idx_stories_title_search ON stories USING gin(to_tsvector('english', title));
CREATE INDEX CONCURRENTLY idx_stories_content_search ON stories USING gin(to_tsvector('english', content));

-- Progress tracking indexes for learning analytics
CREATE INDEX CONCURRENTLY idx_progress_user_story ON progress(user_id, story_id);
CREATE INDEX CONCURRENTLY idx_progress_user_updated ON progress(user_id, updated_at DESC);
CREATE INDEX CONCURRENTLY idx_progress_completion ON progress(completion_percentage) WHERE completion_percentage >= 80;
CREATE INDEX CONCURRENTLY idx_progress_time_spent ON progress(user_id, time_spent DESC);
CREATE INDEX CONCURRENTLY idx_progress_last_accessed ON progress(user_id, last_accessed DESC);

-- Vocabulary indexes for word learning
CREATE INDEX CONCURRENTLY idx_vocabulary_word_level ON vocabulary(word, difficulty_level);
CREATE INDEX CONCURRENTLY idx_vocabulary_frequency ON vocabulary(frequency DESC);
CREATE INDEX CONCURRENTLY idx_vocabulary_search ON vocabulary USING gin(to_tsvector('english', word || ' ' || definition));
CREATE INDEX CONCURRENTLY idx_vocabulary_pos ON vocabulary(part_of_speech);

-- User vocabulary progress indexes
CREATE INDEX CONCURRENTLY idx_user_vocab_progress ON user_vocabulary_progress(user_id, vocabulary_id);
CREATE INDEX CONCURRENTLY idx_user_vocab_mastery ON user_vocabulary_progress(user_id, mastery_level) WHERE mastery_level >= 0.8;
CREATE INDEX CONCURRENTLY idx_user_vocab_last_reviewed ON user_vocabulary_progress(user_id, last_reviewed DESC);
CREATE INDEX CONCURRENTLY idx_user_vocab_review_due ON user_vocabulary_progress(user_id, next_review_date) WHERE next_review_date <= CURRENT_DATE;

-- Exercise-related indexes
CREATE INDEX CONCURRENTLY idx_exercises_story_type ON exercises(story_id, exercise_type);
CREATE INDEX CONCURRENTLY idx_exercises_difficulty ON exercises(difficulty_level);
CREATE INDEX CONCURRENTLY idx_exercise_attempts_user ON exercise_attempts(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_exercise_attempts_success ON exercise_attempts(user_id, is_correct, created_at DESC);
CREATE INDEX CONCURRENTLY idx_exercise_attempts_exercise ON exercise_attempts(exercise_id, created_at DESC);

-- Learning session indexes for analytics
CREATE INDEX CONCURRENTLY idx_learning_sessions_user_date ON learning_sessions(user_id, started_at DESC);
CREATE INDEX CONCURRENTLY idx_learning_sessions_duration ON learning_sessions(duration_minutes) WHERE duration_minutes > 0;
CREATE INDEX CONCURRENTLY idx_learning_sessions_completed ON learning_sessions(user_id, completed_at DESC) WHERE completed_at IS NOT NULL;

-- Event tracking indexes
CREATE INDEX CONCURRENTLY idx_user_events_type_date ON user_events(user_id, event_type, created_at DESC);
CREATE INDEX CONCURRENTLY idx_user_events_session ON user_events(session_id, created_at);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_stories_tenant_level_published ON stories(tenant_id, level, published) WHERE published = true;
CREATE INDEX CONCURRENTLY idx_progress_user_completion_date ON progress(user_id, completion_percentage, updated_at DESC);
CREATE INDEX CONCURRENTLY idx_vocab_progress_user_mastery_reviewed ON user_vocabulary_progress(user_id, mastery_level, last_reviewed DESC);
CREATE INDEX CONCURRENTLY idx_stories_tenant_featured_level ON stories(tenant_id, featured, level) WHERE published = true;

-- Partial indexes for specific use cases
CREATE INDEX CONCURRENTLY idx_stories_incomplete_progress ON progress(user_id, story_id) WHERE completion_percentage < 100;
CREATE INDEX CONCURRENTLY idx_vocabulary_needs_review ON user_vocabulary_progress(user_id, vocabulary_id) WHERE mastery_level < 0.8;
CREATE INDEX CONCURRENTLY idx_recent_user_activity ON user_events(user_id, created_at DESC) WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
```

### Index Maintenance and Monitoring

```sql
-- Index usage statistics query
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE
        WHEN idx_scan = 0 THEN 'Never used'
        WHEN idx_scan < 100 THEN 'Rarely used'
        WHEN idx_scan < 1000 THEN 'Moderately used'
        ELSE 'Frequently used'
    END as usage_level
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
    AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Index bloat detection
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as size,
    CASE
        WHEN pg_relation_size(indexrelid) > 100 * 1024 * 1024 THEN 'Consider REINDEX'
        ELSE 'OK'
    END as recommendation
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Query Optimization

### Optimized Query Patterns

```typescript
// lib/database/optimized-queries.ts
export class OptimizedQueries {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Optimized story fetching with pagination and filtering
  async getStoriesOptimized(params: StoryQueryParams): Promise<StoryResult> {
    const {
      userId,
      tenantId,
      level,
      difficulty,
      limit = 20,
      offset = 0,
      includeProgress = false,
      searchTerm,
    } = params;

    // Use raw query for complex filtering with proper index usage
    const whereConditions = ["s.tenant_id = $1", "s.published = true"];

    const queryParams: any[] = [tenantId];
    let paramIndex = 2;

    if (level) {
      whereConditions.push(`s.level = $${paramIndex}`);
      queryParams.push(level);
      paramIndex++;
    }

    if (difficulty) {
      whereConditions.push(
        `s.difficulty_score BETWEEN $${paramIndex} AND $${paramIndex + 1}`
      );
      queryParams.push(difficulty.min, difficulty.max);
      paramIndex += 2;
    }

    if (searchTerm) {
      whereConditions.push(`(
        to_tsvector('english', s.title) @@ plainto_tsquery('english', $${paramIndex}) OR
        to_tsvector('english', s.content) @@ plainto_tsquery('english', $${paramIndex})
      )`);
      queryParams.push(searchTerm);
      paramIndex++;
    }

    const progressJoin = includeProgress
      ? `
      LEFT JOIN progress p ON s.id = p.story_id AND p.user_id = $${paramIndex}
    `
      : "";

    if (includeProgress) {
      queryParams.push(userId);
      paramIndex++;
    }

    const progressSelect = includeProgress
      ? `
      p.completion_percentage,
      p.time_spent,
      p.last_accessed,
    `
      : `
      NULL as completion_percentage,
      NULL as time_spent,
      NULL as last_accessed,
    `;

    queryParams.push(limit, offset);

    const query = `
      SELECT 
        s.id,
        s.title,
        s.level,
        s.difficulty_score,
        s.estimated_duration,
        s.thumbnail_url,
        s.view_count,
        s.featured,
        s.created_at,
        ${progressSelect}
        COUNT(*) OVER() as total_count
      FROM stories s
      ${progressJoin}
      WHERE ${whereConditions.join(" AND ")}
      ORDER BY 
        s.featured DESC,
        ${includeProgress ? "p.last_accessed DESC NULLS LAST," : ""}
        s.created_at DESC
      LIMIT $${paramIndex - 1} OFFSET $${paramIndex}
    `;

    const results = await this.prisma.$queryRawUnsafe(query, ...queryParams);

    return {
      stories: results,
      totalCount: results.length > 0 ? results[0].total_count : 0,
      hasMore:
        offset + limit < (results.length > 0 ? results[0].total_count : 0),
    };
  }

  // Optimized user progress aggregation
  async getUserProgressSummary(userId: string): Promise<ProgressSummary> {
    const result = await this.prisma.$queryRaw<ProgressSummary[]>`
      WITH progress_stats AS (
        SELECT 
          COUNT(DISTINCT p.story_id) as stories_started,
          COUNT(DISTINCT CASE WHEN p.completion_percentage >= 100 THEN p.story_id END) as stories_completed,
          AVG(p.completion_percentage) as avg_completion,
          SUM(p.time_spent) as total_time_spent,
          MAX(p.updated_at) as last_activity
        FROM progress p
        WHERE p.user_id = ${userId}
      ),
      vocabulary_stats AS (
        SELECT 
          COUNT(DISTINCT uvp.vocabulary_id) as vocabulary_learned,
          AVG(uvp.mastery_level) as avg_vocabulary_mastery,
          COUNT(DISTINCT CASE WHEN uvp.mastery_level >= 0.8 THEN uvp.vocabulary_id END) as vocabulary_mastered
        FROM user_vocabulary_progress uvp
        WHERE uvp.user_id = ${userId}
      ),
      streak_stats AS (
        SELECT 
          COUNT(DISTINCT DATE(ls.started_at)) as active_days_last_30,
          COALESCE(current_streak.streak_days, 0) as current_streak
        FROM learning_sessions ls
        LEFT JOIN (
          SELECT COUNT(*) as streak_days
          FROM (
            SELECT DATE(started_at) as session_date,
                   ROW_NUMBER() OVER (ORDER BY DATE(started_at) DESC) as rn,
                   DATE(started_at) - INTERVAL '1 day' * ROW_NUMBER() OVER (ORDER BY DATE(started_at) DESC) as streak_group
            FROM learning_sessions
            WHERE user_id = ${userId}
              AND started_at >= CURRENT_DATE - INTERVAL '30 days'
          ) grouped
          WHERE session_date = CURRENT_DATE - INTERVAL '1 day' * (rn - 1)
          GROUP BY streak_group
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) current_streak ON true
        WHERE ls.user_id = ${userId}
          AND ls.started_at >= CURRENT_DATE - INTERVAL '30 days'
      )
      SELECT 
        ps.*,
        vs.*,
        ss.*
      FROM progress_stats ps
      CROSS JOIN vocabulary_stats vs
      CROSS JOIN streak_stats ss
    `;

    return (
      result[0] || {
        stories_started: 0,
        stories_completed: 0,
        avg_completion: 0,
        total_time_spent: 0,
        vocabulary_learned: 0,
        avg_vocabulary_mastery: 0,
        vocabulary_mastered: 0,
        active_days_last_30: 0,
        current_streak: 0,
        last_activity: null,
      }
    );
  }

  // Optimized vocabulary recommendations with spaced repetition
  async getVocabularyRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<VocabularyRecommendation[]> {
    return await this.prisma.$queryRaw<VocabularyRecommendation[]>`
      WITH user_level AS (
        SELECT 
          COALESCE(AVG(s.difficulty_score), 1.0) as avg_difficulty,
          COUNT(DISTINCT p.story_id) as stories_completed
        FROM progress p
        JOIN stories s ON p.story_id = s.id
        WHERE p.user_id = ${userId}
          AND p.completion_percentage > 80
      ),
      vocabulary_scores AS (
        SELECT 
          v.id,
          v.word,
          v.definition,
          v.difficulty_level,
          v.frequency,
          v.part_of_speech,
          COALESCE(uvp.mastery_level, 0) as current_mastery,
          COALESCE(uvp.review_count, 0) as review_count,
          uvp.last_reviewed,
          uvp.next_review_date,
          -- Spaced repetition scoring
          CASE 
            WHEN uvp.next_review_date IS NULL THEN 1.0
            WHEN uvp.next_review_date <= CURRENT_DATE THEN 1.0
            WHEN uvp.last_reviewed < CURRENT_DATE - INTERVAL '7 days' THEN 0.9
            WHEN uvp.last_reviewed < CURRENT_DATE - INTERVAL '3 days' THEN 0.7
            ELSE 0.3
          END as review_urgency,
          -- Difficulty matching score
          1.0 - ABS(v.difficulty_level - (SELECT avg_difficulty FROM user_level)) / 2.0 as difficulty_match,
          -- Frequency boost for common words
          LEAST(v.frequency / 1000.0, 1.0) as frequency_score
        FROM vocabulary v
        LEFT JOIN user_vocabulary_progress uvp ON v.id = uvp.vocabulary_id AND uvp.user_id = ${userId}
        WHERE v.difficulty_level <= (SELECT avg_difficulty FROM user_level) + 0.5
          AND (uvp.mastery_level IS NULL OR uvp.mastery_level < 0.9)
      )
      SELECT 
        id,
        word,
        definition,
        difficulty_level,
        frequency,
        part_of_speech,
        current_mastery,
        review_count,
        last_reviewed,
        next_review_date,
        -- Combined recommendation score
        (review_urgency * 0.4 + difficulty_match * 0.3 + frequency_score * 0.3) as recommendation_score
      FROM vocabulary_scores
      WHERE current_mastery < 0.9
      ORDER BY 
        recommendation_score DESC,
        review_urgency DESC,
        frequency DESC
      LIMIT ${limit}
    `;
  }

  // Batch operations for better performance
  async batchUpdateProgress(progressUpdates: ProgressUpdate[]): Promise<void> {
    if (progressUpdates.length === 0) return;

    // Use UNNEST for efficient batch operations
    const userIds = progressUpdates.map((u) => u.userId);
    const storyIds = progressUpdates.map((u) => u.storyId);
    const completionPercentages = progressUpdates.map(
      (u) => u.completionPercentage
    );
    const timeSpents = progressUpdates.map((u) => u.timeSpent);

    await this.prisma.$executeRaw`
      INSERT INTO progress (user_id, story_id, completion_percentage, time_spent, updated_at)
      SELECT 
        unnest(${userIds}::uuid[]) as user_id,
        unnest(${storyIds}::uuid[]) as story_id,
        unnest(${completionPercentages}::integer[]) as completion_percentage,
        unnest(${timeSpents}::integer[]) as time_spent,
        NOW() as updated_at
      ON CONFLICT (user_id, story_id)
      DO UPDATE SET
        completion_percentage = GREATEST(progress.completion_percentage, EXCLUDED.completion_percentage),
        time_spent = progress.time_spent + EXCLUDED.time_spent,
        updated_at = EXCLUDED.updated_at
    `;
  }

  // Optimized analytics queries
  async getLearningAnalytics(
    tenantId: string,
    dateRange: DateRange
  ): Promise<LearningAnalytics> {
    return await this.prisma.$queryRaw<LearningAnalytics[]>`
      WITH daily_stats AS (
        SELECT 
          DATE(ls.started_at) as date,
          COUNT(DISTINCT ls.user_id) as active_users,
          COUNT(*) as total_sessions,
          AVG(ls.duration_minutes) as avg_session_duration,
          SUM(ls.duration_minutes) as total_learning_time
        FROM learning_sessions ls
        JOIN users u ON ls.user_id = u.id
        WHERE u.tenant_id = ${tenantId}
          AND ls.started_at BETWEEN ${dateRange.start} AND ${dateRange.end}
        GROUP BY DATE(ls.started_at)
      ),
      completion_stats AS (
        SELECT 
          COUNT(DISTINCT CASE WHEN p.completion_percentage >= 100 THEN p.user_id END) as users_completed_stories,
          AVG(p.completion_percentage) as avg_completion_rate
        FROM progress p
        JOIN users u ON p.user_id = u.id
        WHERE u.tenant_id = ${tenantId}
          AND p.updated_at BETWEEN ${dateRange.start} AND ${dateRange.end}
      ),
      vocabulary_stats AS (
        SELECT 
          COUNT(DISTINCT uvp.user_id) as users_learning_vocabulary,
          AVG(uvp.mastery_level) as avg_vocabulary_mastery
        FROM user_vocabulary_progress uvp
        JOIN users u ON uvp.user_id = u.id
        WHERE u.tenant_id = ${tenantId}
          AND uvp.updated_at BETWEEN ${dateRange.start} AND ${dateRange.end}
      )
      SELECT 
        json_agg(
          json_build_object(
            'date', ds.date,
            'active_users', ds.active_users,
            'total_sessions', ds.total_sessions,
            'avg_session_duration', ds.avg_session_duration,
            'total_learning_time', ds.total_learning_time
          ) ORDER BY ds.date
        ) as daily_stats,
        cs.users_completed_stories,
        cs.avg_completion_rate,
        vs.users_learning_vocabulary,
        vs.avg_vocabulary_mastery
      FROM daily_stats ds
      CROSS JOIN completion_stats cs
      CROSS JOIN vocabulary_stats vs
      GROUP BY cs.users_completed_stories, cs.avg_completion_rate, 
               vs.users_learning_vocabulary, vs.avg_vocabulary_mastery
    `.then((results) => results[0]);
  }
}

// Query performance monitoring
export class QueryPerformanceMonitor {
  private slowQueryThreshold = 1000; // 1 second
  private queryStats = new Map<string, QueryStats>();

  async monitorQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;

      this.recordQueryStats(queryName, duration, true);

      if (duration > this.slowQueryThreshold) {
        console.warn(
          `Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`
        );
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordQueryStats(queryName, duration, false);
      throw error;
    }
  }

  private recordQueryStats(
    queryName: string,
    duration: number,
    success: boolean
  ): void {
    const stats = this.queryStats.get(queryName) || {
      totalExecutions: 0,
      totalDuration: 0,
      successCount: 0,
      errorCount: 0,
      minDuration: Infinity,
      maxDuration: 0,
    };

    stats.totalExecutions++;
    stats.totalDuration += duration;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);

    if (success) {
      stats.successCount++;
    } else {
      stats.errorCount++;
    }

    this.queryStats.set(queryName, stats);
  }

  getQueryStatistics(): Map<string, QueryStatsWithAverages> {
    const result = new Map<string, QueryStatsWithAverages>();

    for (const [queryName, stats] of this.queryStats) {
      result.set(queryName, {
        ...stats,
        avgDuration: stats.totalDuration / stats.totalExecutions,
        successRate: stats.successCount / stats.totalExecutions,
      });
    }

    return result;
  }

  getSlowQueries(threshold: number = this.slowQueryThreshold): string[] {
    const slowQueries: string[] = [];

    for (const [queryName, stats] of this.queryStats) {
      const avgDuration = stats.totalDuration / stats.totalExecutions;
      if (avgDuration > threshold) {
        slowQueries.push(queryName);
      }
    }

    return slowQueries;
  }
}

interface QueryStats {
  totalExecutions: number;
  totalDuration: number;
  successCount: number;
  errorCount: number;
  minDuration: number;
  maxDuration: number;
}

interface QueryStatsWithAverages extends QueryStats {
  avgDuration: number;
  successRate: number;
}
```

## Connection Pool Management

### Prisma Connection Pool Configuration

```typescript
// lib/database/connection-pool.ts
export class DatabaseConnectionManager {
  private prisma: PrismaClient;
  private connectionMetrics = {
    activeConnections: 0,
    totalConnections: 0,
    queuedRequests: 0,
    connectionErrors: 0,
  };

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.buildConnectionString(),
        },
      },
      log: [
        { emit: "event", level: "query" },
        { emit: "event", level: "error" },
        { emit: "event", level: "info" },
        { emit: "event", level: "warn" },
      ],
    });

    this.setupConnectionMonitoring();
    this.setupConnectionPoolEvents();
  }

  private buildConnectionString(): string {
    const baseUrl = process.env.DATABASE_URL;
    const poolConfig = {
      connection_limit: parseInt(process.env.DB_CONNECTION_LIMIT || "20"),
      pool_timeout: parseInt(process.env.DB_POOL_TIMEOUT || "10"),
      connect_timeout: parseInt(process.env.DB_CONNECT_TIMEOUT || "10"),
      socket_timeout: parseInt(process.env.DB_SOCKET_TIMEOUT || "30"),
    };

    const params = new URLSearchParams();
    Object.entries(poolConfig).forEach(([key, value]) => {
      params.append(key, value.toString());
    });

    return `${baseUrl}?${params.toString()}`;
  }

  private setupConnectionMonitoring(): void {
    // Monitor connection pool every 30 seconds
    setInterval(async () => {
      try {
        const metrics = await this.getConnectionMetrics();
        this.connectionMetrics = metrics;

        // Alert on high connection usage
        if (metrics.activeConnections / metrics.totalConnections > 0.8) {
          console.warn("High database connection usage:", metrics);
        }

        // Alert on queued requests
        if (metrics.queuedRequests > 10) {
          console.warn(
            "High number of queued database requests:",
            metrics.queuedRequests
          );
        }
      } catch (error) {
        console.error("Connection monitoring error:", error);
        this.connectionMetrics.connectionErrors++;
      }
    }, 30000);
  }

  private setupConnectionPoolEvents(): void {
    this.prisma.$on("query", (event) => {
      if (event.duration > 1000) {
        // Log slow queries
        console.warn("Slow query detected:", {
          query: event.query,
          duration: event.duration,
          params: event.params,
        });
      }
    });

    this.prisma.$on("error", (event) => {
      console.error("Database error:", event);
      this.connectionMetrics.connectionErrors++;
    });

    this.prisma.$on("info", (event) => {
      if (event.message.includes("connection")) {
        console.info("Database connection info:", event.message);
      }
    });
  }

  private async getConnectionMetrics(): Promise<ConnectionMetrics> {
    try {
      // Query PostgreSQL for connection information
      const result = await this.prisma.$queryRaw<ConnectionInfo[]>`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE wait_event IS NOT NULL) as waiting_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;

      const info = result[0];
      return {
        totalConnections: Number(info.total_connections),
        activeConnections: Number(info.active_connections),
        idleConnections: Number(info.idle_connections),
        queuedRequests: Number(info.waiting_connections),
        connectionErrors: this.connectionMetrics.connectionErrors,
      };
    } catch (error) {
      console.error("Failed to get connection metrics:", error);
      return this.connectionMetrics;
    }
  }

  // Connection health check
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = performance.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = performance.now() - startTime;

      return {
        healthy: true,
        responseTime,
        connectionMetrics: this.connectionMetrics,
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: performance.now() - startTime,
        error: error.message,
        connectionMetrics: this.connectionMetrics,
      };
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log("Shutting down database connections...");
    await this.prisma.$disconnect();
    console.log("Database connections closed.");
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  getConnectionMetrics(): ConnectionMetrics {
    return { ...this.connectionMetrics };
  }
}

interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections?: number;
  queuedRequests: number;
  connectionErrors: number;
}

interface ConnectionInfo {
  total_connections: bigint;
  active_connections: bigint;
  idle_connections: bigint;
  waiting_connections: bigint;
}

interface HealthCheckResult {
  healthy: boolean;
  responseTime: number;
  error?: string;
  connectionMetrics: ConnectionMetrics;
}
```

## Database Scaling

### Read Replica Configuration

```typescript
// lib/database/read-replica.ts
export class ReadReplicaManager {
  private primaryClient: PrismaClient;
  private replicaClients: PrismaClient[];
  private currentReplicaIndex = 0;
  private replicaHealthStatus = new Map<number, boolean>();

  constructor() {
    // Primary database connection
    this.primaryClient = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_PRIMARY_URL },
      },
    });

    // Read replica connections
    this.replicaClients = this.initializeReplicas();
    this.setupHealthChecks();
  }

  private initializeReplicas(): PrismaClient[] {
    const replicaUrls = [
      process.env.DATABASE_REPLICA_1_URL,
      process.env.DATABASE_REPLICA_2_URL,
      process.env.DATABASE_REPLICA_3_URL,
    ].filter(Boolean);

    return replicaUrls.map((url, index) => {
      const client = new PrismaClient({
        datasources: { db: { url } },
      });

      this.replicaHealthStatus.set(index, true);
      return client;
    });
  }

  private setupHealthChecks(): void {
    // Check replica health every minute
    setInterval(async () => {
      await Promise.all(
        this.replicaClients.map(async (client, index) => {
          try {
            await client.$queryRaw`SELECT 1`;
            this.replicaHealthStatus.set(index, true);
          } catch (error) {
            console.warn(`Replica ${index} health check failed:`, error);
            this.replicaHealthStatus.set(index, false);
          }
        })
      );
    }, 60000);
  }

  // Get read client with load balancing
  getReadClient(): PrismaClient {
    const healthyReplicas = this.replicaClients.filter((_, index) =>
      this.replicaHealthStatus.get(index)
    );

    if (healthyReplicas.length === 0) {
      console.warn("No healthy replicas available, using primary");
      return this.primaryClient;
    }

    // Round-robin load balancing
    const replica =
      healthyReplicas[this.currentReplicaIndex % healthyReplicas.length];
    this.currentReplicaIndex++;

    return replica;
  }

  // Always use primary for writes
  getWriteClient(): PrismaClient {
    return this.primaryClient;
  }

  // Intelligent query routing
  async executeQuery<T>(
    operation: "read" | "write",
    queryFn: (client: PrismaClient) => Promise<T>
  ): Promise<T> {
    const client =
      operation === "read" ? this.getReadClient() : this.getWriteClient();

    try {
      return await queryFn(client);
    } catch (error) {
      // Fallback to primary for read operations if replica fails
      if (operation === "read" && client !== this.primaryClient) {
        console.warn("Read replica failed, falling back to primary:", error);
        return await queryFn(this.primaryClient);
      }
      throw error;
    }
  }

  // Replica lag monitoring
  async checkReplicationLag(): Promise<ReplicationLagInfo[]> {
    const lagInfo: ReplicationLagInfo[] = [];

    await Promise.all(
      this.replicaClients.map(async (replica, index) => {
        try {
          const [primaryLSN] = await this.primaryClient.$queryRaw<
            [{ lsn: string }]
          >`
            SELECT pg_current_wal_lsn() as lsn
          `;

          const [replicaLSN] = await replica.$queryRaw<
            [{ lsn: string; lag: number }]
          >`
            SELECT 
              pg_last_wal_receive_lsn() as lsn,
              EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) as lag
          `;

          lagInfo.push({
            replicaIndex: index,
            healthy: this.replicaHealthStatus.get(index) || false,
            lagSeconds: replicaLSN.lag || 0,
            primaryLSN: primaryLSN.lsn,
            replicaLSN: replicaLSN.lsn,
          });
        } catch (error) {
          lagInfo.push({
            replicaIndex: index,
            healthy: false,
            lagSeconds: -1,
            error: error.message,
          });
        }
      })
    );

    return lagInfo;
  }

  async shutdown(): Promise<void> {
    await Promise.all([
      this.primaryClient.$disconnect(),
      ...this.replicaClients.map((client) => client.$disconnect()),
    ]);
  }
}

interface ReplicationLagInfo {
  replicaIndex: number;
  healthy: boolean;
  lagSeconds: number;
  primaryLSN?: string;
  replicaLSN?: string;
  error?: string;
}
```

### Database Sharding Strategy

```typescript
// lib/database/sharding.ts
export class DatabaseShardManager {
  private shardClients = new Map<string, PrismaClient>();
  private shardCount: number;

  constructor() {
    this.shardCount = parseInt(process.env.DATABASE_SHARD_COUNT || "4");
    this.initializeShards();
  }

  private initializeShards(): void {
    for (let i = 0; i < this.shardCount; i++) {
      const shardUrl = process.env[`DATABASE_SHARD_${i}_URL`];
      if (shardUrl) {
        const client = new PrismaClient({
          datasources: { db: { url: shardUrl } },
        });
        this.shardClients.set(`shard_${i}`, client);
      }
    }
  }

  // Determine shard based on tenant ID
  private getShardKey(tenantId: string): string {
    const hash = this.hashString(tenantId);
    const shardIndex = hash % this.shardCount;
    return `shard_${shardIndex}`;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Get client for specific tenant
  getClientForTenant(tenantId: string): PrismaClient {
    const shardKey = this.getShardKey(tenantId);
    const client = this.shardClients.get(shardKey);

    if (!client) {
      throw new Error(`Shard not found for tenant: ${tenantId}`);
    }

    return client;
  }

  // Execute query on specific shard
  async executeOnShard<T>(
    tenantId: string,
    queryFn: (client: PrismaClient) => Promise<T>
  ): Promise<T> {
    const client = this.getClientForTenant(tenantId);
    return await queryFn(client);
  }

  // Execute query across all shards (for admin operations)
  async executeOnAllShards<T>(
    queryFn: (client: PrismaClient) => Promise<T>
  ): Promise<T[]> {
    const results = await Promise.all(
      Array.from(this.shardClients.values()).map((client) => queryFn(client))
    );
    return results;
  }

  // Shard rebalancing (for future use)
  async rebalanceShards(): Promise<void> {
    // Implementation for shard rebalancing
    // This would involve moving data between shards
    console.log("Shard rebalancing not implemented yet");
  }

  async shutdown(): Promise<void> {
    await Promise.all(
      Array.from(this.shardClients.values()).map((client) =>
        client.$disconnect()
      )
    );
  }
}
```

## Performance Monitoring

### Database Performance Metrics

```sql
-- Database performance monitoring queries

-- Query performance statistics
SELECT
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;

-- Table statistics
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Database size and growth
SELECT
    pg_database.datname,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
ORDER BY pg_database_size(pg_database.datname) DESC;

-- Connection statistics
SELECT
    state,
    count(*) as connections,
    max(now() - state_change) as max_duration
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;

-- Lock monitoring
SELECT
    pg_stat_activity.pid,
    pg_stat_activity.usename,
    pg_stat_activity.query,
    pg_locks.mode,
    pg_locks.locktype,
    pg_locks.granted
FROM pg_stat_activity
JOIN pg_locks ON pg_stat_activity.pid = pg_locks.pid
WHERE NOT pg_locks.granted
ORDER BY pg_stat_activity.query_start;
```

### Automated Performance Monitoring

```typescript
// lib/database/performance-monitor.ts
export class DatabasePerformanceMonitor {
  private prisma: PrismaClient;
  private metrics = new Map<string, PerformanceMetric[]>();
  private alertThresholds = {
    slowQueryTime: 1000, // 1 second
    highConnectionUsage: 0.8, // 80%
    lowCacheHitRatio: 0.9, // 90%
    highDeadTuples: 1000,
  };

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Monitor every 5 minutes
    setInterval(
      async () => {
        await this.collectMetrics();
        await this.checkAlerts();
      },
      5 * 60 * 1000
    );
  }

  private async collectMetrics(): Promise<void> {
    try {
      const [queryStats, connectionStats, tableStats, indexStats] =
        await Promise.all([
          this.getQueryStatistics(),
          this.getConnectionStatistics(),
          this.getTableStatistics(),
          this.getIndexStatistics(),
        ]);

      const timestamp = Date.now();

      this.recordMetric("query_performance", {
        timestamp,
        data: queryStats,
      });

      this.recordMetric("connections", {
        timestamp,
        data: connectionStats,
      });

      this.recordMetric("tables", {
        timestamp,
        data: tableStats,
      });

      this.recordMetric("indexes", {
        timestamp,
        data: indexStats,
      });
    } catch (error) {
      console.error("Failed to collect database metrics:", error);
    }
  }

  private async getQueryStatistics(): Promise<QueryStatistic[]> {
    return await this.prisma.$queryRaw<QueryStatistic[]>`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        stddev_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements
      WHERE calls > 10
      ORDER BY total_time DESC
      LIMIT 50
    `;
  }

  private async getConnectionStatistics(): Promise<ConnectionStatistic[]> {
    return await this.prisma.$queryRaw<ConnectionStatistic[]>`
      SELECT 
        state,
        count(*) as connection_count,
        max(extract(epoch from (now() - state_change))) as max_duration_seconds
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
    `;
  }

  private async getTableStatistics(): Promise<TableStatistic[]> {
    return await this.prisma.$queryRaw<TableStatistic[]>`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        extract(epoch from (now() - last_vacuum)) as seconds_since_vacuum,
        extract(epoch from (now() - last_autovacuum)) as seconds_since_autovacuum
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
    `;
  }

  private async getIndexStatistics(): Promise<IndexStatistic[]> {
    return await this.prisma.$queryRaw<IndexStatistic[]>`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch,
        idx_scan,
        pg_relation_size(indexrelid) as size_bytes
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
    `;
  }

  private recordMetric(type: string, metric: PerformanceMetric): void {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, []);
    }

    const metrics = this.metrics.get(type)!;
    metrics.push(metric);

    // Keep only last 24 hours of metrics
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    this.metrics.set(
      type,
      metrics.filter((m) => m.timestamp > cutoff)
    );
  }

  private async checkAlerts(): Promise<void> {
    const latestMetrics = this.getLatestMetrics();

    // Check for slow queries
    const slowQueries = latestMetrics.query_performance?.data.filter(
      (q: QueryStatistic) => q.mean_time > this.alertThresholds.slowQueryTime
    );

    if (slowQueries && slowQueries.length > 0) {
      console.warn("Slow queries detected:", slowQueries.length);
      // Send alert to monitoring system
    }

    // Check connection usage
    const connectionStats = latestMetrics.connections?.data;
    if (connectionStats) {
      const totalConnections = connectionStats.reduce(
        (sum: number, stat: ConnectionStatistic) => sum + stat.connection_count,
        0
      );

      const maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS || "100");
      const usage = totalConnections / maxConnections;

      if (usage > this.alertThresholds.highConnectionUsage) {
        console.warn(`High connection usage: ${(usage * 100).toFixed(1)}%`);
      }
    }

    // Check for tables needing maintenance
    const tableStats = latestMetrics.tables?.data;
    if (tableStats) {
      const tablesNeedingVacuum = tableStats.filter(
        (table: TableStatistic) =>
          table.dead_tuples > this.alertThresholds.highDeadTuples &&
          (table.seconds_since_autovacuum > 3600 ||
            !table.seconds_since_autovacuum)
      );

      if (tablesNeedingVacuum.length > 0) {
        console.warn(
          "Tables needing vacuum:",
          tablesNeedingVacuum.map((t) => t.tablename)
        );
      }
    }
  }

  private getLatestMetrics(): Record<string, PerformanceMetric> {
    const latest: Record<string, PerformanceMetric> = {};

    for (const [type, metrics] of this.metrics) {
      if (metrics.length > 0) {
        latest[type] = metrics[metrics.length - 1];
      }
    }

    return latest;
  }

  getMetrics(type: string, hours: number = 1): PerformanceMetric[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const metrics = this.metrics.get(type) || [];
    return metrics.filter((m) => m.timestamp > cutoff);
  }

  getAllMetrics(): Map<string, PerformanceMetric[]> {
    return new Map(this.metrics);
  }
}

interface PerformanceMetric {
  timestamp: number;
  data: any;
}

interface QueryStatistic {
  query: string;
  calls: number;
  total_time: number;
  mean_time: number;
  stddev_time: number;
  rows: number;
  hit_percent: number;
}

interface ConnectionStatistic {
  state: string;
  connection_count: number;
  max_duration_seconds: number;
}

interface TableStatistic {
  schemaname: string;
  tablename: string;
  inserts: number;
  updates: number;
  deletes: number;
  live_tuples: number;
  dead_tuples: number;
  seconds_since_vacuum: number;
  seconds_since_autovacuum: number;
}

interface IndexStatistic {
  schemaname: string;
  tablename: string;
  indexname: string;
  idx_tup_read: number;
  idx_tup_fetch: number;
  idx_scan: number;
  size_bytes: number;
}
```

This comprehensive database optimization guide provides the foundation for maintaining high-performance database operations in the EdTech platform, covering indexing, query optimization, connection management, scaling strategies, and performance monitoring.
