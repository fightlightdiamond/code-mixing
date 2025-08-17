# Caching Strategies Implementation Guide

## Overview

This document provides detailed implementation patterns for the multi-layer caching architecture used in the EdTech platform. The caching strategy is designed to optimize performance across different layers while maintaining data consistency and user experience.

## Caching Architecture Layers

### 1. Browser-Level Caching

#### HTTP Cache Headers

```typescript
// middleware.ts - Cache headers configuration
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Static assets caching
  if (request.nextUrl.pathname.startsWith("/_next/static/")) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
    return response;
  }

  // API responses caching
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const cacheControl = getCacheControlForAPI(request.nextUrl.pathname);
    response.headers.set("Cache-Control", cacheControl);
    return response;
  }

  // Page caching
  if (isStaticPage(request.nextUrl.pathname)) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, stale-while-revalidate=86400"
    );
    return response;
  }

  return response;
}

function getCacheControlForAPI(pathname: string): string {
  const cacheRules = {
    "/api/stories": "public, max-age=1800, stale-while-revalidate=3600", // 30 min
    "/api/vocabulary": "public, max-age=86400, stale-while-revalidate=172800", // 24 hours
    "/api/progress": "private, max-age=300, stale-while-revalidate=600", // 5 min
    "/api/me": "private, max-age=600, stale-while-revalidate=1200", // 10 min
  };

  for (const [path, control] of Object.entries(cacheRules)) {
    if (pathname.startsWith(path)) {
      return control;
    }
  }

  return "no-cache"; // Default for unknown APIs
}
```

#### Service Worker Caching

```javascript
// public/sw.js - Advanced caching strategies
const CACHE_STRATEGIES = {
  STORIES: "stories-v1",
  AUDIO: "audio-v1",
  IMAGES: "images-v1",
  API: "api-v1",
  STATIC: "static-v1",
};

// Cache management with size limits
class CacheManager {
  constructor() {
    this.maxCacheSize = {
      [CACHE_STRATEGIES.STORIES]: 50 * 1024 * 1024, // 50MB
      [CACHE_STRATEGIES.AUDIO]: 200 * 1024 * 1024, // 200MB
      [CACHE_STRATEGIES.IMAGES]: 100 * 1024 * 1024, // 100MB
      [CACHE_STRATEGIES.API]: 10 * 1024 * 1024, // 10MB
    };
  }

  async addToCache(cacheName, request, response) {
    const cache = await caches.open(cacheName);

    // Check cache size before adding
    await this.enforceMaxSize(cacheName);

    // Clone response before caching
    await cache.put(request, response.clone());

    return response;
  }

  async enforceMaxSize(cacheName) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    let totalSize = 0;
    const sizePromises = requests.map(async (request) => {
      const response = await cache.match(request);
      const size = await this.getResponseSize(response);
      return { request, size };
    });

    const requestSizes = await Promise.all(sizePromises);
    totalSize = requestSizes.reduce((sum, item) => sum + item.size, 0);

    const maxSize = this.maxCacheSize[cacheName];
    if (totalSize > maxSize) {
      // Remove oldest entries (LRU)
      const sortedRequests = requestSizes.sort((a, b) => {
        // Implement LRU logic based on last access time
        return (
          this.getLastAccessTime(a.request) - this.getLastAccessTime(b.request)
        );
      });

      let removedSize = 0;
      for (const item of sortedRequests) {
        if (totalSize - removedSize <= maxSize) break;

        await cache.delete(item.request);
        removedSize += item.size;
      }
    }
  }

  async getResponseSize(response) {
    if (!response) return 0;
    const blob = await response.blob();
    return blob.size;
  }

  getLastAccessTime(request) {
    // Implementation to track last access time
    const accessTimes = JSON.parse(
      localStorage.getItem("cache-access-times") || "{}"
    );
    return accessTimes[request.url] || 0;
  }
}

const cacheManager = new CacheManager();

// Intelligent caching based on content type
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  event.respondWith(
    (async () => {
      // Determine caching strategy based on URL pattern
      if (url.pathname.includes("/audio/")) {
        return handleAudioRequest(request);
      } else if (url.pathname.includes("/api/stories")) {
        return handleStoryAPIRequest(request);
      } else if (url.pathname.includes("/api/")) {
        return handleGenericAPIRequest(request);
      } else if (url.pathname.includes("/_next/static/")) {
        return handleStaticAssetRequest(request);
      } else {
        return handlePageRequest(request);
      }
    })()
  );
});

async function handleAudioRequest(request) {
  const cache = await caches.open(CACHE_STRATEGIES.AUDIO);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Update access time for LRU
    updateAccessTime(request.url);
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cacheManager.addToCache(CACHE_STRATEGIES.AUDIO, request, response);
    }
    return response;
  } catch (error) {
    // Return offline fallback for audio
    return new Response("Audio not available offline", { status: 503 });
  }
}

async function handleStoryAPIRequest(request) {
  const cache = await caches.open(CACHE_STRATEGIES.API);

  // Try network first for fresh data
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cacheManager.addToCache(CACHE_STRATEGIES.API, request, response);
    }
    return response;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

function updateAccessTime(url) {
  const accessTimes = JSON.parse(
    localStorage.getItem("cache-access-times") || "{}"
  );
  accessTimes[url] = Date.now();
  localStorage.setItem("cache-access-times", JSON.stringify(accessTimes));
}
```

