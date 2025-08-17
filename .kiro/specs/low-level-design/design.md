# Low-Level System Design Document

> **📖 Documentation Guide**: This document provides detailed component-level design specifications for implementing the EdTech English Learning Platform.

## 📋 Quick Navigation

| Section                                               | Description                         | Implementation Level   |
| ----------------------------------------------------- | ----------------------------------- | ---------------------- |
| [Component Architecture](#component-architecture)     | React components, hooks, interfaces | Class/Interface Design |
| [Database Implementation](#database-implementation)   | Schema, queries, optimization       | Table/Query Design     |
| [API Implementation](#api-implementation)             | Endpoints, middleware, validation   | Service/Route Design   |
| [Frontend Architecture](#frontend-architecture)       | UI components, state management     | Component/Hook Design  |
| [Security Implementation](#security-implementation)   | Auth, authorization, validation     | Security Logic Design  |
| [Performance Optimization](#performance-optimization) | Caching, lazy loading, optimization | Performance Design     |
| [Testing Implementation](#testing-implementation)     | Unit, integration, e2e tests        | Test Strategy Design   |

## 🔗 Cross-References

- **High-Level Design**: See [../high-level-design/design.md](../high-level-design/design.md) for system overview
- **Requirements**: See [./requirements.md](./requirements.md) for detailed requirements
- **Codebase**: Based on existing implementation in `/src` directory
- **Database Schema**: References [../../prisma/schema.prisma](../../prisma/schema.prisma)

---

## Component Architecture

### 1. Core Learning Components

#### 1.1 StoryReader Component

**File**: `src/app/learning/components/StoryReader.tsx`

```typescript
interface StoryReaderProps {
  story: LearningStory;
  onWordClick: (word: string, position: { x: number; y: number }) => void;
  highlightedChunk?: number;
  className?: string;
  userPreferences?: UserLearningPreferences;
}

interface StoryReaderState {
  processedChunks: ProcessedStoryChunk[];
  currentChunk: number;
  isProcessing: boolean;
}

class StoryReaderImplementation {
  // Core Methods
  processChunkText(chunkText: string, isChemChunk: boolean): ReactNode;
  adjustEmbeddingRatio(chunkText: string, targetRatio: number): string;
  handleWordClick(word: string, position: Position): void;
  handleKeyboardNavigation(event: KeyboardEvent): void;

  // Accessibility Methods
  announceChunkChange(chunkIndex: number): void;
  setupScreenReaderSupport(): void;
  handleFocusManagement(): void;

  // Performance Methods
  memoizeProcessedChunks(): ProcessedStoryChunk[];
  lazyLoadChunks(): void;
  optimizeRendering(): void;
}
```

**Key Features**:

- **Dynamic Embedding Ratio**: Adjusts English word ratio based on user preferences
- **Accessibility Support**: ARIA labels, keyboard navigation, screen reader support
- **Performance Optimization**: Memoized chunk processing, lazy loading
- **Word Interaction**: Click/keyboard interaction for vocabulary lookup

#### 1.2 AudioPlayer Component

**File**: `src/app/learning/components/AudioPlayer.tsx`

```typescript
interface AudioPlayerProps {
  audioUrl: string;
  chunks: StoryChunk[];
  storyId: string;
  onChunkHighlight: (chunkIndex: number) => void;
  className?: string;
}

interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentChunk: number;
  isLoading: boolean;
  error: string | null;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
  bookmarks: AudioBookmark[];
}

class AudioPlayerImplementation {
  // Core Audio Methods
  play(): Promise<void>;
  pause(): void;
  seek(time: number): void;
  setVolume(volume: number): void;
  setPlaybackRate(rate: number): void;

  // Chunk Synchronization
  syncWithText(currentTime: number): number;
  highlightCurrentChunk(chunkIndex: number): void;
  jumpToChunk(chunkIndex: number): void;

  // Bookmark Management
  addBookmark(time: number, note?: string): void;
  removeBookmark(bookmarkId: string): void;
  jumpToBookmark(bookmarkId: string): void;

  // Progress Tracking
  trackProgress(currentTime: number): void;
  saveProgress(): Promise<void>;
  loadProgress(): Promise<AudioProgress>;
}
```

#### 1.3 VocabularyPopup Component

**File**: `src/app/learning/components/VocabularyPopup.tsx`

```typescript
interface VocabularyPopupProps {
  word: string;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  vocabularyData?: VocabularyData;
  isLoading?: boolean;
  storyContext?: string;
}

interface VocabularyPopupState {
  data: VocabularyData | null;
  isLoading: boolean;
  error: string | null;
  audioPlaying: boolean;
  userProgress: VocabularyProgress | null;
}

class VocabularyPopupImplementation {
  // Data Management
  fetchVocabularyData(word: string): Promise<VocabularyData>;
  fetchUserProgress(word: string): Promise<VocabularyProgress>;
  updateUserProgress(word: string, action: ProgressAction): Promise<void>;

  // Audio Management
  playPronunciation(): Promise<void>;
  stopAudio(): void;

  // UI Management
  calculatePosition(targetPosition: Position): Position;
  handleClickOutside(event: MouseEvent): void;
  handleEscapeKey(event: KeyboardEvent): void;

  // Progress Actions
  markAsLearning(word: string): Promise<void>;
  markAsMastered(word: string): Promise<void>;
  addToReview(word: string): Promise<void>;
}
```

### 2. Exercise Components

#### 2.1 ExercisePanel Component

**File**: `src/app/learning/components/ExercisePanel.tsx`

```typescript
interface ExercisePanelProps {
  storyId: string;
  exercises: Exercise[];
  onComplete: (results: ExerciseResult[]) => void;
  onExerciseResult: (result: ExerciseResult) => void;
  className?: string;
}

interface ExerciseState {
  currentExercise: number;
  answers: Record<string, string | string[]>;
  results: ExerciseResult[];
  startTime: number;
  isCompleted: boolean;
  showFeedback: boolean;
  timeSpent: Record<string, number>;
}

class ExercisePanelImplementation {
  // Exercise Management
  loadExercises(storyId: string): Promise<Exercise[]>;
  nextExercise(): void;
  previousExercise(): void;
  submitAnswer(exerciseId: string, answer: string | string[]): void;

  // Validation & Feedback
  validateAnswer(exercise: Exercise, answer: string | string[]): boolean;
  showFeedback(exercise: Exercise, isCorrect: boolean): void;
  calculateScore(results: ExerciseResult[]): number;

  // Progress Tracking
  trackExerciseTime(exerciseId: string): void;
  saveExerciseResult(result: ExerciseResult): Promise<void>;
  generateProgressReport(): ExerciseProgressReport;
}
```

#### 2.2 Exercise Type Components

```typescript
// Fill in the Blank Exercise
interface FillBlankExerciseProps {
  exercise: FillBlankExercise;
  onAnswer: (answer: string[]) => void;
  showFeedback?: boolean;
  isCorrect?: boolean;
}

// Multiple Choice Exercise
interface MultipleChoiceExerciseProps {
  exercise: MultipleChoiceExercise;
  onAnswer: (answer: string) => void;
  showFeedback?: boolean;
  isCorrect?: boolean;
}

// Drag and Drop Exercise
interface DragDropExerciseProps {
  exercise: DragDropExercise;
  onAnswer: (answer: string[]) => void;
  showFeedback?: boolean;
  isCorrect?: boolean;
}
```

### 3. Progress Tracking Components

#### 3.1 ProgressTracker Component

**File**: `src/app/learning/components/ProgressTracker.tsx`

```typescript
interface ProgressTrackerProps {
  userId: string;
  className?: string;
  showDetailed?: boolean;
}

interface ProgressState {
  overallProgress: LearningProgress;
  vocabularyProgress: VocabularyProgress[];
  recentActivity: ActivityLog[];
  achievements: Achievement[];
  streakData: StreakData;
  levelProgress: LevelProgress;
}

class ProgressTrackerImplementation {
  // Data Loading
  loadUserProgress(userId: string): Promise<LearningProgress>;
  loadVocabularyProgress(userId: string): Promise<VocabularyProgress[]>;
  loadRecentActivity(userId: string): Promise<ActivityLog[]>;

  // Progress Calculations
  calculateCompletionPercentage(): number;
  calculateLearningVelocity(): number;
  calculateStreakData(): StreakData;
  calculateLevelProgress(): LevelProgress;

  // Achievements
  checkAchievements(): Promise<Achievement[]>;
  unlockAchievement(achievementId: string): Promise<void>;

  // Analytics
  generateLearningInsights(): LearningInsights;
  getRecommendations(): Recommendation[];
}
```

### 4. Custom Hooks Architecture

#### 4.1 useStories Hook

**File**: `src/app/learning/hooks/useStories.ts`

```typescript
interface UseStoriesOptions {
  filters?: StoryFilters;
  autoFetch?: boolean;
  cacheTime?: number;
}

interface UseStoriesReturn {
  stories: LearningStory[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

class UseStoriesImplementation {
  // Data Fetching
  fetchStories(filters?: StoryFilters): Promise<LearningStory[]>;
  buildQueryParams(filters: StoryFilters): URLSearchParams;
  handleApiResponse(response: Response): Promise<LearningStory[]>;

  // Caching
  getCachedStories(key: string): LearningStory[] | null;
  setCachedStories(key: string, stories: LearningStory[]): void;
  invalidateCache(pattern?: string): void;

  // Pagination
  loadMoreStories(): Promise<void>;
  hasMoreStories(): boolean;

  // Error Handling
  handleFetchError(error: Error): void;
  retryFetch(maxRetries: number): Promise<void>;
}
```

#### 4.2 useAudioPlayer Hook

**File**: `src/app/learning/hooks/useAudioPlayer.ts`

```typescript
interface UseAudioPlayerOptions {
  audioUrl: string;
  chunks: StoryChunk[];
  autoPlay?: boolean;
  onChunkChange?: (chunkIndex: number) => void;
}

interface UseAudioPlayerReturn {
  // State
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentChunk: number;
  isLoading: boolean;
  error: string | null;

  // Controls
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;

  // Chunk Navigation
  jumpToChunk: (chunkIndex: number) => void;
  nextChunk: () => void;
  previousChunk: () => void;

  // Bookmarks
  addBookmark: (time: number, note?: string) => void;
  removeBookmark: (bookmarkId: string) => void;
  bookmarks: AudioBookmark[];
}

class UseAudioPlayerImplementation {
  // Audio Management
  initializeAudio(url: string): HTMLAudioElement;
  setupEventListeners(): void;
  cleanupAudio(): void;

  // Chunk Synchronization
  calculateCurrentChunk(currentTime: number): number;
  syncChunkHighlight(chunkIndex: number): void;

  // Progress Persistence
  saveProgress(storyId: string, currentTime: number): Promise<void>;
  loadProgress(storyId: string): Promise<number>;

  // Error Recovery
  handleAudioError(error: MediaError): void;
  retryAudioLoad(): Promise<void>;
}
```

#### 4.3 useProgress Hook

**File**: `src/app/learning/hooks/useProgress.ts`

```typescript
interface UseProgressOptions {
  userId: string;
  autoUpdate?: boolean;
  syncInterval?: number;
}

interface UseProgressReturn {
  progress: LearningProgress;
  vocabularyProgress: VocabularyProgress[];
  updateProgress: (data: ProgressUpdateData) => Promise<void>;
  syncProgress: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

class UseProgressImplementation {
  // Progress Management
  loadUserProgress(userId: string): Promise<LearningProgress>;
  updateUserProgress(data: ProgressUpdateData): Promise<void>;
  syncProgressToServer(): Promise<void>;

  // Vocabulary Progress
  updateVocabularyProgress(
    word: string,
    status: VocabularyStatus
  ): Promise<void>;
  getVocabularyReviewList(): Promise<string[]>;

  // Analytics
  trackLearningSession(sessionData: SessionData): Promise<void>;
  calculateLearningMetrics(): LearningMetrics;

  // Offline Support
  queueOfflineUpdates(updates: ProgressUpdate[]): void;
  syncOfflineUpdates(): Promise<void>;
}
```

---

## Database Implementation

### 1. Core Tables Design

#### 1.1 Stories and Content Tables

```sql
-- Stories table with optimized indexes
CREATE TABLE "Story" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "storyType" "StoryType" NOT NULL DEFAULT 'original',
  "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'beginner',
  "estimatedMinutes" INTEGER,
  "wordCount" INTEGER,
  "chemRatio" DOUBLE PRECISION,
  "status" "ContentStatus" NOT NULL DEFAULT 'draft',
  "lessonId" TEXT,
  "createdBy" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  -- Indexes for performance
  INDEX "Story_tenantId_status_difficulty_idx" ("tenantId", "status", "difficulty"),
  INDEX "Story_storyType_difficulty_idx" ("storyType", "difficulty"),
  INDEX "Story_createdBy_idx" ("createdBy"),
  INDEX "Story_lessonId_idx" ("lessonId"),
  INDEX "Story_wordCount_idx" ("wordCount"),

  -- Full-text search index
  INDEX "Story_title_content_fulltext" USING gin(to_tsvector('english', "title" || ' ' || "content")),

  FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL,
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT,
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);

-- Story chunks with optimized ordering
CREATE TABLE "StoryChunk" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "storyId" TEXT NOT NULL,
  "chunkOrder" INTEGER NOT NULL,
  "chunkText" TEXT NOT NULL,
  "type" "ChunkType" NOT NULL DEFAULT 'normal',
  "startTime" DOUBLE PRECISION,
  "endTime" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Composite index for efficient chunk retrieval
  INDEX "StoryChunk_storyId_chunkOrder_idx" ("storyId", "chunkOrder"),
  INDEX "StoryChunk_type_idx" ("type"),

  FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE,
  UNIQUE("storyId", "chunkOrder")
);
```

#### 1.2 User Progress Tables

```sql
-- User progress with partitioning support
CREATE TABLE "UserProgress" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "timeSpent" INTEGER NOT NULL DEFAULT 0,
  "lastPosition" INTEGER DEFAULT 0,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  -- Composite indexes for efficient queries
  INDEX "UserProgress_userId_storyId_idx" ("userId", "storyId"),
  INDEX "UserProgress_userId_completedAt_idx" ("userId", "completedAt"),
  INDEX "UserProgress_storyId_completionPercentage_idx" ("storyId", "completionPercentage"),

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE,
  UNIQUE("userId", "storyId")
);

-- Vocabulary progress with spaced repetition
CREATE TABLE "UserVocabularyProgress" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "word" TEXT NOT NULL,
  "status" "VocabularyStatus" NOT NULL DEFAULT 'new',
  "encounters" INTEGER NOT NULL DEFAULT 0,
  "correctAnswers" INTEGER NOT NULL DEFAULT 0,
  "totalAttempts" INTEGER NOT NULL DEFAULT 0,
  "masteryLevel" INTEGER NOT NULL DEFAULT 0,
  "lastReviewed" TIMESTAMP(3),
  "nextReview" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  -- Indexes for spaced repetition queries
  INDEX "UserVocabularyProgress_userId_status_idx" ("userId", "status"),
  INDEX "UserVocabularyProgress_userId_nextReview_idx" ("userId", "nextReview"),
  INDEX "UserVocabularyProgress_word_idx" ("word"),
  INDEX "UserVocabularyProgress_masteryLevel_idx" ("masteryLevel"),

  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  UNIQUE("userId", "word")
);
```

### 2. Query Optimization Patterns

#### 2.1 Story Retrieval Queries

```typescript
// Optimized story queries with proper indexing
class StoryRepository {
  // Get stories with filters and pagination
  async getStories(
    filters: StoryFilters,
    pagination: PaginationOptions
  ): Promise<LearningStory[]> {
    return await prisma.story.findMany({
      where: {
        tenantId: filters.tenantId,
        status: "published",
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.storyType && { storyType: filters.storyType }),
        ...(filters.search && {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { content: { contains: filters.search, mode: "insensitive" } },
          ],
        }),
        ...(filters.wordCount && {
          wordCount: {
            gte: filters.wordCount.min,
            lte: filters.wordCount.max,
          },
        }),
      },
      include: {
        chunks: {
          orderBy: { chunkOrder: "asc" },
          select: {
            id: true,
            chunkOrder: true,
            chunkText: true,
            type: true,
            startTime: true,
            endTime: true,
          },
        },
        lesson: {
          select: { id: true, title: true },
        },
        _count: {
          select: {
            chunks: true,
            learningSessions: true,
          },
        },
      },
      orderBy: [{ difficulty: "asc" }, { createdAt: "desc" }],
      skip: pagination.offset,
      take: pagination.limit,
    });
  }

  // Get story with user progress
  async getStoryWithProgress(
    storyId: string,
    userId: string
  ): Promise<StoryWithProgress> {
    const [story, progress] = await Promise.all([
      prisma.story.findUnique({
        where: { id: storyId },
        include: {
          chunks: { orderBy: { chunkOrder: "asc" } },
          lesson: { select: { id: true, title: true } },
        },
      }),
      prisma.userProgress.findUnique({
        where: {
          userId_storyId: { userId, storyId },
        },
      }),
    ]);

    return { ...story, userProgress: progress };
  }

  // Bulk update story statistics
  async updateStoryStatistics(storyId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const stats = await tx.userProgress.aggregate({
        where: { storyId },
        _avg: { completionPercentage: true },
        _count: { id: true },
      });

      await tx.story.update({
        where: { id: storyId },
        data: {
          averageCompletion: stats._avg.completionPercentage,
          totalSessions: stats._count.id,
        },
      });
    });
  }
}
```

#### 2.2 Progress Tracking Queries

```typescript
class ProgressRepository {
  // Update user progress with optimistic locking
  async updateUserProgress(
    userId: string,
    storyId: string,
    progressData: ProgressUpdateData
  ): Promise<UserProgress> {
    return await prisma.userProgress.upsert({
      where: {
        userId_storyId: { userId, storyId },
      },
      update: {
        completionPercentage: progressData.completionPercentage,
        timeSpent: { increment: progressData.timeSpent },
        lastPosition: progressData.lastPosition,
        isCompleted: progressData.completionPercentage >= 100,
        completedAt:
          progressData.completionPercentage >= 100 ? new Date() : null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        storyId,
        completionPercentage: progressData.completionPercentage,
        timeSpent: progressData.timeSpent,
        lastPosition: progressData.lastPosition,
        isCompleted: progressData.completionPercentage >= 100,
        completedAt:
          progressData.completionPercentage >= 100 ? new Date() : null,
      },
    });
  }

  // Get user learning analytics with aggregations
  async getUserAnalytics(
    userId: string,
    dateRange: DateRange
  ): Promise<LearningAnalytics> {
    const [progressStats, vocabularyStats, sessionStats] = await Promise.all([
      // Progress statistics
      prisma.userProgress.aggregate({
        where: {
          userId,
          updatedAt: { gte: dateRange.start, lte: dateRange.end },
        },
        _sum: { timeSpent: true },
        _avg: { completionPercentage: true },
        _count: { id: true },
      }),

      // Vocabulary statistics
      prisma.userVocabularyProgress.groupBy({
        by: ["status"],
        where: {
          userId,
          updatedAt: { gte: dateRange.start, lte: dateRange.end },
        },
        _count: { id: true },
      }),

      // Session statistics
      prisma.learningSession.aggregate({
        where: {
          userId,
          createdAt: { gte: dateRange.start, lte: dateRange.end },
        },
        _sum: { duration: true, interactions: true },
        _avg: { duration: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalTimeSpent: progressStats._sum.timeSpent || 0,
      averageCompletion: progressStats._avg.completionPercentage || 0,
      storiesInProgress: progressStats._count.id,
      vocabularyByStatus: vocabularyStats.reduce(
        (acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        },
        {} as Record<VocabularyStatus, number>
      ),
      totalSessions: sessionStats._count.id,
      averageSessionDuration: sessionStats._avg.duration || 0,
      totalInteractions: sessionStats._sum.interactions || 0,
    };
  }

  // Batch update vocabulary progress
  async batchUpdateVocabularyProgress(
    userId: string,
    updates: VocabularyProgressUpdate[]
  ): Promise<void> {
    await prisma.$transaction(
      updates.map((update) =>
        prisma.userVocabularyProgress.upsert({
          where: {
            userId_word: { userId, word: update.word },
          },
          update: {
            status: update.status,
            encounters: { increment: 1 },
            correctAnswers: update.isCorrect ? { increment: 1 } : undefined,
            totalAttempts: { increment: 1 },
            masteryLevel: update.masteryLevel,
            lastReviewed: new Date(),
            nextReview: update.nextReview,
          },
          create: {
            userId,
            word: update.word,
            status: update.status,
            encounters: 1,
            correctAnswers: update.isCorrect ? 1 : 0,
            totalAttempts: 1,
            masteryLevel: update.masteryLevel,
            lastReviewed: new Date(),
            nextReview: update.nextReview,
          },
        })
      )
    );
  }
}
```

### 3. Database Performance Optimization

#### 3.1 Connection Pooling Configuration

```typescript
// Prisma connection configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
  errorFormat: "pretty",
});

// Connection pool optimization
const connectionConfig = {
  // Connection pool settings
  connection_limit: parseInt(process.env.DB_CONNECTION_LIMIT || "10"),
  pool_timeout: parseInt(process.env.DB_POOL_TIMEOUT || "10"),

  // Query optimization
  statement_cache_size: 100,
  prepared_statement_cache_size: 100,

  // Performance monitoring
  slow_query_threshold: 1000, // 1 second
  log_slow_queries: true,
};
```

#### 3.2 Caching Strategy

```typescript
// Redis caching for frequently accessed data
class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  // Cache story data with TTL
  async cacheStory(
    storyId: string,
    story: LearningStory,
    ttl: number = 3600
  ): Promise<void> {
    const key = `story:${storyId}`;
    await this.redis.setex(key, ttl, JSON.stringify(story));
  }

  // Cache user progress with shorter TTL
  async cacheUserProgress(
    userId: string,
    progress: LearningProgress,
    ttl: number = 300
  ): Promise<void> {
    const key = `progress:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(progress));
  }

  // Cache vocabulary data with longer TTL
  async cacheVocabulary(
    word: string,
    data: VocabularyData,
    ttl: number = 7200
  ): Promise<void> {
    const key = `vocab:${word}`;
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }

  // Invalidate cache patterns
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Cache warming for popular content
  async warmCache(): Promise<void> {
    // Cache popular stories
    const popularStories = await prisma.story.findMany({
      where: { status: "published" },
      orderBy: { viewCount: "desc" },
      take: 50,
      include: { chunks: true },
    });

    await Promise.all(
      popularStories.map((story) => this.cacheStory(story.id, story, 7200))
    );
  }
}
```

---

## API Implementation

### 1. REST Endpoint Design

#### 1.1 Stories API Endpoints

**File**: `src/app/api/learning/stories/route.ts`

```typescript
// GET /api/learning/stories - List stories with filters
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract and validate query parameters
    const { searchParams } = new URL(request.url);
    const filters = await validateStoryFilters(searchParams);

    // Check user permissions
    const user = await getUserFromRequest(request);
    const ability = await buildAbilityForUser(user);

    if (!ability.can("read", "Story")) {
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 }
      );
    }

    // Apply tenant filtering
    const tenantFilters = {
      ...filters,
      tenantId: user.tenantId,
    };

    // Fetch stories with caching
    const cacheKey = `stories:${JSON.stringify(tenantFilters)}`;
    let stories = await cacheService.get(cacheKey);

    if (!stories) {
      stories = await storyRepository.getStories(tenantFilters, {
        offset: parseInt(searchParams.get("offset") || "0"),
        limit: Math.min(parseInt(searchParams.get("limit") || "20"), 100),
      });

      await cacheService.set(cacheKey, stories, 300); // 5 minutes
    }

    // Transform for API response
    const transformedStories = stories.map(transformStoryForAPI);

    return NextResponse.json(transformedStories, {
      headers: {
        "Cache-Control": "public, max-age=300",
        "X-Total-Count": stories.length.toString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching stories:", error);
    return NextResponse.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}

// POST /api/learning/stories - Create new story
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(request);
    const ability = await buildAbilityForUser(user);

    if (!ability.can("create", "Story")) {
      return NextResponse.json(
        { error: "Không có quyền tạo truyện" },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validatedData = await createStorySchema.parseAsync(body);

    // Create story with transaction
    const story = await prisma.$transaction(async (tx) => {
      const newStory = await tx.story.create({
        data: {
          ...validatedData,
          createdBy: user.id,
          tenantId: user.tenantId,
          status: "draft",
        },
      });

      // Create story chunks
      if (validatedData.chunks && validatedData.chunks.length > 0) {
        await tx.storyChunk.createMany({
          data: validatedData.chunks.map((chunk, index) => ({
            storyId: newStory.id,
            chunkOrder: index,
            chunkText: chunk.text,
            type: chunk.type || "normal",
          })),
        });
      }

      return newStory;
    });

    // Invalidate cache
    await cacheService.invalidatePattern(`stories:*`);

    // Log audit event
    await auditLogger.log({
      action: "story.created",
      userId: user.id,
      resourceId: story.id,
      details: { title: story.title },
    });

    return NextResponse.json(transformStoryForAPI(story), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: error.errors },
        { status: 400 }
      );
    }

    logger.error("Error creating story:", error);
    return NextResponse.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}
```

#### 1.2 Progress API Endpoints

**File**: `src/app/api/learning/progress/update/route.ts`

```typescript
// POST /api/learning/progress/update - Update user progress
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(request);

    // Validate request body
    const body = await request.json();
    const progressData = await updateProgressSchema.parseAsync(body);

    // Check if user can update their own progress
    if (progressData.userId !== user.id) {
      const ability = await buildAbilityForUser(user);
      if (!ability.can("update", "UserProgress")) {
        return NextResponse.json(
          { error: "Không có quyền cập nhật tiến trình" },
          { status: 403 }
        );
      }
    }

    // Update progress with optimistic locking
    const updatedProgress = await progressRepository.updateUserProgress(
      progressData.userId,
      progressData.storyId,
      {
        completionPercentage: progressData.completionPercentage,
        timeSpent: progressData.timeSpent,
        lastPosition: progressData.lastPosition,
        wordsLearned: progressData.wordsLearned || [],
      }
    );

    // Update vocabulary progress if words were learned
    if (progressData.wordsLearned && progressData.wordsLearned.length > 0) {
      await progressRepository.batchUpdateVocabularyProgress(
        progressData.userId,
        progressData.wordsLearned.map((word) => ({
          word,
          status: "reviewing" as VocabularyStatus,
          isCorrect: true,
          masteryLevel: 25,
          nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }))
      );
    }

    // Process exercise results if provided
    if (
      progressData.exerciseResults &&
      progressData.exerciseResults.length > 0
    ) {
      await Promise.all(
        progressData.exerciseResults.map((result) =>
          exerciseRepository.saveExerciseResult({
            ...result,
            userId: progressData.userId,
            storyId: progressData.storyId,
          })
        )
      );
    }

    // Check for achievements
    const newAchievements = await achievementService.checkAchievements(
      progressData.userId,
      updatedProgress
    );

    // Invalidate progress cache
    await cacheService.invalidatePattern(`progress:${progressData.userId}*`);

    // Track learning session
    await analyticsService.trackLearningSession({
      userId: progressData.userId,
      storyId: progressData.storyId,
      duration: progressData.timeSpent,
      completionPercentage: progressData.completionPercentage,
      wordsLearned: progressData.wordsLearned?.length || 0,
      exercisesCompleted: progressData.exerciseResults?.length || 0,
    });

    return NextResponse.json({
      progress: transformProgressForAPI(updatedProgress),
      achievements: newAchievements,
      message: "Tiến trình đã được cập nhật thành công",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: error.errors },
        { status: 400 }
      );
    }

    logger.error("Error updating progress:", error);
    return NextResponse.json({ error: "Lỗi server nội bộ" }, { status: 500 });
  }
}
```

### 2. API Middleware Implementation

#### 2.1 Authentication Middleware

```typescript
// Authentication middleware with JWT validation
export async function authMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  try {
    // Extract token from Authorization header or cookie
    const token = extractTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: "Token xác thực không tồn tại" },
        { status: 401 }
      );
    }

    // Verify JWT token
    const payload = await verifyJWT(token);

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: "Token không hợp lệ" },
        { status: 401 }
      );
    }

    // Check token expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return NextResponse.json({ error: "Token đã hết hạn" }, { status: 401 });
    }

    // Load user data with caching
    const user = await userService.getUserById(payload.userId);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Người dùng không tồn tại hoặc đã bị vô hiệu hóa" },
        { status: 401 }
      );
    }

    // Add user to request context
    request.user = user;

    return null; // Continue to next middleware
  } catch (error) {
    logger.error("Authentication error:", error);
    return NextResponse.json({ error: "Lỗi xác thực" }, { status: 401 });
  }
}
```

#### 2.2 Rate Limiting Middleware

```typescript
// Rate limiting with Redis
export async function rateLimitMiddleware(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 100,
    keyGenerator = (req) => getClientIP(req),
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  try {
    const key = `rate_limit:${keyGenerator(request)}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Use Redis sorted set for sliding window
    const pipeline = redis.pipeline();

    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    pipeline.zcard(key);

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiration
    pipeline.expire(key, Math.ceil(windowMs / 1000));

    const results = await pipeline.exec();
    const currentRequests = results[1][1] as number;

    if (currentRequests >= maxRequests) {
      return NextResponse.json(
        {
          error: "Quá nhiều yêu cầu",
          retryAfter: Math.ceil(windowMs / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(now + windowMs).toISOString(),
            "Retry-After": Math.ceil(windowMs / 1000).toString(),
          },
        }
      );
    }

    // Add rate limit headers
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", maxRequests.toString());
    response.headers.set(
      "X-RateLimit-Remaining",
      (maxRequests - currentRequests - 1).toString()
    );
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(now + windowMs).toISOString()
    );

    return null; // Continue to next middleware
  } catch (error) {
    logger.error("Rate limiting error:", error);
    // Don't block requests on rate limiting errors
    return null;
  }
}
```

### 3. API Validation Schemas

#### 3.1 Zod Validation Schemas

```typescript
// Story validation schemas
export const createStorySchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(200, "Tiêu đề không được quá 200 ký tự"),

  content: z
    .string()
    .min(10, "Nội dung phải có ít nhất 10 ký tự")
    .max(50000, "Nội dung không được quá 50,000 ký tự"),

  storyType: z.enum([
    "original",
    "chemdanhtu",
    "chemdongtu",
    "chemtinhtu",
    "custom",
  ]),

  difficulty: z.enum([
    "beginner",
    "elementary",
    "intermediate",
    "upper_intermediate",
    "advanced",
    "proficient",
  ]),

  estimatedMinutes: z
    .number()
    .int("Thời gian ước tính phải là số nguyên")
    .min(1, "Thời gian ước tính phải lớn hơn 0")
    .max(180, "Thời gian ước tính không được quá 180 phút")
    .optional(),

  chemRatio: z
    .number()
    .min(0, "Tỷ lệ chêm không được âm")
    .max(1, "Tỷ lệ chêm không được quá 100%")
    .optional(),

  lessonId: z.string().uuid("ID bài học không hợp lệ").optional(),

  chunks: z
    .array(
      z.object({
        text: z.string().min(1, "Nội dung chunk không được để trống"),
        type: z.enum(["normal", "chem", "explain"]).default("normal"),
        startTime: z.number().min(0).optional(),
        endTime: z.number().min(0).optional(),
      })
    )
    .optional(),
});

// Progress update schema
export const updateProgressSchema = z.object({
  userId: z.string().uuid("ID người dùng không hợp lệ"),

  storyId: z.string().uuid("ID truyện không hợp lệ"),

  completionPercentage: z
    .number()
    .min(0, "Phần trăm hoàn thành không được âm")
    .max(100, "Phần trăm hoàn thành không được quá 100"),

  timeSpent: z
    .number()
    .int("Thời gian phải là số nguyên")
    .min(0, "Thời gian không được âm"),

  lastPosition: z
    .number()
    .int("Vị trí cuối phải là số nguyên")
    .min(0, "Vị trí cuối không được âm")
    .optional(),

  wordsLearned: z.array(z.string().min(1)).optional(),

  exerciseResults: z
    .array(
      z.object({
        exerciseId: z.string().uuid(),
        userAnswer: z.union([z.string(), z.array(z.string())]),
        isCorrect: z.boolean(),
        timeSpent: z.number().min(0),
        attempts: z.number().int().min(1),
      })
    )
    .optional(),
});

// Exercise submission schema
export const submitExerciseSchema = z.object({
  exerciseId: z.string().uuid("ID bài tập không hợp lệ"),

  storyId: z.string().uuid("ID truyện không hợp lệ"),

  userAnswer: z.union([
    z.string().min(1, "Câu trả lời không được để trống"),
    z.array(z.string().min(1)).min(1, "Phải có ít nhất một câu trả lời"),
  ]),

  timeSpent: z
    .number()
    .int("Thời gian phải là số nguyên")
    .min(0, "Thời gian không được âm")
    .max(3600, "Thời gian không được quá 1 giờ"),
});
```

---

_[Document continues with Frontend Architecture, Security Implementation, Performance Optimization, and Testing Implementation sections...]_

---

**Document Status**: 🔄 In Progress - Part 1 Complete  
**Next Sections**: Frontend Architecture, Security, Performance, Testing  
**Implementation Level**: Component and code-level specifications

## Frontend Architecture

### 1. Next.js 15 Page Architecture

#### 1.1 App Router Structure

```typescript
// Main learning page structure
// File: src/app/learning/page.tsx
export default function LearningPage() {
  return (
    <AccessibilityProvider>
      <div className="min-h-screen bg-gray-50">
        <SkipLinks />
        <LearningHeader />
        <main className="container mx-auto px-4 py-8">
          <LearningContent />
        </main>
        <LearningFooter />
      </div>
    </AccessibilityProvider>
  );
}

// Learning content with lazy loading
function LearningContent() {
  const [selectedStory, setSelectedStory] = useState<LearningStory | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Suspense fallback={<StoryReaderSkeleton />}>
          {selectedStory ? (
            <StoryReader story={selectedStory} />
          ) : (
            <StorySelector onStorySelect={setSelectedStory} />
          )}
        </Suspense>
      </div>

      <aside className="space-y-6">
        <Suspense fallback={<ProgressSkeleton />}>
          <ProgressTracker />
        </Suspense>

        <Suspense fallback={<VocabularySkeleton />}>
          <VocabularyPanel />
        </Suspense>
      </aside>
    </div>
  );
}
```

#### 1.2 Layout Components

```typescript
// Root layout with providers
// File: src/app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={cn(inter.className, "antialiased")}>
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>

        <Analytics />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

// Learning layout with sidebar
// File: src/app/learning/layout.tsx
export default function LearningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <LearningNavigation />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <LearningAside />
    </div>
  );
}
```

### 2. State Management Architecture

#### 2.1 Zustand Store Structure

```typescript
// Learning state store
// File: src/app/learning/store/learningStore.ts
interface LearningState {
  // Current session state
  currentStory: LearningStory | null;
  currentChunk: number;
  isPlaying: boolean;

  // UI state
  showVocabularyPopup: boolean;
  selectedWord: string | null;
  vocabularyPosition: { x: number; y: number } | null;

  // User preferences
  preferences: UserLearningPreferences;

  // Progress state
  sessionProgress: SessionProgress;

  // Actions
  setCurrentStory: (story: LearningStory | null) => void;
  setCurrentChunk: (chunk: number) => void;
  setIsPlaying: (playing: boolean) => void;
  showVocabulary: (word: string, position: { x: number; y: number }) => void;
  hideVocabulary: () => void;
  updatePreferences: (preferences: Partial<UserLearningPreferences>) => void;
  updateSessionProgress: (progress: Partial<SessionProgress>) => void;
}

export const useLearningStore = create<LearningState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentStory: null,
        currentChunk: 0,
        isPlaying: false,
        showVocabularyPopup: false,
        selectedWord: null,
        vocabularyPosition: null,
        preferences: defaultPreferences,
        sessionProgress: {
          startTime: Date.now(),
          timeSpent: 0,
          wordsLearned: [],
          exercisesCompleted: 0,
          completionPercentage: 0,
        },

        // Actions
        setCurrentStory: (story) => set({ currentStory: story }),

        setCurrentChunk: (chunk) => set({ currentChunk: chunk }),

        setIsPlaying: (playing) => set({ isPlaying: playing }),

        showVocabulary: (word, position) =>
          set({
            showVocabularyPopup: true,
            selectedWord: word,
            vocabularyPosition: position,
          }),

        hideVocabulary: () =>
          set({
            showVocabularyPopup: false,
            selectedWord: null,
            vocabularyPosition: null,
          }),

        updatePreferences: (newPreferences) =>
          set((state) => ({
            preferences: { ...state.preferences, ...newPreferences },
          })),

        updateSessionProgress: (progress) =>
          set((state) => ({
            sessionProgress: { ...state.sessionProgress, ...progress },
          })),
      }),
      {
        name: "learning-store",
        partialize: (state) => ({
          preferences: state.preferences,
          sessionProgress: state.sessionProgress,
        }),
      }
    )
  )
);
```

#### 2.2 TanStack Query Integration

```typescript
// Query hooks for server state
// File: src/app/learning/hooks/queries.ts

// Stories queries
export const useStoriesQuery = (filters?: StoryFilters) => {
  return useQuery({
    queryKey: ["stories", filters],
    queryFn: () => fetchStories(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Story detail query
export const useStoryQuery = (storyId: string | null) => {
  return useQuery({
    queryKey: ["story", storyId],
    queryFn: () => (storyId ? fetchStory(storyId) : null),
    enabled: !!storyId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Progress queries
export const useProgressQuery = (userId: string) => {
  return useQuery({
    queryKey: ["progress", userId],
    queryFn: () => fetchUserProgress(userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

// Vocabulary query
export const useVocabularyQuery = (word: string | null) => {
  return useQuery({
    queryKey: ["vocabulary", word],
    queryFn: () => (word ? fetchVocabularyData(word) : null),
    enabled: !!word,
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 2 * 60 * 60 * 1000, // 2 hours
  });
};

// Mutations for updates
export const useUpdateProgressMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProgress,
    onSuccess: (data, variables) => {
      // Update progress cache
      queryClient.setQueryData(["progress", variables.userId], data);

      // Invalidate related queries
      queryClient.invalidateQueries(["progress"]);
      queryClient.invalidateQueries(["stats", variables.userId]);
    },
    onError: (error) => {
      toast.error("Không thể cập nhật tiến độ");
      console.error("Progress update error:", error);
    },
  });
};

export const useSubmitExerciseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitExerciseAnswer,
    onSuccess: (data, variables) => {
      // Update exercise cache
      queryClient.setQueryData(["exercises", variables.storyId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          results: [...(old.results || []), data],
        };
      });

      // Update progress
      queryClient.invalidateQueries(["progress"]);
    },
    onError: (error) => {
      toast.error("Không thể gửi bài tập");
      console.error("Exercise submission error:", error);
    },
  });
};
```

### 3. Component Design Patterns

#### 3.1 Compound Components Pattern

```typescript
// Audio player compound component
// File: src/app/learning/components/AudioPlayer/index.tsx
interface AudioPlayerContextType {
  state: AudioPlayerState;
  actions: AudioPlayerActions;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export const AudioPlayer = ({ children, ...props }: AudioPlayerProps) => {
  const audioPlayer = useAudioPlayer(props);

  return (
    <AudioPlayerContext.Provider value={audioPlayer}>
      <div className="audio-player" role="region" aria-label="Trình phát âm thanh">
        {children}
      </div>
    </AudioPlayerContext.Provider>
  );
};

// Sub-components
AudioPlayer.Controls = function AudioControls() {
  const { state, actions } = useAudioPlayerContext();

  return (
    <div className="flex items-center gap-2" role="toolbar" aria-label="Điều khiển âm thanh">
      <button
        onClick={actions.togglePlayPause}
        aria-label={state.isPlaying ? "Tạm dừng" : "Phát"}
        className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
      >
        {state.isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button
        onClick={() => actions.skipBackward(10)}
        aria-label="Lùi 10 giây"
        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
      >
        <SkipBackIcon />
      </button>

      <button
        onClick={() => actions.skipForward(10)}
        aria-label="Tiến 10 giây"
        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
      >
        <SkipForwardIcon />
      </button>
    </div>
  );
};

AudioPlayer.Progress = function AudioProgress() {
  const { state, actions } = useAudioPlayerContext();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">
        {formatTime(state.currentTime)}
      </span>

      <input
        type="range"
        min={0}
        max={state.duration}
        value={state.currentTime}
        onChange={(e) => actions.seek(Number(e.target.value))}
        className="flex-1"
        aria-label="Thanh tiến độ âm thanh"
      />

      <span className="text-sm text-gray-600">
        {formatTime(state.duration)}
      </span>
    </div>
  );
};

AudioPlayer.Volume = function AudioVolume() {
  const { state, actions } = useAudioPlayerContext();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={actions.toggleMute}
        aria-label={state.isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
        className="p-1 rounded hover:bg-gray-200"
      >
        {state.isMuted ? <VolumeOffIcon /> : <VolumeOnIcon />}
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.1}
        value={state.volume}
        onChange={(e) => actions.setVolume(Number(e.target.value))}
        className="w-20"
        aria-label="Âm lượng"
      />
    </div>
  );
};

// Usage
function StoryAudioPlayer() {
  return (
    <AudioPlayer audioUrl={story.audioUrl} chunks={story.chunks}>
      <AudioPlayer.Controls />
      <AudioPlayer.Progress />
      <AudioPlayer.Volume />
    </AudioPlayer>
  );
}
```

#### 3.2 Render Props Pattern

```typescript
// Vocabulary lookup with render props
// File: src/app/learning/components/VocabularyLookup.tsx
interface VocabularyLookupProps {
  word: string;
  children: (props: {
    data: VocabularyData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
  }) => ReactNode;
}

export function VocabularyLookup({ word, children }: VocabularyLookupProps) {
  const { data, isLoading, error, refetch } = useVocabularyQuery(word);

  return <>{children({ data, isLoading, error, refetch })}</>;
}

// Usage
function VocabularyWord({ word }: { word: string }) {
  return (
    <VocabularyLookup word={word}>
      {({ data, isLoading, error }) => (
        <Popover>
          <PopoverTrigger asChild>
            <button className="vocabulary-word">
              {word}
            </button>
          </PopoverTrigger>

          <PopoverContent>
            {isLoading && <VocabularyLoadingSkeleton />}
            {error && <VocabularyError error={error} />}
            {data && <VocabularyDefinition data={data} />}
          </PopoverContent>
        </Popover>
      )}
    </VocabularyLookup>
  );
}
```

### 4. Responsive Design Implementation

#### 4.1 Mobile-First Approach

```typescript
// Responsive story reader
// File: src/app/learning/components/ResponsiveStoryReader.tsx
export function ResponsiveStoryReader({ story }: { story: LearningStory }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <MobileStoryReader story={story} />;
  }

  return <DesktopStoryReader story={story} />;
}

// Mobile-optimized story reader
function MobileStoryReader({ story }: { story: LearningStory }) {
  return (
    <div className="mobile-story-reader">
      {/* Mobile-specific layout */}
      <div className="sticky top-0 bg-white border-b p-4">
        <StoryHeader story={story} compact />
      </div>

      <div className="p-4 space-y-4">
        {story.chunks.map((chunk, index) => (
          <MobileStoryChunk
            key={chunk.id}
            chunk={chunk}
            index={index}
          />
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <MobileAudioControls />
      </div>
    </div>
  );
}
```

#### 4.2 Breakpoint System

```typescript
// Responsive utilities
// File: src/app/learning/utils/responsive.ts
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints>('sm');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width >= breakpoints['2xl']) setBreakpoint('2xl');
      else if (width >= breakpoints.xl) setBreakpoint('xl');
      else if (width >= breakpoints.lg) setBreakpoint('lg');
      else if (width >= breakpoints.md) setBreakpoint('md');
      else setBreakpoint('sm');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
  };
}

// Responsive component wrapper
export function ResponsiveWrapper<T extends Record<string, any>>({
  mobile,
  tablet,
  desktop,
  ...props
}: {
  mobile?: ComponentType<T>;
  tablet?: ComponentType<T>;
  desktop?: ComponentType<T>;
} & T) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  if (isMobile && mobile) {
    const MobileComponent = mobile;
    return <MobileComponent {...props} />;
  }

  if (isTablet && tablet) {
    const TabletComponent = tablet;
    return <TabletComponent {...props} />;
  }

  if (isDesktop && desktop) {
    const DesktopComponent = desktop;
    return <DesktopComponent {...props} />;
  }

  return null;
}
```

---

## Security Implementation

### 1. Authentication Flow Implementation

#### 1.1 JWT Token Management

```typescript
// Token management service
// File: src/core/auth/tokenManager.ts
interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

class TokenManager {
  private static instance: TokenManager;
  private tokenData: TokenData | null = null;
  private refreshPromise: Promise<string> | null = null;

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // Store token securely
  public setTokens(tokens: TokenData): void {
    this.tokenData = tokens;

    // Encrypt and store in localStorage
    const encrypted = this.encryptTokenData(tokens);
    localStorage.setItem("auth_tokens", encrypted);

    // Set up automatic refresh
    this.scheduleTokenRefresh();
  }

  // Get current access token
  public getAccessToken(): string | null {
    if (!this.tokenData) {
      this.loadTokensFromStorage();
    }

    if (!this.tokenData) return null;

    // Check if token is expired
    if (this.isTokenExpired()) {
      this.refreshTokens();
      return null;
    }

    return this.tokenData.accessToken;
  }

  // Refresh tokens
  public async refreshTokens(): Promise<string | null> {
    if (!this.tokenData?.refreshToken) {
      this.clearTokens();
      return null;
    }

    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: this.tokenData?.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const newTokens = await response.json();
      this.setTokens(newTokens);

      return newTokens.accessToken;
    } catch (error) {
      console.error("Token refresh error:", error);
      this.clearTokens();

      // Redirect to login
      window.location.href = "/login";
      return null;
    }
  }

  private isTokenExpired(): boolean {
    if (!this.tokenData) return true;

    // Check if token expires in the next 5 minutes
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    return this.tokenData.expiresAt < fiveMinutesFromNow;
  }

  private scheduleTokenRefresh(): void {
    if (!this.tokenData) return;

    // Schedule refresh 5 minutes before expiration
    const refreshTime = this.tokenData.expiresAt - Date.now() - 5 * 60 * 1000;

    if (refreshTime > 0) {
      setTimeout(() => {
        this.refreshTokens();
      }, refreshTime);
    }
  }

  private encryptTokenData(tokens: TokenData): string {
    // Simple base64 encoding (in production, use proper encryption)
    return btoa(JSON.stringify(tokens));
  }

  private decryptTokenData(encrypted: string): TokenData | null {
    try {
      return JSON.parse(atob(encrypted));
    } catch {
      return null;
    }
  }

  private loadTokensFromStorage(): void {
    const encrypted = localStorage.getItem("auth_tokens");
    if (encrypted) {
      this.tokenData = this.decryptTokenData(encrypted);
    }
  }

  public clearTokens(): void {
    this.tokenData = null;
    localStorage.removeItem("auth_tokens");
  }
}

export const tokenManager = TokenManager.getInstance();
```

#### 1.2 CASL Authorization Implementation

```typescript
// CASL ability builder
// File: src/core/auth/abilities.ts
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import type { User, Role, Permission } from '@prisma/client';

export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'publish' | 'approve';
export type Subjects = 'Story' | 'Lesson' | 'User' | 'Exercise' | 'Progress' | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

interface UserWithRoles extends User {
  roles: (Role & {
    permissions: Permission[];
  })[];
}

export function buildAbilityForUser(user: UserWithRoles | null): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (!user) {
    // Guest permissions
    can('read', 'Story', { status: 'published' });
    return build();
  }

  // Extract all permissions from user roles
  const permissions = user.roles.flatMap(role => role.permissions);
  const permissionNames = permissions.map(p => p.name);

  // Basic user permissions
  can('read', 'Story', { status: 'published', tenantId: user.tenantId });
  can('read', 'Progress', { userId: user.id });
  can('update', 'Progress', { userId: user.id });

  // Role-based permissions
  if (permissionNames.includes('story.create')) {
    can('create', 'Story');
  }

  if (permissionNames.includes('story.update')) {
    can('update', 'Story', { createdBy: user.id, tenantId: user.tenantId });
  }

  if (permissionNames.includes('story.delete')) {
    can('delete', 'Story', { createdBy: user.id, tenantId: user.tenantId });
  }

  if (permissionNames.includes('story.publish')) {
    can('publish', 'Story', { tenantId: user.tenantId });
  }

  if (permissionNames.includes('story.approve')) {
    can('approve', 'Story', { tenantId: user.tenantId });
  }

  // Admin permissions
  if (user.roles.some(role => role.name === 'admin')) {
    can('manage', 'all');
  }

  // Super admin permissions
  if (user.roles.some(role => role.name === 'super_admin')) {
    can('manage', 'all');
  }

  return build();
}

// React hook for abilities
export function useAbility(): AppAbility {
  const { user } = useAuth();
  return useMemo(() => buildAbilityForUser(user), [user]);
}

// Permission check component
interface CanProps {
  I: Actions;
  a: Subjects | { __type: Subjects; [key: string]: any };
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ I, a, children, fallback = null }: CanProps) {
  const ability = useAbility();

  if (ability.can(I, a)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
```

### 2. Input Validation and Sanitization

#### 2.1 Zod Schema Validation

```typescript
// Comprehensive validation schemas
// File: src/core/validation/schemas.ts
import { z } from "zod";

// User input sanitization
const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ""); // Remove event handlers
};

// Custom Zod transforms
const sanitizedString = z.string().transform(sanitizeString);

// Story content validation
export const storyContentSchema = z.object({
  title: sanitizedString
    .min(1, "Tiêu đề không được để trống")
    .max(200, "Tiêu đề không được quá 200 ký tự")
    .regex(/^[a-zA-ZÀ-ỹ0-9\s\-_.,!?]+$/, "Tiêu đề chứa ký tự không hợp lệ"),

  content: sanitizedString
    .min(10, "Nội dung phải có ít nhất 10 ký tự")
    .max(50000, "Nội dung không được quá 50,000 ký tự"),

  storyType: z.enum([
    "original",
    "chemdanhtu",
    "chemdongtu",
    "chemtinhtu",
    "custom",
  ]),

  difficulty: z.enum([
    "beginner",
    "elementary",
    "intermediate",
    "upper_intermediate",
    "advanced",
    "proficient",
  ]),

  estimatedMinutes: z
    .number()
    .int("Thời gian ước tính phải là số nguyên")
    .min(1, "Thời gian ước tính phải lớn hơn 0")
    .max(180, "Thời gian ước tính không được quá 180 phút")
    .optional(),

  chemRatio: z
    .number()
    .min(0, "Tỷ lệ chêm không được âm")
    .max(1, "Tỷ lệ chêm không được quá 100%")
    .optional(),

  tags: z
    .array(sanitizedString.max(50, "Tag không được quá 50 ký tự"))
    .max(10, "Không được có quá 10 tags")
    .optional(),
});

// User registration validation
export const userRegistrationSchema = z.object({
  email: z
    .string()
    .email("Email không hợp lệ")
    .max(255, "Email không được quá 255 ký tự")
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .max(128, "Mật khẩu không được quá 128 ký tự")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt"
    ),

  name: sanitizedString
    .min(2, "Tên phải có ít nhất 2 ký tự")
    .max(100, "Tên không được quá 100 ký tự")
    .regex(/^[a-zA-ZÀ-ỹ\s]+$/, "Tên chỉ được chứa chữ cái và khoảng trắng"),

  phone: z
    .string()
    .regex(/^(\+84|0)[3-9]\d{8}$/, "Số điện thoại không hợp lệ")
    .optional(),
});

// Exercise submission validation
export const exerciseSubmissionSchema = z.object({
  exerciseId: z.string().uuid("ID bài tập không hợp lệ"),

  storyId: z.string().uuid("ID truyện không hợp lệ"),

  userAnswer: z.union([
    sanitizedString.min(1, "Câu trả lời không được để trống"),
    z.array(sanitizedString.min(1)).min(1, "Phải có ít nhất một câu trả lời"),
  ]),

  timeSpent: z
    .number()
    .int("Thời gian phải là số nguyên")
    .min(0, "Thời gian không được âm")
    .max(3600, "Thời gian không được quá 1 giờ"),

  metadata: z
    .object({
      attempts: z.number().int().min(1).max(10),
      hints_used: z.number().int().min(0).max(5),
      confidence_level: z.number().min(1).max(5).optional(),
    })
    .optional(),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File không được lớn hơn 10MB"
    )
    .refine(
      (file) => ["audio/mpeg", "audio/wav", "audio/mp4"].includes(file.type),
      "Chỉ chấp nhận file âm thanh MP3, WAV, M4A"
    ),

  storyId: z.string().uuid("ID truyện không hợp lệ"),

  description: sanitizedString
    .max(500, "Mô tả không được quá 500 ký tự")
    .optional(),
});
```

#### 2.2 CSRF Protection Implementation

```typescript
// CSRF token management
// File: src/core/security/csrf.ts
class CSRFManager {
  private static instance: CSRFManager;
  private token: string | null = null;

  public static getInstance(): CSRFManager {
    if (!CSRFManager.instance) {
      CSRFManager.instance = new CSRFManager();
    }
    return CSRFManager.instance;
  }

  // Get CSRF token from server
  public async getToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    try {
      const response = await fetch("/api/auth/csrf", {
        method: "GET",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Failed to get CSRF token");
      }

      const data = await response.json();
      this.token = data.csrfToken;
      return this.token;
    } catch (error) {
      console.error("CSRF token error:", error);
      throw error;
    }
  }

  // Add CSRF token to request headers
  public async addTokenToHeaders(
    headers: HeadersInit = {}
  ): Promise<HeadersInit> {
    const token = await this.getToken();

    return {
      ...headers,
      "X-CSRF-Token": token,
    };
  }

  // Clear token (on logout)
  public clearToken(): void {
    this.token = null;
  }
}

export const csrfManager = CSRFManager.getInstance();

// Enhanced API client with CSRF protection
export async function secureApiCall(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Add authentication token
  const accessToken = tokenManager.getAccessToken();

  // Add CSRF token for non-GET requests
  let headers = options.headers || {};

  if (accessToken) {
    headers = {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
    };
  }

  if (options.method && options.method !== "GET") {
    headers = await csrfManager.addTokenToHeaders(headers);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
  });

  // Handle token expiration
  if (response.status === 401) {
    const newToken = await tokenManager.refreshTokens();
    if (newToken) {
      // Retry with new token
      return secureApiCall(url, {
        ...options,
        headers: {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    } else {
      // Redirect to login
      window.location.href = "/login";
      throw new Error("Authentication failed");
    }
  }

  return response;
}
```

### 3. Security Headers and Middleware

#### 3.1 Security Headers Configuration

```typescript
// Security headers middleware
// File: src/middleware/security.ts
import { NextRequest, NextResponse } from "next/server";

export function securityHeaders(request: NextRequest) {
  const response = NextResponse.next();

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https: blob:",
    "connect-src 'self' https://api.example.com wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // Other security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // HSTS (only in production)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}
```

#### 3.2 Rate Limiting Implementation

```typescript
// Advanced rate limiting with Redis
// File: src/core/security/rateLimiting.ts
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

class RateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async checkLimit(
    request: NextRequest,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const key = `rate_limit:${config.keyGenerator(request)}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Use Redis sorted set for sliding window
    const pipeline = this.redis.pipeline();

    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Count current requests
    pipeline.zcard(key);

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiration
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();
    const currentRequests = results[1][1] as number;

    const allowed = currentRequests < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - currentRequests - 1);
    const resetTime = new Date(now + config.windowMs);

    return { allowed, remaining, resetTime };
  }
}

