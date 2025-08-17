# EdTech Platform API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Learning API](#learning-api)
4. [User Progress API](#user-progress-api)
5. [Exercise API](#exercise-api)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [API Usage Guidelines](#api-usage-guidelines)
9. [Troubleshooting](#troubleshooting)

## Overview

The EdTech Platform API provides comprehensive access to learning content, user progress tracking, and educational analytics. The API follows RESTful principles with JWT-based authentication and RBAC/ABAC authorization.

### Base URL

```
Production: https://api.edtech-platform.com
Development: http://localhost:3000/api
```

### API Versioning

The API uses URL-based versioning. Current version is `v1`.

### Content Types

- Request: `application/json`
- Response: `application/json`

### Rate Limits

- Authenticated users: 1000 requests per hour
- Unauthenticated users: 100 requests per hour

## Authentication & Authorization

### JWT Token Authentication

The API uses JWT (JSON Web Tokens) for authentication. Tokens must be included in the `Authorization` header using the Bearer scheme.

#### Token Structure

```typescript
interface JWTPayload {
  userId: string; // User ID
  email: string; // User email
  role: string; // User role (student, coach, admin)
  tenantId?: string; // Tenant ID for multi-tenancy
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
}
```

#### Authentication Flow

**1. Login**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "student"
    }
  }
}
```

**2. Token Refresh**

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

#### Authorization Headers

Include the JWT token in all authenticated requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Permission System

The API uses CASL (Code Access Security Layer) for fine-grained permissions:

- **RBAC (Role-Based Access Control)**: Permissions based on user roles
- **ABAC (Attribute-Based Access Control)**: Context-aware permissions based on resource attributes

**Role Hierarchy:**

- `student`: Can read own progress, access published content
- `coach`: Can read student progress, manage assigned content
- `admin`: Full access to all resources

## Learning API

### Get Stories

Retrieve learning stories with filtering and pagination.

```http
GET /api/learning/stories
Authorization: Bearer {token}
```

**Query Parameters:**

- `level` (optional): Filter by difficulty level (`beginner`, `intermediate`, `advanced`)
- `type` (optional): Filter by story type (`original`, `chemdanhtu`, `chemdongtu`)
- `search` (optional): Search in title and content
- `minWords` (optional): Minimum word count
- `maxWords` (optional): Maximum word count
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Example Request:**

```http
GET /api/learning/stories?level=intermediate&type=chemdanhtu&limit=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "data": [
    {
      "id": "story-123",
      "title": "Cuộc phiêu lưu của Tom",
      "difficulty": "intermediate",
      "storyType": "chemdanhtu",
      "estimatedMinutes": 15,
      "wordCount": 450,
      "chemRatio": 0.3,
      "createdAt": "2024-01-15T10:30:00Z",
      "lesson": {
        "id": "lesson-456",
        "title": "Daily Activities"
      },
      "chunks": [
        {
          "id": "chunk-789",
          "chunkOrder": 1,
          "chunkText": "Tom thức dậy vào lúc 7 giờ morning.",
          "type": "chem"
        }
      ],
      "audios": [
        {
          "id": "audio-101",
          "voiceType": "female",
          "durationSec": 180
        }
      ],
      "tags": [
        {
          "id": "tag-1",
          "name": "daily-routine"
        }
      ],
      "userProgress": {
        "status": "in_progress",
        "lastViewedAt": "2024-01-20T14:30:00Z"
      },
      "learningSession": {
        "timeSpentSec": 300,
        "interactionCount": 15,
        "endedAt": "2024-01-20T14:35:00Z"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

### Get Story Details

Retrieve detailed information about a specific story.

```http
GET /api/learning/stories/{id}
Authorization: Bearer {token}
```

**Path Parameters:**

- `id` (required): Story ID

**Example Request:**

```http
GET /api/learning/stories/story-123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "data": {
    "id": "story-123",
    "title": "Cuộc phiêu lưu của Tom",
    "difficulty": "intermediate",
    "storyType": "chemdanhtu",
    "estimatedMinutes": 15,
    "wordCount": 450,
    "chemRatio": 0.3,
    "createdAt": "2024-01-15T10:30:00Z",
    "lesson": {
      "id": "lesson-456",
      "title": "Daily Activities",
      "description": "Learn vocabulary about daily activities"
    },
    "chunks": [
      {
        "id": "chunk-789",
        "chunkOrder": 1,
        "chunkText": "Tom thức dậy vào lúc 7 giờ morning và brush teeth.",
        "type": "chem"
      },
      {
        "id": "chunk-790",
        "chunkOrder": 2,
        "chunkText": "Sau đó anh ấy ăn breakfast với gia đình.",
        "type": "chem"
      }
    ],
    "audios": [
      {
        "id": "audio-101",
        "storageKey": "stories/story-123/audio-female.mp3",
        "voiceType": "female",
        "durationSec": 180
      }
    ],
    "tags": [
      {
        "id": "tag-1",
        "name": "daily-routine"
      }
    ],
    "userProgress": {
      "status": "in_progress",
      "lastViewedAt": "2024-01-20T14:30:00Z",
      "updatedAt": "2024-01-20T14:35:00Z"
    },
    "learningSession": {
      "timeSpentSec": 300,
      "interactionCount": 15,
      "endedAt": "2024-01-20T14:35:00Z"
    }
  }
}
```

## User Progress API

### Get User Progress

Retrieve comprehensive learning progress for the authenticated user.

```http
GET /api/learning/progress/user
Authorization: Bearer {token}
```

**Query Parameters:**

- `includeDetails` (optional): Include detailed progress data (`true`/`false`, default: `false`)
- `timeframe` (optional): Filter by timeframe (`all`, `week`, `month`, `year`, default: `all`)

**Example Request:**

```http
GET /api/learning/progress/user?includeDetails=true&timeframe=month
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "data": {
    "userId": "user-123",
    "timeframe": "month",
    "stats": {
      "totalLessons": 25,
      "completedLessons": 18,
      "inProgressLessons": 5,
      "totalVocabulary": 150,
      "masteredVocabulary": 120,
      "reviewingVocabulary": 25,
      "newVocabulary": 5,
      "totalTimeSpent": 7200,
      "totalInteractions": 450,
      "learningStreak": 7,
      "averageSessionTime": 480
    },
    "levelProgression": {
      "currentLevel": 3,
      "totalPoints": 280,
      "pointsToNextLevel": 20,
      "completedLessons": 18,
      "masteredVocabulary": 120
    },
    "recentAchievements": [
      {
        "type": "streak_achievement",
        "title": "7 Day Streak!",
        "description": "You've been learning consistently for 7 days in a row!",
        "earnedAt": "2024-01-20T00:00:00Z"
      }
    ],
    "lessonProgress": [
      {
        "id": "progress-456",
        "lessonId": "lesson-456",
        "status": "completed",
        "lastViewedAt": "2024-01-19T15:30:00Z",
        "updatedAt": "2024-01-19T16:00:00Z",
        "lesson": {
          "id": "lesson-456",
          "title": "Daily Activities",
          "difficulty": "intermediate",
          "estimatedMinutes": 30,
          "course": {
            "id": "course-789",
            "title": "English Basics"
          }
        }
      }
    ],
    "vocabularyProgress": [
      {
        "id": "vocab-progress-789",
        "vocabulary": {
          "id": "vocab-101",
          "word": "morning",
          "meaning": "buổi sáng",
          "lesson": {
            "id": "lesson-456",
            "title": "Daily Activities"
          }
        },
        "status": "mastered",
        "lastReviewed": "2024-01-19T14:20:00Z"
      }
    ],
    "recentSessions": [
      {
        "id": "session-123",
        "storyId": "story-123",
        "timeSpentSec": 480,
        "interactionCount": 12,
        "startedAt": "2024-01-20T14:00:00Z",
        "endedAt": "2024-01-20T14:08:00Z"
      }
    ]
  }
}
```

### Update Progress

Update user progress for a specific learning activity.

```http
POST /api/learning/progress/update
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "storyId": "story-123",
  "lessonId": "lesson-456",
  "timeSpentSec": 300,
  "interactionCount": 15,
  "completionPercentage": 75,
  "vocabularyInteractions": [
    {
      "vocabularyId": "vocab-101",
      "action": "clicked",
      "timestamp": "2024-01-20T14:30:00Z"
    }
  ]
}
```

**Response:**

```json
{
  "data": {
    "sessionId": "session-456",
    "progressUpdated": true,
    "newAchievements": [
      {
        "type": "lesson_milestone",
        "title": "10 Lessons Completed!",
        "description": "You've completed 10 lessons. Keep up the great work!"
      }
    ]
  }
}
```

## Exercise API

### Get Story Exercises

Retrieve exercises for a specific story.

```http
GET /api/learning/exercises/story/{id}
Authorization: Bearer {token}
```

**Path Parameters:**

- `id` (required): Story ID

**Example Request:**

```http
GET /api/learning/exercises/story/story-123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**

```json
{
  "data": {
    "storyId": "story-123",
    "storyTitle": "Cuộc phiêu lưu của Tom",
    "exercises": [
      {
        "id": "exercise-456",
        "type": "multiple_choice",
        "difficulty": "medium",
        "questions": [
          {
            "id": "question-789",
            "stem": "What does 'morning' mean in this context?",
            "type": "MCQ",
            "choices": [
              {
                "id": "choice-1",
                "text": "buổi sáng"
              },
              {
                "id": "choice-2",
                "text": "buổi chiều"
              },
              {
                "id": "choice-3",
                "text": "buổi tối"
              },
              {
                "id": "choice-4",
                "text": "ban đêm"
              }
            ]
          }
        ],
        "source": "database"
      },
      {
        "id": "dynamic-fill-blank-story-123",
        "type": "fill_blank",
        "difficulty": "medium",
        "questions": [
          {
            "id": "dynamic-fill-story-123-0",
            "stem": "Fill in the blank: Tom thức dậy vào lúc 7 giờ ______.",
            "type": "fill_blank"
          }
        ],
        "source": "dynamic"
      }
    ],
    "totalExercises": 2
  }
}
```

### Submit Exercise Answer

Submit an answer for an exercise question.

```http
POST /api/learning/exercises/submit
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "exerciseId": "exercise-456",
  "questionId": "question-789",
  "answer": "choice-1",
  "timeSpentSec": 15,
  "storyId": "story-123"
}
```

**Response:**

```json
{
  "data": {
    "correct": true,
    "explanation": "Correct! 'Morning' means 'buổi sáng' in Vietnamese.",
    "score": 10,
    "feedback": "Great job! You're mastering daily vocabulary.",
    "nextQuestion": {
      "id": "question-790",
      "stem": "What activity does Tom do after waking up?"
    }
  }
}
```

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "error": "Validation failed",
  "message": "The request data is invalid",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "issue": "Invalid email format"
  },
  "timestamp": "2024-01-20T14:30:00Z",
  "path": "/api/auth/login"
}
```

### Common Error Codes

#### Authentication Errors (401)

```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "code": "UNAUTHORIZED",
  "timestamp": "2024-01-20T14:30:00Z",
  "path": "/api/learning/stories"
}
```

#### Authorization Errors (403)

```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions to access this resource",
  "code": "INSUFFICIENT_PERMISSIONS",
  "details": {
    "required": "read:Story",
    "userRole": "student"
  },
  "timestamp": "2024-01-20T14:30:00Z",
  "path": "/api/admin/users"
}
```

#### Validation Errors (400)

```json
{
  "error": "Validation failed",
  "message": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "issues": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  },
  "timestamp": "2024-01-20T14:30:00Z",
  "path": "/api/auth/register"
}
```

#### Resource Not Found (404)

```json
{
  "error": "Story not found",
  "message": "The requested story does not exist",
  "code": "NOT_FOUND",
  "timestamp": "2024-01-20T14:30:00Z",
  "path": "/api/learning/stories/invalid-id"
}
```

#### Rate Limit Exceeded (429)

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 100,
    "window": "1 hour",
    "retryAfter": 3600
  },
  "timestamp": "2024-01-20T14:30:00Z",
  "path": "/api/learning/stories"
}
```

## Rate Limiting

### Rate Limit Headers

All API responses include rate limiting information in headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642694400
X-RateLimit-Window: 3600
```