### 2. Application-Level Caching

#### TanStack Query Configuration

```typescript
// lib/query-client.ts - Advanced query caching
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error("Query error:", error, query.queryKey);
    },
    onSuccess: (data, query) => {
      // Log successful queries for analytics
      if (process.env.NODE_ENV === "development") {
        console.log("Query success:", query.queryKey, data);
      }
    },
  }),

  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      console.error("Mutation error:", error, mutation.options.mutationKey);
    },
  }),

  defaultOptions: {
    queries: {
      // Stale time based on data type
      staleTime: (query) => {
        const [resource] = query.queryKey;
        const staleTimes = {
          stories: 30 * 60 * 1000, // 30 minutes
          vocabulary: 24 * 60 * 60 * 1000, // 24 hours
          progress: 5 * 60 * 1000, // 5 minutes
          user: 10 * 60 * 1000, // 10 minutes
        };
        return staleTimes[resource] || 5 * 60 * 1000;
      },

      // Garbage collection time
      gcTime: 30 * 60 * 1000, // 30 minutes

      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },

      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Network mode for offline support
      networkMode: "offlineFirst",
    },

    mutations: {
      retry: 1,
      networkMode: "offlineFirst",
    },
  },
});

// Smart prefetching based on user behavior
export class SmartPrefetcher {
  private prefetchQueue: Set<string> = new Set();
  private userBehaviorTracker = new UserBehaviorTracker();

  constructor(private queryClient: QueryClient) {
    this.setupPrefetchingStrategies();
  }

  private setupPrefetchingStrategies() {
    // Prefetch based on hover
    this.setupHoverPrefetching();

    // Prefetch based on user patterns
    this.setupPatternBasedPrefetching();

    // Prefetch based on time of day
    this.setupTimeBasedPrefetching();
  }

  private setupHoverPrefetching() {
    document.addEventListener("mouseover", (event) => {
      const target = event.target as HTMLElement;
      const storyCard = target.closest("[data-story-id]");

      if (storyCard) {
        const storyId = storyCard.getAttribute("data-story-id");
        this.prefetchStory(storyId);
      }
    });
  }

  private setupPatternBasedPrefetching() {
    // Analyze user behavior and prefetch likely next content
    setInterval(() => {
      const predictions = this.userBehaviorTracker.getPredictions();
      predictions.forEach((prediction) => {
        if (prediction.confidence > 0.7) {
          this.prefetchContent(prediction.type, prediction.id);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  private setupTimeBasedPrefetching() {
    // Prefetch content during low-usage periods
    const now = new Date();
    const hour = now.getHours();

    // Prefetch during off-peak hours (2-6 AM)
    if (hour >= 2 && hour <= 6) {
      this.prefetchPopularContent();
    }
  }

  async prefetchStory(storyId: string) {
    if (this.prefetchQueue.has(storyId)) return;

    this.prefetchQueue.add(storyId);

    try {
      await this.queryClient.prefetchQuery({
        queryKey: ["stories", "detail", storyId],
        queryFn: () => fetchStory(storyId),
        staleTime: 30 * 60 * 1000, // 30 minutes
      });
    } catch (error) {
      console.warn("Prefetch failed for story:", storyId, error);
    } finally {
      this.prefetchQueue.delete(storyId);
    }
  }

  async prefetchContent(type: string, id: string) {
    const prefetchStrategies = {
      story: () => this.prefetchStory(id),
      vocabulary: () => this.prefetchVocabulary(id),
      exercises: () => this.prefetchExercises(id),
    };

    const strategy = prefetchStrategies[type];
    if (strategy) {
      await strategy();
    }
  }

  private async prefetchPopularContent() {
    try {
      const popularStories = await this.queryClient.fetchQuery({
        queryKey: ["stories", "popular"],
        queryFn: fetchPopularStories,
        staleTime: 60 * 60 * 1000, // 1 hour
      });

      // Prefetch top 5 popular stories
      const topStories = popularStories.slice(0, 5);
      await Promise.all(
        topStories.map((story) => this.prefetchStory(story.id))
      );
    } catch (error) {
      console.warn("Failed to prefetch popular content:", error);
    }
  }
}

// User behavior tracking for smart prefetching
class UserBehaviorTracker {
  private interactions: UserInteraction[] = [];
  private patterns: Map<string, number> = new Map();

  trackInteraction(
    type: string,
    target: string,
    timestamp: number = Date.now()
  ) {
    this.interactions.push({ type, target, timestamp });

    // Keep only recent interactions (last 24 hours)
    const cutoff = timestamp - 24 * 60 * 60 * 1000;
    this.interactions = this.interactions.filter((i) => i.timestamp > cutoff);

    this.updatePatterns();
  }

  private updatePatterns() {
    // Analyze sequences of interactions
    for (let i = 0; i < this.interactions.length - 1; i++) {
      const current = this.interactions[i];
      const next = this.interactions[i + 1];

      const pattern = `${current.type}:${current.target} -> ${next.type}:${next.target}`;
      const count = this.patterns.get(pattern) || 0;
      this.patterns.set(pattern, count + 1);
    }
  }

  getPredictions(): Prediction[] {
    const predictions: Prediction[] = [];
    const totalInteractions = this.interactions.length;

    for (const [pattern, count] of this.patterns.entries()) {
      const confidence = count / totalInteractions;

      if (confidence > 0.1) {
        // Minimum 10% confidence
        const [, target] = pattern.split(" -> ");
        const [type, id] = target.split(":");

        predictions.push({
          type,
          id,
          confidence,
          pattern,
        });
      }
    }

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }
}

interface UserInteraction {
  type: string;
  target: string;
  timestamp: number;
}

interface Prediction {
  type: string;
  id: string;
  confidence: number;
  pattern: string;
}
```

