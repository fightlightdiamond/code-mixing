# Visual Architecture Diagrams

> **📖 Documentation Guide**: For complete system documentation, see [README.md](./README.md). This document provides visual representations referenced throughout the design documentation.

This document contains comprehensive visual diagrams for the EdTech English Learning Platform, providing clear visual representations of system architecture, database relationships, component interactions, and user flows.

## 📋 Quick Navigation

| Diagram Category                                          | Purpose                 | Related Sections                                         |
| --------------------------------------------------------- | ----------------------- | -------------------------------------------------------- |
| [System Overview](#system-overview-diagrams)              | High-level architecture | [Design Overview](./design.md#overview)                  |
| [Database ERD](#database-erd-diagrams)                    | Data relationships      | [Data Models](./design.md#data-models)                   |
| [Component Interactions](#component-interaction-diagrams) | System behavior         | [Components](./design.md#components-and-interfaces)      |
| [User Flows](#user-flow-diagrams)                         | User journeys           | [Learning Requirements](./requirements.md#requirement-3) |

## 🔗 Cross-References

- **Architecture Details**: See [System Design](./design.md#architecture) for detailed explanations
- **Implementation**: See [Tasks](./tasks.md) for development roadmap
- **API Reference**: See [API Documentation](../../docs/API_DOCUMENTATION.md) for endpoint details
- **Database Schema**: See [Prisma Schema](../../prisma/schema.prisma) for implementation

## Table of Contents

1. [System Overview Diagrams](#system-overview-diagrams)
2. [Database ERD Diagrams](#database-erd-diagrams)
3. [Component Interaction Diagrams](#component-interaction-diagrams)
4. [User Flow Diagrams](#user-flow-diagrams)

---

## System Overview Diagrams

### High-Level System Architecture

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
        CASL[CASL Authorization]
    end

    subgraph "Application Layer"
        API[REST API Routes]
        SSR[Server-Side Rendering]
        ISR[Incremental Static Regeneration]
        PAGES[Page Components]
    end

    subgraph "Business Logic Layer"
        CORE[Core Services]
        FEATURES[Feature Modules]
        AUTH_SVC[Authorization Service]
        LEARNING[Learning Engine]
        ANALYTICS[Analytics Engine]
    end

    subgraph "Data Layer"
        PRISMA[Prisma ORM]
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis Cache)]
        S3[(AWS S3 - Audio)]
        INDEXEDDB[(IndexedDB - Offline)]
    end

    subgraph "External Services"
        AI[AI Services - Story Remix]
        EMAIL[Email Service]
        CDN[CDN - Static Assets]
        MONITORING[Monitoring & Logging]
    end

    WEB --> MIDDLEWARE
    PWA --> MIDDLEWARE
    MOBILE --> MIDDLEWARE

    MIDDLEWARE --> AUTH
    AUTH --> RATE
    RATE --> CORS
    CORS --> CASL

    CASL --> API
    CASL --> SSR
    CASL --> ISR
    CASL --> PAGES

    API --> CORE
    SSR --> CORE
    ISR --> CORE
    PAGES --> FEATURES

    CORE --> PRISMA
    FEATURES --> PRISMA
    AUTH_SVC --> PRISMA
    LEARNING --> PRISMA
    ANALYTICS --> PRISMA

    PRISMA --> POSTGRES
    CORE --> REDIS
    LEARNING --> S3
    PWA --> INDEXEDDB

    LEARNING --> AI
    CORE --> EMAIL
    WEB --> CDN
    ANALYTICS --> MONITORING
```

### Technology Stack Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js 15] --> B[React 18]
        B --> C[TypeScript]
        C --> D[Tailwind CSS]
        D --> E[Shadcn/ui Components]
        E --> F[PWA Service Worker]
    end

    subgraph "State Management"
        G[TanStack Query] --> H[Server State]
        I[Zustand] --> J[Client State]
        K[React Context] --> L[Auth State]
    end

    subgraph "Backend Services"
        M[Next.js API Routes] --> N[Middleware Stack]
        N --> O[Authentication]
        N --> P[Authorization CASL]
        N --> Q[Rate Limiting]
        N --> R[CORS Handling]
    end

    subgraph "Data Layer"
        S[Prisma ORM] --> T[PostgreSQL]
        U[Redis Cache] --> V[Session Store]
        W[IndexedDB] --> X[Offline Storage]
        Y[AWS S3] --> Z[Audio Assets]
    end

    subgraph "External Services"
        AA[AI Story Remix] --> BB[OpenAI/Custom]
        CC[Email Service] --> DD[SendGrid/SES]
        EE[CDN] --> FF[CloudFront/Vercel]
        GG[Monitoring] --> HH[Sentry/LogRocket]
    end

    subgraph "Infrastructure"
        II[Container Runtime] --> JJ[Docker]
        KK[Orchestration] --> LL[Kubernetes/ECS]
        MM[Load Balancer] --> NN[ALB/Nginx]
        OO[CI/CD] --> PP[GitHub Actions]
    end

    A --> G
    A --> I
    A --> K
    M --> S
    M --> U
    F --> W
    S --> T
    M --> AA
    M --> CC
    A --> EE
    A --> GG
    M --> II
    II --> KK
    KK --> MM
    PP --> II
```

### Deployment Architecture Overview

```mermaid
graph TB
    subgraph "Development Environment"
        A[Local Development] --> B[Docker Compose]
        B --> C[Local PostgreSQL]
        B --> D[Local Redis]
        B --> E[Mock Services]
    end

    subgraph "Staging Environment"
        F[Staging Deploy] --> G[Container Registry]
        G --> H[Staging Cluster]
        H --> I[Staging Database]
        H --> J[Staging Cache]
        H --> K[Test Data]
    end

    subgraph "Production Environment"
        L[Production Deploy] --> M[Blue-Green Deployment]
        M --> N[Production Cluster]
        N --> O[Primary Database]
        N --> P[Read Replicas]
        N --> Q[Production Cache]
        N --> R[CDN Distribution]
    end

    subgraph "Monitoring & Observability"
        S[Application Metrics] --> T[Prometheus]
        U[Log Aggregation] --> V[ELK Stack]
        W[Error Tracking] --> X[Sentry]
        Y[Performance] --> Z[New Relic]
    end

    subgraph "Security & Compliance"
        AA[WAF] --> BB[CloudFlare]
        CC[Secrets Management] --> DD[AWS Secrets]
        EE[Backup Strategy] --> FF[Automated Backups]
        GG[Compliance] --> HH[SOC2/GDPR]
    end

    A --> F
    F --> L
    N --> S
    N --> U
    N --> W
    N --> Y
    N --> AA
    N --> CC
    O --> EE
    L --> GG
```

### Multi-Tenant Architecture

```mermaid
graph TD
    subgraph "Tenant Isolation"
        A[Tenant A] --> B[Database Schema]
        C[Tenant B] --> B
        D[Tenant C] --> B
    end

    subgraph "Shared Infrastructure"
        B --> E[Application Layer]
        E --> F[Authentication]
        E --> G[Authorization]
        E --> H[Caching]
    end

    subgraph "Tenant-Specific Data"
        I[Users] --> J[Tenant ID Filter]
        K[Stories] --> J
        L[Progress] --> J
        M[Analytics] --> J
    end

    subgraph "Security Boundaries"
        J --> N[Row-Level Security]
        N --> O[API Middleware]
        O --> P[CASL Policies]
    end

    F --> J
    G --> P
    H --> N
```

---

## Database ERD Diagrams

### Complete System Entity Relationships

```mermaid
erDiagram
    %% Multi-Tenancy & Security
    TENANT ||--o{ USER : contains
    TENANT ||--o{ ROLE : scoped_to
    TENANT ||--o{ RESOURCE_POLICY : applies_to
    TENANT ||--o{ AUDIT_LOG : tracks

    USER ||--o{ USER_ROLE : has
    ROLE ||--o{ USER_ROLE : assigned_to
    ROLE ||--o{ ROLE_PERMISSION : has
    PERMISSION ||--o{ ROLE_PERMISSION : granted_to
    USER ||--o{ USER_PERMISSION : has_direct
    PERMISSION ||--o{ USER_PERMISSION : granted_directly

    %% Content Hierarchy
    TENANT ||--o{ COURSE : contains
    COURSE ||--o{ UNIT : contains
    UNIT ||--o{ LESSON : contains
    LESSON ||--o{ STORY : contains
    LESSON ||--o{ VOCABULARY : contains
    LESSON ||--o{ EXERCISE : contains
    LESSON ||--o{ QUIZ : contains

    %% Story & Content Management
    STORY ||--o{ STORY_VERSION : has
    STORY ||--o{ STORY_CHUNK : contains
    STORY ||--o{ AUDIO : has_audio
    STORY_VERSION ||--o{ AUDIO : version_audio
    STORY ||--o{ STORY_TAG : tagged_with
    TAG ||--o{ STORY_TAG : tags
    STORY_VERSION ||--o{ CLOZE_CONFIG : configured_for
    STORY_VERSION ||--o{ REMIX_JOB : remixed_from

    %% Assessment & Exercises
    EXERCISE ||--o{ QUESTION : contains
    QUESTION ||--o{ CHOICE : has_choices
    QUIZ ||--o{ QUIZ_QUESTION : includes
    QUIZ ||--o{ QUIZ_EXERCISE : includes
    QUIZ_QUESTION }o--|| QUESTION : references
    QUIZ_EXERCISE }o--|| EXERCISE : references

    %% User Progress & Analytics
    USER ||--o{ USER_PROGRESS : tracks
    LESSON ||--o{ USER_PROGRESS : tracked_for
    USER ||--o{ QUIZ_RESULT : completes
    QUIZ ||--o{ QUIZ_RESULT : results_in
    USER ||--o{ USER_VOCABULARY_PROGRESS : vocab_progress
    VOCABULARY ||--o{ USER_VOCABULARY_PROGRESS : tracked_vocab
    USER ||--o{ LEARNING_SESSION : participates_in
    LESSON ||--o{ LEARNING_SESSION : session_for
    STORY ||--o{ LEARNING_SESSION : story_session

    %% Workflow & Approval
    USER ||--o{ APPROVAL : requests
    USER ||--o{ APPROVAL : approves
    LESSON ||--o{ APPROVAL : requires_approval
    STORY_VERSION ||--o{ APPROVAL : requires_approval

    %% Communication & Feedback
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ FEEDBACK : provides
    LESSON ||--o{ FEEDBACK : feedback_for
    USER ||--o{ REFLECTION : creates
    LESSON ||--o{ REFLECTION : reflection_on

    %% Content Creation
    USER ||--o{ STORY : creates
    USER ||--o{ STORY_VERSION : authors
    USER ||--o{ AUDIO : records
    USER ||--o{ EXERCISE : designs
    USER ||--o{ QUIZ : creates
    USER ||--o{ COURSE : develops
    USER ||--o{ LESSON : teaches
```

### Authentication & Authorization Schema

```mermaid
erDiagram
    TENANT {
        string id PK
        string name
        string plan
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        enum role
        string tenantId FK
        boolean isActive
        datetime lastLoginAt
        json preferences
        datetime createdAt
        datetime updatedAt
    }

    ROLE {
        string id PK
        string name
        string slug UK
        string description
        string tenantScope
        string tenantId FK
        boolean isSystem
        datetime createdAt
        datetime updatedAt
    }

    PERMISSION {
        string id PK
        string name
        string slug UK
        string resource
        string action
        string description
        boolean isSystem
        datetime createdAt
        datetime updatedAt
    }

    USER_ROLE {
        string id PK
        string userId FK
        string roleId FK
        string tenantId FK
    }

    ROLE_PERMISSION {
        string id PK
        string roleId FK
        string permissionId FK
        string tenantId FK
    }

    USER_PERMISSION {
        string id PK
        string userId FK
        string permissionId FK
        string tenantId FK
        boolean granted
    }

    RESOURCE_POLICY {
        string id PK
        string name
        string resource
        json conditions
        string effect
        int priority
        boolean isActive
        string tenantId FK
        datetime createdAt
        datetime updatedAt
    }

    TENANT ||--o{ USER : contains
    TENANT ||--o{ ROLE : scoped_to
    TENANT ||--o{ USER_ROLE : scoped_to
    TENANT ||--o{ ROLE_PERMISSION : scoped_to
    TENANT ||--o{ USER_PERMISSION : scoped_to
    TENANT ||--o{ RESOURCE_POLICY : applies_to

    USER ||--o{ USER_ROLE : has
    ROLE ||--o{ USER_ROLE : assigned_to
    ROLE ||--o{ ROLE_PERMISSION : has
    PERMISSION ||--o{ ROLE_PERMISSION : granted_to
    USER ||--o{ USER_PERMISSION : has_direct
    PERMISSION ||--o{ USER_PERMISSION : granted_directly
```

### Learning Content Schema

```mermaid
erDiagram
    COURSE {
        string id PK
        string title
        text description
        enum level
        enum difficulty
        string thumbnailUrl
        int estimatedHours
        string tenantId FK
        enum status
        string createdBy FK
        datetime createdAt
        datetime updatedAt
    }

    UNIT {
        string id PK
        string courseId FK
        string title
        int order
        string tenantId FK
    }

    LESSON {
        string id PK
        string unitId FK
        string courseId FK
        string title
        text description
        int order
        int estimatedMinutes
        string[] prerequisites
        string tenantId FK
        enum status
        datetime publishedAt
        string createdBy FK
        string approvedBy FK
        datetime createdAt
        datetime updatedAt
    }

    STORY {
        string id PK
        string lessonId FK
        string title
        text content
        enum storyType
        enum difficulty
        int estimatedMinutes
        int wordCount
        float chemRatio
        string tenantId FK
        string createdBy FK
        enum status
        datetime createdAt
        datetime updatedAt
    }

    STORY_VERSION {
        string id PK
        string storyId FK
        int version
        text content
        boolean isApproved
        boolean isPublished
        float chemingRatio
        string chemingScopes
        string createdBy FK
        string tenantId FK
        datetime createdAt
        datetime updatedAt
    }

    STORY_CHUNK {
        string id PK
        string storyId FK
        int chunkOrder
        text chunkText
        enum type
    }

    VOCABULARY {
        string id PK
        string lessonId FK
        string word
        string meaning
        string example
        string audioUrl
    }

    AUDIO {
        string id PK
        string lessonId FK
        string storyId FK
        string storyVersionId FK
        string storageKey
        string voiceType
        int durationSec
        string tenantId FK
        string createdBy FK
        enum status
        datetime createdAt
        datetime updatedAt
    }

    COURSE ||--o{ UNIT : contains
    UNIT ||--o{ LESSON : contains
    LESSON ||--o{ STORY : contains
    LESSON ||--o{ VOCABULARY : contains
    STORY ||--o{ STORY_VERSION : has
    STORY ||--o{ STORY_CHUNK : contains
    STORY ||--o{ AUDIO : has_audio
    STORY_VERSION ||--o{ AUDIO : version_audio
```

### Progress & Analytics Schema

```mermaid
erDiagram
    USER_PROGRESS {
        string id PK
        string userId FK
        string lessonId FK
        enum status
        datetime lastViewedAt
        string tenantId FK
        datetime createdAt
        datetime updatedAt
    }

    LEARNING_SESSION {
        string id PK
        string userId FK
        string lessonId FK
        string storyId FK
        datetime startedAt
        datetime endedAt
        int timeSpentSec
        int interactionCount
        string tenantId FK
        datetime createdAt
    }

    USER_VOCABULARY_PROGRESS {
        string id PK
        string userId FK
        string vocabularyId FK
        enum status
        datetime lastReviewed
    }

    QUIZ_RESULT {
        string id PK
        string quizId FK
        string userId FK
        decimal score
        int timeSpentSec
        datetime attemptedAt
        string tenantId FK
        datetime createdAt
    }

    AUDIT_LOG {
        string id PK
        string userId FK
        string action
        string entityType
        string entityId
        json oldValues
        json newValues
        string tenantId FK
        datetime createdAt
    }

    NOTIFICATION {
        string id PK
        string userId FK
        string title
        text message
        enum type
        boolean isRead
        string actionUrl
        string tenantId FK
        datetime createdAt
    }

    USER ||--o{ USER_PROGRESS : tracks
    LESSON ||--o{ USER_PROGRESS : progress_for
    USER ||--o{ LEARNING_SESSION : participates
    LESSON ||--o{ LEARNING_SESSION : session_for
    STORY ||--o{ LEARNING_SESSION : story_session
    USER ||--o{ USER_VOCABULARY_PROGRESS : vocab_progress
    VOCABULARY ||--o{ USER_VOCABULARY_PROGRESS : tracked_vocab
    USER ||--o{ QUIZ_RESULT : completes
    QUIZ ||--o{ QUIZ_RESULT : results
    USER ||--o{ AUDIT_LOG : actions
    USER ||--o{ NOTIFICATION : receives
```

---

## Component Interaction Diagrams

### Learning Session Component Architecture

```mermaid
graph TD
    subgraph "Learning Page Container"
        A[LearningPage] --> B[StorySelector]
        A --> C[StoryReader]
        A --> D[AudioPlayer]
        A --> E[ProgressTracker]
        A --> F[ExercisePanel]
        A --> G[VocabularyPopup]
    end

    subgraph "State Management Layer"
        H[Learning Store] --> I[Story State]
        H --> J[Audio State]
        H --> K[Progress State]
        H --> L[Vocabulary State]
        H --> M[Exercise State]
    end

    subgraph "Service Layer"
        N[Story Service] --> O[API Client]
        P[Audio Service] --> O
        Q[Progress Service] --> O
        R[Vocabulary Service] --> O
        S[Exercise Service] --> O
    end

    subgraph "Data Layer"
        O --> T[TanStack Query]
        T --> U[Cache Layer]
        U --> V[IndexedDB]
        U --> W[Local Storage]
    end

    B --> I
    C --> I
    C --> L
    D --> J
    E --> K
    F --> M
    G --> L

    I --> N
    J --> P
    K --> Q
    L --> R
    M --> S
```

### Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant M as Middleware
    participant A as Auth Service
    participant D as Database
    participant P as Protected Resource

    U->>C: Login Request
    C->>A: Authenticate User
    A->>D: Validate Credentials
    D-->>A: User Data + Roles
    A->>A: Generate JWT Token
    A-->>C: Token + User Info
    C->>C: Store Token

    Note over C: User accesses protected resource

    C->>M: Request with JWT
    M->>M: Validate JWT
    M->>A: Get User Permissions
    A->>D: Query RBAC/ABAC Rules
    D-->>A: Permissions + Policies
    A->>A: Evaluate CASL Rules
    A-->>M: Authorization Result

    alt Authorized
        M->>P: Forward Request
        P-->>M: Resource Data
        M-->>C: Success Response
    else Unauthorized
        M-->>C: 403 Forbidden
    end
```

### Real-time Learning Analytics

```mermaid
graph LR
    subgraph "User Interactions"
        A[Word Click] --> E[Event Collector]
        B[Audio Play] --> E
        C[Exercise Submit] --> E
        D[Progress Update] --> E
    end

    subgraph "Event Processing"
        E --> F[Event Queue]
        F --> G[Analytics Pipeline]
        G --> H[Data Aggregator]
    end

    subgraph "Analysis Engine"
        H --> I[Learning Patterns]
        H --> J[Difficulty Assessment]
        H --> K[Engagement Metrics]
        H --> L[Performance Trends]
    end

    subgraph "Adaptive Responses"
        I --> M[Content Recommendations]
        J --> N[Difficulty Adjustment]
        K --> O[Engagement Strategies]
        L --> P[Learning Path Optimization]
    end

    subgraph "Feedback Loop"
        M --> Q[Updated UI]
        N --> Q
        O --> Q
        P --> Q
        Q --> A
    end
```

### Offline-First Synchronization

```mermaid
graph TD
    subgraph "Client-Side Storage"
        A[IndexedDB] --> B[Story Content]
        A --> C[User Progress]
        A --> D[Audio Files]
        A --> E[Exercise Data]
        A --> F[Vocabulary Data]
    end

    subgraph "Sync Management"
        G[Sync Queue] --> H[Pending Updates]
        H --> I[Conflict Resolution]
        I --> J[Merge Strategy]
    end

    subgraph "Network Detection"
        K[Online Status] --> L{Connected?}
        L -->|Yes| M[Sync Process]
        L -->|No| N[Offline Mode]
    end

    subgraph "Data Synchronization"
        M --> O[Upload Changes]
        O --> P[Download Updates]
        P --> Q[Update Local Cache]
        Q --> R[Notify Components]
    end

    subgraph "Conflict Resolution Strategies"
        I --> S{Conflict Type}
        S -->|Progress| T[Latest Wins]
        S -->|Content| U[Server Wins]
        S -->|Settings| V[User Choice]
    end

    B --> G
    C --> G
    E --> G
    F --> G

    G --> M
    N --> A

    T --> Q
    U --> Q
    V --> Q
```

### Story Embedding (Chem) Processing

```mermaid
graph TD
    subgraph "Content Input"
        A[Original Vietnamese Story] --> B[Content Analyzer]
        B --> C[Part-of-Speech Tagger]
        C --> D[Vocabulary Extractor]
    end

    subgraph "Embedding Engine"
        D --> E[Embedding Rules Engine]
        E --> F[Noun Embedding]
        E --> G[Verb Embedding]
        E --> H[Adjective Embedding]
        E --> I[Custom Embedding]
    end

    subgraph "Quality Control"
        F --> J[Readability Checker]
        G --> J
        H --> J
        I --> J
        J --> K[Difficulty Assessor]
        K --> L[Context Validator]
    end

    subgraph "Output Generation"
        L --> M[Story Chunks]
        M --> N[Audio Mapping]
        M --> O[Exercise Generation]
        M --> P[Vocabulary Extraction]
    end

    subgraph "Approval Workflow"
        N --> Q[Content Review]
        O --> Q
        P --> Q
        Q --> R[Instructor Approval]
        R --> S[Published Content]
    end
```

---

## User Flow Diagrams

### Complete Learning Journey

```mermaid
graph TD
    A[User Login] --> B[Dashboard]
    B --> C[Select Course]
    C --> D[Choose Lesson]
    D --> E[Story Selection]

    E --> F[Read Story]
    F --> G{Embedded Word?}
    G -->|Yes| H[Click Word]
    G -->|No| I[Continue Reading]

    H --> J[Vocabulary Popup]
    J --> K[Listen to Pronunciation]
    K --> L[Mark as Learned]
    L --> I

    I --> M{Story Complete?}
    M -->|No| F
    M -->|Yes| N[Start Exercises]

    N --> O[Exercise 1: Fill Blanks]
    O --> P[Submit Answer]
    P --> Q{Correct?}
    Q -->|Yes| R[Next Exercise]
    Q -->|No| S[Show Explanation]
    S --> T[Retry]
    T --> P

    R --> U[Exercise 2: Multiple Choice]
    U --> V[Submit Answer]
    V --> W{All Exercises Done?}
    W -->|No| R
    W -->|Yes| X[Show Results]

    X --> Y[Update Progress]
    Y --> Z[Recommendations]
    Z --> AA[Next Lesson/Story]
    AA --> D
```

### Story Creation & Approval Workflow

```mermaid
graph TD
    A[Content Creator Login] --> B[Create New Story]
    B --> C[Write Vietnamese Content]
    C --> D[Select Embedding Type]

    D --> E{Embedding Type}
    E -->|Automatic| F[AI-Assisted Embedding]
    E -->|Manual| G[Manual Word Selection]

    F --> H[Review AI Suggestions]
    H --> I[Adjust Embedding Ratio]
    G --> I

    I --> J[Preview Story]
    J --> K{Satisfied?}
    K -->|No| L[Edit Content]
    L --> I
    K -->|Yes| M[Submit for Review]

    M --> N[Instructor Review]
    N --> O{Approved?}
    O -->|No| P[Feedback & Revision]
    P --> L
    O -->|Yes| Q[Generate Audio]

    Q --> R[Voice Artist Recording]
    R --> S[Audio Review]
    S --> T{Audio Approved?}
    T -->|No| U[Re-record]
    U --> R
    T -->|Yes| V[Publish Story]

    V --> W[Generate Exercises]
    W --> X[Final Review]
    X --> Y[Make Available to Students]
```

### Adaptive Learning Path

```mermaid
graph TD
    A[Student Assessment] --> B[Determine Level]
    B --> C[Initial Story Recommendation]
    C --> D[Student Reads Story]

    D --> E[Track Interactions]
    E --> F[Analyze Performance]
    F --> G{Performance Level}

    G -->|High| H[Increase Difficulty]
    G -->|Medium| I[Maintain Level]
    G -->|Low| J[Decrease Difficulty]

    H --> K[More Complex Stories]
    I --> L[Similar Level Stories]
    J --> M[Simpler Stories]

    K --> N[Higher Embedding Ratio]
    L --> O[Maintain Embedding Ratio]
    M --> P[Lower Embedding Ratio]

    N --> Q[Advanced Vocabulary]
    O --> R[Current Vocabulary]
    P --> S[Basic Vocabulary]

    Q --> T[Complex Exercises]
    R --> U[Standard Exercises]
    S --> V[Simple Exercises]

    T --> W[Update Learning Profile]
    U --> W
    V --> W

    W --> X[Next Recommendation]
    X --> D
```

### Multi-Tenant User Management

```mermaid
graph TD
    A[Super Admin] --> B[Create Tenant]
    B --> C[Configure Tenant Settings]
    C --> D[Create Org Admin]

    D --> E[Org Admin Login]
    E --> F[Manage Tenant Users]
    F --> G{User Type}

    G -->|Instructor| H[Create Instructor Account]
    G -->|Student| I[Create Student Account]
    G -->|Content Creator| J[Create Creator Account]

    H --> K[Assign Instructor Roles]
    I --> L[Assign Student Roles]
    J --> M[Assign Creator Roles]

    K --> N[Set Permissions]
    L --> N
    M --> N

    N --> O[Configure Access Policies]
    O --> P[User Receives Invitation]
    P --> Q[User Accepts & Sets Password]
    Q --> R[User Access Granted]

    R --> S{User Role}
    S -->|Instructor| T[Access Teaching Tools]
    S -->|Student| U[Access Learning Content]
    S -->|Creator| V[Access Content Creation]

    T --> W[Tenant-Scoped Data Access]
    U --> W
    V --> W
```

### Offline Learning Experience

```mermaid
graph TD
    A[User Online] --> B[Download Content]
    B --> C[Select Stories for Offline]
    C --> D[Download Audio Files]
    D --> E[Cache Exercises]
    E --> F[Store Progress Data]

    F --> G[Go Offline]
    G --> H[Access Cached Content]
    H --> I[Read Stories Offline]
    I --> J[Listen to Cached Audio]
    J --> K[Complete Exercises]
    K --> L[Track Progress Locally]

    L --> M{Back Online?}
    M -->|No| N[Continue Offline]
    N --> I
    M -->|Yes| O[Sync Progress]

    O --> P[Upload Local Changes]
    P --> Q[Download Server Updates]
    Q --> R{Conflicts?}

    R -->|Yes| S[Resolve Conflicts]
    R -->|No| T[Merge Complete]

    S --> U{Resolution Strategy}
    U -->|Server Wins| V[Accept Server Data]
    U -->|Client Wins| W[Keep Local Data]
    U -->|Manual| X[User Chooses]

    V --> T
    W --> T
    X --> T

    T --> Y[Update UI]
    Y --> Z[Continue Learning]
```

### Performance Monitoring & Analytics

```mermaid
graph TD
    A[User Interaction] --> B[Event Capture]
    B --> C[Real-time Processing]
    C --> D[Metrics Calculation]

    D --> E{Metric Type}
    E -->|Performance| F[Response Time]
    E -->|Learning| G[Progress Metrics]
    E -->|Engagement| H[Interaction Metrics]
    E -->|Error| I[Error Tracking]

    F --> J[Performance Dashboard]
    G --> K[Learning Analytics]
    H --> L[Engagement Dashboard]
    I --> M[Error Monitoring]

    J --> N[Alert System]
    K --> O[Adaptive Recommendations]
    L --> P[Content Optimization]
    M --> Q[Bug Reports]

    N --> R{Threshold Exceeded?}
    R -->|Yes| S[Send Alert]
    R -->|No| T[Continue Monitoring]

    O --> U[Update Learning Path]
    P --> V[Improve Content]
    Q --> W[Fix Issues]

    S --> X[Admin Notification]
    U --> Y[Better User Experience]
    V --> Y
    W --> Y

    X --> Z[Take Action]
    Y --> A
    Z --> A
```

---

## Diagram Usage Guidelines

### For Developers

- Use **System Overview Diagrams** to understand overall architecture
- Reference **Component Interaction Diagrams** for implementation details
- Follow **Database ERD** for data modeling and relationships

### For Product Managers

- Review **User Flow Diagrams** for feature planning
- Use **Learning Journey** flows for user experience optimization
- Reference **Analytics Flow** for metrics and KPI tracking

### For DevOps Engineers

- Focus on **System Architecture** for deployment planning
- Use **Multi-Tenant Architecture** for infrastructure scaling
- Reference **Offline Sync** for caching and performance optimization

### For QA Engineers

- Use **User Flow Diagrams** for test case creation
- Reference **Component Interactions** for integration testing
- Follow **Error Handling** flows for edge case testing

---

## Maintenance Notes

These diagrams should be updated when:

- New features are added to the system
- Database schema changes occur
- Component architecture is modified
- User flows are updated or new flows are introduced
- Performance optimizations change the system architecture

Last Updated: January 2025

### Advanced Learning Analytics Pipeline

```mermaid
graph TD
    subgraph "Data Collection Layer"
        A[User Interactions] --> B[Event Collector]
        C[Learning Progress] --> B
        D[Audio Interactions] --> B
        E[Exercise Results] --> B
        F[Time Tracking] --> B
    end

    subgraph "Real-time Processing"
        B --> G[Event Stream]
        G --> H[Data Validation]
        H --> I[Event Enrichment]
        I --> J[Pattern Detection]
    end

    subgraph "Analytics Engine"
        J --> K[Learning Velocity]
        J --> L[Difficulty Assessment]
        J --> M[Engagement Scoring]
        J --> N[Retention Prediction]
        J --> O[Content Effectiveness]
    end

    subgraph "Machine Learning Models"
        K --> P[Adaptive Difficulty]
        L --> Q[Content Recommendation]
        M --> R[Engagement Optimization]
        N --> S[Intervention Triggers]
        O --> T[Content Quality Scoring]
    end

    subgraph "Personalization Engine"
        P --> U[Dynamic Story Selection]
        Q --> V[Vocabulary Prioritization]
        R --> W[UI Customization]
        S --> X[Learning Support]
        T --> Y[Content Curation]
    end

    subgraph "Feedback Loop"
        U --> Z[Updated Learning Experience]
        V --> Z
        W --> Z
        X --> Z
        Y --> Z
        Z --> A
    end

    subgraph "Reporting & Dashboards"
        K --> AA[Instructor Dashboard]
        L --> BB[Student Progress]
        M --> CC[Engagement Reports]
        N --> DD[Risk Alerts]
        O --> EE[Content Analytics]
    end
```

### Comprehensive Security Architecture

```mermaid
graph TD
    subgraph "Authentication Layer"
        A[User Login] --> B[Credential Validation]
        B --> C[Multi-Factor Auth]
        C --> D[JWT Token Generation]
        D --> E[Session Management]
    end

    subgraph "Authorization Layer"
        E --> F[RBAC Engine]
        F --> G[ABAC Policy Engine]
        G --> H[CASL Rule Evaluation]
        H --> I[Resource Access Control]
    end

    subgraph "Multi-Tenant Security"
        I --> J[Tenant Isolation]
        J --> K[Data Segregation]
        K --> L[Row-Level Security]
        L --> M[API Scoping]
    end

    subgraph "Data Protection"
        M --> N[Input Validation]
        N --> O[SQL Injection Prevention]
        O --> P[XSS Protection]
        P --> Q[CSRF Protection]
    end

    subgraph "Infrastructure Security"
        Q --> R[WAF Protection]
        R --> S[Rate Limiting]
        S --> T[DDoS Mitigation]
        T --> U[SSL/TLS Encryption]
    end

    subgraph "Compliance & Auditing"
        U --> V[Audit Logging]
        V --> W[GDPR Compliance]
        W --> X[Data Retention]
        X --> Y[Privacy Controls]
    end

    subgraph "Threat Detection"
        Y --> Z[Anomaly Detection]
        Z --> AA[Intrusion Detection]
        AA --> BB[Security Alerts]
        BB --> CC[Incident Response]
    end

    CC --> A
```

### Microservices Architecture (Future State)

```mermaid
graph TB
    subgraph "API Gateway"
        A[Kong/AWS API Gateway] --> B[Authentication Service]
        A --> C[Rate Limiting]
        A --> D[Load Balancing]
    end

    subgraph "Core Services"
        E[User Service] --> F[User Database]
        G[Content Service] --> H[Content Database]
        I[Learning Service] --> J[Learning Database]
        K[Analytics Service] --> L[Analytics Database]
    end

    subgraph "Supporting Services"
        M[Notification Service] --> N[Message Queue]
        O[File Service] --> P[Object Storage]
        Q[Search Service] --> R[Elasticsearch]
        S[Cache Service] --> T[Redis Cluster]
    end

    subgraph "External Integrations"
        U[AI Service] --> V[OpenAI/Custom ML]
        W[Email Service] --> X[SendGrid/SES]
        Y[CDN Service] --> Z[CloudFront/CloudFlare]
    end

    subgraph "Event-Driven Architecture"
        AA[Event Bus] --> BB[Learning Events]
        AA --> CC[User Events]
        AA --> DD[Content Events]
        AA --> EE[System Events]
    end

    A --> E
    A --> G
    A --> I
    A --> K

    E --> AA
    G --> AA
    I --> AA
    K --> AA

    AA --> M
    AA --> O
    AA --> Q

    I --> U
    M --> W
    G --> Y
```

### DevOps & CI/CD Pipeline

```mermaid
graph LR
    subgraph "Development"
        A[Developer] --> B[Git Commit]
        B --> C[Feature Branch]
        C --> D[Pull Request]
    end

    subgraph "CI Pipeline"
        D --> E[GitHub Actions]
        E --> F[Code Quality Check]
        F --> G[Unit Tests]
        G --> H[Integration Tests]
        H --> I[Security Scan]
        I --> J[Build Docker Image]
    end

    subgraph "CD Pipeline"
        J --> K[Push to Registry]
        K --> L[Deploy to Staging]
        L --> M[E2E Tests]
        M --> N[Performance Tests]
        N --> O[Security Tests]
    end

    subgraph "Production Deployment"
        O --> P{Manual Approval}
        P -->|Approved| Q[Blue-Green Deploy]
        P -->|Rejected| R[Rollback]
        Q --> S[Health Checks]
        S --> T[Traffic Routing]
    end

    subgraph "Monitoring"
        T --> U[Application Monitoring]
        U --> V[Log Aggregation]
        V --> W[Alerting]
        W --> X[Incident Response]
    end

    subgraph "Feedback Loop"
        X --> Y[Post-Incident Review]
        Y --> Z[Process Improvement]
        Z --> A
    end
```