// Rate limiting configurations
export const rateLimitConfigs = {
  // General API rate limiting
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (req: NextRequest) => getClientIP(req),
  },

  // Login rate limiting
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req: NextRequest) => getClientIP(req),
    message: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.",
  },

  // Story creation rate limiting
  storyCreation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyGenerator: (req: NextRequest) => getUserIdFromRequest(req),
  },

  // File upload rate limiting
  fileUpload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    keyGenerator: (req: NextRequest) => getUserIdFromRequest(req),
  },
};

export const rateLimiter = new RateLimiter();
```

---

_[Document continues with Performance Optimization and Testing Implementation sections...]_

## Performance Optimization

### 1. Caching Strategies

#### 1.1 Multi-Level Caching Architecture

```typescript
// Cache service with multiple layers
// File: src/core/cache/cacheService.ts
interface CacheConfig {
  ttl: number;
  maxSize?: number;
  strategy: "lru" | "lfu" | "fifo";
}

class MultiLevelCacheService {
  private memoryCache: Map<string, { data: any; expires: number }>;
  private redis: Redis;
  private maxMemorySize: number;

  constructor() {
    this.memoryCache = new Map();
    this.redis = new Redis(process.env.REDIS_URL!);
    this.maxMemorySize = 100; // Max items in memory
  }