### 3. Server-Side Caching

#### Redis Implementation

```typescript
// lib/cache/redis-manager.ts - Advanced Redis caching
export class RedisManager {
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;
  private cacheStats = new Map<string, CacheStats>();

  constructor() {
    const redisConfig = {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    };

    this.client = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);

    this.setupCacheInvalidation();
    this.setupCacheWarming();
  }

  // Intelligent caching with automatic TTL adjustment
  async smartSet<T>(
    key: string,
    value: T,
    options: SmartCacheOptions = {}
  ): Promise<boolean> {
    const {
      baseTTL = 3600,
      accessFrequency = 1,
      dataVolatility = "medium",
      userSpecific = false,
    } = options;

    // Adjust TTL based on access patterns and data characteristics
    const adjustedTTL = this.calculateOptimalTTL(
      baseTTL,
      accessFrequency,
      dataVolatility,
      userSpecific
    );

    try {
      const serializedValue = JSON.stringify({
        data: value,
        metadata: {
          cachedAt: Date.now(),
          accessCount: 0,
          lastAccessed: Date.now(),
        },
      });

      await this.client.setex(key, adjustedTTL, serializedValue);

      // Update cache statistics
      this.updateCacheStats(key, "set");

      return true;
    } catch (error) {
      console.error("Redis set error:", error);
      return false;
    }
  }

  async smartGet<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) {
        this.updateCacheStats(key, "miss");
        return null;
      }

      const parsed = JSON.parse(value);

      // Update access metadata
      parsed.metadata.accessCount++;
      parsed.metadata.lastAccessed = Date.now();

      // Update cache with new metadata (fire and forget)
      this.client.set(key, JSON.stringify(parsed)).catch(console.error);

      this.updateCacheStats(key, "hit");

      return parsed.data;
    } catch (error) {
      console.error("Redis get error:", error);
      this.updateCacheStats(key, "error");
      return null;
    }
  }

  // Cache warming strategies
  private setupCacheWarming() {
    // Warm cache during off-peak hours
    const warmingSchedule = [
      { hour: 2, action: () => this.warmPopularContent() },
      { hour: 4, action: () => this.warmUserSpecificContent() },
      { hour: 6, action: () => this.warmVocabularyData() },
    ];

    setInterval(
      () => {
        const currentHour = new Date().getHours();
        const task = warmingSchedule.find((t) => t.hour === currentHour);
        if (task) {
          task.action().catch(console.error);
        }
      },
      60 * 60 * 1000
    ); // Check every hour
  }

  private async warmPopularContent() {
    try {
      // Get popular stories from database
      const popularStories = await prisma.story.findMany({
        where: { published: true },
        orderBy: { viewCount: "desc" },
        take: 50,
        include: {
          vocabulary: true,
          exercises: true,
        },
      });

      // Cache popular stories
      await Promise.all(
        popularStories.map((story) =>
          this.smartSet(`story:${story.id}`, story, {
            baseTTL: 7200, // 2 hours
            accessFrequency: 10,
            dataVolatility: "low",
          })
        )
      );

      console.log(`Warmed cache for ${popularStories.length} popular stories`);
    } catch (error) {
      console.error("Cache warming failed:", error);
    }
  }

  private async warmUserSpecificContent() {
    try {
      // Get active users from the last 24 hours
      const activeUsers = await prisma.user.findMany({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        select: { id: true },
        take: 100,
      });

      // Warm user progress data
      await Promise.all(
        activeUsers.map(async (user) => {
          const progress = await prisma.progress.findMany({
            where: { userId: user.id },
            include: { story: true },
          });

          return this.smartSet(`progress:${user.id}`, progress, {
            baseTTL: 1800, // 30 minutes
            userSpecific: true,
          });
        })
      );

      console.log(`Warmed cache for ${activeUsers.length} active users`);
    } catch (error) {
      console.error("User cache warming failed:", error);
    }
  }

  // Cache invalidation with pub/sub
  private setupCacheInvalidation() {
    this.subscriber.subscribe("cache:invalidate");

    this.subscriber.on("message", async (channel, message) => {
      if (channel === "cache:invalidate") {
        try {
          const { pattern, reason } = JSON.parse(message);
          await this.invalidatePattern(pattern);
          console.log(`Cache invalidated: ${pattern} (${reason})`);
        } catch (error) {
          console.error("Cache invalidation error:", error);
        }
      }
    });
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      await this.client.del(...keys);

      // Update statistics
      keys.forEach((key) => this.updateCacheStats(key, "invalidate"));

      return keys.length;
    } catch (error) {
      console.error("Pattern invalidation error:", error);
      return 0;
    }
  }

  async publishInvalidation(pattern: string, reason: string): Promise<void> {
    try {
      await this.publisher.publish(
        "cache:invalidate",
        JSON.stringify({
          pattern,
          reason,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Failed to publish invalidation:", error);
    }
  }

  // Cache statistics and monitoring
  private updateCacheStats(key: string, operation: CacheOperation) {
    const keyPattern = this.getKeyPattern(key);
    const stats = this.cacheStats.get(keyPattern) || {
      hits: 0,
      misses: 0,
      sets: 0,
      errors: 0,
      invalidations: 0,
    };

    stats[
      operation === "hit"
        ? "hits"
        : operation === "miss"
          ? "misses"
          : operation === "set"
            ? "sets"
            : operation === "error"
              ? "errors"
              : "invalidations"
    ]++;

    this.cacheStats.set(keyPattern, stats);
  }

  private getKeyPattern(key: string): string {
    // Extract pattern from key (e.g., "story:123" -> "story:*")
    const parts = key.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:*`;
    }
    return key;
  }

  getCacheStatistics(): Map<string, CacheStats> {
    return new Map(this.cacheStats);
  }

  private calculateOptimalTTL(
    baseTTL: number,
    accessFrequency: number,
    dataVolatility: DataVolatility,
    userSpecific: boolean
  ): number {
    let multiplier = 1;

    // Adjust based on access frequency
    if (accessFrequency > 10) multiplier *= 1.5;
    else if (accessFrequency < 2) multiplier *= 0.7;

    // Adjust based on data volatility
    const volatilityMultipliers = {
      low: 2.0,
      medium: 1.0,
      high: 0.5,
    };
    multiplier *= volatilityMultipliers[dataVolatility];

    // Adjust for user-specific data
    if (userSpecific) multiplier *= 0.8;

    return Math.floor(baseTTL * multiplier);
  }
}