### Rate Limits by Endpoint

| Endpoint Category   | Authenticated | Unauthenticated |
| ------------------- | ------------- | --------------- |
| Authentication      | 10/min        | 5/min           |
| Learning Content    | 1000/hour     | 100/hour        |
| Progress Updates    | 500/hour      | N/A             |
| Exercise Submission | 200/hour      | N/A             |

### Rate Limit Strategies

**1. Token Bucket Algorithm**

- Each user gets a bucket with a fixed number of tokens
- Tokens are consumed with each request
- Tokens refill at a constant rate

**2. Sliding Window**

- Tracks requests within a rolling time window
- More accurate than fixed windows
- Prevents burst traffic at window boundaries

## API Usage Guidelines

### Best Practices

#### 1. Authentication

- Always use HTTPS in production
- Store JWT tokens securely (httpOnly cookies recommended)
- Implement token refresh logic
- Handle token expiration gracefully

```javascript
// Example token refresh implementation
async function makeAuthenticatedRequest(url, options = {}) {
  let token = getStoredToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired, try to refresh
    token = await refreshToken();
    if (token) {
      // Retry with new token
      return fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
    } else {
      // Refresh failed, redirect to login
      redirectToLogin();
    }
  }

  return response;
}
```

#### 2. Error Handling

