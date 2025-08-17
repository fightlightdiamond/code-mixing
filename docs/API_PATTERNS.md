# API Design Patterns & Conventions

This document details the API design patterns, conventions, and best practices used throughout the EdTech platform.

## Table of Contents

1. [RESTful API Design](#restful-api-design)
2. [Authentication & Authorization](#authentication--authorization)
3. [Error Handling](#error-handling)
4. [Request/Response Patterns](#requestresponse-patterns)
5. [Validation & Serialization](#validation--serialization)
6. [Caching Strategies](#caching-strategies)
7. [Rate Limiting](#rate-limiting)
8. [API Versioning](#api-versioning)

## RESTful API Design

### Resource Naming Conventions

```typescript
// ✅ Good: Plural nouns for collections
GET / api / stories;
POST / api / stories;
GET / api / stories / 123;
PUT / api / stories / 123;
DELETE / api / stories / 123;

// ✅ Good: Nested resources
GET / api / stories / 123 / chunks;
POST / api / stories / 123 / chunks;
GET / api / lessons / 456 / stories;

// ✅ Good: Action endpoints for non-CRUD operations
POST / api / stories / 123 / publish;
POST / api / auth / refresh;
POST / api / learning / progress / update;

// ❌ Avoid: Verbs in URLs
POST / api / createStory;
GET / api / getStories;
```

### HTTP Methods & Status Codes

```typescript
// Standard CRUD operations
export async function GET(request: Request) {
  // Return 200 for successful retrieval
  // Return 404 if resource not found
  // Return 403 if access denied
}

export async function POST(request: Request) {
  // Return 201 for successful creation
  // Return 400 for validation errors
  // Return 409 for conflicts (duplicate resources)
}

export async function PUT(request: Request) {
  // Return 200 for successful update
  // Return 404 if resource not found
  // Return 400 for validation errors
}

export async function DELETE(request: Request) {
  // Return 204 for successful deletion
  // Return 404 if resource not found
  // Return 409 if resource has dependencies
}
```

### Query Parameters

```typescript
// Filtering, sorting, and pagination
interface QueryParams {
  // Filtering
  status?: 'draft' | 'published' | 'archived';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  storyType?: 'original' | 'chemdanhtu' | 'chemdongtu';

  // Searching
  search?: string;

  // Sorting
  sortBy?: 'createdAt' | 'title' | 'difficulty';
  sortOrder?: 'asc' | 'desc';

  // Pagination
  page?: number;
  limit?: number;
  cursor?: string; // For cursor-based pagination

  // Inclusion
  include?: string[]; // Related resources to include
}

// Example usage
GET /api/stories?status=published&difficulty=intermediate&sortBy=createdAt&sortOrder=desc&page=1&limit=20&include=chunks,audios
```

## Authentication & Authorization

### JWT Token Management

```typescript
// Token structure
interface JWTPayload {
  sub: string; // User ID
  email: string;
  roles: string[];
  tenantId?: string;
  permissions: string[];
  iat: number; // Issued at
  exp: number; // Expires at
}

// Token refresh flow
export async function POST(request: Request) {
  const { refreshToken } = await request.json();

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
    const user = await getUserById(payload.sub);

    if (!user || !user.isActive) {
      return Response.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const newTokens = generateTokenPair(user);

    return Response.json({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresIn: 3600,
    });
  } catch (error) {
    return Response.json({ error: "Invalid refresh token" }, { status: 401 });
  }
}
```

### CASL Authorization Middleware

```typescript
// Authorization middleware
export function withAuthorization(
  resource: string,
  action: string,
  getSubject?: (request: Request) => Promise<any>
) {
  return function (handler: Function) {
    return async function (request: Request) {
      const user = request.user; // Set by authentication middleware

      if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const ability = await defineAbilityFor(user);
      const subject = getSubject ? await getSubject(request) : resource;

      if (!ability.can(action, subject)) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }

      return handler(request);
    };
  };
}

// Usage in API routes
export const GET = withAuth(
  withAuthorization(
    "Story",
    "read"
  )(async function (request: Request) {
    // Handler implementation
  })
);
```

### Multi-Tenant Data Isolation

```typescript
// Tenant-aware data access
export class TenantAwareRepository<T> {
  constructor(private model: any) {}

  async findMany(tenantId: string, filters: any = {}): Promise<T[]> {
    return this.model.findMany({
      where: {
        tenantId,
        ...filters,
      },
    });
  }

  async create(tenantId: string, data: any): Promise<T> {
    return this.model.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async update(tenantId: string, id: string, data: any): Promise<T> {
    return this.model.update({
      where: {
        id,
        tenantId, // Ensures user can only update their tenant's data
      },
      data,
    });
  }
}
```

## Error Handling

### Standardized Error Responses

```typescript
// Error response interface
interface ApiErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
  path: string;
}

// Error handling utility
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "ApiError";
  }

  toResponse(path: string): Response {
    const errorResponse: ApiErrorResponse = {
      error: this.message,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: new Date().toISOString(),
      path,
    };

    return Response.json(errorResponse, { status: this.status });
  }
}

// Global error handler
export function handleApiError(error: unknown, request: Request): Response {
  const url = new URL(request.url);

  if (error instanceof ApiError) {
    return error.toResponse(url.pathname);
  }

  if (error instanceof z.ZodError) {
    return new ApiError("Validation failed", 400, "VALIDATION_ERROR", {
      issues: error.issues,
    }).toResponse(url.pathname);
  }

  // Log unexpected errors
  console.error("Unexpected API error:", error);

  return new ApiError(
    "Internal server error",
    500,
    "INTERNAL_ERROR"
  ).toResponse(url.pathname);
}
```

### Error Categories

```typescript
// Common error types
export const ApiErrors = {
  // Authentication errors
  UNAUTHORIZED: new ApiError("Unauthorized", 401, "UNAUTHORIZED"),
  INVALID_TOKEN: new ApiError("Invalid token", 401, "INVALID_TOKEN"),
  TOKEN_EXPIRED: new ApiError("Token expired", 401, "TOKEN_EXPIRED"),

  // Authorization errors
  FORBIDDEN: new ApiError("Forbidden", 403, "FORBIDDEN"),
  INSUFFICIENT_PERMISSIONS: new ApiError(
    "Insufficient permissions",
    403,
    "INSUFFICIENT_PERMISSIONS"
  ),

  // Validation errors
  VALIDATION_FAILED: (details: any) =>
    new ApiError("Validation failed", 400, "VALIDATION_FAILED", details),
  MISSING_REQUIRED_FIELD: (field: string) =>
    new ApiError(
      `Missing required field: ${field}`,
      400,
      "MISSING_REQUIRED_FIELD"
    ),

  // Resource errors
  NOT_FOUND: (resource: string) =>
    new ApiError(`${resource} not found`, 404, "NOT_FOUND"),
  ALREADY_EXISTS: (resource: string) =>
    new ApiError(`${resource} already exists`, 409, "ALREADY_EXISTS"),

  // Business logic errors
  STORY_NOT_PUBLISHED: new ApiError(
    "Story is not published",
    400,
    "STORY_NOT_PUBLISHED"
  ),
  LESSON_NOT_AVAILABLE: new ApiError(
    "Lesson is not available",
    400,
    "LESSON_NOT_AVAILABLE"
  ),
  PROGRESS_ALREADY_COMPLETED: new ApiError(
    "Progress already completed",
    409,
    "PROGRESS_ALREADY_COMPLETED"
  ),
};
```

## Request/Response Patterns

### Standard Response Format

```typescript
// Success response wrapper
interface ApiResponse<T = any> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters?: Record<string, any>;
    sort?: {
      field: string;
      order: "asc" | "desc";
    };
  };
  links?: {
    self: string;
    first?: string;
    last?: string;
    prev?: string;
    next?: string;
  };
}

// Response builder utility
export class ResponseBuilder<T> {
  private data: T;
  private meta: any = {};
  private links: any = {};

  constructor(data: T) {
    this.data = data;
  }

  withPagination(pagination: PaginationMeta): this {
    this.meta.pagination = pagination;
    return this;
  }

  withLinks(links: Record<string, string>): this {
    this.links = { ...this.links, ...links };
    return this;
  }

  build(): Response {
    const response: ApiResponse<T> = {
      data: this.data,
      ...(Object.keys(this.meta).length > 0 && { meta: this.meta }),
      ...(Object.keys(this.links).length > 0 && { links: this.links }),
    };

    return Response.json(response);
  }
}

// Usage example
export async function GET(request: Request) {
  const stories = await getStories(filters);
  const total = await getStoriesCount(filters);

  return new ResponseBuilder(stories)
    .withPagination({
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    })
    .withLinks({
      self: request.url,
      next: buildNextPageUrl(request.url, filters.page),
    })
    .build();
}
```

### Request Validation

```typescript
// Request validation middleware
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return function (handler: (request: Request, data: T) => Promise<Response>) {
    return async function (request: Request): Promise<Response> {
      try {
        const body = await request.json();
        const validatedData = schema.parse(body);
        return handler(request, validatedData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return ApiErrors.VALIDATION_FAILED(error.issues).toResponse(
            request.url
          );
        }
        throw error;
      }
    };
  };
}

// Schema definitions
export const CreateStorySchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
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
  chemRatio: z.number().min(0).max(1).optional(),
  lessonId: z.string().uuid().optional(),
});

// Usage
export const POST = withAuth(
  withValidation(CreateStorySchema)(async function (
    request: Request,
    data: z.infer<typeof CreateStorySchema>
  ) {
    const story = await createStory(data, request.user.id);
    return new ResponseBuilder(story).build();
  })
);
```

## Validation & Serialization

### Input Validation

```typescript
// Complex validation schemas
export const UpdateUserPreferencesSchema = z.object({
  language: z.enum(["en", "vi"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  notifications: z
    .object({
      email: z.boolean(),
      push: z.boolean(),
      inApp: z.boolean(),
    })
    .optional(),
  learning: z
    .object({
      autoAdvance: z.boolean(),
      playbackSpeed: z.number().min(0.5).max(2.0),
      embeddingRatio: z.number().min(0.1).max(0.5),
      preferredDifficulty: z.enum(["beginner", "intermediate", "advanced"]),
    })
    .optional(),
});

// Custom validation functions
export const validateStoryContent = z
  .string()
  .refine((content) => content.split(" ").length >= 50, {
    message: "Story content must be at least 50 words",
  });

export const validateEmbeddingRatio = z.number().refine(
  (ratio, ctx) => {
    const storyType = ctx.parent?.storyType;
    if (storyType === "original" && ratio > 0) {
      return false;
    }
    return true;
  },
  { message: "Original stories cannot have embedding ratio > 0" }
);
```

### Output Serialization

```typescript
// Data transformation utilities
export class StorySerializer {
  static toPublic(story: Story): PublicStory {
    return {
      id: story.id,
      title: story.title,
      difficulty: story.difficulty,
      storyType: story.storyType,
      estimatedMinutes: story.estimatedMinutes,
      wordCount: story.wordCount,
      chemRatio: story.chemRatio,
      createdAt: story.createdAt,
      // Exclude sensitive fields like createdBy, tenantId
    };
  }

  static toDetailed(story: Story, includeContent = false): DetailedStory {
    return {
      ...this.toPublic(story),
      ...(includeContent && { content: story.content }),
      chunks: story.chunks?.map((chunk) => ({
        id: chunk.id,
        chunkOrder: chunk.chunkOrder,
        chunkText: chunk.chunkText,
        type: chunk.type,
      })),
      audios: story.audios?.map((audio) => ({
        id: audio.id,
        storageKey: audio.storageKey,
        voiceType: audio.voiceType,
        durationSec: audio.durationSec,
      })),
    };
  }
}

// Usage in API routes
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeContent = searchParams.get("includeContent") === "true";

  const story = await getStoryById(params.id);
  const serializedStory = StorySerializer.toDetailed(story, includeContent);

  return Response.json({ data: serializedStory });
}
```

## Caching Strategies

### HTTP Caching Headers

```typescript
// Cache control utilities
export function setCacheHeaders(
  response: Response,
  options: {
    maxAge?: number;
    staleWhileRevalidate?: number;
    mustRevalidate?: boolean;
    private?: boolean;
  }
) {
  const cacheControl = [];

  if (options.private) {
    cacheControl.push("private");
  } else {
    cacheControl.push("public");
  }

  if (options.maxAge) {
    cacheControl.push(`max-age=${options.maxAge}`);
  }

  if (options.staleWhileRevalidate) {
    cacheControl.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }

  if (options.mustRevalidate) {
    cacheControl.push("must-revalidate");
  }

  response.headers.set("Cache-Control", cacheControl.join(", "));
  return response;
}

// Usage examples
export async function GET(request: Request) {
  const stories = await getPublishedStories();
  const response = Response.json({ data: stories });

  // Cache for 5 minutes, allow stale for 1 hour
  return setCacheHeaders(response, {
    maxAge: 300,
    staleWhileRevalidate: 3600,
  });
}
```

### Redis Caching

```typescript
// Redis cache wrapper
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Cache with automatic invalidation
  async cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const fresh = await fetcher();
    await this.set(key, fresh, ttl);
    return fresh;
  }
}

// Usage in API routes
const cache = new CacheService();

export async function GET(request: Request) {
  const cacheKey = `stories:published:${request.url}`;

  const stories = await cache.cached(
    cacheKey,
    () => getPublishedStories(),
    300 // 5 minutes
  );

  return Response.json({ data: stories });
}
```

## Rate Limiting

### Token Bucket Implementation

```typescript
// Rate limiting middleware
export class RateLimiter {
  private buckets = new Map<string, TokenBucket>();

  constructor(
    private maxTokens: number = 100,
    private refillRate: number = 10, // tokens per second
    private windowMs: number = 60000 // 1 minute
  ) {}

  async isAllowed(identifier: string): Promise<boolean> {
    const bucket = this.getBucket(identifier);
    return bucket.consume();
  }

  private getBucket(identifier: string): TokenBucket {
    if (!this.buckets.has(identifier)) {
      this.buckets.set(
        identifier,
        new TokenBucket(this.maxTokens, this.refillRate)
      );
    }
    return this.buckets.get(identifier)!;
  }
}

class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  consume(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens--;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// Rate limiting middleware
export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 60000
) {
  const limiter = new RateLimiter(
    maxRequests,
    maxRequests / (windowMs / 1000),
    windowMs
  );

  return function (handler: Function) {
    return async function (request: Request): Promise<Response> {
      const identifier = getClientIdentifier(request);

      if (!(await limiter.isAllowed(identifier))) {
        return Response.json(
          { error: "Rate limit exceeded" },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil(windowMs / 1000).toString(),
            },
          }
        );
      }

      return handler(request);
    };
  };
}

function getClientIdentifier(request: Request): string {
  // Use user ID if authenticated, otherwise IP address
  const user = request.user;
  if (user) return `user:${user.id}`;

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return `ip:${ip}`;
}
```

## API Versioning

### URL-Based Versioning

```typescript
// Version-aware routing
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { version: string; id: string } }
) {
  const { version, id } = params;

  switch (version) {
    case "v1":
      return handleV1Request(request, id);
    case "v2":
      return handleV2Request(request, id);
    default:
      return Response.json(
        { error: "Unsupported API version" },
        { status: 400 }
      );
  }
}

// Version-specific handlers
async function handleV1Request(request: Request, id: string) {
  const story = await getStoryById(id);
  // V1 response format
  return Response.json({
    id: story.id,
    title: story.title,
    content: story.content,
  });
}

async function handleV2Request(request: Request, id: string) {
  const story = await getStoryById(id);
  // V2 response format with additional fields
  return Response.json({
    data: {
      id: story.id,
      title: story.title,
      content: story.content,
      difficulty: story.difficulty,
      storyType: story.storyType,
      chunks: story.chunks,
    },
    meta: {
      version: "v2",
      timestamp: new Date().toISOString(),
    },
  });
}
```

### Header-Based Versioning

```typescript
// Accept header versioning
export async function GET(request: Request) {
  const acceptHeader = request.headers.get("Accept") || "";
  const version = extractVersionFromAccept(acceptHeader);

  switch (version) {
    case "v1":
      return handleV1Response(request);
    case "v2":
    default:
      return handleV2Response(request);
  }
}

function extractVersionFromAccept(acceptHeader: string): string {
  const match = acceptHeader.match(/application\/vnd\.api\+json;version=(\d+)/);
  return match ? `v${match[1]}` : "v2";
}
```

This comprehensive API patterns documentation provides the foundation for consistent, maintainable, and scalable API development across the EdTech platform.
