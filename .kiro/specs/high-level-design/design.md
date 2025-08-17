# High-Level System Design Document

> **📖 Documentation Guide**: For an overview of all design documents and how to use them, see [README.md](./README.md).

## 📋 Quick Navigation

| Section                                            | Description                        | Related Docs                                                      |
| -------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| [Overview](#overview)                              | System introduction and philosophy | [Requirements](./requirements.md)                                 |
| [Architecture](#architecture)                      | System architecture and components | [Visual Diagrams](./visual-architecture-diagrams.md)              |
| [Components](#components-and-interfaces)           | Detailed component design          | [API Docs](../../docs/API_DOCUMENTATION.md)                       |
| [Data Models](#data-models)                        | Database schema and relationships  | [Database Guide](../../docs/DATABASE_SCHEMA_GUIDE.md)             |
| [Security](#security-architecture)                 | Authentication and authorization   | [Auth Setup](../../AUTHENTICATION_IMPROVEMENTS.md)                |
| [Learning](#learning-methodology-implementation)   | Story embedding methodology        | [Learning Module](../../src/app/learning/README.md)               |
| [Testing](#testing-strategy-and-quality-assurance) | Quality assurance strategy         | [Performance Guide](../../docs/PERFORMANCE_OPTIMIZATION_GUIDE.md) |

---

## Overview

Đây là một nền tảng học tiếng Anh EdTech tiên tiến được xây dựng với Next.js 15, sử dụng phương pháp "Jewish-style story embedding" (truyện chêm) độc đáo để tích hợp từ vựng tiếng Anh vào câu chuyện tiếng Việt. Hệ thống hỗ trợ multi-tenancy, RBAC/ABAC authorization phức tạp, và nhiều tính năng học tập thông minh.

### Core Philosophy

- **Story-Driven Learning**: Học từ vựng thông qua ngữ cảnh câu chuyện thay vì học thuộc lòng
- **Progressive Embedding**: Tăng dần tỷ lệ từ tiếng Anh theo trình độ người học
- **Multi-Modal Experience**: Kết hợp text, audio, và interactive exercises
- **Data-Driven Personalization**: Sử dụng analytics để cá nhân hóa trải nghiệm học tập

## Architecture

> **📊 Visual Diagrams**: For comprehensive visual representations of all system components, database relationships, and user flows, see [Visual Architecture Diagrams](./visual-architecture-diagrams.md).

### System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App - Next.js 15]
        PWA[PWA - Offline Support]
        MOBILE[Mobile App - Future]
    end

    subgraph "API Gateway Layer"
        MIDDLEWARE[Next.js Middleware]
        AUTH[Authentication]
        RATE[Rate Limiting]
        CORS[CORS Handler]
    end

    subgraph "Application Layer"
        API[REST API Routes]
        SSR[Server-Side Rendering]
        ISR[Incremental Static Regeneration]
    end

    subgraph "Business Logic Layer"
        CORE[Core Services]
        FEATURES[Feature Modules]
        AUTH_SVC[Authorization Service]
        LEARNING[Learning Engine]
    end

    subgraph "Data Layer"
        PRISMA[Prisma ORM]
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis Cache)]
        S3[(AWS S3 - Audio)]
    end

    subgraph "External Services"
        AI[AI Services - Story Remix]
        ANALYTICS[Analytics Service]
        EMAIL[Email Service]
        CDN[CDN - Static Assets]
    end

    WEB --> MIDDLEWARE
    PWA --> MIDDLEWARE
    MOBILE --> MIDDLEWARE

    MIDDLEWARE --> API
    MIDDLEWARE --> SSR
    MIDDLEWARE --> ISR

    API --> CORE
    SSR --> CORE
    ISR --> CORE

    CORE --> PRISMA
    FEATURES --> PRISMA
    AUTH_SVC --> PRISMA
    LEARNING --> PRISMA

    PRISMA --> POSTGRES
    CORE --> REDIS
    LEARNING --> S3

    LEARNING --> AI
    CORE --> ANALYTICS
    AUTH_SVC --> EMAIL
    WEB --> CDN
```

### Detailed Component Architecture

#### Frontend Component Hierarchy

```mermaid
graph TD
    subgraph "App Router Structure"
        ROOT[app/layout.tsx]
        PROVIDERS[Providers Layer]
        PAGES[Page Components]
    end

    subgraph "Learning Module"
        LEARNING_PAGE[learning/page.tsx]
        STORY_READER[StoryReader Component]
        AUDIO_PLAYER[AudioPlayer Component]
        PROGRESS_TRACKER[ProgressTracker Component]
        VOCAB_POPUP[VocabularyPopup Component]
        EXERCISE_PANEL[ExercisePanel Component]
    end

    subgraph "State Management"
        TANSTACK[TanStack Query]
        ZUSTAND[Zustand Stores]
        AUTH_CONTEXT[Auth Context]
        LEARNING_STORE[Learning Store]
    end

    subgraph "Core Services"
        API_CLIENT[API Client]
        CACHE_SERVICE[Cache Service]
        AUDIO_SERVICE[Audio Service]
        OFFLINE_SERVICE[Offline Service]
    end

    ROOT --> PROVIDERS
    PROVIDERS --> PAGES
    PAGES --> LEARNING_PAGE

    LEARNING_PAGE --> STORY_READER
    LEARNING_PAGE --> AUDIO_PLAYER
    LEARNING_PAGE --> PROGRESS_TRACKER

    STORY_READER --> VOCAB_POPUP
    STORY_READER --> EXERCISE_PANEL

    TANSTACK --> API_CLIENT
    ZUSTAND --> LEARNING_STORE
    AUTH_CONTEXT --> API_CLIENT

    API_CLIENT --> CACHE_SERVICE
    AUDIO_PLAYER --> AUDIO_SERVICE
    LEARNING_PAGE --> OFFLINE_SERVICE
```

#### Backend Service Architecture

```mermaid
graph TD
    subgraph "API Routes Layer"
        AUTH_ROUTES[/api/auth/*]
        LEARNING_ROUTES[/api/learning/*]
        ADMIN_ROUTES[/api/admin/*]
        USER_ROUTES[/api/me/*]
    end

    subgraph "Middleware Stack"
        CORS_MW[CORS Middleware]
        AUTH_MW[Auth Middleware]
        RATE_MW[Rate Limit Middleware]
        CASL_MW[CASL Authorization]
        AUDIT_MW[Audit Middleware]
    end

    subgraph "Business Services"
        USER_SERVICE[User Service]
        STORY_SERVICE[Story Service]
        PROGRESS_SERVICE[Progress Service]
        VOCAB_SERVICE[Vocabulary Service]
        EXERCISE_SERVICE[Exercise Service]
    end

    subgraph "Data Access Layer"
        USER_REPO[User Repository]
        STORY_REPO[Story Repository]
        PROGRESS_REPO[Progress Repository]
        CACHE_LAYER[Redis Cache Layer]
    end

    AUTH_ROUTES --> CORS_MW
    LEARNING_ROUTES --> CORS_MW
    ADMIN_ROUTES --> CORS_MW
    USER_ROUTES --> CORS_MW

    CORS_MW --> AUTH_MW
    AUTH_MW --> RATE_MW
    RATE_MW --> CASL_MW
    CASL_MW --> AUDIT_MW

    AUDIT_MW --> USER_SERVICE
    AUDIT_MW --> STORY_SERVICE
    AUDIT_MW --> PROGRESS_SERVICE
    AUDIT_MW --> VOCAB_SERVICE
    AUDIT_MW --> EXERCISE_SERVICE

    USER_SERVICE --> USER_REPO
    STORY_SERVICE --> STORY_REPO
    PROGRESS_SERVICE --> PROGRESS_REPO

    USER_REPO --> CACHE_LAYER
    STORY_REPO --> CACHE_LAYER
    PROGRESS_REPO --> CACHE_LAYER
```

### Component Interaction Patterns

#### Learning Session Component Interactions

```mermaid
graph LR
    subgraph "User Interface Layer"
        SR[StoryReader]
        AP[AudioPlayer]
        VP[VocabularyPopup]
        PT[ProgressTracker]
        EP[ExercisePanel]
    end

    subgraph "State Management"
        LS[Learning Store]
        QC[Query Cache]
    end

    subgraph "Services"
        AS[Audio Service]
        PS[Progress Service]
        VS[Vocabulary Service]
    end

    SR -->|"Click word"| VP
    SR -->|"Update progress"| PT
    SR -->|"Generate exercise"| EP

    AP -->|"Play audio"| AS
    AP -->|"Track time"| PS

    VP -->|"Mark learned"| VS
    VP -->|"Update mastery"| PS

    PT -->|"Save progress"| PS
    EP -->|"Submit answer"| PS

    LS -->|"State updates"| SR
    LS -->|"State updates"| AP
    LS -->|"State updates"| PT

    QC -->|"Cache data"| PS
    QC -->|"Cache data"| VS
    QC -->|"Cache data"| AS
```

#### Authentication & Authorization Flow

```mermaid
graph TD
    subgraph "Client Components"
        LOGIN[Login Form]
        PROTECTED[Protected Component]
        AUTH_GUARD[Auth Guard]
    end

    subgraph "Context & State"
        AUTH_CTX[Auth Context]
        TOKEN_MGR[Token Manager]
    end

    subgraph "API Layer"
        AUTH_API[Auth API]
        PROTECTED_API[Protected API]
        JWT_MW[JWT Middleware]
        CASL_MW[CASL Middleware]
    end

    subgraph "Services"
        AUTH_SVC[Auth Service]
        USER_SVC[User Service]
        PERM_SVC[Permission Service]
    end

    LOGIN -->|"Submit credentials"| AUTH_CTX
    AUTH_CTX -->|"Login request"| AUTH_API
    AUTH_API -->|"Validate user"| AUTH_SVC
    AUTH_SVC -->|"Generate JWT"| TOKEN_MGR
    TOKEN_MGR -->|"Store token"| AUTH_CTX

    PROTECTED -->|"Check auth"| AUTH_GUARD
    AUTH_GUARD -->|"Validate token"| AUTH_CTX
    AUTH_CTX -->|"API request"| PROTECTED_API

    PROTECTED_API -->|"Verify JWT"| JWT_MW
    JWT_MW -->|"Check permissions"| CASL_MW
    CASL_MW -->|"Load permissions"| PERM_SVC
    PERM_SVC -->|"Authorize action"| USER_SVC
```

#### Real-time Learning Analytics Flow

```mermaid
graph TD
    subgraph "User Interactions"
        A[Word Click] --> B[Audio Play]
        B --> C[Exercise Completion]
        C --> D[Progress Update]
    end

    subgraph "Event Collection"
        A --> E[Vocabulary Event]
        B --> F[Audio Event]
        C --> G[Exercise Event]
        D --> H[Progress Event]
    end

    subgraph "Event Processing"
        E --> I[Event Aggregator]
        F --> I
        G --> I
        H --> I
        I --> J[Analytics Pipeline]
    end

    subgraph "Data Analysis"
        J --> K[Learning Patterns]
        J --> L[Difficulty Assessment]
        J --> M[Engagement Metrics]
        J --> N[Performance Trends]
    end

    subgraph "Adaptive Responses"
        K --> O[Content Recommendations]
        L --> P[Difficulty Adjustment]
        M --> Q[Engagement Strategies]
        N --> R[Learning Path Optimization]
    end

    subgraph "Feedback Loop"
        O --> S[Updated UI]
        P --> S
        Q --> S
        R --> S
        S --> A
    end
```

#### Offline-First Architecture Pattern

```mermaid
graph TD
    subgraph "Client-Side Storage"
        A[IndexedDB] --> B[Story Content]
        A --> C[User Progress]
        A --> D[Audio Files]
        A --> E[Exercise Data]
    end

    subgraph "Sync Management"
        F[Sync Queue] --> G[Pending Updates]
        G --> H[Conflict Resolution]
        H --> I[Merge Strategy]
    end

    subgraph "Network Detection"
        J[Online Status] --> K{Connected?}
        K -->|Yes| L[Sync Process]
        K -->|No| M[Offline Mode]
    end

    subgraph "Data Synchronization"
        L --> N[Upload Changes]
        N --> O[Download Updates]
        O --> P[Update Local Cache]
        P --> Q[Notify UI]
    end

    subgraph "Conflict Resolution"
        H --> R{Conflict Type}
        R -->|Progress| S[Latest Wins]
        R -->|Content| T[Server Wins]
        R -->|Settings| U[User Choice]
    end

    B --> F
    C --> F
    E --> F

    F --> L
    M --> A

    S --> P
    T --> P
    U --> P
```

#### State Management Data Flow

```mermaid
graph LR
    subgraph "Component Layer"
        A[StoryReader] --> B[User Action]
        C[AudioPlayer] --> B
        D[ProgressTracker] --> B
    end

    subgraph "State Management"
        B --> E[Zustand Action]
        E --> F[State Update]
        F --> G[Component Re-render]
    end

    subgraph "Server State"
        B --> H[TanStack Query]
        H --> I[API Request]
        I --> J[Server Response]
        J --> K[Cache Update]
        K --> L[Component Update]
    end

    subgraph "Persistence"
        F --> M[Local Storage]
        K --> N[IndexedDB]
        J --> O[Database]
    end

    subgraph "Side Effects"
        G --> P[UI Updates]
        L --> P
        P --> Q[User Feedback]
        Q --> A
        Q --> C
        Q --> D
    end
```

#### Error Handling & Recovery Patterns

```mermaid
graph TD
    subgraph "Error Sources"
        A[Network Error] --> B[Error Boundary]
        C[API Error] --> B
        D[Validation Error] --> B
        E[Runtime Error] --> B
    end

    subgraph "Error Classification"
        B --> F{Error Type}
        F -->|Recoverable| G[Retry Logic]
        F -->|User Error| H[User Feedback]
        F -->|System Error| I[Fallback UI]
        F -->|Critical Error| J[Error Report]
    end

    subgraph "Recovery Strategies"
        G --> K[Exponential Backoff]
        K --> L[Retry Attempt]
        L --> M{Success?}
        M -->|Yes| N[Normal Flow]
        M -->|No| O[Fallback Strategy]
    end

    subgraph "User Experience"
        H --> P[Toast Notification]
        I --> Q[Skeleton UI]
        O --> R[Offline Mode]
        J --> S[Error Page]
    end

    subgraph "Monitoring"
        J --> T[Error Tracking]
        T --> U[Analytics Dashboard]
        U --> V[Alert System]
        V --> W[Developer Notification]
    end
```

### System Integration Patterns

#### API Design Patterns

```mermaid
graph TD
    subgraph "RESTful API Design"
        A[Resource-Based URLs] --> B[HTTP Verbs]
        B --> C[Status Codes]
        C --> D[Content Negotiation]
    end

    subgraph "API Versioning"
        E[URL Versioning] --> F[/api/v1/stories]
        G[Header Versioning] --> H[Accept: application/vnd.api+json;version=1]
        I[Query Versioning] --> J[/api/stories?version=1]
    end

    subgraph "Response Patterns"
        K[Success Response] --> L[Data + Meta]
        M[Error Response] --> N[Error + Context]
        O[Pagination] --> P[Links + Meta]
    end

    subgraph "Security Patterns"
        Q[JWT Authentication] --> R[Bearer Token]
        S[CORS Handling] --> T[Preflight Requests]
        U[Rate Limiting] --> V[Token Bucket]
    end
```

#### Data Synchronization Patterns

```mermaid
graph LR
    subgraph "Client-Server Sync"
        A[Optimistic Updates] --> B[Conflict Resolution]
        B --> C[Last-Write-Wins]
        B --> D[Operational Transform]
        B --> E[CRDT]
    end

    subgraph "Offline Sync"
        F[Local Storage] --> G[Sync Queue]
        G --> H[Background Sync]
        H --> I[Conflict Detection]
        I --> J[Merge Strategy]
    end

    subgraph "Real-time Updates"
        K[WebSocket] --> L[Server-Sent Events]
        L --> M[Push Notifications]
        M --> N[Live Updates]
    end
```

#### Integration Architecture

```mermaid
graph TD
    subgraph "Internal Integrations"
        A[Learning Module] --> B[Progress Module]
        B --> C[Analytics Module]
        C --> D[Recommendation Module]
    end

    subgraph "External Integrations"
        E[AI Services] --> F[Story Generation]
        G[Email Service] --> H[Notifications]
        I[Payment Gateway] --> J[Subscriptions]
        K[CDN] --> L[Asset Delivery]
    end

    subgraph "Integration Patterns"
        M[Adapter Pattern] --> N[Service Wrapper]
        O[Circuit Breaker] --> P[Fault Tolerance]
        Q[Retry Pattern] --> R[Exponential Backoff]
        S[Bulkhead Pattern] --> T[Resource Isolation]
    end

    A --> M
    E --> O
    G --> Q
    I --> S
```

### Architecture Decision Records (ADRs)

#### Key Architectural Decisions

1. **Next.js 15 with App Router**
   - **Decision**: Use Next.js 15 with App Router for full-stack development
   - **Rationale**: Unified development experience, excellent TypeScript support, built-in optimizations
   - **Consequences**: Single deployment unit, easier development, potential scaling limitations

2. **TanStack Query + Zustand State Management**
   - **Decision**: Separate server state (TanStack Query) from client state (Zustand)
   - **Rationale**: Optimized caching, reduced boilerplate, better developer experience
   - **Consequences**: Learning curve, additional dependencies, excellent performance

3. **PostgreSQL with Prisma ORM**
   - **Decision**: PostgreSQL as primary database with Prisma for type-safe database access
   - **Rationale**: ACID compliance, JSON support, excellent TypeScript integration
   - **Consequences**: Strong consistency, complex queries support, vendor lock-in

4. **Multi-Tenant Architecture**
   - **Decision**: Single database with tenant isolation via tenant_id
   - **Rationale**: Cost-effective, easier maintenance, shared resources
   - **Consequences**: Careful query design required, potential data leakage risks

5. **CASL for Authorization**
   - **Decision**: Use CASL for complex RBAC + ABAC authorization
   - **Rationale**: Flexible permission system, type-safe, frontend/backend consistency
   - **Consequences**: Learning curve, complex permission logic, powerful authorization

6. **Offline-First PWA**
   - **Decision**: Implement offline-first architecture with service workers
   - **Rationale**: Better user experience, mobile-friendly, reduced server load
   - **Consequences**: Complex synchronization logic, storage limitations, development complexity

## Testing Strategy and Quality Assurance

### Overview

The EdTech platform implements a comprehensive testing strategy that ensures code quality, functionality, and user experience across all layers of the application. The testing approach follows industry best practices with multiple testing levels, automated quality gates, and performance benchmarking.

### Testing Architecture

#### Testing Pyramid Structure

```mermaid
graph TD
    subgraph "Testing Pyramid"
        A[Unit Tests - 70%] --> B[Integration Tests - 20%]
        B --> C[E2E Tests - 10%]
    end

    subgraph "Unit Testing Layer"
        D[Component Tests] --> E[Hook Tests]
        E --> F[Utility Tests]
        F --> G[Service Tests]
        G --> H[API Route Tests]
    end

    subgraph "Integration Testing Layer"
        I[Feature Flow Tests] --> J[API Integration Tests]
        J --> K[Database Integration Tests]
        K --> L[External Service Tests]
    end

    subgraph "E2E Testing Layer"
        M[User Journey Tests] --> N[Cross-Browser Tests]
        N --> O[Performance Tests]
        O --> P[Accessibility Tests]
    end

    A --> D
    B --> I
    C --> M
```

#### Testing Technology Stack

```mermaid
graph LR
    subgraph "Testing Framework"
        A[Jest] --> B[React Testing Library]
        B --> C[Testing Library User Event]
        C --> D[Jest DOM]
    end

    subgraph "E2E Testing"
        E[Playwright] --> F[Cross-Browser Testing]
        F --> G[Visual Regression]
        G --> H[Performance Monitoring]
    end

    subgraph "Performance Testing"
        I[Lighthouse CI] --> J[Web Vitals]
        J --> K[Bundle Analyzer]
        K --> L[Load Testing]
    end

    subgraph "Quality Tools"
        M[ESLint] --> N[Prettier]
        N --> O[TypeScript]
        O --> P[Husky Git Hooks]
    end
```

### Unit Testing Standards

#### Component Testing Patterns

**1. Component Rendering Tests**

```typescript
// Example: StoryReader Component Test
describe("StoryReader Component", () => {
  it("renders story title and metadata correctly", () => {
    render(<StoryReader story={mockStory} onWordClick={mockOnWordClick} />);

    expect(screen.getByText("Test Story")).toBeInTheDocument();
    expect(screen.getByText("BEGINNER")).toBeInTheDocument();
    expect(screen.getByText("5 phút")).toBeInTheDocument();
  });

  it("highlights embedded English words in chem chunks", () => {
    render(<StoryReader story={mockStory} onWordClick={mockOnWordClick} />);

    const studentButton = screen.getByRole("button", { name: /student/i });
    expect(studentButton).toHaveClass("bg-blue-100", "text-blue-800");
  });
});
```

**2. Hook Testing Patterns**

```typescript
// Example: Custom Hook Test
describe("useAudioPlayer Hook", () => {
  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useAudioPlayer());

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentTime).toBe(0);
    expect(result.current.duration).toBe(0);
  });

  it("handles play/pause functionality", async () => {
    const { result } = renderHook(() => useAudioPlayer());

    act(() => {
      result.current.play();
    });

    expect(result.current.isPlaying).toBe(true);
  });
});
```

**3. API Route Testing**

```typescript
// Example: API Route Test
describe("/api/learning/stories/[id]", () => {
  it("returns story data for valid ID", async () => {
    const req = createMockRequest({ method: "GET" });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "story-1",
        title: expect.any(String),
      })
    );
  });

  it("returns 404 for non-existent story", async () => {
    const req = createMockRequest({
      method: "GET",
      query: { id: "non-existent" },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
```

#### Testing Standards and Conventions

**1. Test File Organization**

```
src/
├── __tests__/
│   ├── components/
│   │   ├── ui/
│   │   │   └── Button.test.tsx
│   │   └── learning/
│   │       └── StoryReader.test.tsx
│   ├── hooks/
│   │   └── useAudioPlayer.test.ts
│   ├── utils/
│   │   └── textProcessing.test.ts
│   ├── api/
│   │   └── stories.test.ts
│   └── integration/
│       └── LearningFlow.test.tsx
```

**2. Test Naming Conventions**

- Test files: `ComponentName.test.tsx` or `functionName.test.ts`
- Test descriptions: Use descriptive, behavior-focused names
- Test groups: Organize related tests using `describe` blocks

**3. Mock Strategies**

```typescript
// Mock external dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock API calls
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock audio elements
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  currentTime: 0,
  duration: 120,
};

Object.defineProperty(window, "HTMLAudioElement", {
  value: jest.fn().mockImplementation(() => mockAudio),
});
```

### Integration Testing Strategy

#### Feature Flow Testing

**1. Learning Session Integration**

```typescript
describe("Learning Flow Integration", () => {
  it("completes a full story reading session", async () => {
    const user = userEvent.setup();

    // Mock API responses for complete flow
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ stories: mockStories }) })
      .mockResolvedValueOnce({ ok: true, json: async () => mockStoryData })
      .mockResolvedValueOnce({ ok: true, json: async () => mockExercises });

    render(<TestWrapper><LearningPage /></TestWrapper>);

    // Story selection
    await waitFor(() => {
      expect(screen.getByText("Test Story")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Test Story"));

    // Story reading
    await waitFor(() => {
      expect(screen.getByText("Xin chào, tôi là một student")).toBeInTheDocument();
    });

    // Vocabulary interaction
    await user.click(screen.getByRole("button", { name: /student/i }));

    // Exercise completion
    await waitFor(() => {
      expect(screen.getByText("Exercise 1 of 1")).toBeInTheDocument();
    });
  });
});
```

**2. API Integration Testing**

```typescript
describe("API Integration Tests", () => {
  it("handles authentication flow correctly", async () => {
    const loginData = { email: "test@example.com", password: "password" };

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });

    expect(response.ok).toBe(true);

    const data = await response.json();
    expect(data).toHaveProperty("token");
    expect(data).toHaveProperty("user");
  });

  it("enforces authorization on protected routes", async () => {
    const response = await fetch("/api/admin/users", {
      method: "GET",
      // No authorization header
    });

    expect(response.status).toBe(401);
  });
});
```

#### Database Integration Testing

```typescript
describe("Database Integration", () => {
  beforeEach(async () => {
    await prisma.$transaction([
      prisma.user.deleteMany(),
      prisma.story.deleteMany(),
      prisma.progress.deleteMany(),
    ]);
  });

  it("creates user progress correctly", async () => {
    const user = await prisma.user.create({
      data: { email: "test@example.com", name: "Test User" },
    });

    const progress = await prisma.progress.create({
      data: {
        userId: user.id,
        storyId: "story-1",
        completionPercentage: 75,
        timeSpent: 300,
      },
    });

    expect(progress.completionPercentage).toBe(75);
    expect(progress.timeSpent).toBe(300);
  });

  it("enforces tenant isolation", async () => {
    const tenant1User = await prisma.user.create({
      data: {
        email: "user1@tenant1.com",
        name: "User 1",
        tenantId: "tenant-1",
      },
    });

    const tenant2User = await prisma.user.create({
      data: {
        email: "user2@tenant2.com",
        name: "User 2",
        tenantId: "tenant-2",
      },
    });

    // User from tenant-1 should not see tenant-2 data
    const tenant1Stories = await prisma.story.findMany({
      where: { tenantId: "tenant-1" },
    });

    const tenant2Stories = await prisma.story.findMany({
      where: { tenantId: "tenant-2" },
    });

    expect(tenant1Stories).not.toEqual(tenant2Stories);
  });
});
```

### End-to-End Testing Strategy

#### User Journey Testing

**1. Complete Learning Session Journey**

```typescript
describe("E2E User Journeys", () => {
  it("completes full learning session from story selection to completion", async () => {
    const page = await browser.newPage();

    // Navigate to learning page
    await page.goto("/learning");

    // Story selection
    await page.waitForSelector('[data-testid="story-card"]');
    await page.click('[data-testid="story-card"]:first-child');

    // Story reading
    await page.waitForSelector('[data-testid="story-content"]');

    // Interact with embedded words
    await page.click('[data-testid="embedded-word"]:first-child');
    await page.waitForSelector('[data-testid="vocabulary-popup"]');

    // Audio interaction
    await page.click('[data-testid="play-button"]');
    await page.waitForTimeout(2000); // Let audio play

    // Exercise completion
    await page.click('[data-testid="start-exercises"]');
    await page.fill('[data-testid="exercise-input"]', "student");
    await page.click('[data-testid="submit-answer"]');

    // Verify completion
    await page.waitForSelector('[data-testid="completion-screen"]');
    expect(
      await page.textContent('[data-testid="completion-message"]')
    ).toContain("Exercises Completed!");
  });
});
```

**2. Cross-Browser Compatibility Testing**

```typescript
describe("Cross-Browser Compatibility", () => {
  const browsers = ["chromium", "firefox", "webkit"];

  browsers.forEach((browserName) => {
    it(`works correctly in ${browserName}`, async () => {
      const browser = await playwright[browserName].launch();
      const page = await browser.newPage();

      await page.goto("/learning");

      // Test core functionality
      await page.waitForSelector('[data-testid="story-list"]');
      expect(await page.isVisible('[data-testid="story-card"]')).toBe(true);

      // Test audio functionality
      await page.click('[data-testid="story-card"]:first-child');
      await page.click('[data-testid="play-button"]');

      // Verify audio is playing (browser-specific checks)
      const audioElement = await page.$("audio");
      const isPaused = await audioElement?.evaluate((el) => el.paused);
      expect(isPaused).toBe(false);

      await browser.close();
    });
  });
});
```

#### Accessibility Testing

```typescript
describe("Accessibility Tests", () => {
  it("meets WCAG 2.1 AA standards", async () => {
    const page = await browser.newPage();
    await page.goto("/learning");

    // Run axe accessibility tests
    const results = await page.evaluate(() => {
      return new Promise((resolve) => {
        axe.run(document, (err, results) => {
          resolve(results);
        });
      });
    });

    expect(results.violations).toHaveLength(0);
  });

  it("supports keyboard navigation", async () => {
    const page = await browser.newPage();
    await page.goto("/learning");

    // Test tab navigation
    await page.keyboard.press("Tab");
    let focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(focusedElement).toBe("BUTTON");

    // Test Enter key activation
    await page.keyboard.press("Enter");
    await page.waitForSelector('[data-testid="story-content"]');
  });

  it("provides proper ARIA labels and roles", async () => {
    const page = await browser.newPage();
    await page.goto("/learning");

    // Check for proper ARIA attributes
    const playButton = await page.$('[data-testid="play-button"]');
    const ariaLabel = await playButton?.getAttribute("aria-label");
    expect(ariaLabel).toContain("Play audio");

    const storyContent = await page.$('[data-testid="story-content"]');
    const role = await storyContent?.getAttribute("role");
    expect(role).toBe("main");
  });
});
```

### Performance Testing Strategy

#### Performance Benchmarking

**1. Core Web Vitals Testing**

```typescript
describe("Performance Tests", () => {
  it("meets Core Web Vitals thresholds", async () => {
    const page = await browser.newPage();

    // Enable performance monitoring
    await page.coverage.startJSCoverage();
    await page.coverage.startCSSCoverage();

    const startTime = Date.now();
    await page.goto("/learning");

    // Measure First Contentful Paint (FCP)
    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(
            (entry) => entry.name === "first-contentful-paint"
          );
          if (fcpEntry) resolve(fcpEntry.startTime);
        }).observe({ entryTypes: ["paint"] });
      });
    });

    expect(fcp).toBeLessThan(1800); // FCP < 1.8s

    // Measure Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ["largest-contentful-paint"] });
      });
    });

    expect(lcp).toBeLessThan(2500); // LCP < 2.5s

    // Measure Cumulative Layout Shift (CLS)
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        }).observe({ entryTypes: ["layout-shift"] });
      });
    });

    expect(cls).toBeLessThan(0.1); // CLS < 0.1
  });

  it("loads stories efficiently", async () => {
    const page = await browser.newPage();

    // Monitor network requests
    const responses = [];
    page.on("response", (response) => {
      responses.push({
        url: response.url(),
        status: response.status(),
        size: response.headers()["content-length"],
      });
    });

    await page.goto("/learning");
    await page.waitForSelector('[data-testid="story-list"]');

    // Check API response times
    const apiResponses = responses.filter((r) => r.url.includes("/api/"));
    apiResponses.forEach((response) => {
      expect(response.status).toBe(200);
    });

    // Verify lazy loading
    const storyCards = await page.$$('[data-testid="story-card"]');
    expect(storyCards.length).toBeGreaterThan(0);
    expect(storyCards.length).toBeLessThanOrEqual(10); // Pagination limit
  });
});
```

**2. Bundle Size Analysis**

```typescript
describe("Bundle Analysis", () => {
  it("maintains acceptable bundle sizes", () => {
    const bundleStats = require("../../../.next/analyze/bundle-stats.json");

    // Main bundle should be under 250KB
    expect(bundleStats.main.size).toBeLessThan(250 * 1024);

    // Individual page bundles should be under 100KB
    Object.entries(bundleStats.pages).forEach(([page, stats]) => {
      expect(stats.size).toBeLessThan(100 * 1024);
    });

    // Check for code splitting effectiveness
    expect(bundleStats.chunks.length).toBeGreaterThan(5);
  });

  it("implements proper code splitting", () => {
    const buildManifest = require("../../../.next/build-manifest.json");

    // Verify dynamic imports are split
    expect(buildManifest.pages["/learning"]).toContain("learning");
    expect(buildManifest.pages["/admin"]).toContain("admin");

    // Verify shared chunks
    expect(buildManifest.pages["/_app"]).toContain("framework");
  });
});
```

#### Load Testing Strategy

```typescript
describe("Load Testing", () => {
  it("handles concurrent users effectively", async () => {
    const concurrentUsers = 50;
    const promises = [];

    for (let i = 0; i < concurrentUsers; i++) {
      promises.push(
        (async () => {
          const page = await browser.newPage();
          const startTime = Date.now();

          await page.goto("/learning");
          await page.waitForSelector('[data-testid="story-list"]');

          const loadTime = Date.now() - startTime;
          await page.close();

          return loadTime;
        })()
      );
    }

    const loadTimes = await Promise.all(promises);
    const averageLoadTime =
      loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;

    expect(averageLoadTime).toBeLessThan(3000); // Average load time < 3s
    expect(Math.max(...loadTimes)).toBeLessThan(5000); // Max load time < 5s
  });

  it("handles API rate limiting gracefully", async () => {
    const requests = [];

    // Make rapid API requests
    for (let i = 0; i < 100; i++) {
      requests.push(
        fetch("/api/learning/stories", {
          headers: { Authorization: "Bearer test-token" },
        })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter((r) => r.status === 429);

    // Should have some rate limiting
    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    // But not all requests should be blocked
    const successfulResponses = responses.filter((r) => r.status === 200);
    expect(successfulResponses.length).toBeGreaterThan(50);
  });
});
```

### Quality Gates and Approval Workflows

#### Automated Quality Checks

**1. Pre-commit Hooks**

```json
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run unit tests for changed files
npm run test:changed

# Check code formatting
npm run format:check

# Run security audit
npm audit --audit-level moderate
```

**2. CI/CD Pipeline Quality Gates**

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install Playwright
        run: npx playwright install
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Build application
        run: npm run build
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
```

#### Code Review Requirements

**1. Pull Request Template**

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Quality Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Accessibility considerations addressed

## Performance Impact

- [ ] Bundle size impact assessed
- [ ] Performance tests passing
- [ ] No performance regressions

## Security Considerations

- [ ] No sensitive data exposed
- [ ] Input validation implemented
- [ ] Authorization checks in place
```

**2. Automated Code Quality Checks**

```typescript
// Quality metrics configuration
const qualityGates = {
  coverage: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
  complexity: {
    max: 10, // Maximum cyclomatic complexity
  },
  maintainability: {
    min: 70, // Minimum maintainability index
  },
  duplication: {
    max: 3, // Maximum percentage of duplicated code
  },
};

// ESLint configuration for quality enforcement
module.exports = {
  extends: [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "plugin:testing-library/react",
    "plugin:jest-dom/recommended",
  ],
  rules: {
    complexity: ["error", { max: 10 }],
    "max-lines": ["error", { max: 300 }],
    "max-lines-per-function": ["error", { max: 50 }],
    "no-console": "error",
    "no-debugger": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "testing-library/prefer-screen-queries": "error",
    "jest-dom/prefer-checked": "error",
  },
};
```

#### Approval Workflow Process

```mermaid
flowchart TD
    A[Developer Creates PR] --> B[Automated Checks]
    B --> C{All Checks Pass?}
    C -->|No| D[Fix Issues]
    D --> B
    C -->|Yes| E[Code Review Required]
    E --> F[Reviewer Assignment]
    F --> G[Code Review]
    G --> H{Review Approved?}
    H -->|No| I[Address Feedback]
    I --> G
    H -->|Yes| J[QA Testing]
    J --> K{QA Approved?}
    K -->|No| L[Fix QA Issues]
    L --> J
    K -->|Yes| M[Merge to Main]
    M --> N[Deploy to Staging]
    N --> O[Smoke Tests]
    O --> P{Smoke Tests Pass?}
    P -->|No| Q[Rollback]
    P -->|Yes| R[Deploy to Production]
```

### Testing Standards and Coverage Expectations

#### Coverage Requirements

**1. Minimum Coverage Thresholds**

```json
// jest.config.js coverage thresholds
{
  "coverageThreshold": {
    "global": {
      "branches": 75,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "./src/components/": {
      "branches": 80,
      "functions": 85,
      "lines": 85,
      "statements": 85
    },
    "./src/app/api/": {
      "branches": 70,
      "functions": 75,
      "lines": 75,
      "statements": 75
    }
  }
}
```

**2. Critical Path Coverage**

- Authentication flows: 95% coverage
- Payment processing: 95% coverage
- Learning progress tracking: 90% coverage
- Content delivery: 85% coverage
- User management: 85% coverage

#### Testing Documentation Standards

**1. Test Case Documentation**

```typescript
/**
 * Test Suite: StoryReader Component
 *
 * Purpose: Validates the story reading functionality including:
 * - Story content rendering
 * - Embedded word highlighting
 * - User interaction handling
 * - Audio synchronization
 *
 * Coverage Areas:
 * - Component rendering
 * - User interactions
 * - Edge cases
 * - Accessibility
 *
 * Dependencies:
 * - React Testing Library
 * - Jest DOM matchers
 * - User Event simulation
 */
describe("StoryReader Component", () => {
  // Test implementation
});
```

**2. Test Maintenance Guidelines**

- Update tests when requirements change
- Remove obsolete tests promptly
- Maintain test data consistency
- Document complex test scenarios
- Regular test suite performance reviews

### Continuous Improvement Process

#### Testing Metrics and Monitoring

```mermaid
graph TD
    subgraph "Test Metrics Dashboard"
        A[Test Execution Time] --> B[Coverage Trends]
        B --> C[Flaky Test Detection]
        C --> D[Failure Rate Analysis]
    end

    subgraph "Quality Metrics"
        E[Code Quality Score] --> F[Technical Debt]
        F --> G[Bug Escape Rate]
        G --> H[Performance Regression]
    end

    subgraph "Process Metrics"
        I[Review Time] --> J[Deployment Frequency]
        J --> K[Lead Time]
        K --> L[Mean Time to Recovery]
    end

    A --> M[Weekly Quality Review]
    E --> M
    I --> M
    M --> N[Process Improvements]
```

#### Regular Quality Reviews

**1. Weekly Test Health Checks**

- Review test execution times
- Identify and fix flaky tests
- Update test data and mocks
- Assess coverage gaps

**2. Monthly Quality Assessments**

- Analyze bug escape rates
- Review performance trends
- Evaluate testing tool effectiveness
- Plan testing infrastructure improvements

**3. Quarterly Strategy Reviews**

- Assess testing strategy effectiveness
- Update testing standards
- Evaluate new testing tools
- Plan team training initiatives

This comprehensive testing strategy ensures high code quality, reliable functionality, and excellent user experience across the EdTech platform while maintaining development velocity and team productivity.

## Learning Methodology Implementation

> **📊 User Flow Diagrams**: See [User Flow Diagrams](./visual-architecture-diagrams.md#user-flow-diagrams) for detailed learning journey flows and story creation workflows.

### Overview of Jewish-Style Story Embedding (Truyện Chêm)

The platform implements a unique language learning methodology called "Jewish-style story embedding" or "truyện chêm" in Vietnamese. This approach integrates English vocabulary naturally into Vietnamese stories, allowing learners to acquire new words in context rather than through rote memorization.

#### Core Methodology Principles

1. **Contextual Learning**: English words are embedded within familiar Vietnamese narratives, providing natural context for vocabulary acquisition
2. **Progressive Difficulty**: The ratio of embedded English words increases gradually as learners advance
3. **Semantic Integration**: Embedded words maintain grammatical and semantic coherence within the Vietnamese text
4. **Cultural Bridge**: Stories serve as cultural bridges, making English learning more accessible to Vietnamese speakers

### Story Types and Embedding Strategies

The system supports multiple story types, each with specific embedding strategies:

```mermaid
graph TD
    subgraph "Story Types"
        A[Original Stories] --> B[Base Vietnamese Content]
        C[Chem Danh Từ] --> D[Noun Embedding]
        E[Chem Động Từ] --> F[Verb Embedding]
        G[Chem Tính Từ] --> H[Adjective Embedding]
        I[Custom Embedding] --> J[Mixed Strategy]
    end

    subgraph "Embedding Process"
        B --> K[Content Analysis]
        K --> L[Word Selection]
        L --> M[Context Validation]
        M --> N[Embedding Integration]
        N --> O[Quality Review]
    end

    subgraph "Output Types"
        O --> P[Story Chunks]
        P --> Q[Normal Text]
        P --> R[Embedded Text]
        P --> S[Explanation Text]
    end
```

#### Story Type Definitions

**1. Original (original)**

- Pure Vietnamese stories without embedded English words
- Used as baseline content and for complete beginners
- Serves as foundation for creating embedded versions

**2. Noun Embedding (chemdanhtu)**

- Focus on embedding English nouns into Vietnamese context
- Maintains Vietnamese sentence structure while introducing English objects, concepts, and entities
- Example: "Cô ấy đang đọc một cuốn **book** rất thú vị" (She is reading a very interesting **book**)

**3. Verb Embedding (chemdongtu)**

- Emphasizes English action words within Vietnamese narratives
- Preserves Vietnamese grammar while introducing English verbs
- Example: "Tôi **study** tiếng Anh mỗi ngày" (I **study** English every day)

**4. Adjective Embedding (chemtinhtu)**

- Integrates English descriptive words into Vietnamese text
- Maintains natural flow while introducing English modifiers
- Example: "Ngôi nhà này rất **beautiful** và **spacious**" (This house is very **beautiful** and **spacious**)

**5. Custom Embedding (custom)**

- Flexible approach combining multiple word types
- Allows for sophisticated embedding patterns based on learning objectives
- Adapts to specific curriculum requirements and learner preferences

### Embedding Ratios and Learning Progression

The system implements a sophisticated progression model that adjusts embedding ratios based on learner proficiency and preferences:

```mermaid
graph LR
    subgraph "Beginner Level"
        A[5-10% English] --> B[Simple Nouns]
        B --> C[High-frequency Words]
        C --> D[Concrete Concepts]
    end

    subgraph "Elementary Level"
        E[10-20% English] --> F[Nouns + Basic Verbs]
        F --> G[Common Adjectives]
        G --> H[Everyday Vocabulary]
    end

    subgraph "Intermediate Level"
        I[20-35% English] --> J[Mixed Word Types]
        J --> K[Abstract Concepts]
        K --> L[Idiomatic Expressions]
    end

    subgraph "Advanced Level"
        M[35-50% English] --> N[Complex Structures]
        N --> O[Technical Terms]
        O --> P[Nuanced Vocabulary]
    end

    A --> E
    E --> I
    I --> M
```

#### Dynamic Ratio Adjustment

The system provides real-time embedding ratio adjustment based on:

1. **User Preferences**: Learners can customize their preferred embedding ratio (10-50%)
2. **Performance Analytics**: System adjusts difficulty based on comprehension and success rates
3. **Learning Goals**: Different ratios for vocabulary acquisition vs. reading comprehension
4. **Content Type**: Narrative stories vs. educational content may use different ratios

```typescript
// Embedding Ratio Configuration
interface EmbeddingConfig {
  targetRatio: number; // 10-50%
  wordTypes: WordType[]; // ['noun', 'verb', 'adjective']
  difficultyLevel: DifficultyLevel;
  adaptiveAdjustment: boolean;
  contextPreservation: number; // 0-100% context preservation
}

// Dynamic Adjustment Algorithm
function adjustEmbeddingRatio(
  currentRatio: number,
  userPerformance: PerformanceMetrics,
  userPreferences: UserPreferences
): number {
  const performanceMultiplier = calculatePerformanceMultiplier(userPerformance);
  const preferenceWeight = userPreferences.embeddingRatio / 100;

  return Math.min(
    50,
    Math.max(10, currentRatio * performanceMultiplier * preferenceWeight)
  );
}
```

### Story Chunk Architecture

Stories are divided into semantic chunks that enable precise control over embedding and audio synchronization:

```mermaid
graph TD
    subgraph "Story Structure"
        A[Complete Story] --> B[Story Chunks]
        B --> C[Normal Chunks]
        B --> D[Embedded Chunks]
        B --> E[Explanation Chunks]
    end

    subgraph "Chunk Processing"
        C --> F[Vietnamese Text Only]
        D --> G[Mixed Language Content]
        E --> H[Translation/Context]
    end

    subgraph "Interactive Features"
        F --> I[Standard Reading]
        G --> J[Clickable Vocabulary]
        H --> K[Learning Support]
    end

    subgraph "Audio Synchronization"
        I --> L[Vietnamese Audio]
        J --> M[Bilingual Audio]
        K --> N[Explanation Audio]
    end
```

#### Chunk Type Implementation

```typescript
enum ChunkType {
  normal = "normal", // Pure Vietnamese text
  chem = "chem", // Text with embedded English words
  explain = "explain", // Explanatory or translation text
}

interface StoryChunk {
  id: string;
  storyId: string;
  chunkOrder: number;
  chunkText: string;
  type: ChunkType;
  embeddedWords?: EmbeddedWord[];
  audioTimestamp?: AudioTimestamp;
}

interface EmbeddedWord {
  word: string;
  position: { start: number; end: number };
  definition: string;
  pronunciation?: string;
  difficulty: DifficultyLevel;
  wordType: WordType;
}
```

### User Journey Diagrams for Different Learning Paths

#### Beginner Learning Journey

```mermaid
journey
    title Beginner Learner Journey
    section Discovery
      Visit Platform: 5: Learner
      Take Placement Test: 3: Learner
      Receive Level Assignment: 4: System
    section First Story
      Select Beginner Story: 5: Learner
      Read with 10% Embedding: 4: Learner
      Click Unknown Words: 5: Learner
      Listen to Audio: 4: Learner
    section Practice
      Complete Fill-in Exercises: 3: Learner
      Review Vocabulary: 4: Learner
      Track Progress: 5: Learner
    section Progression
      Unlock Next Story: 5: System
      Increase Embedding Ratio: 4: System
      Celebrate Milestones: 5: Learner
```

#### Intermediate Learning Journey

```mermaid
journey
    title Intermediate Learner Journey
    section Story Selection
      Browse Story Library: 5: Learner
      Filter by Interests: 4: Learner
      Choose Mixed Embedding: 5: Learner
    section Active Reading
      Read 25% Embedded Story: 4: Learner
      Use Context Clues: 5: Learner
      Audio-Text Synchronization: 4: Learner
    section Skill Building
      Complex Exercise Types: 3: Learner
      Vocabulary Review System: 4: Learner
      Speaking Practice: 3: Learner
    section Mastery
      Adaptive Difficulty: 5: System
      Personalized Recommendations: 4: System
      Peer Interaction: 3: Learner
```

#### Advanced Learning Journey

```mermaid
journey
    title Advanced Learner Journey
    section Content Exploration
      Access Premium Stories: 5: Learner
      Custom Embedding Ratios: 5: Learner
      Technical/Academic Content: 4: Learner
    section Deep Learning
      40%+ Embedding Stories: 4: Learner
      Complex Grammar Patterns: 3: Learner
      Cultural Context Learning: 5: Learner
    section Content Creation
      Suggest Story Improvements: 4: Learner
      Create Custom Exercises: 3: Learner
      Mentor Other Learners: 5: Learner
    section Mastery Assessment
      Comprehensive Evaluations: 3: Learner
      Real-world Application: 5: Learner
      Certification Preparation: 4: Learner
```

### Content Creation and Approval Workflows

The platform implements a comprehensive content creation and approval system to ensure quality and pedagogical effectiveness:

#### Content Creation Workflow

```mermaid
flowchart TD
    subgraph "Content Creation Phase"
        A[Content Creator] --> B[Create Original Story]
        B --> C[Define Learning Objectives]
        C --> D[Select Embedding Strategy]
        D --> E[Apply Embedding Rules]
        E --> F[Generate Story Chunks]
        F --> G[Add Audio Timestamps]
        G --> H[Create Exercises]
    end

    subgraph "Quality Assurance Phase"
        H --> I[QA Review]
        I --> J{Quality Check}
        J -->|Pass| K[Curriculum Lead Review]
        J -->|Fail| L[Return to Creator]
        L --> B
    end

    subgraph "Approval Phase"
        K --> M{Pedagogical Review}
        M -->|Approve| N[Voice Artist Assignment]
        M -->|Revise| O[Content Revision]
        O --> I
    end

    subgraph "Production Phase"
        N --> P[Audio Recording]
        P --> Q[Audio Processing]
        Q --> R[Final Integration]
        R --> S[Publishing]
    end

    subgraph "Post-Publication"
        S --> T[Analytics Monitoring]
        T --> U[Learner Feedback]
        U --> V[Continuous Improvement]
        V --> O
    end
```

#### Role-Based Content Workflow

```mermaid
graph TD
    subgraph "Content Creator Role"
        A[Draft Story Content] --> B[Apply Embedding Rules]
        B --> C[Create Initial Chunks]
        C --> D[Submit for Review]
    end

    subgraph "QA Role"
        D --> E[Grammar Check]
        E --> F[Embedding Validation]
        F --> G[Technical Review]
        G --> H{QA Approval}
        H -->|Pass| I[Forward to Curriculum]
        H -->|Fail| J[Return with Feedback]
    end

    subgraph "Curriculum Lead Role"
        I --> K[Pedagogical Assessment]
        K --> L[Learning Objective Alignment]
        L --> M[Difficulty Calibration]
        M --> N{Curriculum Approval}
        N -->|Approve| O[Assign Voice Artist]
        N -->|Revise| P[Provide Guidance]
    end

    subgraph "Voice Artist Role"
        O --> Q[Record Audio]
        Q --> R[Sync with Text]
        R --> S[Audio Quality Check]
        S --> T[Submit Audio Assets]
    end

    subgraph "Admin Role"
        T --> U[Final Integration]
        U --> V[Publishing]
        V --> W[Analytics Setup]
    end

    J --> A
    P --> A
```

#### Content Approval States

```typescript
enum ContentStatus {
  draft = "draft", // Initial creation
  in_review = "in_review", // Under QA review
  published = "published", // Live content
  archived = "archived", // Retired content
  rejected = "rejected", // Failed approval
}

interface ApprovalWorkflow {
  entityId: string;
  entityType: "Story" | "Lesson" | "Exercise";
  currentStage: ApprovalStage;
  approvers: ApprovalStep[];
  history: ApprovalHistory[];
  requiredApprovals: number;
  currentApprovals: number;
}

interface ApprovalStep {
  role: UserRole;
  userId?: string;
  status: "pending" | "approved" | "rejected";
  feedback?: string;
  timestamp?: Date;
}
```

### Content Quality Standards

#### Embedding Quality Metrics

1. **Semantic Coherence**: Embedded words must maintain natural meaning within Vietnamese context
2. **Grammatical Integration**: English words should follow Vietnamese sentence structure rules
3. **Difficulty Progression**: Vocabulary complexity should align with learner level
4. **Cultural Sensitivity**: Content should be appropriate for Vietnamese cultural context

#### Automated Quality Checks

```typescript
interface QualityMetrics {
  embeddingRatio: number; // Actual vs. target ratio
  vocabularyDifficulty: number; // Average word difficulty score
  semanticCoherence: number; // Context appropriateness score
  grammarCompliance: number; // Grammar rule adherence
  culturalSensitivity: number; // Cultural appropriateness score
}

class ContentQualityValidator {
  validateEmbeddingRatio(story: Story): ValidationResult {
    const actualRatio = this.calculateEmbeddingRatio(story);
    const targetRatio = story.chemRatio || 0;
    const variance = Math.abs(actualRatio - targetRatio);

    return {
      passed: variance <= 0.05, // 5% tolerance
      score: Math.max(0, 1 - variance),
      feedback:
        variance > 0.05
          ? `Embedding ratio ${actualRatio}% differs from target ${targetRatio}%`
          : "Embedding ratio within acceptable range",
    };
  }

  validateVocabularyDifficulty(story: Story): ValidationResult {
    const words = this.extractEmbeddedWords(story);
    const avgDifficulty = this.calculateAverageDifficulty(words);
    const targetDifficulty = this.getDifficultyScore(story.difficulty);

    return {
      passed: Math.abs(avgDifficulty - targetDifficulty) <= 0.5,
      score: 1 - Math.abs(avgDifficulty - targetDifficulty) / 5,
      feedback: `Average vocabulary difficulty: ${avgDifficulty}/5`,
    };
  }
}
```

### Learning Analytics and Adaptation

The system continuously monitors learner performance to optimize the embedding methodology:

#### Performance Tracking

```mermaid
graph TD
    subgraph "Data Collection"
        A[Reading Time] --> D[Analytics Engine]
        B[Word Clicks] --> D
        C[Exercise Results] --> D
        E[Audio Usage] --> D
        F[Completion Rates] --> D
    end

    subgraph "Analysis"
        D --> G[Comprehension Analysis]
        D --> H[Engagement Metrics]
        D --> I[Difficulty Assessment]
        D --> J[Learning Velocity]
    end

    subgraph "Adaptation"
        G --> K[Content Recommendations]
        H --> L[Embedding Adjustments]
        I --> M[Difficulty Progression]
        J --> N[Personalized Paths]
    end

    subgraph "Feedback Loop"
        K --> O[Updated Content]
        L --> P[Modified Ratios]
        M --> Q[Level Adjustments]
        N --> R[Custom Journeys]
    end
```

#### Adaptive Learning Algorithm

```typescript
interface LearningAnalytics {
  comprehensionRate: number; // % of embedded words understood
  engagementScore: number; // Interaction frequency and depth
  progressVelocity: number; // Learning speed metric
  retentionRate: number; // Vocabulary retention over time
  preferenceProfile: UserPreferences;
}

class AdaptiveLearningEngine {
  calculateOptimalEmbeddingRatio(
    analytics: LearningAnalytics,
    currentRatio: number
  ): number {
    const comprehensionWeight = 0.4;
    const engagementWeight = 0.3;
    const velocityWeight = 0.2;
    const retentionWeight = 0.1;

    const adaptationScore =
      analytics.comprehensionRate * comprehensionWeight +
      analytics.engagementScore * engagementWeight +
      analytics.progressVelocity * velocityWeight +
      analytics.retentionRate * retentionWeight;

    // Adjust ratio based on performance
    if (adaptationScore > 0.8) {
      return Math.min(50, currentRatio * 1.1); // Increase difficulty
    } else if (adaptationScore < 0.6) {
      return Math.max(10, currentRatio * 0.9); // Decrease difficulty
    }

    return currentRatio; // Maintain current level
  }

  generatePersonalizedRecommendations(
    analytics: LearningAnalytics
  ): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];

    // Vocabulary focus recommendations
    if (analytics.retentionRate < 0.7) {
      recommendations.push({
        type: "vocabulary_review",
        priority: "high",
        content: "Focus on vocabulary review exercises",
      });
    }

    // Difficulty adjustment recommendations
    if (analytics.comprehensionRate > 0.9) {
      recommendations.push({
        type: "difficulty_increase",
        priority: "medium",
        content: "Ready for more challenging content",
      });
    }

    return recommendations;
  }
}
```

### Technical Implementation Details

#### Story Processing Pipeline

```mermaid
graph LR
    subgraph "Input Processing"
        A[Raw Story Text] --> B[Text Analysis]
        B --> C[Word Segmentation]
        C --> D[POS Tagging]
    end

    subgraph "Embedding Engine"
        D --> E[Embedding Strategy Selection]
        E --> F[Word Replacement Logic]
        F --> G[Context Validation]
        G --> H[Quality Scoring]
    end

    subgraph "Chunk Generation"
        H --> I[Semantic Chunking]
        I --> J[Audio Timestamp Mapping]
        J --> K[Interactive Element Creation]
    end

    subgraph "Output Generation"
        K --> L[Database Storage]
        L --> M[API Serialization]
        M --> N[Frontend Rendering]
    end
```

#### Database Schema for Story Embedding

The database schema supports the complex requirements of the embedding methodology:

```sql
-- Story chunks with embedding metadata
CREATE TABLE story_chunks (
  id UUID PRIMARY KEY,
  story_id UUID REFERENCES stories(id),
  chunk_order INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  type chunk_type NOT NULL, -- 'normal', 'chem', 'explain'
  embedding_metadata JSONB, -- Embedded word positions and metadata
  audio_start_time INTEGER, -- Milliseconds
  audio_end_time INTEGER,   -- Milliseconds
  created_at TIMESTAMP DEFAULT NOW()
);

-- Embedded word tracking
CREATE TABLE embedded_words (
  id UUID PRIMARY KEY,
  chunk_id UUID REFERENCES story_chunks(id),
  word TEXT NOT NULL,
  position_start INTEGER NOT NULL,
  position_end INTEGER NOT NULL,
  word_type VARCHAR(20), -- 'noun', 'verb', 'adjective'
  difficulty_level difficulty_level,
  definition TEXT,
  pronunciation TEXT,
  audio_url TEXT
);

-- Learning analytics for embedding optimization
CREATE TABLE embedding_analytics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  story_id UUID REFERENCES stories(id),
  chunk_id UUID REFERENCES story_chunks(id),
  word TEXT,
  interaction_type VARCHAR(20), -- 'click', 'hover', 'audio_play'
  comprehension_indicated BOOLEAN,
  timestamp TIMESTAMP DEFAULT NOW(),
  session_id UUID
);
```

This comprehensive learning methodology implementation provides a robust foundation for the Jewish-style story embedding approach, ensuring effective vocabulary acquisition through contextual learning while maintaining cultural relevance and pedagogical soundness.

### Architectural Patterns & Design Principles

#### Domain-Driven Design (DDD) Structure

```mermaid
graph TD
    subgraph "Presentation Layer"
        A[Next.js Pages] --> B[React Components]
        B --> C[Custom Hooks]
        C --> D[State Management]
    end

    subgraph "Application Layer"
        E[API Routes] --> F[Use Cases]
        F --> G[Command Handlers]
        G --> H[Query Handlers]
    end

    subgraph "Domain Layer"
        I[Domain Models] --> J[Business Logic]
        J --> K[Domain Services]
        K --> L[Domain Events]
    end

    subgraph "Infrastructure Layer"
        M[Repositories] --> N[Database Access]
        N --> O[External APIs]
        O --> P[File Storage]
    end

    A --> E
    F --> I
    H --> M
    L --> F
```

#### Hexagonal Architecture Implementation

```mermaid
graph TD
    subgraph "Core Domain"
        A[Learning Engine] --> B[Story Processing]
        B --> C[Progress Tracking]
        C --> D[Vocabulary Management]
    end

    subgraph "Primary Adapters (Driving)"
        E[Web UI] --> F[REST API]
        G[Mobile App] --> F
        H[Admin Panel] --> F
    end

    subgraph "Secondary Adapters (Driven)"
        I[PostgreSQL] --> J[Database Port]
        K[Redis] --> L[Cache Port]
        M[AWS S3] --> N[Storage Port]
        O[AI Service] --> P[AI Port]
    end

    subgraph "Ports (Interfaces)"
        F --> Q[Application Port]
        J --> R[Repository Port]
        L --> S[Cache Port]
        N --> T[Storage Port]
        P --> U[AI Port]
    end

    Q --> A
    A --> R
    A --> S
    A --> T
    A --> U
```

#### Event-Driven Architecture

```mermaid
graph LR
    subgraph "Event Sources"
        A[User Actions] --> B[Domain Events]
        C[System Events] --> B
        D[External Events] --> B
    end

    subgraph "Event Bus"
        B --> E[Event Router]
        E --> F[Event Queue]
        F --> G[Event Handlers]
    end

    subgraph "Event Handlers"
        G --> H[Progress Handler]
        G --> I[Analytics Handler]
        G --> J[Notification Handler]
        G --> K[Cache Handler]
    end

    subgraph "Side Effects"
        H --> L[Database Update]
        I --> M[Analytics Store]
        J --> N[Email Service]
        K --> O[Cache Invalidation]
    end
```

#### Microservices Readiness Architecture

```mermaid
graph TD
    subgraph "Current Monolith"
        A[Next.js Application] --> B[Feature Modules]
        B --> C[Shared Database]
    end

    subgraph "Future Microservices"
        D[User Service] --> E[User Database]
        F[Learning Service] --> G[Learning Database]
        H[Content Service] --> I[Content Database]
        J[Analytics Service] --> K[Analytics Database]
    end

    subgraph "Service Communication"
        L[API Gateway] --> D
        L --> F
        L --> H
        L --> J

        M[Event Bus] --> D
        M --> F
        M --> H
        M --> J
    end

    subgraph "Cross-Cutting Concerns"
        N[Authentication] --> L
        O[Monitoring] --> L
        P[Logging] --> L
        Q[Tracing] --> L
    end

    A -.->|"Migration Path"| D
    A -.->|"Migration Path"| F
    A -.->|"Migration Path"| H
    A -.->|"Migration Path"| J
```

### Security Architecture Diagrams

#### RBAC + ABAC Authorization Flow

```mermaid
flowchart TD
    subgraph "User Request"
        A[User Action] --> B[Extract JWT Token]
        B --> C[Decode User Claims]
    end

    subgraph "Role-Based Access Control (RBAC)"
        C --> D[Check User Role]
        D --> E{Role Permissions}
        E -->|student| F[Basic Learning Access]
        E -->|content_creator| G[Content Creation Access]
        E -->|admin| H[Administrative Access]
        E -->|super_admin| I[Full System Access]
    end

    subgraph "Attribute-Based Access Control (ABAC)"
        F --> J[Check Resource Attributes]
        G --> J
        H --> J
        I --> J

        J --> K{Resource Ownership}
        K -->|Own Resource| L[Allow Access]
        K -->|Tenant Resource| M[Check Tenant Membership]
        K -->|Public Resource| N[Check Publication Status]

        M --> O{Tenant Match}
        O -->|Match| L
        O -->|No Match| P[Deny Access]

        N --> Q{Published}
        Q -->|Yes| L
        Q -->|No| P
    end

    subgraph "Policy Enforcement"
        L --> R[Execute Action]
        P --> S[Return 403 Forbidden]
        R --> T[Audit Log]
        S --> T
    end
```

#### Multi-Tenant Data Isolation

```mermaid
graph TD
    subgraph "Request Layer"
        A[Client Request] --> B[JWT Token]
        B --> C[Extract Tenant ID]
    end

    subgraph "Middleware Layer"
        C --> D[Tenant Validation Middleware]
        D --> E[Prisma Middleware]
        E --> F[Query Transformation]
    end

    subgraph "Database Layer"
        F --> G{Query Type}
        G -->|SELECT| H[Add WHERE tenant_id = ?]
        G -->|INSERT| I[Add tenant_id to data]
        G -->|UPDATE| J[Add WHERE tenant_id = ?]
        G -->|DELETE| K[Add WHERE tenant_id = ?]
    end

    subgraph "Data Storage"
        H --> L[(Tenant A Data)]
        H --> M[(Tenant B Data)]
        H --> N[(Tenant C Data)]

        I --> L
        I --> M
        I --> N

        J --> L
        J --> M
        J --> N

        K --> L
        K --> M
        K --> N
    end

    subgraph "Response Layer"
        L --> O[Filtered Results]
        M --> O
        N --> O
        O --> P[Return to Client]
    end
```

### Performance Architecture Diagrams

#### Caching Strategy Architecture

```mermaid
graph TD
    subgraph "Client Layer"
        A[Browser Cache] --> B[Service Worker Cache]
        B --> C[IndexedDB]
    end

    subgraph "CDN Layer"
        D[CloudFlare CDN] --> E[Static Assets]
        D --> F[API Response Cache]
    end

    subgraph "Application Layer"
        G[Next.js App] --> H[TanStack Query Cache]
        H --> I[Zustand State]
    end

    subgraph "Server Layer"
        J[API Routes] --> K[Redis Cache]
        K --> L{Cache Strategy}
        L -->|Stories| M[Long TTL - 1 hour]
        L -->|User Progress| N[Short TTL - 5 min]
        L -->|Session Data| O[Medium TTL - 30 min]
    end

    subgraph "Database Layer"
        P[(PostgreSQL)] --> Q[Connection Pool]
        Q --> R[Read Replicas]
    end

    A --> D
    C --> G
    G --> J
    J --> K
    K --> P

    M --> P
    N --> P
    O --> P
```

#### Database Performance Optimization

```mermaid
graph LR
    subgraph "Query Optimization"
        A[Incoming Query] --> B[Query Planner]
        B --> C{Index Available?}
        C -->|Yes| D[Index Scan]
        C -->|No| E[Sequential Scan]
        D --> F[Fast Execution]
        E --> G[Slow Execution]
    end

    subgraph "Connection Management"
        H[Application] --> I[Connection Pool]
        I --> J[Active Connections]
        I --> K[Idle Connections]
        J --> L[(Primary DB)]
        K --> M[(Read Replica)]
    end

    subgraph "Caching Layer"
        N[Query Result] --> O{Cacheable?}
        O -->|Yes| P[Redis Cache]
        O -->|No| Q[Direct Response]
        P --> R[Cached Response]
    end

    F --> N
    G --> N
    L --> N
    M --> N
```

### Deployment Architecture Diagrams

#### Container Orchestration

```mermaid
graph TD
    subgraph "Development Environment"
        A[Docker Compose] --> B[Next.js Container]
        A --> C[PostgreSQL Container]
        A --> D[Redis Container]
        A --> E[Nginx Container]
    end

    subgraph "Staging Environment"
        F[Kubernetes Cluster] --> G[Next.js Pods]
        F --> H[PostgreSQL StatefulSet]
        F --> I[Redis Deployment]
        F --> J[Ingress Controller]
    end

    subgraph "Production Environment"
        K[Load Balancer] --> L[Next.js Instances]
        L --> M[Database Cluster]
        L --> N[Redis Cluster]
        L --> O[CDN]
    end

    subgraph "CI/CD Pipeline"
        P[GitHub Actions] --> Q[Build & Test]
        Q --> R[Docker Build]
        R --> S[Registry Push]
        S --> T[Deploy to Staging]
        T --> U[Integration Tests]
        U --> V[Deploy to Production]
    end

    B --> G
    G --> L
    P --> A
    P --> F
    P --> K
```

#### Scalability Architecture

```mermaid
graph TB
    subgraph "Load Distribution"
        A[Load Balancer] --> B[Next.js Instance 1]
        A --> C[Next.js Instance 2]
        A --> D[Next.js Instance N]
    end

    subgraph "Database Scaling"
        E[Primary Database] --> F[Read Replica 1]
        E --> G[Read Replica 2]
        E --> H[Read Replica N]
    end

    subgraph "Cache Scaling"
        I[Redis Cluster] --> J[Redis Node 1]
        I --> K[Redis Node 2]
        I --> L[Redis Node N]
    end

    subgraph "Storage Scaling"
        M[AWS S3] --> N[Audio Files]
        M --> O[Static Assets]
        M --> P[User Uploads]
    end

    subgraph "Monitoring & Observability"
        Q[Prometheus] --> R[Metrics Collection]
        S[Grafana] --> T[Dashboards]
        U[ELK Stack] --> V[Log Aggregation]
    end

    B --> E
    C --> F
    D --> G

    B --> I
    C --> I
    D --> I

    B --> M
    C --> M
    D --> M

    R --> S
    V --> S
```

## Security Architecture

### Overview

The security architecture implements a comprehensive defense-in-depth strategy combining multiple layers of protection:

1. **Authentication Layer**: JWT-based token authentication with refresh token rotation
2. **Authorization Layer**: Hybrid RBAC + ABAC system using CASL framework
3. **Multi-Tenancy Layer**: Database-level tenant isolation with middleware enforcement
4. **Transport Security**: HTTPS enforcement with security headers
5. **Input Validation**: Comprehensive validation using Zod schemas
6. **Audit Layer**: Complete audit trail for all sensitive operations

### Authentication Architecture

#### JWT Token Lifecycle

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AuthService
    participant TokenManager
    participant Database

    Note over Client,Database: Login Flow
    Client->>API: POST /api/auth/login
    API->>AuthService: Validate credentials
    AuthService->>Database: Query user
    Database-->>AuthService: User data
    AuthService->>AuthService: Verify password hash
    AuthService->>TokenManager: Generate tokens
    TokenManager-->>AuthService: Access + Refresh tokens
    AuthService-->>API: Token pair
    API-->>Client: Tokens + User data

    Note over Client,Database: Token Refresh Flow
    Client->>API: POST /api/auth/refresh
    API->>TokenManager: Verify refresh token
    TokenManager->>Database: Validate user status
    Database-->>TokenManager: User active status
    TokenManager->>TokenManager: Generate new tokens
    TokenManager-->>API: New token pair
    API-->>Client: New tokens

    Note over Client,Database: Protected Request Flow
    Client->>API: Request with Bearer token
    API->>TokenManager: Verify access token
    alt Token valid
        TokenManager-->>API: User context
        API->>API: Process request
        API-->>Client: Response
    else Token expired
        TokenManager-->>API: Token expired
        API-->>Client: 401 Unauthorized
        Client->>Client: Trigger refresh flow
    end
```

#### Token Management Implementation

```typescript
// JWT Token Structure
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  iat: number;
  exp: number;
}

// Token Configuration
const TOKEN_CONFIG = {
  ACCESS_TOKEN_EXPIRY: "15m", // Short-lived for security
  REFRESH_TOKEN_EXPIRY: "7d", // Longer-lived for UX
  ALGORITHM: "HS256", // HMAC SHA-256
  ISSUER: "edtech-platform",
  AUDIENCE: "edtech-users",
};

// Token Generation
export function generateTokenPair(user: User): TokenPair {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY,
    issuer: TOKEN_CONFIG.ISSUER,
    audience: TOKEN_CONFIG.AUDIENCE,
  });

  const refreshToken = jwt.sign(
    { userId: user.id, type: "refresh" },
    JWT_SECRET,
    {
      expiresIn: TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY,
      issuer: TOKEN_CONFIG.ISSUER,
      audience: TOKEN_CONFIG.AUDIENCE,
    }
  );

  return { accessToken, refreshToken };
}
```

#### Authentication Flow Diagrams

```mermaid
graph TD
    subgraph "Client Authentication"
        A[Login Request] --> B[Credential Validation]
        B --> C{Valid Credentials?}
        C -->|Yes| D[Generate JWT Pair]
        C -->|No| E[Return 401]
        D --> F[Store in HttpOnly Cookie]
        D --> G[Return to Client]
    end

    subgraph "Token Refresh"
        H[Token Expiring] --> I[Automatic Refresh]
        I --> J[Validate Refresh Token]
        J --> K{Token Valid?}
        K -->|Yes| L[Generate New Pair]
        K -->|No| M[Force Re-login]
        L --> N[Update Storage]
    end

    subgraph "Request Authorization"
        O[API Request] --> P[Extract JWT]
        P --> Q[Verify Signature]
        Q --> R{Token Valid?}
        R -->|Yes| S[Extract User Context]
        R -->|No| T[Return 401]
        S --> U[Proceed to Authorization]
    end

    G --> H
    N --> O
```

### Authorization Architecture (RBAC + ABAC)

#### Role-Based Access Control (RBAC)

The system implements a comprehensive RBAC system with 11 distinct roles:

```typescript
enum UserRole {
  student, // Basic learning access
  coach, // Mentoring and grading capabilities
  admin, // Full administrative access
  super_admin, // Cross-tenant system administration
  org_admin, // Tenant-level administration
  curriculum_lead, // Content approval and publishing
  content_creator, // Content creation and editing
  instructor, // Teaching and assessment
  voice_artist, // Audio content creation
  qa, // Quality assurance and review
  guest, // Limited read-only access
}
```

#### RBAC Permission Matrix

| Role                | Users     | Content    | Courses   | Analytics | System |
| ------------------- | --------- | ---------- | --------- | --------- | ------ |
| **super_admin**     | ✅ All    | ✅ All     | ✅ All    | ✅ All    | ✅ All |
| **admin**           | ✅ Tenant | ✅ Tenant  | ✅ Tenant | ✅ Tenant | ❌     |
| **org_admin**       | ✅ Tenant | ✅ Manage  | ✅ Manage | ✅ View   | ❌     |
| **curriculum_lead** | ❌        | ✅ Approve | ✅ Create | ✅ View   | ❌     |
| **content_creator** | ❌        | ✅ Create  | ✅ View   | ❌        | ❌     |
| **instructor**      | ❌        | ✅ View    | ✅ Assign | ✅ View   | ❌     |
| **coach**           | ❌        | ✅ View    | ✅ Assign | ✅ View   | ❌     |
| **voice_artist**    | ❌        | ✅ Audio   | ❌        | ❌        | ❌     |
| **qa**              | ❌        | ✅ Review  | ❌        | ❌        | ❌     |
| **student**         | ❌        | ✅ View    | ✅ Learn  | ❌        | ❌     |
| **guest**           | ❌        | ✅ Public  | ✅ Public | ❌        | ❌     |

#### CASL Implementation Details

```typescript
// Permission Rules Definition
const roleDefinitions: Record<string, AbilityRule[]> = {
  super_admin: [{ action: "manage", subject: "all" }],

  org_admin: [
    {
      action: "manage",
      subject: "User",
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "manage",
      subject: ["Course", "Unit", "Lesson", "Story"],
      conditions: { tenantId: "${ctx.tenantId}" },
    },
    {
      action: "approve",
      subject: ["StoryVersion", "Lesson"],
      conditions: { tenantId: "${ctx.tenantId}" },
    },
  ],

  content_creator: [
    {
      action: ["create", "read", "update"],
      subject: ["Story", "StoryVersion", "Exercise"],
      conditions: {
        tenantId: "${ctx.tenantId}",
        ownerId: "${ctx.userId}",
      },
    },
    {
      action: "delete",
      subject: ["StoryVersion", "Exercise"],
      conditions: {
        tenantId: "${ctx.tenantId}",
        ownerId: "${ctx.userId}",
        status: "draft",
      },
    },
  ],

  student: [
    {
      action: "read",
      subject: ["Course", "Lesson", "Story", "Exercise"],
      conditions: {
        tenantId: "${ctx.tenantId}",
        status: "published",
      },
    },
    {
      action: ["create", "read", "update"],
      subject: "UserProgress",
      conditions: {
        tenantId: "${ctx.tenantId}",
        userId: "${ctx.userId}",
      },
    },
  ],
};

// Ability Builder with Context Interpolation
export function buildAbility(
  rulesFromServer: ServerRule[] | undefined,
  ctx: AbilityContext | undefined
): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    createPrismaAbility
  );

  // Apply role-based rules
  if (ctx?.roles) {
    ctx.roles.forEach((role) => {
      const rules = roleDefinitions[role];
      if (rules) {
        rules.forEach((rule) => {
          // Replace context placeholders
          let conditions = rule.conditions;
          if (conditions) {
            conditions = JSON.parse(
              JSON.stringify(conditions)
                .replace(/\$\{ctx\.userId\}/g, ctx.userId || "")
                .replace(/\$\{ctx\.tenantId\}/g, ctx.tenantId || "")
            );
          }

          // Apply permissions
          const subjects = Array.isArray(rule.subject)
            ? rule.subject
            : [rule.subject];
          subjects.forEach((subject) => {
            if (Array.isArray(rule.action)) {
              can(rule.action, subject, conditions);
            } else {
              can(rule.action, subject, conditions);
            }
          });
        });
      }
    });
  }

  return build();
}
```

#### Attribute-Based Access Control (ABAC)

ABAC policies provide fine-grained access control based on resource attributes:

```typescript
// ABAC Policy Structure
interface ResourcePolicy {
  id: string;
  name: string;
  resource: string; // e.g., "Story", "Lesson"
  conditions: Json; // Dynamic conditions
  effect: "allow" | "deny"; // Policy effect
  priority: number; // Evaluation order
  isActive: boolean;
  tenantId?: string;
}

// Example ABAC Policies
const abacPolicies = [
  {
    name: "Deny Draft Content Access",
    resource: "Story",
    conditions: {
      status: "draft",
      ownerId: { not: "${ctx.userId}" },
    },
    effect: "deny",
    priority: 100,
  },
  {
    name: "Allow Published Content",
    resource: "Story",
    conditions: {
      status: "published",
      tenantId: "${ctx.tenantId}",
    },
    effect: "allow",
    priority: 50,
  },
];

// ABAC Evaluation Engine
export async function evaluateAbacPolicies(
  resource: string,
  context: AbilityContext,
  resourceAttributes: Record<string, unknown>
): Promise<{ allowed: boolean; reason?: string }> {
  const policies = await prisma.resourcePolicy.findMany({
    where: {
      resource,
      isActive: true,
      OR: [{ tenantId: null }, { tenantId: context.tenantId }],
    },
    orderBy: { priority: "desc" },
  });

  for (const policy of policies) {
    const interpolatedConditions = interpolateConditions(
      policy.conditions,
      context
    );

    if (matchesConditions(resourceAttributes, interpolatedConditions)) {
      if (policy.effect === "deny") {
        return { allowed: false, reason: policy.name };
      }
      // Continue evaluation for allow policies
    }
  }

  return { allowed: true };
}
```

### Multi-Tenancy Security

#### Tenant Isolation Architecture

```mermaid
graph TD
    subgraph "Request Processing"
        A[Client Request] --> B[JWT Extraction]
        B --> C[Tenant ID Validation]
        C --> D[Prisma Middleware]
    end

    subgraph "Database Layer"
        D --> E[Query Transformation]
        E --> F{Query Type}
        F -->|SELECT| G[Add WHERE tenantId = ?]
        F -->|INSERT| H[Add tenantId to data]
        F -->|UPDATE| I[Add WHERE tenantId = ?]
        F -->|DELETE| J[Add WHERE tenantId = ?]
    end

    subgraph "Data Isolation"
        G --> K[(Tenant A Data)]
        G --> L[(Tenant B Data)]
        G --> M[(Tenant C Data)]

        H --> K
        H --> L
        H --> M

        I --> K
        I --> L
        I --> M

        J --> K
        J --> L
        J --> M
    end
```

#### Prisma Middleware for Tenant Isolation

```typescript
// Tenant Isolation Middleware
export function createTenantMiddleware(tenantId: string) {
  return Prisma.middleware(async (params, next) => {
    // Skip for system operations
    if (params.model === "Tenant" || !tenantId) {
      return next(params);
    }

    // Add tenant filter to all queries
    if (params.action === "findMany" || params.action === "findFirst") {
      params.args.where = {
        ...params.args.where,
        tenantId: tenantId,
      };
    }

    // Add tenant ID to create operations
    if (params.action === "create") {
      params.args.data = {
        ...params.args.data,
        tenantId: tenantId,
      };
    }

    // Add tenant filter to update/delete operations
    if (
      params.action === "update" ||
      params.action === "delete" ||
      params.action === "updateMany" ||
      params.action === "deleteMany"
    ) {
      params.args.where = {
        ...params.args.where,
        tenantId: tenantId,
      };
    }

    return next(params);
  });
}

// Usage in API routes
export async function withTenantIsolation<T>(
  tenantId: string,
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const prismaWithTenant = prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Apply tenant isolation
          if (model !== "Tenant" && tenantId) {
            if (operation === "findMany" || operation === "findFirst") {
              args.where = { ...args.where, tenantId };
            } else if (operation === "create") {
              args.data = { ...args.data, tenantId };
            } else if (
              ["update", "delete", "updateMany", "deleteMany"].includes(
                operation
              )
            ) {
              args.where = { ...args.where, tenantId };
            }
          }
          return query(args);
        },
      },
    },
  });

  return operation(prismaWithTenant as any);
}
```

#### Tenant Security Policies

```typescript
// Tenant Security Configuration
interface TenantSecurityPolicy {
  id: string;
  tenantId: string;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    maxAge: number; // days
  };
  sessionPolicy: {
    maxDuration: number; // minutes
    maxConcurrentSessions: number;
    requireMFA: boolean;
  };
  dataRetention: {
    auditLogRetention: number; // days
    userDataRetention: number; // days
    backupRetention: number; // days
  };
}

// Default Security Policies
const DEFAULT_SECURITY_POLICY: TenantSecurityPolicy = {
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false,
    maxAge: 90,
  },
  sessionPolicy: {
    maxDuration: 480, // 8 hours
    maxConcurrentSessions: 3,
    requireMFA: false,
  },
  dataRetention: {
    auditLogRetention: 365,
    userDataRetention: 2555, // 7 years
    backupRetention: 90,
  },
};
```

### Security Middleware Stack

#### Request Security Pipeline

```mermaid
graph LR
    subgraph "Security Middleware Stack"
        A[Request] --> B[CORS Middleware]
        B --> C[Rate Limiting]
        C --> D[Security Headers]
        D --> E[JWT Verification]
        E --> F[CASL Authorization]
        F --> G[Tenant Validation]
        G --> H[Input Validation]
        H --> I[Audit Logging]
        I --> J[Route Handler]
    end

    subgraph "Security Headers"
        D --> K[X-Content-Type-Options]
        D --> L[X-Frame-Options]
        D --> M[X-XSS-Protection]
        D --> N[Strict-Transport-Security]
        D --> O[Content-Security-Policy]
    end
```

#### Security Headers Implementation

```typescript
// Security Headers Configuration
const SECURITY_HEADERS = {
  // Prevent XSS attacks
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",

  // HTTPS enforcement
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join("; "),

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions policy
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

// Middleware Implementation
export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
```

#### Rate Limiting Implementation

```typescript
// Rate Limiting Configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "/api/auth/login": {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    skipSuccessfulRequests: false,
  },
  "/api/auth/register": {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  },
  "/api/": {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    skipSuccessfulRequests: true,
  },
};

// Rate Limiter Implementation
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): boolean {
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get request history from Redis
  const requests = getRequestHistory(key, windowStart);

  if (requests.length >= config.maxRequests) {
    return false; // Rate limit exceeded
  }

  // Record this request
  recordRequest(key, now, config.windowMs);
  return true;
}
```

### Input Validation & Sanitization

#### Zod Schema Validation

```typescript
// Authentication Schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email format").max(320, "Email too long"), // RFC 5321 limit
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password too long"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s\u00C0-\u017F\u1EA0-\u1EF9]+$/, "Invalid name format"),
  email: z.string().email("Invalid email format").max(320, "Email too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
  role: z.enum(["student", "coach"]).optional().default("student"),
});

// Content Schemas
export const storySchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title too long")
    .trim(),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(50000, "Content too long"),
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
  chemRatio: z
    .number()
    .min(0, "Ratio must be non-negative")
    .max(1, "Ratio cannot exceed 1")
    .optional(),
});

// Validation Middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);

      // Attach validated data to request
      (request as any).validatedData = validatedData;
      return null; // Continue processing
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid input data",
              details: error.flatten(),
            },
          },
          { status: 400 }
        );
      }
      throw error;
    }
  };
}
```

### Audit & Monitoring

#### Comprehensive Audit Trail

```typescript
// Audit Event Types
enum AuditAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  PERMISSION_GRANTED = "PERMISSION_GRANTED",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  EXPORT = "EXPORT",
}

// Audit Log Structure
interface AuditLogEntry {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  tenantId: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

// Audit Logger Implementation
export class AuditLogger {
  static async logAction(entry: Omit<AuditLogEntry, "id" | "timestamp">) {
    try {
      await prisma.auditLog.create({
        data: {
          ...entry,
          id: generateId(),
          timestamp: new Date(),
        },
      });
    } catch (error) {
      // Log to external system if database fails
      console.error("Failed to write audit log:", error);
      await this.logToExternalSystem(entry);
    }
  }

  static async logAuthenticationEvent(
    userId: string,
    action: "LOGIN" | "LOGOUT" | "TOKEN_REFRESH",
    success: boolean,
    metadata: Record<string, unknown> = {}
  ) {
    await this.logAction({
      userId,
      action: action as AuditAction,
      entityType: "Authentication",
      entityId: userId,
      success,
      ...metadata,
    });
  }

  static async logAuthorizationCheck(
    userId: string,
    tenantId: string,
    action: string,
    resource: string,
    allowed: boolean,
    metadata: Record<string, unknown> = {}
  ) {
    await this.logAction({
      userId,
      tenantId,
      action: allowed
        ? AuditAction.PERMISSION_GRANTED
        : AuditAction.PERMISSION_DENIED,
      entityType: "Authorization",
      entityId: `${action}:${resource}`,
      success: allowed,
      newValues: { action, resource, ...metadata },
    });
  }
}
```

#### Security Monitoring & Alerting

```typescript
// Security Event Detection
interface SecurityEvent {
  type:
    | "BRUTE_FORCE"
    | "SUSPICIOUS_LOGIN"
    | "PRIVILEGE_ESCALATION"
    | "DATA_BREACH";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  userId?: string;
  tenantId?: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

export class SecurityMonitor {
  // Detect brute force attacks
  static async detectBruteForce(
    userId: string,
    ipAddress: string
  ): Promise<boolean> {
    const recentFailures = await prisma.auditLog.count({
      where: {
        userId,
        action: "LOGIN",
        success: false,
        timestamp: {
          gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
        },
      },
    });

    if (recentFailures >= 5) {
      await this.raiseSecurityEvent({
        type: "BRUTE_FORCE",
        severity: "HIGH",
        userId,
        details: { ipAddress, failureCount: recentFailures },
        timestamp: new Date(),
      });
      return true;
    }

    return false;
  }

  // Detect suspicious login patterns
  static async detectSuspiciousLogin(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<boolean> {
    const recentLogins = await prisma.auditLog.findMany({
      where: {
        userId,
        action: "LOGIN",
        success: true,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { timestamp: "desc" },
      take: 5,
    });

    // Check for login from new location/device
    const knownIPs = recentLogins
      .map((log) => log.newValues?.ipAddress)
      .filter(Boolean);
    const knownUserAgents = recentLogins
      .map((log) => log.newValues?.userAgent)
      .filter(Boolean);

    if (!knownIPs.includes(ipAddress) || !knownUserAgents.includes(userAgent)) {
      await this.raiseSecurityEvent({
        type: "SUSPICIOUS_LOGIN",
        severity: "MEDIUM",
        userId,
        details: { ipAddress, userAgent, knownIPs, knownUserAgents },
        timestamp: new Date(),
      });
      return true;
    }

    return false;
  }

  private static async raiseSecurityEvent(event: SecurityEvent) {
    // Log to audit trail
    await AuditLogger.logAction({
      userId: event.userId || "system",
      tenantId: event.tenantId || "system",
      action: "SECURITY_EVENT" as AuditAction,
      entityType: "SecurityEvent",
      entityId: event.type,
      success: true,
      newValues: event.details,
    });

    // Send alerts for high/critical events
    if (["HIGH", "CRITICAL"].includes(event.severity)) {
      await this.sendSecurityAlert(event);
    }
  }

  private static async sendSecurityAlert(event: SecurityEvent) {
    // Implementation would send alerts via email, Slack, etc.
    console.warn(
      `SECURITY ALERT [${event.severity}]: ${event.type}`,
      event.details
    );
  }
}
```

### Technology Stack

#### Frontend Stack

- **Next.js 15**: React framework với App Router và React 19
- **TypeScript**: Type safety toàn bộ application
- **TailwindCSS 4**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Animation và transitions
- **TanStack Query v5**: Server state management
- **Zustand**: Client state management
- **React Hook Form**: Form handling với validation

#### Backend Stack

- **Next.js API Routes**: RESTful API endpoints
- **Prisma ORM**: Type-safe database operations
- **PostgreSQL**: Primary database
- **Redis**: Caching và session storage
- **JWT**: Token-based authentication
- **CASL**: Authorization framework (RBAC + ABAC)

#### Infrastructure

- **Docker**: Containerization
- **AWS S3**: Audio file storage
- **Vercel/Railway**: Deployment options
- **GitHub Actions**: CI/CD pipeline

### Security Implementation Examples

#### CASL Usage Patterns in API Routes

```typescript
// Example: Story Management API with CASL Authorization
// /api/stories/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/core/auth/getUser";
import { caslGuard } from "@/core/auth/casl.guard";
import { prisma } from "@/core/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract user context from JWT
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Define required permissions
    const authResult = caslGuard(
      [
        {
          action: "read",
          subject: "Story",
          conditions: {
            tenantId: user.tenantId,
            status: "published",
          },
        },
      ],
      user
    );

    if (!authResult.allowed) {
      return NextResponse.json(
        { error: "Forbidden", details: authResult.failedRules },
        { status: 403 }
      );
    }

    // Fetch story with tenant isolation
    const story = await prisma.story.findUnique({
      where: {
        id: params.id,
        tenantId: user.tenantId, // Enforce tenant isolation
      },
      include: {
        versions: {
          where: { isPublished: true },
        },
        tags: true,
      },
    });

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: story,
    });
  } catch (error) {
    console.error("Story fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // More restrictive permissions for updates
    const authResult = caslGuard(
      [
        {
          action: "update",
          subject: "Story",
          conditions: {
            tenantId: user.tenantId,
            OR: [
              { createdBy: user.sub }, // Own content
              { status: "draft" }, // Draft content (if curriculum_lead)
            ],
          },
        },
      ],
      user
    );

    if (!authResult.allowed) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const validatedData = storySchema.parse(body);

    // Update with audit trail
    const updatedStory = await prisma.story.update({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    });

    // Log the update
    await AuditLogger.logAction({
      userId: user.sub,
      tenantId: user.tenantId!,
      action: AuditAction.UPDATE,
      entityType: "Story",
      entityId: params.id,
      newValues: validatedData,
      success: true,
    });

    return NextResponse.json({
      success: true,
      data: updatedStory,
    });
  } catch (error) {
    console.error("Story update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
```

#### Frontend Authorization with CASL

```typescript
// React component with CASL authorization
// components/StoryEditor.tsx

import { useAbility } from '@casl/react';
import { Can } from '@/shared/components/Can';
import { useAuth } from '@/contexts/AuthContext';

interface StoryEditorProps {
  story: Story;
  onSave: (story: Story) => void;
  onDelete: (id: string) => void;
}

export function StoryEditor({ story, onSave, onDelete }: StoryEditorProps) {
  const { user } = useAuth();
  const ability = useAbility();

  // Check if user can edit this story
  const canEdit = ability.can('update', 'Story', {
    tenantId: user?.tenantId,
    createdBy: story.createdBy,
    status: story.status,
  });

  const canDelete = ability.can('delete', 'Story', {
    tenantId: user?.tenantId,
    createdBy: story.createdBy,
    status: 'draft', // Only draft stories can be deleted
  });

  const canPublish = ability.can('publish', 'Story', {
    tenantId: user?.tenantId,
    isApproved: story.isApproved,
  });

  if (!canEdit) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">
          You don't have permission to edit this story.
        </p>
      </div>
    );
  }

  return (
    <div className="story-editor">
      <form onSubmit={handleSubmit}>
        {/* Story editing form */}
        <input
          type="text"
          value={story.title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canEdit}
        />

        <textarea
          value={story.content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!canEdit}
        />

        <div className="actions">
          <button type="submit" disabled={!canEdit}>
            Save Draft
          </button>

          {/* Conditional rendering based on permissions */}
          <Can I="publish" a="Story" this={story}>
            <button
              type="button"
              onClick={handlePublish}
              disabled={!story.isApproved}
            >
              Publish Story
            </button>
          </Can>

          <Can I="delete" a="Story" this={story}>
            <button
              type="button"
              onClick={() => onDelete(story.id)}
              className="btn-danger"
            >
              Delete Story
            </button>
          </Can>
        </div>
      </form>
    </div>
  );
}

// Custom Can component for type-safe permissions
// shared/components/Can.tsx

import { createCanBoundTo } from '@casl/react';
import { AppAbility } from '@/core/auth/ability';

export const Can = createCanBoundTo<AppAbility>();
```

#### Multi-Tenant Data Access Patterns

```typescript
// Service layer with tenant isolation
// services/StoryService.ts

export class StoryService {
  constructor(
    private tenantId: string,
    private userId: string
  ) {}

  async findAll(filters: StoryFilters = {}): Promise<Story[]> {
    return prisma.story.findMany({
      where: {
        tenantId: this.tenantId, // Always filter by tenant
        ...filters,
        // Additional security: only show published stories to students
        ...(this.isStudent() && { status: "published" }),
      },
      include: {
        versions: {
          where: { isPublished: true },
        },
        tags: true,
        creator: {
          select: { id: true, name: true }, // Don't expose sensitive data
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<Story | null> {
    const story = await prisma.story.findFirst({
      where: {
        id,
        tenantId: this.tenantId, // Tenant isolation
      },
      include: {
        versions: true,
        tags: true,
      },
    });

    // Additional authorization check
    if (story && !this.canAccessStory(story)) {
      throw new ForbiddenError("Access denied to this story");
    }

    return story;
  }

  async create(data: CreateStoryData): Promise<Story> {
    // Validate user can create stories
    if (!this.canCreateStory()) {
      throw new ForbiddenError("Insufficient permissions to create stories");
    }

    return prisma.story.create({
      data: {
        ...data,
        tenantId: this.tenantId,
        createdBy: this.userId,
        status: "draft", // Always start as draft
      },
    });
  }

  async update(id: string, data: UpdateStoryData): Promise<Story> {
    const story = await this.findById(id);
    if (!story) {
      throw new NotFoundError("Story not found");
    }

    // Check ownership or appropriate role
    if (!this.canEditStory(story)) {
      throw new ForbiddenError("Cannot edit this story");
    }

    return prisma.story.update({
      where: {
        id,
        tenantId: this.tenantId, // Double-check tenant isolation
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  private canAccessStory(story: Story): boolean {
    // Students can only access published stories
    if (this.isStudent()) {
      return story.status === "published";
    }

    // Content creators can access their own stories
    if (this.isContentCreator()) {
      return story.createdBy === this.userId || story.status === "published";
    }

    // Admins and curriculum leads can access all stories in their tenant
    return this.isAdmin() || this.isCurriculumLead();
  }

  private canEditStory(story: Story): boolean {
    // Only owner can edit draft stories
    if (story.status === "draft") {
      return story.createdBy === this.userId;
    }

    // Curriculum leads can edit any story in review
    if (story.status === "in_review") {
      return this.isCurriculumLead() || this.isAdmin();
    }

    // Published stories can only be edited by admins
    return this.isAdmin();
  }

  private canCreateStory(): boolean {
    return [
      "content_creator",
      "curriculum_lead",
      "admin",
      "super_admin",
    ].includes(this.userRole);
  }

  // Role checking helpers
  private isStudent(): boolean {
    return this.userRole === "student";
  }
  private isContentCreator(): boolean {
    return this.userRole === "content_creator";
  }
  private isCurriculumLead(): boolean {
    return this.userRole === "curriculum_lead";
  }
  private isAdmin(): boolean {
    return ["admin", "super_admin"].includes(this.userRole);
  }
}
```

#### Security Testing Examples

```typescript
// Security test examples
// __tests__/security/authorization.test.ts

describe("Authorization Security Tests", () => {
  describe("RBAC Tests", () => {
    it("should deny student access to admin endpoints", async () => {
      const studentToken = await generateTestToken({
        userId: "student-1",
        role: "student",
        tenantId: "tenant-1",
      });

      const response = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Forbidden");
    });

    it("should allow content creator to edit own stories", async () => {
      const creatorToken = await generateTestToken({
        userId: "creator-1",
        role: "content_creator",
        tenantId: "tenant-1",
      });

      const story = await createTestStory({
        createdBy: "creator-1",
        tenantId: "tenant-1",
        status: "draft",
      });

      const response = await request(app)
        .put(`/api/stories/${story.id}`)
        .set("Authorization", `Bearer ${creatorToken}`)
        .send({ title: "Updated Title" });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe("Updated Title");
    });

    it("should deny content creator editing others stories", async () => {
      const creatorToken = await generateTestToken({
        userId: "creator-1",
        role: "content_creator",
        tenantId: "tenant-1",
      });

      const story = await createTestStory({
        createdBy: "creator-2", // Different creator
        tenantId: "tenant-1",
        status: "draft",
      });

      const response = await request(app)
        .put(`/api/stories/${story.id}`)
        .set("Authorization", `Bearer ${creatorToken}`)
        .send({ title: "Hacked Title" });

      expect(response.status).toBe(403);
    });
  });

  describe("Multi-Tenancy Tests", () => {
    it("should prevent cross-tenant data access", async () => {
      const userToken = await generateTestToken({
        userId: "user-1",
        role: "admin",
        tenantId: "tenant-1",
      });

      const story = await createTestStory({
        tenantId: "tenant-2", // Different tenant
      });

      const response = await request(app)
        .get(`/api/stories/${story.id}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(404); // Should not find cross-tenant data
    });

    it("should isolate tenant data in list endpoints", async () => {
      const tenant1Token = await generateTestToken({
        userId: "user-1",
        role: "admin",
        tenantId: "tenant-1",
      });

      // Create stories in different tenants
      await createTestStory({ tenantId: "tenant-1", title: "Tenant 1 Story" });
      await createTestStory({ tenantId: "tenant-2", title: "Tenant 2 Story" });

      const response = await request(app)
        .get("/api/stories")
        .set("Authorization", `Bearer ${tenant1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe("Tenant 1 Story");
    });
  });

  describe("Input Validation Tests", () => {
    it("should reject malicious script injection", async () => {
      const token = await generateTestToken({
        userId: "user-1",
        role: "content_creator",
        tenantId: "tenant-1",
      });

      const maliciousData = {
        title: '<script>alert("XSS")</script>',
        content: "Normal content",
        storyType: "original",
        difficulty: "intermediate",
      };

      const response = await request(app)
        .post("/api/stories")
        .set("Authorization", `Bearer ${token}`)
        .send(maliciousData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should enforce content length limits", async () => {
      const token = await generateTestToken({
        userId: "user-1",
        role: "content_creator",
        tenantId: "tenant-1",
      });

      const oversizedData = {
        title: "Valid Title",
        content: "x".repeat(60000), // Exceeds 50k limit
        storyType: "original",
        difficulty: "intermediate",
      };

      const response = await request(app)
        .post("/api/stories")
        .set("Authorization", `Bearer ${token}`)
        .send(oversizedData);

      expect(response.status).toBe(400);
      expect(response.body.error.details.fieldErrors.content).toBeDefined();
    });
  });

  describe("Rate Limiting Tests", () => {
    it("should enforce login rate limits", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      // Make 6 failed login attempts
      for (let i = 0; i < 6; i++) {
        await request(app).post("/api/auth/login").send(loginData);
      }

      // 6th attempt should be rate limited
      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData);

      expect(response.status).toBe(429);
      expect(response.body.message).toContain("Too many login attempts");
    });
  });
});
```

## Components and Interfaces

> **📊 Component Diagrams**: See [Component Interaction Diagrams](./visual-architecture-diagrams.md#component-interaction-diagrams) for detailed visual representations of component relationships and data flow.

### Core Domain Models

#### User Management Domain

```typescript
// User entity với 11 role types
enum UserRole {
  student,
  coach,
  admin,
  super_admin,
  org_admin,
  curriculum_lead,
  content_creator,
  instructor,
  voice_artist,
  qa,
  guest,
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  preferences: UserPreferences;
  // ... other fields
}
```

#### Content Management Domain

```typescript
// Story types cho embedding method
enum StoryType {
  original, // Câu chuyện gốc tiếng Việt
  chemdanhtu, // Chêm danh từ tiếng Anh
  chemdongtu, // Chêm động từ tiếng Anh
  chemtinhtu, // Chêm tính từ tiếng Anh
  custom, // Chêm tùy chỉnh
}

interface Story {
  id: string;
  title: string;
  content: string;
  storyType: StoryType;
  difficulty: DifficultyLevel;
  chemRatio: number; // Tỷ lệ từ tiếng Anh (0-1)
  chunks: StoryChunk[];
  versions: StoryVersion[];
}
```

#### Learning Domain

```typescript
interface LearningSession {
  id: string;
  userId: string;
  storyId: string;
  startedAt: Date;
  endedAt?: Date;
  timeSpentSec: number;
  interactionCount: number;
  progress: LearningProgress;
}

interface VocabularyProgress {
  word: string;
  status: "new" | "reviewing" | "mastered";
  encounters: number;
  masteryLevel: number;
  nextReview: Date;
}
```

### API Architecture

#### RESTful API Design

```
/api/
├── auth/                 # Authentication endpoints
│   ├── login            # POST - User login
│   ├── register         # POST - User registration
│   ├── refresh          # POST - Token refresh
│   └── logout           # POST - User logout
├── learning/            # Learning-specific endpoints
│   ├── stories/         # Story management
│   │   ├── [id]         # GET, PUT, DELETE specific story
│   │   └── route.ts     # GET, POST stories list
│   ├── progress/        # Progress tracking
│   │   ├── user         # GET user progress
│   │   ├── update       # POST progress update
│   │   └── analytics    # GET learning analytics
│   ├── exercises/       # Exercise management
│   │   ├── story/[id]   # GET exercises for story
│   │   └── submit       # POST exercise submission
│   └── vocabulary/      # Vocabulary management
│       └── progress     # GET/POST vocabulary progress
├── admin/               # Admin-only endpoints
│   ├── users/           # User management
│   ├── content/         # Content management
│   └── analytics/       # System analytics
└── me/                  # Current user endpoints
    ├── profile          # GET, PUT user profile
    ├── preferences      # GET, PUT user preferences
    └── progress         # GET user learning progress
```

#### API Response Standards

```typescript
// Success response format
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId: string;
  };
}

// Error response format
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}
```

### State Management Architecture

#### TanStack Query (Server State)

```typescript
// Query keys factory pattern
export const learningKeys = {
  all: ["learning"] as const,
  stories: () => [...learningKeys.all, "stories"] as const,
  story: (id: string) => [...learningKeys.stories(), id] as const,
  progress: () => [...learningKeys.all, "progress"] as const,
  userProgress: (userId: string) =>
    [...learningKeys.progress(), userId] as const,
};

// Custom hooks for data fetching
export function useStories(filters: StoryFilters) {
  return useQuery({
    queryKey: [...learningKeys.stories(), filters],
    queryFn: () => fetchStories(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

#### Zustand (Client State)

```typescript
// Feature-based store pattern
interface LearningStore {
  // UI State
  currentStory: string | null;
  isPlaying: boolean;
  playbackSpeed: number;

  // Filters & Pagination
  filters: StoryFilters;
  pagination: PaginationState;

  // Actions
  setCurrentStory: (id: string | null) => void;
  updateFilters: (filters: Partial<StoryFilters>) => void;
  resetState: () => void;
}

export const useLearningStore = create<LearningStore>((set, get) => ({
  // Implementation
}));
```

## Data Models

> **📊 Database ERD**: See [Database ERD Diagrams](./visual-architecture-diagrams.md#database-erd-diagrams) for comprehensive entity relationship diagrams showing all database relationships and constraints.

### Database Schema Overview

Hệ thống sử dụng PostgreSQL với 40+ entities được tổ chức thành các domain logic:

#### Multi-tenancy & Security Domain

- **Tenant**: Organization isolation
- **Role, Permission**: RBAC system
- **UserToRole, RolePermission**: Permission mappings
- **ResourcePolicy**: ABAC policies
- **AuditLog**: Complete audit trail

#### Core Learning Domain

- **User**: 11 role types với tenant support
- **Course, Unit, Lesson**: Learning content hierarchy
- **Story, StoryVersion, StoryChunk**: Story-based content
- **Vocabulary, GrammarPoint**: Learning materials

#### Assessment Domain

- **Exercise, Question, Choice**: Interactive exercises
- **Quiz, QuizResult**: Assessment system
- **UserProgress**: Learning progress tracking

#### Media Domain

- **Audio**: Audio assets với WaveSurfer.js support
- **Tag, StoryTag**: Content categorization

### Key Relationships

```mermaid
erDiagram
    Tenant ||--o{ User : contains
    User ||--o{ Story : creates
    Story ||--o{ StoryVersion : has
    Story ||--o{ StoryChunk : contains
    Lesson ||--o{ Story : includes
    Story ||--o{ Exercise : generates
    User ||--o{ UserProgress : tracks
    User ||--o{ LearningSession : participates
    Story ||--o{ Audio : has
    User ||--o{ QuizResult : achieves
```

### Data Flow Patterns

#### Learning Session Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant A as API
    participant D as Database
    participant R as Redis

    U->>C: Start learning story
    C->>A: POST /api/learning/sessions
    A->>D: Create learning session
    A->>R: Cache session data
    A-->>C: Session ID

    loop During Learning
        U->>C: Interact with content
        C->>A: POST /api/learning/progress/update
        A->>D: Update progress
        A->>R: Update cache
    end

    U->>C: Complete story
    C->>A: POST /api/learning/sessions/complete
    A->>D: Finalize session
    A->>R: Clear cache
    A-->>C: Final results
```

#### Story Content Processing Flow

```mermaid
flowchart TD
    subgraph "Content Creation"
        A[Original Vietnamese Story] --> B[Story Type Selection]
        B --> C{Embedding Type}
        C -->|chemdanhtu| D[Noun Embedding]
        C -->|chemdongtu| E[Verb Embedding]
        C -->|chemtinhtu| F[Adjective Embedding]
        C -->|custom| G[Custom Embedding]
    end

    subgraph "Processing Pipeline"
        D --> H[Text Analysis]
        E --> H
        F --> H
        G --> H
        H --> I[Vocabulary Extraction]
        I --> J[Difficulty Assessment]
        J --> K[Audio Generation]
        K --> L[Exercise Creation]
    end

    subgraph "Storage & Delivery"
        L --> M[Database Storage]
        M --> N[Cache Layer]
        N --> O[Content Delivery]
        O --> P[User Interface]
    end

    subgraph "Learning Analytics"
        P --> Q[User Interaction]
        Q --> R[Progress Tracking]
        R --> S[Adaptive Difficulty]
        S --> T[Personalized Recommendations]
    end
```

#### Multi-Tenant Data Isolation Flow

```mermaid
flowchart LR
    subgraph "Request Processing"
        A[User Request] --> B[JWT Token]
        B --> C[Extract Tenant ID]
        C --> D[Middleware Validation]
    end

    subgraph "Data Access Layer"
        D --> E[Prisma Middleware]
        E --> F{Query Type}
        F -->|Read| G[Add Tenant Filter]
        F -->|Write| H[Inject Tenant ID]
        F -->|Delete| I[Verify Tenant Ownership]
    end

    subgraph "Database Operations"
        G --> J[Filtered Query]
        H --> K[Tenant-Scoped Insert]
        I --> L[Authorized Delete]
        J --> M[(PostgreSQL)]
        K --> M
        L --> M
    end

    subgraph "Response Processing"
        M --> N[Result Validation]
        N --> O[Tenant Data Only]
        O --> P[Response to Client]
    end
```

### Critical User Journey Sequence Diagrams

#### Complete Learning Journey

```mermaid
sequenceDiagram
    participant U as User
    participant WEB as Web App
    participant AUTH as Auth Service
    participant LEARN as Learning API
    participant STORY as Story Service
    participant PROG as Progress Service
    participant VOCAB as Vocabulary Service
    participant DB as Database
    participant CACHE as Redis Cache

    Note over U,CACHE: User Authentication
    U->>WEB: Navigate to /learning
    WEB->>AUTH: Check authentication
    AUTH->>CACHE: Validate JWT token
    CACHE-->>AUTH: Token valid
    AUTH-->>WEB: User authenticated

    Note over U,CACHE: Story Selection
    WEB->>LEARN: GET /api/learning/stories
    LEARN->>STORY: Fetch user stories
    STORY->>CACHE: Check cached stories
    CACHE-->>STORY: Cache miss
    STORY->>DB: Query stories by tenant/difficulty
    DB-->>STORY: Return story list
    STORY->>CACHE: Cache story list
    STORY-->>LEARN: Stories data
    LEARN-->>WEB: Stories response
    WEB-->>U: Display story selection

    Note over U,CACHE: Story Reading Session
    U->>WEB: Select story
    WEB->>LEARN: POST /api/learning/sessions
    LEARN->>PROG: Create learning session
    PROG->>DB: Insert session record
    DB-->>PROG: Session created
    PROG->>CACHE: Cache session data
    PROG-->>LEARN: Session ID
    LEARN-->>WEB: Session started

    Note over U,CACHE: Interactive Learning
    loop Vocabulary Interactions
        U->>WEB: Click embedded word
        WEB->>VOCAB: GET /api/learning/vocabulary/progress
        VOCAB->>CACHE: Check word progress
        CACHE-->>VOCAB: Progress data
        VOCAB-->>WEB: Word details & progress
        WEB-->>U: Show vocabulary popup

        U->>WEB: Mark word as learned
        WEB->>VOCAB: POST /api/learning/vocabulary/progress
        VOCAB->>DB: Update word mastery
        VOCAB->>CACHE: Update cached progress
        DB-->>VOCAB: Progress updated
        VOCAB-->>WEB: Success response
    end

    Note over U,CACHE: Progress Tracking
    loop Progress Updates
        WEB->>PROG: POST /api/learning/progress/update
        PROG->>DB: Update session progress
        PROG->>CACHE: Update cached progress
        DB-->>PROG: Progress saved
        PROG-->>WEB: Progress updated
    end

    Note over U,CACHE: Session Completion
    U->>WEB: Complete story
    WEB->>LEARN: POST /api/learning/sessions/complete
    LEARN->>PROG: Finalize session
    PROG->>DB: Update final session data
    PROG->>CACHE: Clear session cache
    DB-->>PROG: Session completed
    PROG-->>LEARN: Completion data
    LEARN-->>WEB: Final results
    WEB-->>U: Show completion summary
```

#### Content Creation & Approval Workflow

```mermaid
sequenceDiagram
    participant CC as Content Creator
    participant WEB as Web App
    participant AUTH as Auth Service
    participant CONTENT as Content API
    participant AI as AI Service
    participant APPROVAL as Approval Service
    participant ADMIN as Admin
    participant DB as Database

    Note over CC,DB: Content Creation
    CC->>WEB: Create new story
    WEB->>AUTH: Verify content_creator role
    AUTH-->>WEB: Role verified

    CC->>WEB: Submit story content
    WEB->>CONTENT: POST /api/admin/stories
    CONTENT->>AI: Generate embedding suggestions
    AI-->>CONTENT: Embedding recommendations
    CONTENT->>DB: Save draft story
    DB-->>CONTENT: Story saved
    CONTENT-->>WEB: Draft created
    WEB-->>CC: Story draft ready

    Note over CC,DB: AI-Assisted Enhancement
    CC->>WEB: Request story remix
    WEB->>CONTENT: POST /api/admin/stories/remix
    CONTENT->>AI: Generate story variations
    AI-->>CONTENT: Multiple versions
    CONTENT->>DB: Save story versions
    DB-->>CONTENT: Versions saved
    CONTENT-->>WEB: Remix options
    WEB-->>CC: Show remix variations

    Note over CC,DB: Approval Process
    CC->>WEB: Submit for approval
    WEB->>APPROVAL: POST /api/admin/stories/submit
    APPROVAL->>DB: Update story status to 'pending'
    APPROVAL->>ADMIN: Notify admin for review
    DB-->>APPROVAL: Status updated
    APPROVAL-->>WEB: Submitted for review

    Note over CC,DB: Admin Review
    ADMIN->>WEB: Review story
    WEB->>CONTENT: GET /api/admin/stories/pending
    CONTENT->>DB: Fetch pending stories
    DB-->>CONTENT: Pending stories
    CONTENT-->>WEB: Stories for review

    alt Story Approved
        ADMIN->>WEB: Approve story
        WEB->>APPROVAL: POST /api/admin/stories/approve
        APPROVAL->>DB: Update status to 'published'
        APPROVAL->>CC: Notify approval
        DB-->>APPROVAL: Story published
    else Story Rejected
        ADMIN->>WEB: Reject with feedback
        WEB->>APPROVAL: POST /api/admin/stories/reject
        APPROVAL->>DB: Update status to 'rejected'
        APPROVAL->>CC: Notify rejection with feedback
        DB-->>APPROVAL: Story rejected
    end
```

#### Offline Learning Synchronization

```mermaid
sequenceDiagram
    participant U as User
    participant PWA as PWA Client
    participant SW as Service Worker
    participant SYNC as Sync Service
    participant API as Learning API
    participant DB as Database

    Note over U,DB: Offline Learning
    U->>PWA: Start learning (offline)
    PWA->>SW: Check cached content
    SW-->>PWA: Cached story data
    PWA-->>U: Display story

    loop Offline Interactions
        U->>PWA: Interact with content
        PWA->>SW: Store progress locally
        SW->>SW: IndexedDB storage
        SW-->>PWA: Progress saved locally
    end

    Note over U,DB: Connection Restored
    PWA->>SYNC: Detect online status
    SYNC->>SW: Retrieve offline progress
    SW-->>SYNC: Local progress data

    Note over U,DB: Data Synchronization
    SYNC->>API: POST /api/learning/progress/sync
    API->>DB: Merge offline progress

    alt Sync Successful
        DB-->>API: Progress merged
        API-->>SYNC: Sync successful
        SYNC->>SW: Clear local cache
        SW-->>SYNC: Cache cleared
        SYNC-->>PWA: Sync completed
        PWA-->>U: Progress synchronized
    else Sync Conflict
        DB-->>API: Conflict detected
        API-->>SYNC: Conflict resolution needed
        SYNC-->>PWA: Show conflict resolution
        PWA-->>U: Choose resolution strategy
        U->>PWA: Select resolution
        PWA->>SYNC: Resolution choice
        SYNC->>API: POST /api/learning/progress/resolve
        API->>DB: Apply resolution
        DB-->>API: Conflict resolved
        API-->>SYNC: Resolution complete
        SYNC-->>PWA: Sync completed
    end
```

## Error Handling

### Error Classification

#### Client-Side Errors

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Error boundary for React components
export class LearningErrorBoundary extends Component {
  // Implementation for graceful error handling
}
```

#### Server-Side Errors

```typescript
// Standardized error responses
export const errorHandler = (error: unknown, req: NextRequest) => {
  if (error instanceof PrismaClientKnownRequestError) {
    return handleDatabaseError(error);
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  // Default error handling
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
};
```

### Error Recovery Strategies

#### Optimistic Updates

```typescript
// TanStack Query optimistic updates
const updateProgressMutation = useMutation({
  mutationFn: updateProgress,
  onMutate: async (newProgress) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: progressKeys.user(userId) });

    // Snapshot previous value
    const previousProgress = queryClient.getQueryData(
      progressKeys.user(userId)
    );

    // Optimistically update
    queryClient.setQueryData(progressKeys.user(userId), newProgress);

    return { previousProgress };
  },
  onError: (err, newProgress, context) => {
    // Rollback on error
    queryClient.setQueryData(
      progressKeys.user(userId),
      context?.previousProgress
    );
  },
});
```

#### Retry Mechanisms

```typescript
// API client with exponential backoff
export const apiClient = new ApiClient({
  retries: 3,
  retryDelay: (attempt) => Math.pow(2, attempt) * 1000,
  retryCondition: (error) => {
    return error.status >= 500 || error.status === 429;
  },
});
```

## Testing Strategy

### Testing Pyramid

#### Unit Tests (Jest + Testing Library)

```typescript
// Component testing example
describe('StoryReader', () => {
  it('should highlight embedded English words', () => {
    render(<StoryReader story={mockStoryWithEmbedding} />);

    expect(screen.getByText('store')).toHaveClass('embedded-word');
    expect(screen.getByText('bread')).toHaveClass('embedded-word');
  });

  it('should track vocabulary encounters', () => {
    const onVocabEncounter = jest.fn();
    render(
      <StoryReader
        story={mockStory}
        onVocabEncounter={onVocabEncounter}
      />
    );

    fireEvent.click(screen.getByText('store'));
    expect(onVocabEncounter).toHaveBeenCalledWith('store');
  });
});
```

#### Integration Tests

```typescript
// API route testing
describe("/api/learning/progress/update", () => {
  it("should update user progress correctly", async () => {
    const mockUser = await createMockUser();
    const mockStory = await createMockStory();

    const response = await POST(
      new NextRequest("http://localhost/api/learning/progress/update", {
        method: "POST",
        body: JSON.stringify({
          storyId: mockStory.id,
          timeSpent: 300,
          wordsLearned: ["store", "bread"],
        }),
      })
    );

    expect(response.status).toBe(200);

    const progress = await getUserProgress(mockUser.id, mockStory.id);
    expect(progress.timeSpentSec).toBe(300);
  });
});
```

#### E2E Tests (Playwright - Planned)

```typescript
// User journey testing
test("complete learning flow", async ({ page }) => {
  await page.goto("/login");
  await page.fill("[data-testid=email]", "student@example.com");
  await page.fill("[data-testid=password]", "password");
  await page.click("[data-testid=login-button]");

  await page.goto("/learning");
  await page.click("[data-testid=story-card]:first-child");

  // Test story reading experience
  await expect(page.locator("[data-testid=story-content]")).toBeVisible();

  // Test vocabulary interaction
  await page.click(".embedded-word:first-child");
  await expect(page.locator("[data-testid=vocabulary-popup]")).toBeVisible();

  // Test progress tracking
  await page.click("[data-testid=complete-story]");
  await expect(page.locator("[data-testid=progress-updated]")).toBeVisible();
});
```

### Quality Assurance

#### Code Quality Gates

- **ESLint**: Strict TypeScript rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks
- **SonarQube**: Code quality analysis (planned)

#### Performance Testing

- **Lighthouse CI**: Core Web Vitals monitoring
- **Bundle Analyzer**: JavaScript bundle optimization
- **Database Query Analysis**: Prisma query performance

#### Security Testing

- **OWASP ZAP**: Security vulnerability scanning
- **Snyk**: Dependency vulnerability checking
- **JWT Security**: Token validation testing

## Security Architecture

### Authentication & Authorization

#### JWT Token Management

```typescript
// Token structure
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  permissions: string[];
  iat: number;
  exp: number;
}

// Token refresh strategy
class TokenManager {
  private refreshThreshold = 5 * 60 * 1000; // 5 minutes

  async getValidToken(): Promise<string | null> {
    const token = this.getStoredToken();

    if (this.isExpiringSoon(token)) {
      return await this.refreshToken();
    }

    return token;
  }
}
```

#### CASL Authorization System

```typescript
// Permission definitions
export const defineAbilityFor = (user: User) => {
  const { can, cannot, build } = new AbilityBuilder(PrismaAbility);

  if (user.role === "super_admin") {
    can("manage", "all");
  } else if (user.role === "content_creator") {
    can(["create", "read", "update"], "Story", {
      tenantId: user.tenantId,
      createdBy: user.id,
    });
    can("remix", "StoryVersion", { tenantId: user.tenantId });
  } else if (user.role === "student") {
    can("read", "Story", {
      tenantId: user.tenantId,
      status: "published",
    });
    can(["create", "read", "update"], "UserProgress", {
      userId: user.id,
    });
  }

  return build();
};
```

### Data Protection

#### Multi-Tenancy Isolation

```typescript
// Tenant-aware Prisma middleware
prisma.$use(async (params, next) => {
  if (params.model && TENANT_MODELS.includes(params.model)) {
    if (params.action === "findMany" || params.action === "findFirst") {
      params.args.where = {
        ...params.args.where,
        tenantId: getCurrentTenantId(),
      };
    }
  }

  return next(params);
});
```

#### Input Validation & Sanitization

```typescript
// Zod schemas for API validation
export const createStorySchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(10),
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
});

// API route with validation
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validatedData = createStorySchema.parse(body);

  // Process validated data
}
```

### Security Headers & CSRF Protection

```typescript
// Middleware security headers
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self'",
  ].join("; "),
};

// CSRF token validation
export const validateCSRF = async (request: NextRequest) => {
  const token = request.headers.get("X-CSRF-Token");
  const sessionToken = await getSessionCSRFToken(request);

  if (!token || token !== sessionToken) {
    throw new Error("Invalid CSRF token");
  }
};
```

## Performance Optimizations

### Frontend Performance

#### Code Splitting & Lazy Loading

```typescript
// Route-based code splitting
const LearningPage = lazy(() => import("@/app/learning/page"));
const AdminDashboard = lazy(() => import("@/app/admin/dashboard/page"));

// Component-based lazy loading
const StoryReader = lazy(() => import("@/components/learning/StoryReader"));
const AudioPlayer = lazy(() => import("@/components/learning/AudioPlayer"));
```

#### State Management Optimization

```typescript
// Zustand with selectors to prevent unnecessary re-renders
const useCurrentStory = () =>
  useLearningStore(useCallback((state) => state.currentStory, []));

// TanStack Query with optimized cache
export const storyQueryOptions = (id: string) => ({
  queryKey: learningKeys.story(id),
  queryFn: () => fetchStory(id),
  staleTime: 10 * 60 * 1000, // 10 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
});
```

### Backend Performance

#### Database Optimization

```sql
-- Strategic indexes for common queries
CREATE INDEX CONCURRENTLY idx_stories_tenant_status
ON stories (tenant_id, status)
WHERE status = 'published';

CREATE INDEX CONCURRENTLY idx_user_progress_user_lesson
ON user_progress (user_id, lesson_id);

CREATE INDEX CONCURRENTLY idx_learning_sessions_user_date
ON learning_sessions (user_id, started_at DESC);
```

#### Caching Strategy

```typescript
// Redis caching for frequently accessed data
export class CacheService {
  private redis = new Redis(process.env.REDIS_URL);

  async getStory(id: string): Promise<Story | null> {
    const cached = await this.redis.get(`story:${id}`);
    if (cached) return JSON.parse(cached);

    const story = await prisma.story.findUnique({ where: { id } });
    if (story) {
      await this.redis.setex(`story:${id}`, 3600, JSON.stringify(story));
    }

    return story;
  }

  async invalidateStory(id: string): Promise<void> {
    await this.redis.del(`story:${id}`);
  }
}
```

### Monitoring & Analytics

#### Performance Monitoring

```typescript
// Core Web Vitals tracking
export const trackWebVitals = (metric: Metric) => {
  switch (metric.name) {
    case "LCP":
      analytics.track("Largest Contentful Paint", {
        value: metric.value,
        rating: metric.rating,
      });
      break;
    case "FID":
      analytics.track("First Input Delay", {
        value: metric.value,
        rating: metric.rating,
      });
      break;
    case "CLS":
      analytics.track("Cumulative Layout Shift", {
        value: metric.value,
        rating: metric.rating,
      });
      break;
  }
};
```

#### Learning Analytics

```typescript
// User behavior tracking
export const trackLearningEvent = async (
  userId: string,
  event: LearningEvent
) => {
  await prisma.learningSession.update({
    where: { id: event.sessionId },
    data: {
      interactionCount: { increment: 1 },
      timeSpentSec: { increment: event.timeSpent },
    },
  });

  // Send to analytics service
  analytics.track("Learning Event", {
    userId,
    storyId: event.storyId,
    eventType: event.type,
    timestamp: new Date(),
  });
};
```

## Deployment Architecture

### Container Strategy

```dockerfile
# Multi-stage Docker build
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runtime
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

### Infrastructure as Code

```yaml
# docker-compose.yml for development
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/edtech
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: edtech
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Scalability Considerations

#### Horizontal Scaling

- **Load Balancing**: Multiple Next.js instances behind load balancer
- **Database Read Replicas**: Separate read/write database connections
- **CDN Integration**: Static assets served from CDN
- **Microservices Migration**: Future migration to microservices architecture

#### Vertical Scaling

- **Database Connection Pooling**: Optimized connection management
- **Memory Optimization**: Efficient caching strategies
- **CPU Optimization**: Background job processing

This comprehensive design document provides a complete overview of the system architecture, covering all major aspects from high-level design to implementation details. The system is built with scalability, security, and maintainability in mind, using modern technologies and best practices.

## Deployment and Infrastructure

### Deployment Strategies for Different Environments

The platform supports multiple deployment strategies tailored for different environments, ensuring optimal performance, security, and maintainability across development, staging, and production environments.

#### Development Environment

**Purpose**: Local development and testing with hot reloading and debugging capabilities.

```mermaid
graph TD
    subgraph "Development Setup"
        A[Developer Machine] --> B[Next.js Dev Server]
        B --> C[Local PostgreSQL]
        B --> D[Local Redis]
        B --> E[MailHog SMTP]
        B --> F[Local File Storage]
    end

    subgraph "Development Tools"
        G[Hot Reload] --> B
        H[TypeScript Watch] --> B
        I[Prisma Studio] --> C
        J[Redis Insight] --> D
        K[Storybook] --> L[Component Library]
    end

    subgraph "Testing Infrastructure"
        M[Jest Unit Tests] --> N[Test Database]
        O[Playwright E2E] --> P[Test Environment]
        Q[Vitest Integration] --> R[Mock Services]
    end
```

**Configuration**:

```bash
# Development Environment Variables
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/edtech_dev
REDIS_URL=redis://localhost:6379
SMTP_HOST=localhost
SMTP_PORT=1025
ENABLE_DEBUG_LOGGING=true
```

**Deployment Commands**:

```bash
# Start development environment
npm run dev

# Start with debugging
npm run dev:debug

# Start all services with Docker
docker-compose -f docker-compose.dev.yml up
```

#### Staging Environment

**Purpose**: Pre-production testing with production-like configuration and data.

```mermaid
graph TD
    subgraph "Staging Infrastructure"
        A[Load Balancer] --> B[Next.js App Instances]
        B --> C[Staging Database]
        B --> D[Redis Cluster]
        B --> E[S3 Bucket - Staging]
        B --> F[Email Service]
    end

    subgraph "CI/CD Pipeline"
        G[GitHub Actions] --> H[Build & Test]
        H --> I[Docker Build]
        I --> J[Deploy to Staging]
        J --> K[Health Checks]
        K --> L[Integration Tests]
    end

    subgraph "Monitoring"
        M[Application Logs] --> N[Log Aggregation]
        O[Metrics Collection] --> P[Monitoring Dashboard]
        Q[Error Tracking] --> R[Alert System]
    end
```

**Configuration**:

```bash
# Staging Environment Variables
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.edtech-platform.com
DATABASE_URL=postgresql://user:pass@staging-db:5432/edtech_staging
REDIS_URL=redis://staging-redis:6379
AWS_S3_BUCKET=edtech-staging-assets
ENABLE_PERFORMANCE_MONITORING=true
```

**Deployment Strategy**:

```yaml
# staging-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: edtech-staging
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    spec:
      containers:
        - name: app
          image: edtech-platform:staging
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
```

#### Production Environment

**Purpose**: Live production system with high availability, security, and performance.

```mermaid
graph TD
    subgraph "Production Infrastructure"
        A[CDN - CloudFlare] --> B[Load Balancer - AWS ALB]
        B --> C[Auto Scaling Group]
        C --> D[Next.js App Instances]
        D --> E[RDS PostgreSQL]
        D --> F[ElastiCache Redis]
        D --> G[S3 + CloudFront]
        D --> H[SES Email Service]
    end

    subgraph "Security Layer"
        I[WAF] --> A
        J[SSL/TLS Termination] --> B
        K[VPC Security Groups] --> D
        L[IAM Roles] --> G
    end

    subgraph "Monitoring & Observability"
        M[CloudWatch] --> N[Metrics & Logs]
        O[X-Ray Tracing] --> P[Performance Insights]
        Q[Sentry] --> R[Error Tracking]
        S[DataDog] --> T[APM & Infrastructure]
    end
```

**Configuration**:

```bash
# Production Environment Variables
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://edtech-platform.com
DATABASE_URL=postgresql://user:pass@prod-db.region.rds.amazonaws.com:5432/edtech_prod
REDIS_URL=redis://prod-redis.cache.amazonaws.com:6379
AWS_S3_BUCKET=edtech-production-assets
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_ERROR_TRACKING=true
```

**Blue-Green Deployment Strategy**:

```mermaid
graph LR
    subgraph "Blue Environment (Current)"
        A[Blue Load Balancer] --> B[Blue App Instances]
        B --> C[Shared Database]
        B --> D[Shared Redis]
    end

    subgraph "Green Environment (New)"
        E[Green Load Balancer] --> F[Green App Instances]
        F --> C
        F --> D
    end

    subgraph "Traffic Management"
        G[Route 53] --> H{Health Check}
        H -->|Healthy| E
        H -->|Fallback| A
    end
```

### Infrastructure Requirements and Dependencies

#### System Requirements

**Minimum Requirements**:

- **CPU**: 2 vCPUs per application instance
- **Memory**: 2GB RAM per application instance
- **Storage**: 20GB for application, 100GB+ for database
- **Network**: 1Gbps bandwidth for production

**Recommended Production Requirements**:

- **CPU**: 4+ vCPUs per application instance
- **Memory**: 4GB+ RAM per application instance
- **Storage**: SSD storage with 3000+ IOPS
- **Network**: 10Gbps bandwidth with CDN

#### Technology Stack Dependencies

```mermaid
graph TD
    subgraph "Runtime Dependencies"
        A[Node.js 18+] --> B[Next.js 15]
        B --> C[React 18]
        B --> D[TypeScript 5+]
    end

    subgraph "Database Layer"
        E[PostgreSQL 14+] --> F[Prisma ORM]
        G[Redis 7+] --> H[Cache & Sessions]
    end

    subgraph "External Services"
        I[AWS S3] --> J[Audio Storage]
        K[AWS SES] --> L[Email Delivery]
        M[CloudFlare] --> N[CDN & Security]
    end

    subgraph "Development Tools"
        O[Docker] --> P[Containerization]
        Q[GitHub Actions] --> R[CI/CD]
        S[Terraform] --> T[Infrastructure as Code]
    end
```

#### Infrastructure Components

**Core Infrastructure**:

```yaml
# infrastructure.yml
version: "3.8"
services:
  app:
    image: edtech-platform:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - database
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 2G
          cpus: "1.0"

  database:
    image: postgres:14
    environment:
      POSTGRES_DB: edtech_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: "2.0"

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: "0.5"

volumes:
  postgres_data:
  redis_data:
```

**AWS Infrastructure (Terraform)**:

```hcl
# main.tf
resource "aws_ecs_cluster" "edtech_cluster" {
  name = "edtech-production"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_rds_instance" "edtech_db" {
  identifier = "edtech-production-db"
  engine     = "postgres"
  engine_version = "14.9"
  instance_class = "db.t3.large"
  allocated_storage = 100
  storage_encrypted = true

  db_name  = "edtech_prod"
  username = var.db_username
  password = var.db_password

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = false
  final_snapshot_identifier = "edtech-final-snapshot"
}

resource "aws_elasticache_cluster" "edtech_redis" {
  cluster_id           = "edtech-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}
```

### Scalability Considerations and Performance Optimization

#### Horizontal Scaling Strategy

```mermaid
graph TD
    subgraph "Load Distribution"
        A[Application Load Balancer] --> B[Auto Scaling Group]
        B --> C[Instance 1]
        B --> D[Instance 2]
        B --> E[Instance N]
    end

    subgraph "Database Scaling"
        F[Primary DB] --> G[Read Replicas]
        G --> H[Read Replica 1]
        G --> I[Read Replica 2]
        J[Connection Pooling] --> F
        J --> G
    end

    subgraph "Cache Scaling"
        K[Redis Cluster] --> L[Master Nodes]
        K --> M[Replica Nodes]
        N[Cache Partitioning] --> K
    end

    subgraph "Storage Scaling"
        O[S3 Bucket] --> P[CloudFront CDN]
        P --> Q[Edge Locations]
        R[Multi-Region Replication] --> O
    end
```

#### Performance Optimization Strategies

**Application Level Optimizations**:

1. **Next.js Optimizations**:

```javascript
// next.config.js
const nextConfig = {
  // Enable SWC minification
  swcMinify: true,

  // Optimize images
  images: {
    domains: ["edtech-assets.s3.amazonaws.com"],
    formats: ["image/webp", "image/avif"],
  },

  // Enable compression
  compress: true,

  // Optimize bundle
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["@tanstack/react-query", "zustand"],
  },

  // Enable ISR
  generateStaticParams: true,
  revalidate: 3600, // 1 hour
};
```

2. **Database Optimizations**:

```sql
-- Index optimization for common queries
CREATE INDEX CONCURRENTLY idx_stories_difficulty_status
ON stories (difficulty, status)
WHERE status = 'published';

CREATE INDEX CONCURRENTLY idx_user_progress_user_story
ON user_progress (user_id, story_id, updated_at DESC);

CREATE INDEX CONCURRENTLY idx_vocabulary_frequency
ON vocabulary (frequency DESC)
WHERE status = 'active';

-- Partial indexes for better performance
CREATE INDEX CONCURRENTLY idx_active_users
ON users (last_active_at DESC)
WHERE status = 'active';
```

3. **Caching Strategy**:

```typescript
// Multi-layer caching implementation
interface CacheStrategy {
  // L1: In-memory cache (React Query)
  clientCache: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  };

  // L2: Redis cache
  serverCache: {
    ttl: 30 * 60, // 30 minutes
    keyPrefix: 'edtech:',
  };

  // L3: CDN cache
  cdnCache: {
    maxAge: 24 * 60 * 60, // 24 hours
    staleWhileRevalidate: 7 * 24 * 60 * 60, // 7 days
  };
}

// Cache implementation
class CacheManager {
  async get<T>(key: string): Promise<T | null> {
    // Try L1 cache first
    const clientCached = this.clientCache.get(key);
    if (clientCached) return clientCached;

    // Try L2 cache
    const serverCached = await this.redis.get(key);
    if (serverCached) {
      this.clientCache.set(key, JSON.parse(serverCached));
      return JSON.parse(serverCached);
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Set in all cache layers
    this.clientCache.set(key, value);
    await this.redis.setex(key, ttl || 1800, JSON.stringify(value));
  }
}
```

#### Auto-Scaling Configuration

```yaml
# auto-scaling.yml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: edtech-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: edtech-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

### Monitoring, Logging, and Alerting Setup

#### Comprehensive Monitoring Architecture

```mermaid
graph TD
    subgraph "Application Monitoring"
        A[Next.js App] --> B[Custom Metrics]
        A --> C[Performance Metrics]
        A --> D[Business Metrics]
    end

    subgraph "Infrastructure Monitoring"
        E[System Metrics] --> F[CPU, Memory, Disk]
        G[Network Metrics] --> H[Bandwidth, Latency]
        I[Database Metrics] --> J[Query Performance]
    end

    subgraph "Log Aggregation"
        K[Application Logs] --> L[Structured Logging]
        M[Access Logs] --> N[Request Tracking]
        O[Error Logs] --> P[Error Tracking]
    end

    subgraph "Monitoring Stack"
        B --> Q[Prometheus]
        C --> Q
        D --> Q
        F --> Q
        H --> Q
        J --> Q

        L --> R[Elasticsearch]
        N --> R
        P --> R

        Q --> S[Grafana Dashboard]
        R --> T[Kibana Dashboard]
    end

    subgraph "Alerting"
        S --> U[Alert Manager]
        T --> U
        U --> V[PagerDuty]
        U --> W[Slack]
        U --> X[Email]
    end
```

#### Logging Strategy

**Structured Logging Implementation**:

```typescript
// logger.ts
import winston from "winston";
import { ElasticsearchTransport } from "winston-elasticsearch";

interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  feature?: string;
  action?: string;
}

class Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: "edtech-platform",
        environment: process.env.NODE_ENV,
        version: process.env.APP_VERSION,
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        new ElasticsearchTransport({
          level: "info",
          clientOpts: {
            node: process.env.ELASTICSEARCH_URL,
          },
          index: "edtech-logs",
        }),
      ],
    });
  }

  info(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.logger.error(message, { error: error?.stack, ...context });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, context);
  }
}

export const logger = new Logger();
```

**Log Categories and Levels**:

```typescript
enum LogLevel {
  ERROR = "error", // System errors, exceptions
  WARN = "warn", // Performance issues, deprecated features
  INFO = "info", // Business events, user actions
  DEBUG = "debug", // Detailed debugging information
}

enum LogCategory {
  AUTH = "auth", // Authentication and authorization
  LEARNING = "learning", // Learning activities and progress
  API = "api", // API requests and responses
  DATABASE = "database", // Database operations
  CACHE = "cache", // Cache operations
  AUDIO = "audio", // Audio processing and playback
  PERFORMANCE = "performance", // Performance metrics
  SECURITY = "security", // Security events
}
```

#### Metrics Collection

**Custom Metrics Implementation**:

```typescript
// metrics.ts
import { register, Counter, Histogram, Gauge } from "prom-client";

// Business Metrics
export const userRegistrations = new Counter({
  name: "user_registrations_total",
  help: "Total number of user registrations",
  labelNames: ["source", "plan"],
});

export const storyCompletions = new Counter({
  name: "story_completions_total",
  help: "Total number of story completions",
  labelNames: ["difficulty", "story_type"],
});

export const vocabularyLearned = new Counter({
  name: "vocabulary_learned_total",
  help: "Total vocabulary words learned",
  labelNames: ["difficulty", "word_type"],
});

// Performance Metrics
export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const databaseQueryDuration = new Histogram({
  name: "database_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

// System Metrics
export const activeUsers = new Gauge({
  name: "active_users_current",
  help: "Current number of active users",
});

export const cacheHitRate = new Gauge({
  name: "cache_hit_rate",
  help: "Cache hit rate percentage",
  labelNames: ["cache_type"],
});
```

#### Alerting Rules

**Critical Alerts**:

```yaml
# alerts.yml
groups:
  - name: edtech-critical
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors per second"

      - alert: DatabaseConnectionFailure
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failure"
          description: "PostgreSQL database is unreachable"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is above 90%"

  - name: edtech-business
    rules:
      - alert: LowUserEngagement
        expr: rate(story_completions_total[1h]) < 10
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "Low user engagement detected"
          description: "Story completion rate is below threshold"

      - alert: AudioProcessingFailure
        expr: rate(audio_processing_errors_total[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Audio processing failures"
          description: "High rate of audio processing failures"
```

#### Monitoring Dashboard Configuration

**Grafana Dashboard JSON**:

```json
{
  "dashboard": {
    "title": "EdTech Platform - Production Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Active Users",
        "type": "singlestat",
        "targets": [
          {
            "expr": "active_users_current",
            "legendFormat": "Current Active Users"
          }
        ]
      },
      {
        "title": "Learning Progress",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(story_completions_total[1h])",
            "legendFormat": "Stories Completed/Hour"
          },
          {
            "expr": "rate(vocabulary_learned_total[1h])",
            "legendFormat": "Vocabulary Learned/Hour"
          }
        ]
      }
    ]
  }
}
```

#### Health Check Implementation

```typescript
// health.ts
interface HealthCheck {
  name: string;
  status: "healthy" | "unhealthy" | "degraded";
  responseTime: number;
  details?: any;
}

class HealthChecker {
  async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        name: "database",
        status: "healthy",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        name: "database",
        status: "unhealthy",
        responseTime: Date.now() - start,
        details: error.message,
      };
    }
  }

  async checkRedis(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await redis.ping();
      return {
        name: "redis",
        status: "healthy",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        name: "redis",
        status: "unhealthy",
        responseTime: Date.now() - start,
        details: error.message,
      };
    }
  }

  async checkS3(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET }).promise();
      return {
        name: "s3",
        status: "healthy",
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        name: "s3",
        status: "unhealthy",
        responseTime: Date.now() - start,
        details: error.message,
      };
    }
  }

  async getOverallHealth(): Promise<{
    status: "healthy" | "unhealthy" | "degraded";
    checks: HealthCheck[];
    timestamp: string;
  }> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkS3(),
    ]);

    const unhealthyCount = checks.filter(
      (c) => c.status === "unhealthy"
    ).length;
    const degradedCount = checks.filter((c) => c.status === "degraded").length;

    let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";
    if (unhealthyCount > 0) {
      overallStatus = "unhealthy";
    } else if (degradedCount > 0) {
      overallStatus = "degraded";
    }

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}

// Health check endpoint
export async function GET() {
  const healthChecker = new HealthChecker();
  const health = await healthChecker.getOverallHealth();

  const statusCode =
    health.status === "healthy"
      ? 200
      : health.status === "degraded"
        ? 200
        : 503;

  return Response.json(health, { status: statusCode });
}
```

This comprehensive deployment and infrastructure documentation covers all the requirements specified in the task:

1. **Deployment strategies for different environments** - Detailed configurations for development, staging, and production environments with specific deployment strategies
2. **Infrastructure requirements and dependency documentation** - Complete system requirements, technology stack dependencies, and infrastructure components
3. **Scalability considerations and performance optimization strategies** - Horizontal scaling, performance optimizations, auto-scaling configurations
4. **Monitoring, logging, and alerting setup** - Comprehensive monitoring architecture, structured logging, metrics collection, alerting rules, and health checks

The documentation addresses requirements 5.1, 5.2, 5.3, and 5.4 from the requirements document, providing DevOps engineers with complete information about deployment options, infrastructure needs, scaling strategies, and monitoring setup.