  // Get from cache with fallback chain
  async get<T>(key: string): Promise<T | null> {
    // 1. Check memory cache first
    const memoryResult = this.getFromMemory<T>(key);
    if (memoryResult !== null) {
      return memoryResult;
    }

    // 2. Check Redis cache
    const redisResult = await this.getFromRedis<T>(key);
    if (redisResult !== null) {
      // Store in memory for faster access
      this.setInMemory(key, redisResult, 300); // 5 minutes in memory
      return redisResult;
    }

    return null;
  }

  // Set in all cache layers
  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    // Set in memory cache
    this.setInMemory(key, data, Math.min(ttl, 300)); // Max 5 minutes in memory

    // Set in Redis cache
    await this.setInRedis(key, data, ttl);
  }

  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.data;
  }

  private setInMemory<T>(key: string, data: T, ttl: number): void {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      data,
      expires: Date.now() + ttl * 1000,
    });
  }

  private async getFromRedis<T>(key: string): Promise<T | null> {
    try {
      const result = await this.redis.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  }

  private async setInRedis<T>(
    key: string,
    data: T,
    ttl: number
  ): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error("Redis set error:", error);
    }
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<void> {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear Redis cache
    const keys = await this.redis.keys(`*${pattern}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Warm cache with popular content
  async warmCache(): Promise<void> {
    const popularStories = await this.getPopularStories();
    const cachePromises = popularStories.map(
      (story) => this.set(`story:${story.id}`, story, 3600) // 1 hour
    );

    await Promise.all(cachePromises);
  }

  private async getPopularStories() {
    // Implementation to get popular stories
    return [];
  }
}

export const cacheService = new MultiLevelCacheService();
```

#### 1.2 Query Result Caching

```typescript
// Database query caching
// File: src/core/database/queryCache.ts
interface QueryCacheOptions {
  ttl: number;
  tags: string[];
  revalidateOnStale?: boolean;
}

class QueryCache {
  private cache: MultiLevelCacheService;

  constructor() {
    this.cache = cacheService;
  }

  // Cached query execution
  async query<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: QueryCacheOptions
  ): Promise<T> {
    const cacheKey = `query:${queryKey}`;

    // Try to get from cache
    const cached = await this.cache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute query
    const result = await queryFn();

    // Cache result with tags for invalidation
    await this.cache.set(cacheKey, result, options.ttl);
    await this.tagCache(cacheKey, options.tags);

    return result;
  }

  // Tag-based cache invalidation
  async invalidateByTag(tag: string): Promise<void> {
    const tagKey = `tag:${tag}`;
    const cachedKeys = await this.cache.get<string[]>(tagKey);

    if (cachedKeys) {
      await Promise.all(
        cachedKeys.map((key) => this.cache.invalidatePattern(key))
      );
      await this.cache.invalidatePattern(tagKey);
    }
  }

  private async tagCache(cacheKey: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const existingKeys = (await this.cache.get<string[]>(tagKey)) || [];
      const updatedKeys = [...existingKeys, cacheKey];
      await this.cache.set(tagKey, updatedKeys, 86400); // 24 hours
    }
  }
}

export const queryCache = new QueryCache();

// Usage in repository
export class StoryRepository {
  async getStories(filters: StoryFilters): Promise<LearningStory[]> {
    const queryKey = `stories:${JSON.stringify(filters)}`;

    return queryCache.query(queryKey, () => this.executeStoryQuery(filters), {
      ttl: 300, // 5 minutes
      tags: ["stories", `tenant:${filters.tenantId}`],
    });
  }

  async updateStory(storyId: string, data: Partial<Story>): Promise<Story> {
    const result = await prisma.story.update({
      where: { id: storyId },
      data,
    });

    // Invalidate related caches
    await queryCache.invalidateByTag("stories");
    await queryCache.invalidateByTag(`story:${storyId}`);

    return result;
  }
}
```

### 2. Lazy Loading and Code Splitting

#### 2.1 Component Lazy Loading

```typescript
// Dynamic component loading
// File: src/app/learning/components/LazyComponents.tsx
import { lazy, Suspense } from 'react';
import { ComponentLoadingSkeleton } from './LoadingSkeletons';

// Lazy load heavy components
export const LazyStoryReader = lazy(() =>
  import('./StoryReader').then(module => ({ default: module.StoryReader }))
);

export const LazyAudioPlayer = lazy(() =>
  import('./AudioPlayer').then(module => ({ default: module.AudioPlayer }))
);

export const LazyExercisePanel = lazy(() =>
  import('./ExercisePanel').then(module => ({ default: module.ExercisePanel }))
);

export const LazyVocabularyManager = lazy(() =>
  import('./VocabularyManager').then(module => ({ default: module.VocabularyManager }))
);

// Wrapper component with error boundary
interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export function LazyComponentWrapper({
  children,
  fallback = <ComponentLoadingSkeleton />,
  errorFallback = <div>Không thể tải component</div>
}: LazyComponentWrapperProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Usage in pages
export function LearningPage() {
  const [selectedStory, setSelectedStory] = useState<LearningStory | null>(null);

  return (
    <div className="learning-page">
      <LazyComponentWrapper>
        <LazyStoryReader story={selectedStory} />
      </LazyComponentWrapper>

      <LazyComponentWrapper>
        <LazyAudioPlayer audioUrl={selectedStory?.audioUrl} />
      </LazyComponentWrapper>
    </div>
  );
}
```

#### 2.2 Route-Based Code Splitting

```typescript
// Dynamic route imports
// File: src/app/learning/loading.tsx
export default function LearningLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
}

// Dynamic page imports with preloading
// File: src/components/navigation/NavigationLink.tsx
interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  preload?: boolean;
}

export function NavigationLink({ href, children, preload = false }: NavigationLinkProps) {
  const router = useRouter();

  // Preload route on hover
  const handleMouseEnter = useCallback(() => {
    if (preload) {
      router.prefetch(href);
    }
  }, [router, href, preload]);

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      className="nav-link"
    >
      {children}
    </Link>
  );
}
```

### 3. Image and Asset Optimization

#### 3.1 Next.js Image Optimization

```typescript
// Optimized image component
// File: src/components/ui/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  placeholder = 'blur',
  blurDataURL
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate blur placeholder if not provided
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

  if (hasError) {
    return (
      <div className={cn("bg-gray-200 flex items-center justify-center", className)}>
        <span className="text-gray-500 text-sm">Không thể tải ảnh</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL || defaultBlurDataURL}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}
```

#### 3.2 Audio File Optimization

```typescript
// Audio optimization service
// File: src/core/media/audioOptimization.ts
interface AudioOptimizationOptions {
  quality: "low" | "medium" | "high";
  format: "mp3" | "aac" | "ogg";
  bitrate?: number;
}

class AudioOptimizationService {
  // Get optimized audio URL based on user's connection
  getOptimizedAudioUrl(
    originalUrl: string,
    options?: AudioOptimizationOptions
  ): string {
    const connection = (navigator as any).connection;
    const isSlowConnection =
      connection &&
      (connection.effectiveType === "slow-2g" ||
        connection.effectiveType === "2g");

    const quality = isSlowConnection ? "low" : options?.quality || "medium";
    const format = this.getBestSupportedFormat();

    // Return CDN URL with optimization parameters
    const params = new URLSearchParams({
      quality,
      format,
      ...(options?.bitrate && { bitrate: options.bitrate.toString() }),
    });

    return `${originalUrl}?${params.toString()}`;
  }

  private getBestSupportedFormat(): string {
    const audio = new Audio();

    if (audio.canPlayType("audio/aac")) return "aac";
    if (audio.canPlayType("audio/ogg")) return "ogg";
    return "mp3"; // Fallback
  }

  // Preload audio with progressive enhancement
  async preloadAudio(url: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();

      audio.addEventListener("canplaythrough", () => resolve(audio));
      audio.addEventListener("error", reject);

      // Start loading
      audio.src = this.getOptimizedAudioUrl(url);
      audio.load();
    });
  }

  // Audio streaming for large files
  createAudioStream(url: string): MediaSource {
    if (!("MediaSource" in window)) {
      throw new Error("MediaSource not supported");
    }

    const mediaSource = new MediaSource();

    mediaSource.addEventListener("sourceopen", () => {
      const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
      this.streamAudioChunks(url, sourceBuffer);
    });

    return mediaSource;
  }

  private async streamAudioChunks(url: string, sourceBuffer: SourceBuffer) {
    const response = await fetch(url);
    const reader = response.body?.getReader();

    if (!reader) return;

    const pump = async (): Promise<void> => {
      const { done, value } = await reader.read();

      if (done) return;

      sourceBuffer.appendBuffer(value);

      sourceBuffer.addEventListener("updateend", pump, { once: true });
    };

    pump();
  }
}

export const audioOptimization = new AudioOptimizationService();
```

### 4. Database Query Optimization

#### 4.1 Query Performance Monitoring

```typescript
// Query performance monitoring
// File: src/core/database/queryMonitoring.ts
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any;
  result?: any;
}

class QueryPerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second

  // Wrap Prisma queries with monitoring
  async monitorQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    params?: any
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;

      this.recordMetrics({
        query: queryName,
        duration,
        timestamp: new Date(),
        params,
        result: this.sanitizeResult(result),
      });

      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.recordMetrics({
        query: queryName,
        duration,
        timestamp: new Date(),
        params,
        result: { error: error.message },
      });

      throw error;
    }
  }

  private recordMetrics(metrics: QueryMetrics): void {
    this.metrics.push(metrics);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private sanitizeResult(result: any): any {
    // Remove sensitive data from metrics
    if (Array.isArray(result)) {
      return { count: result.length, type: "array" };
    }

    if (typeof result === "object" && result !== null) {
      return { type: "object", keys: Object.keys(result) };
    }

    return { type: typeof result };
  }

  // Get performance analytics
  getAnalytics(): {
    averageQueryTime: number;
    slowQueries: QueryMetrics[];
    queryFrequency: Record<string, number>;
  } {
    const totalTime = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageQueryTime = totalTime / this.metrics.length;

    const slowQueries = this.metrics.filter(
      (m) => m.duration > this.slowQueryThreshold
    );

    const queryFrequency = this.metrics.reduce(
      (freq, m) => {
        freq[m.query] = (freq[m.query] || 0) + 1;
        return freq;
      },
      {} as Record<string, number>
    );

    return {
      averageQueryTime,
      slowQueries,
      queryFrequency,
    };
  }
}

export const queryMonitor = new QueryPerformanceMonitor();

// Enhanced repository with monitoring
export class MonitoredStoryRepository {
  async getStories(filters: StoryFilters): Promise<LearningStory[]> {
    return queryMonitor.monitorQuery(
      "getStories",
      () =>
        prisma.story.findMany({
          where: this.buildWhereClause(filters),
          include: {
            chunks: { orderBy: { chunkOrder: "asc" } },
            lesson: { select: { id: true, title: true } },
          },
          orderBy: [{ difficulty: "asc" }, { createdAt: "desc" }],
        }),
      filters
    );
  }

  async getStoryWithProgress(
    storyId: string,
    userId: string
  ): Promise<StoryWithProgress> {
    return queryMonitor.monitorQuery(
      "getStoryWithProgress",
      async () => {
        const [story, progress] = await Promise.all([
          prisma.story.findUnique({
            where: { id: storyId },
            include: {
              chunks: { orderBy: { chunkOrder: "asc" } },
              lesson: { select: { id: true, title: true } },
            },
          }),
          prisma.userProgress.findUnique({
            where: { userId_storyId: { userId, storyId } },
          }),
        ]);

        return { ...story, userProgress: progress };
      },
      { storyId, userId }
    );
  }
}
```

---

## Testing Implementation

### 1. Unit Testing Strategy

#### 1.1 Component Testing with React Testing Library

```typescript
// Story reader component tests
// File: src/__tests__/app/learning/components/StoryReader.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryReader } from '@/app/learning/components/StoryReader';
import { mockStory, mockUserPreferences } from '../../../__mocks__/learningData';

// Mock dependencies
jest.mock('@/app/learning/contexts/AccessibilityContext', () => ({
  useAccessibility: () => ({
    settings: { reducedMotion: false },
  }),
  useKeyboardNavigation: () => ({
    handleKeyDown: jest.fn(),
  }),
  useScreenReader: () => ({
    announceAction: jest.fn(),
  }),
}));

describe('StoryReader Component', () => {
  const defaultProps = {
    story: mockStory,
    onWordClick: jest.fn(),
    highlightedChunk: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders story title and content', () => {
    render(<StoryReader {...defaultProps} />);

    expect(screen.getByRole('heading', { name: mockStory.title })).toBeInTheDocument();
    expect(screen.getByText(mockStory.chunks[0].chunkText)).toBeInTheDocument();
  });

  it('highlights embedded English words as clickable buttons', () => {
    const storyWithEmbeddedWords = {
      ...mockStory,
      chunks: [
        {
          id: '1',
          chunkOrder: 0,
          chunkText: 'Hôm nay tôi đi đến office để meeting với team.',
          type: 'chem' as const,
        },
      ],
    };

    render(<StoryReader {...defaultProps} story={storyWithEmbeddedWords} />);

    const officeButton = screen.getByRole('button', { name: /office/i });
    const meetingButton = screen.getByRole('button', { name: /meeting/i });
    const teamButton = screen.getByRole('button', { name: /team/i });

    expect(officeButton).toBeInTheDocument();
    expect(meetingButton).toBeInTheDocument();
    expect(teamButton).toBeInTheDocument();
  });

  it('calls onWordClick when vocabulary word is clicked', async () => {
    const user = userEvent.setup();
    const onWordClick = jest.fn();

    const storyWithEmbeddedWords = {
      ...mockStory,
      chunks: [
        {
          id: '1',
          chunkOrder: 0,
          chunkText: 'I love programming.',
          type: 'chem' as const,
        },
      ],
    };

    render(<StoryReader {...defaultProps} story={storyWithEmbeddedWords} onWordClick={onWordClick} />);

    const programmingButton = screen.getByRole('button', { name: /programming/i });
    await user.click(programmingButton);

    expect(onWordClick).toHaveBeenCalledWith('programming', expect.objectContaining({
      x: expect.any(Number),
      y: expect.any(Number),
    }));
  });

  it('adjusts embedding ratio based on user preferences', () => {
    const userPreferences = {
      ...mockUserPreferences,
      embeddingRatio: 30, // 30%
    };

    render(<StoryReader {...defaultProps} userPreferences={userPreferences} />);

    expect(screen.getByText(/30% \(tùy chỉnh\)/)).toBeInTheDocument();
  });

  it('highlights current chunk during audio playback', () => {
    render(<StoryReader {...defaultProps} highlightedChunk={1} />);

    const chunks = screen.getAllByRole('region');
    expect(chunks[1]).toHaveClass('bg-yellow-50', 'border-l-4', 'border-yellow-400');
  });

  it('supports keyboard navigation for vocabulary words', async () => {
    const user = userEvent.setup();
    const onWordClick = jest.fn();

    const storyWithEmbeddedWords = {
      ...mockStory,
      chunks: [
        {
          id: '1',
          chunkOrder: 0,
          chunkText: 'Hello world',
          type: 'chem' as const,
        },
      ],
    };

    render(<StoryReader {...defaultProps} story={storyWithEmbeddedWords} onWordClick={onWordClick} />);

    const helloButton = screen.getByRole('button', { name: /hello/i });
    helloButton.focus();

    await user.keyboard('{Enter}');
    expect(onWordClick).toHaveBeenCalledWith('Hello', expect.any(Object));

    await user.keyboard('{Space}');
    expect(onWordClick).toHaveBeenCalledTimes(2);
  });

  it('displays story metadata correctly', () => {
    render(<StoryReader {...defaultProps} />);

    expect(screen.getByText(`Cấp độ: ${mockStory.difficulty}`)).toBeInTheDocument();
    expect(screen.getByText(`Thời gian: ${mockStory.estimatedMinutes} phút`)).toBeInTheDocument();
    expect(screen.getByText(`Số từ: ${mockStory.wordCount}`)).toBeInTheDocument();
  });

  it('handles accessibility features correctly', () => {
    render(<StoryReader {...defaultProps} />);

    const storyTitle = screen.getByRole('heading');
    expect(storyTitle).toHaveAttribute('id', 'story-title');
    expect(storyTitle).toHaveAttribute('tabIndex', '-1');

    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveAttribute('aria-labelledby', 'story-title');
  });
});
```

#### 1.2 Hook Testing

```typescript
// Audio player hook tests
// File: src/__tests__/app/learning/hooks/useAudioPlayer.test.ts
import { renderHook, act } from "@testing-library/react";
import { useAudioPlayer } from "@/app/learning/hooks/useAudioPlayer";
import { mockStoryChunks } from "../../../__mocks__/learningData";

// Mock HTML Audio API
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 180,
  volume: 1,
  muted: false,
  playbackRate: 1,
  src: "",
};

Object.defineProperty(window, "HTMLAudioElement", {
  writable: true,
  value: jest.fn().mockImplementation(() => mockAudio),
});

describe("useAudioPlayer Hook", () => {
  const defaultOptions = {
    chunks: mockStoryChunks,
    onChunkHighlight: jest.fn(),
    onPositionSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useAudioPlayer(defaultOptions));

    expect(result.current.state).toEqual({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      currentChunk: 0,
      isLoading: true,
      error: null,
      isMuted: false,
      volume: 1,
      playbackRate: 1,
    });
  });

  it("loads audio correctly", async () => {
    const { result } = renderHook(() => useAudioPlayer(defaultOptions));

    await act(async () => {
      result.current.actions.loadAudio("test-audio.mp3");
    });

    expect(mockAudio.src).toBe("test-audio.mp3");
    expect(mockAudio.load).toHaveBeenCalled();
  });

  it("plays and pauses audio", async () => {
    const { result } = renderHook(() => useAudioPlayer(defaultOptions));

    await act(async () => {
      await result.current.actions.play();
    });

    expect(mockAudio.play).toHaveBeenCalled();
    expect(result.current.state.isPlaying).toBe(true);

    act(() => {
      result.current.actions.pause();
    });

    expect(mockAudio.pause).toHaveBeenCalled();
    expect(result.current.state.isPlaying).toBe(false);
  });

  it("seeks to specific time", () => {
    const { result } = renderHook(() => useAudioPlayer(defaultOptions));

    act(() => {
      result.current.actions.seek(60);
    });

    expect(mockAudio.currentTime).toBe(60);
    expect(result.current.state.currentTime).toBe(60);
  });

  it("skips forward and backward", () => {
    const { result } = renderHook(() => useAudioPlayer(defaultOptions));

    // Set initial time
    act(() => {
      result.current.actions.seek(60);
    });

    act(() => {
      result.current.actions.skipForward(10);
    });

    expect(result.current.state.currentTime).toBe(70);

    act(() => {
      result.current.actions.skipBackward(20);
    });

    expect(result.current.state.currentTime).toBe(50);
  });

  it("controls volume and mute", () => {
    const { result } = renderHook(() => useAudioPlayer(defaultOptions));

    act(() => {
      result.current.actions.setVolume(0.5);
    });

    expect(mockAudio.volume).toBe(0.5);
    expect(result.current.state.volume).toBe(0.5);

    act(() => {
      result.current.actions.toggleMute();
    });

    expect(mockAudio.muted).toBe(true);
    expect(result.current.state.isMuted).toBe(true);
  });

  it("sets playback rate", () => {
    const { result } = renderHook(() => useAudioPlayer(defaultOptions));

    act(() => {
      result.current.actions.setPlaybackRate(1.5);
    });

    expect(mockAudio.playbackRate).toBe(1.5);
    expect(result.current.state.playbackRate).toBe(1.5);
  });

  it("calls onChunkHighlight when chunk changes", () => {
    const onChunkHighlight = jest.fn();
    const { result } = renderHook(() =>
      useAudioPlayer({ ...defaultOptions, onChunkHighlight })
    );

    // Simulate time update that would trigger chunk change
    act(() => {
      // Mock duration and current time to trigger chunk calculation
      Object.defineProperty(result.current.state, "duration", { value: 180 });
      Object.defineProperty(result.current.state, "currentTime", { value: 60 });
    });

    // This would be triggered by the useEffect in the actual hook
    expect(onChunkHighlight).toHaveBeenCalled();
  });

  it("saves position periodically", async () => {
    const onPositionSave = jest.fn();

    renderHook(() => useAudioPlayer({ ...defaultOptions, onPositionSave }));

    // Fast-forward time to trigger position save
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(onPositionSave).toHaveBeenCalled();
  });
});
```

### 2. Integration Testing

#### 2.1 API Route Testing

```typescript
// Stories API integration tests
// File: src/__tests__/app/api/learning/stories/route.test.ts
import { GET, POST } from "@/app/api/learning/stories/route";
import { NextRequest } from "next/server";
import { prisma } from "@/core/prisma";
import { createMockUser, createMockStory } from "../../../../__mocks__/apiData";

// Mock Prisma
jest.mock("@/core/prisma", () => ({
  prisma: {
    story: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    storyChunk: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock authentication
jest.mock("@/core/auth/getUserFromRequest", () => ({
  getUserFromRequest: jest.fn(),
}));

describe("/api/learning/stories", () => {
  const mockUser = createMockUser();
  const mockStory = createMockStory();

  beforeEach(() => {
    jest.clearAllMocks();
    (
      require("@/core/auth/getUserFromRequest").getUserFromRequest as jest.Mock
    ).mockResolvedValue(mockUser);
  });

  describe("GET /api/learning/stories", () => {
    it("returns stories with default filters", async () => {
      const mockStories = [mockStory];
      (prisma.story.findMany as jest.Mock).mockResolvedValue(mockStories);

      const request = new NextRequest(
        "http://localhost:3000/api/learning/stories"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockStories);
      expect(prisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockUser.tenantId,
            status: "published",
          }),
        })
      );
    });

    it("applies search filters correctly", async () => {
      const mockStories = [mockStory];
      (prisma.story.findMany as jest.Mock).mockResolvedValue(mockStories);

      const request = new NextRequest(
        "http://localhost:3000/api/learning/stories?search=test&difficulty=beginner"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(prisma.story.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            difficulty: "beginner",
            OR: [
              { title: { contains: "test", mode: "insensitive" } },
              { content: { contains: "test", mode: "insensitive" } },
            ],
          }),
        })
      );
    });

    it("returns 403 for unauthorized users", async () => {
      (
        require("@/core/auth/getUserFromRequest")
          .getUserFromRequest as jest.Mock
      ).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/learning/stories"
      );
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it("handles database errors gracefully", async () => {
      (prisma.story.findMany as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/learning/stories"
      );
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Lỗi server nội bộ");
    });
  });

  describe("POST /api/learning/stories", () => {
    const validStoryData = {
      title: "Test Story",
      content: "This is a test story content.",
      storyType: "original",
      difficulty: "beginner",
      estimatedMinutes: 10,
    };

    it("creates a new story successfully", async () => {
      const createdStory = { ...mockStory, ...validStoryData };
      (prisma.$transaction as jest.Mock).mockResolvedValue(createdStory);

      const request = new NextRequest(
        "http://localhost:3000/api/learning/stories",
        {
          method: "POST",
          body: JSON.stringify(validStoryData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe(validStoryData.title);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("validates input data", async () => {
      const invalidData = {
        title: "", // Invalid: empty title
        content: "Short", // Invalid: too short
        storyType: "invalid", // Invalid: not in enum
      };

      const request = new NextRequest(
        "http://localhost:3000/api/learning/stories",
        {
          method: "POST",
          body: JSON.stringify(invalidData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Dữ liệu không hợp lệ");
      expect(data.details).toBeDefined();
    });

    it("creates story with chunks", async () => {
      const storyWithChunks = {
        ...validStoryData,
        chunks: [
          { text: "First chunk", type: "normal" },
          { text: "Second chunk with English words", type: "chem" },
        ],
      };

      const createdStory = { ...mockStory, id: "new-story-id" };
      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback) => {
          return callback({
            story: {
              create: jest.fn().mockResolvedValue(createdStory),
            },
            storyChunk: {
              createMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
          });
        }
      );

      const request = new NextRequest(
        "http://localhost:3000/api/learning/stories",
        {
          method: "POST",
          body: JSON.stringify(storyWithChunks),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("returns 403 for users without create permission", async () => {
      const userWithoutPermission = {
        ...mockUser,
        roles: [{ name: "student", permissions: [] }],
      };

      (
        require("@/core/auth/getUserFromRequest")
          .getUserFromRequest as jest.Mock
      ).mockResolvedValue(userWithoutPermission);

      const request = new NextRequest(
        "http://localhost:3000/api/learning/stories",
        {
          method: "POST",
          body: JSON.stringify(validStoryData),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(403);
    });
  });
});
```

### 3. End-to-End Testing

#### 3.1 User Journey Tests

```typescript
// Complete learning journey E2E test
// File: src/__tests__/e2e/learningJourney.test.ts
import { test, expect } from "@playwright/test";

test.describe("Complete Learning Journey", () => {
  test.beforeEach(async ({ page }) => {
    // Login as student
    await page.goto("/login");
    await page.fill('[data-testid="email"]', "student@example.com");
    await page.fill('[data-testid="password"]', "student123");
    await page.click('[data-testid="login-button"]');

    // Wait for redirect to dashboard
    await page.waitForURL("/dashboard");
  });

  test("student can complete a full learning session", async ({ page }) => {
    // Navigate to learning page
    await page.click('[data-testid="start-learning"]');
    await page.waitForURL("/learning");

    // Select a story
    await page.click('[data-testid="story-card"]:first-child');
    await page.waitForSelector('[data-testid="story-reader"]');

    // Verify story content is loaded
    await expect(page.locator('[data-testid="story-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="story-content"]')).toBeVisible();

    // Click on an embedded English word
    const vocabularyWord = page.locator(".vocabulary-word").first();
    await vocabularyWord.click();

    // Verify vocabulary popup appears
    await expect(
      page.locator('[data-testid="vocabulary-popup"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="word-definition"]')).toBeVisible();

    // Mark word as learned
    await page.click('[data-testid="mark-as-learned"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Close vocabulary popup
    await page.click('[data-testid="close-popup"]');

    // Start audio playback
    await page.click('[data-testid="play-button"]');
    await expect(page.locator('[data-testid="audio-player"]')).toHaveClass(
      /playing/
    );

    // Verify chunk highlighting during audio
    await page.waitForTimeout(2000); // Wait for audio to progress
    await expect(page.locator('[data-chunk-index="0"]')).toHaveClass(
      /highlighted/
    );

    // Pause audio
    await page.click('[data-testid="pause-button"]');
    await expect(page.locator('[data-testid="audio-player"]')).not.toHaveClass(
      /playing/
    );

    // Complete reading (scroll to bottom)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Navigate to exercises
    await page.click('[data-testid="start-exercises"]');
    await page.waitForSelector('[data-testid="exercise-panel"]');

    // Complete first exercise (multiple choice)
    await page.click('[data-testid="exercise-option"]:first-child');
    await page.click('[data-testid="submit-answer"]');

    // Verify feedback
    await expect(
      page.locator('[data-testid="exercise-feedback"]')
    ).toBeVisible();

    // Continue to next exercise
    await page.click('[data-testid="next-exercise"]');

    // Complete fill-in-the-blank exercise
    await page.fill('[data-testid="fill-blank-input"]', "programming");
    await page.click('[data-testid="submit-answer"]');

    // Finish exercises
    await page.click('[data-testid="finish-exercises"]');

    // Verify completion message and progress update
    await expect(
      page.locator('[data-testid="completion-message"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="progress-update"]')).toBeVisible();

    // Check updated progress in dashboard
    await page.goto("/dashboard");
    await expect(
      page.locator('[data-testid="stories-completed"]')
    ).toContainText("1");
    await expect(page.locator('[data-testid="words-learned"]')).toContainText(
      "1"
    );
  });

  test("student can use accessibility features", async ({ page }) => {
    await page.goto("/learning");

    // Open accessibility settings
    await page.click('[data-testid="accessibility-button"]');
    await page.waitForSelector('[data-testid="accessibility-panel"]');

    // Enable high contrast mode
    await page.click('[data-testid="high-contrast-toggle"]');
    await expect(page.locator("body")).toHaveClass(/high-contrast/);

    // Increase font size
    await page.click('[data-testid="font-size-large"]');
    await expect(page.locator("html")).toHaveCSS("font-size", "18px");

    // Enable screen reader optimization
    await page.click('[data-testid="screen-reader-toggle"]');

    // Test keyboard navigation
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    // Verify keyboard interaction works
    await expect(page.locator('[data-testid="story-reader"]')).toBeVisible();

    // Test skip links
    await page.keyboard.press("Tab");
    const skipLink = page.locator('[data-testid="skip-to-content"]');
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");

    // Verify focus moved to main content
    await expect(page.locator('[data-testid="story-content"]')).toBeFocused();
  });

  test("student can learn offline", async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);

    await page.goto("/learning/offline");

    // Verify offline indicator
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toBeVisible();

    // Verify cached stories are available
    await expect(page.locator('[data-testid="cached-stories"]')).toBeVisible();

    // Select a cached story
    await page.click('[data-testid="cached-story"]:first-child');

    // Verify story loads from cache
    await expect(page.locator('[data-testid="story-reader"]')).toBeVisible();

    // Complete some learning activities offline
    await page.click(".vocabulary-word:first-child");
    await page.click('[data-testid="mark-as-learned"]');

    // Verify offline progress is tracked
    await expect(
      page.locator('[data-testid="offline-progress"]')
    ).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Verify sync indicator appears
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible();

    // Wait for sync to complete
    await page.waitForSelector('[data-testid="sync-complete"]');

    // Verify progress was synced
    await page.goto("/dashboard");
    await expect(page.locator('[data-testid="words-learned"]')).toContainText(
      "1"
    );
  });

  test("handles errors gracefully", async ({ page }) => {
    // Simulate network error
    await page.route("**/api/learning/stories", (route) => route.abort());

    await page.goto("/learning");

    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      "Không thể tải danh sách truyện"
    );

    // Verify retry button works
    await page.unroute("**/api/learning/stories");
    await page.click('[data-testid="retry-button"]');

    // Verify content loads after retry
    await expect(page.locator('[data-testid="story-list"]')).toBeVisible();
  });
});
```

---

**Document Status**: ✅ Complete - All Sections Implemented  
**Implementation Level**: Comprehensive component and code-level specifications  
**Ready for**: Development team implementation