- Always check response status codes
- Parse error responses for detailed information
- Implement retry logic for transient errors
- Log errors for debugging

```javascript
// Example error handling
async function handleApiResponse(response) {
  if (!response.ok) {
    const errorData = await response.json();

    switch (response.status) {
      case 400:
        throw new ValidationError(errorData.message, errorData.details);
      case 401:
        throw new AuthenticationError(errorData.message);
      case 403:
        throw new AuthorizationError(errorData.message);
      case 404:
        throw new NotFoundError(errorData.message);
      case 429:
        throw new RateLimitError(
          errorData.message,
          errorData.details.retryAfter
        );
      case 500:
        throw new ServerError(errorData.message);
      default:
        throw new ApiError(errorData.message, response.status);
    }
  }

  return response.json();
}
```

#### 3. Pagination

- Use pagination for large datasets
- Implement cursor-based pagination for real-time data
- Cache paginated results when appropriate

```javascript
// Example pagination handling
async function fetchAllStories() {
  const allStories = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`/api/learning/stories?page=${page}&limit=50`);
    const data = await response.json();

    allStories.push(...data.data);

    hasMore = data.meta.pagination.page < data.meta.pagination.totalPages;
    page++;
  }

  return allStories;
}
```

#### 4. Caching

- Implement client-side caching for frequently accessed data
- Respect cache headers from the API
- Use ETags for conditional requests