interface SmartCacheOptions {
  baseTTL?: number;
  accessFrequency?: number;
  dataVolatility?: DataVolatility;
  userSpecific?: boolean;
}

type DataVolatility = "low" | "medium" | "high";
type CacheOperation = "hit" | "miss" | "set" | "error" | "invalidate";

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  errors: number;
  invalidations: number;
}
```

### 4. Database Query Caching

#### Prisma Query Optimization

```typescript
// lib/database/query-cache.ts
export class DatabaseQueryCache {
  private queryCache = new Map<string, QueryCacheEntry>();
  private maxCacheSize = 1000;
  private defaultTTL = 300000; // 5 minutes

  constructor(private prisma: PrismaClient) {
    this.setupCacheCleanup();
  }

  async cachedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.queryCache.get(queryKey);

    if (cached && Date.now() - cached.timestamp < ttl) {
      cached.accessCount++;
      cached.lastAccessed = Date.now();
      return cached.data;
    }

    const data = await queryFn();

    this.queryCache.set(queryKey, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    });

    this.enforceMaxSize();

    return data;
  }

  // Optimized story queries with caching
  async getStoriesWithCache(filters: StoryFilters): Promise<Story[]> {
    const queryKey = `stories:${JSON.stringify(filters)}`;

    return this.cachedQuery(
      queryKey,
      async () => {
        return await this.prisma.story.findMany({
          where: {
            tenantId: filters.tenantId,
            published: true,
            ...(filters.level && { level: filters.level }),
            ...(filters.difficulty && {
              difficultyScore: {
                gte: filters.difficulty.min,
                lte: filters.difficulty.max,
              },
            }),
          },
          include: {
            vocabulary: {
              select: {
                id: true,
                word: true,
                definition: true,
                difficultyLevel: true,
              },
            },
            _count: {
              select: {
                progress: true,
                exercises: true,
              },
            },
          },
          orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
          take: filters.limit || 20,
          skip: filters.offset || 0,
        });
      },
      600000 // 10 minutes TTL for stories
    );
  }

  // Cached user progress with intelligent invalidation
  async getUserProgressWithCache(userId: string): Promise<UserProgress[]> {
    const queryKey = `progress:${userId}`;

    return this.cachedQuery(
      queryKey,
      async () => {
        return await this.prisma.progress.findMany({
          where: { userId },
          include: {
            story: {
              select: {
                id: true,
                title: true,
                level: true,
                estimatedDuration: true,
              },
            },
            vocabularyProgress: {
              include: {
                vocabulary: {
                  select: {
                    word: true,
                    definition: true,
                  },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        });
      },
      180000 // 3 minutes TTL for progress
    );
  }

  // Batch query optimization
  async batchGetStoriesWithCache(
    storyIds: string[]
  ): Promise<Map<string, Story>> {
    const results = new Map<string, Story>();
    const uncachedIds: string[] = [];

    // Check cache for each story
    for (const id of storyIds) {
      const queryKey = `story:${id}`;
      const cached = this.queryCache.get(queryKey);

      if (cached && Date.now() - cached.timestamp < 600000) {
        // 10 minutes
        results.set(id, cached.data);
      } else {
        uncachedIds.push(id);
      }
    }

    // Fetch uncached stories in batch
    if (uncachedIds.length > 0) {
      const stories = await this.prisma.story.findMany({
        where: {
          id: { in: uncachedIds },
          published: true,
        },
        include: {
          vocabulary: true,
          exercises: {
            select: {
              id: true,
              type: true,
              difficulty: true,
            },
          },
        },
      });

      // Cache individual stories
      for (const story of stories) {
        const queryKey = `story:${story.id}`;
        this.queryCache.set(queryKey, {
          data: story,
          timestamp: Date.now(),
          accessCount: 1,
          lastAccessed: Date.now(),
        });
        results.set(story.id, story);
      }
    }

    return results;
  }

  // Cache invalidation methods
  invalidateUserCache(userId: string): void {
    const keysToDelete: string[] = [];

    for (const [key] of this.queryCache) {
      if (
        key.includes(`user:${userId}`) ||
        key.includes(`progress:${userId}`)
      ) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.queryCache.delete(key));
  }

  invalidateStoryCache(storyId: string): void {
    const keysToDelete: string[] = [];

    for (const [key] of this.queryCache) {
      if (key.includes(`story:${storyId}`) || key.startsWith("stories:")) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.queryCache.delete(key));
  }

  private setupCacheCleanup(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const [key, entry] of this.queryCache) {
        if (now - entry.timestamp > this.defaultTTL) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach((key) => this.queryCache.delete(key));

      if (keysToDelete.length > 0) {
        console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
      }
    }, 300000); // 5 minutes
  }

  private enforceMaxSize(): void {
    if (this.queryCache.size <= this.maxCacheSize) return;

    // Remove least recently used entries
    const entries = Array.from(this.queryCache.entries()).sort(
      ([, a], [, b]) => a.lastAccessed - b.lastAccessed
    );

    const toRemove = entries.slice(0, this.queryCache.size - this.maxCacheSize);
    toRemove.forEach(([key]) => this.queryCache.delete(key));
  }

  getCacheStatistics(): CacheStatistics {
    const entries = Array.from(this.queryCache.values());

    return {
      totalEntries: this.queryCache.size,
      totalAccessCount: entries.reduce(
        (sum, entry) => sum + entry.accessCount,
        0
      ),
      averageAge:
        entries.reduce(
          (sum, entry) => sum + (Date.now() - entry.timestamp),
          0
        ) / entries.length,
      hitRate: this.calculateHitRate(),
    };
  }

  private calculateHitRate(): number {
    // Implementation would track hits vs misses
    return 0.85; // Placeholder
  }
}

interface QueryCacheEntry {
  data: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStatistics {
  totalEntries: number;
  totalAccessCount: number;
  averageAge: number;
  hitRate: number;
}

interface StoryFilters {
  tenantId: string;
  level?: string;
  difficulty?: { min: number; max: number };
  limit?: number;
  offset?: number;
}
```

## Cache Invalidation Strategies

### Event-Driven Invalidation

```typescript
// lib/cache/invalidation.ts
export class CacheInvalidationManager {
  private redisManager: RedisManager;
  private queryCache: DatabaseQueryCache;
  private eventEmitter = new EventEmitter();

  constructor(redisManager: RedisManager, queryCache: DatabaseQueryCache) {
    this.redisManager = redisManager;
    this.queryCache = queryCache;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Story-related invalidations
    this.eventEmitter.on("story:updated", async (storyId: string) => {
      await Promise.all([
        this.redisManager.invalidatePattern(`story:${storyId}*`),
        this.redisManager.invalidatePattern("stories:*"),
        this.queryCache.invalidateStoryCache(storyId),
      ]);
    });

    // User progress invalidations
    this.eventEmitter.on("progress:updated", async (userId: string) => {
      await Promise.all([
        this.redisManager.invalidatePattern(`progress:${userId}*`),
        this.redisManager.invalidatePattern(`user:${userId}*`),
        this.queryCache.invalidateUserCache(userId),
      ]);
    });

    // Vocabulary invalidations
    this.eventEmitter.on("vocabulary:updated", async (vocabularyId: string) => {
      await Promise.all([
        this.redisManager.invalidatePattern(`vocab:*`),
        this.redisManager.invalidatePattern("vocabulary:*"),
      ]);
    });
  }

  // Trigger invalidation events
  async invalidateStory(
    storyId: string,
    reason: string = "manual"
  ): Promise<void> {
    this.eventEmitter.emit("story:updated", storyId);
    await this.redisManager.publishInvalidation(`story:${storyId}*`, reason);
  }

  async invalidateUserProgress(
    userId: string,
    reason: string = "manual"
  ): Promise<void> {
    this.eventEmitter.emit("progress:updated", userId);
    await this.redisManager.publishInvalidation(`progress:${userId}*`, reason);
  }

  async invalidateVocabulary(
    vocabularyId: string,
    reason: string = "manual"
  ): Promise<void> {
    this.eventEmitter.emit("vocabulary:updated", vocabularyId);
    await this.redisManager.publishInvalidation("vocab:*", reason);
  }

  // Scheduled invalidation for time-sensitive data
  setupScheduledInvalidation(): void {
    // Invalidate user sessions every hour
    setInterval(
      async () => {
        await this.redisManager.invalidatePattern("session:*");
      },
      60 * 60 * 1000
    );

    // Invalidate analytics cache every 15 minutes
    setInterval(
      async () => {
        await this.redisManager.invalidatePattern("analytics:*");
      },
      15 * 60 * 1000
    );

    // Invalidate recommendation cache every 30 minutes
    setInterval(
      async () => {
        await this.redisManager.invalidatePattern("recommendations:*");
      },
      30 * 60 * 1000
    );
  }
}
```

This comprehensive caching strategy documentation provides implementation details for all caching layers in the EdTech platform, ensuring optimal performance while maintaining data consistency and user experience.