```javascript
// Example caching with ETags
const cache = new Map();

async function fetchWithCache(url) {
  const cached = cache.get(url);
  const headers = {};

  if (cached && cached.etag) {
    headers["If-None-Match"] = cached.etag;
  }

  const response = await fetch(url, { headers });

  if (response.status === 304) {
    // Not modified, return cached data
    return cached.data;
  }

  const data = await response.json();
  const etag = response.headers.get("ETag");

  if (etag) {
    cache.set(url, { data, etag });
  }

  return data;
}
```

### Performance Optimization

#### 1. Request Batching

- Batch multiple requests when possible
- Use GraphQL-style field selection if available

#### 2. Compression

- Enable gzip compression for requests/responses
- Use appropriate content encoding

#### 3. Connection Reuse

- Use HTTP/2 when available
- Implement connection pooling

### Security Considerations

#### 1. Input Validation

- Validate all input data on the client side
- Never trust client-side validation alone
- Sanitize data before sending to API

#### 2. Sensitive Data

- Never log sensitive information
- Use HTTPS for all communications
- Implement proper CORS policies

#### 3. Rate Limiting

- Implement client-side rate limiting
- Handle rate limit responses gracefully
- Use exponential backoff for retries

## Troubleshooting

### Common Issues

#### 1. Authentication Problems

**Issue**: "Unauthorized" error despite having a token

```json
{
  "error": "Unauthorized",
  "code": "INVALID_TOKEN"
}
```

**Solutions:**

- Check if token is expired
- Verify token format (should start with "Bearer ")
- Ensure token is included in Authorization header
- Try refreshing the token

#### 2. Permission Denied

**Issue**: "Forbidden" error when accessing resources

```json
{
  "error": "Forbidden",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

**Solutions:**

- Check user role and permissions
- Verify resource ownership (for user-specific resources)
- Contact administrator if permissions seem incorrect

#### 3. Rate Limiting

**Issue**: "Rate limit exceeded" error

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

**Solutions:**

- Implement exponential backoff
- Reduce request frequency
- Use caching to minimize API calls
- Consider upgrading to higher rate limits

#### 4. Validation Errors

**Issue**: Request validation failures

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "issues": [...]
  }
}
```

**Solutions:**

- Check request body format
- Verify required fields are included
- Validate data types and formats
- Review API documentation for field requirements

### Debug Tools

#### 1. API Response Logging

```javascript
// Enable detailed logging
const originalFetch = window.fetch;
window.fetch = function (...args) {
  console.log("API Request:", args);
  return originalFetch.apply(this, args).then((response) => {
    console.log("API Response:", response.status, response.statusText);
    return response;
  });
};
```

#### 2. Network Monitoring

- Use browser developer tools Network tab
- Monitor request/response headers
- Check for CORS issues
- Verify SSL certificate validity

#### 3. Token Inspection

```javascript
// Decode JWT token (client-side only, for debugging)
function decodeJWT(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
}

// Check token expiration
const payload = decodeJWT(token);
const isExpired = payload.exp * 1000 < Date.now();
console.log("Token expired:", isExpired);
```

### Support

For additional support:

- Check the [Developer Onboarding Guide](./DEVELOPER_ONBOARDING.md)
- Review [API Patterns](./API_PATTERNS.md) for implementation details
- See [API Rate Limiting Guide](./API_RATE_LIMITING.md) for rate limit handling
- Consult [API Troubleshooting Guide](./API_TROUBLESHOOTING.md) for common issues
- Contact the development team for API-specific issues
- Submit bug reports with detailed request/response information

## Related Documentation

- **[API Patterns](./API_PATTERNS.md)**: Detailed API design patterns and conventions
- **[API Rate Limiting](./API_RATE_LIMITING.md)**: Comprehensive rate limiting guide
- **[API Troubleshooting](./API_TROUBLESHOOTING.md)**: Common issues and solutions
- **[Developer Onboarding](./DEVELOPER_ONBOARDING.md)**: Getting started guide
- **[State Management](./STATE_MANAGEMENT_GUIDE.md)**: Client-side state management

---

_Last updated: January 2024_
_API Version: v1_
