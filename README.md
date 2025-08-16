# 🎓 English Learning Platform - EdTech Application

A comprehensive English learning platform built with Next.js 15, featuring story-based learning with embedded vocabulary (Jewish-style story embedding method), advanced role-based access control, multi-tenancy support, and comprehensive learning analytics.

## 🚀 Overview

This is an advanced EdTech application designed for English language learning through interactive stories. The platform uses a unique **"Jewish-style story embedding"** method (truyện chêm) where English vocabulary is naturally integrated into Vietnamese stories to enhance learning retention and comprehension.

## ✨ Key Features

### 🎓 Learning Features

- **Story-based Learning**: Interactive stories with embedded English vocabulary using the Jewish-style embedding method
- **Multi-level Content**: 6 difficulty levels from Beginner to Proficient
- **Audio Integration**: Native pronunciation, user recording, and WaveSurfer.js audio visualization
- **Interactive Exercises**: Multiple choice, fill-in-the-blank, drag-and-drop, and short answer questions
- **Progress Tracking**: Comprehensive user progress monitoring with learning analytics
- **Vocabulary Management**: Spaced repetition system with vocabulary status tracking
- **Quiz System**: Adaptive quizzes with detailed results and performance analytics
- **Learning Sessions**: Real-time session tracking with interaction analytics
- **Remix System**: AI-powered story remixing with different embedding ratios

### 🔐 Advanced Security & Authorization

- **CASL Authorization**: Fine-grained permission system with RBAC + ABAC
- **Multi-tenancy**: Complete tenant isolation with resource policies
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **CSRF Protection**: Built-in CSRF token validation
- **Audit Logging**: Comprehensive audit trail for all system changes
- **Role-based Access**: 11 distinct user roles with granular permissions

### 🏗️ Technical Architecture

- **Next.js 15** with App Router and React 19
- **TypeScript** - Full type safety throughout the application
- **Prisma ORM** - Type-safe database operations with PostgreSQL
- **TanStack Query v5** - Advanced server state management with caching
- **Zustand** - Optimized client state management with persistence
- **Docker Compose** - Complete development environment setup
- **Storybook** - Component documentation and testing
- **Jest + Testing Library** - Comprehensive testing suite

### 🎨 Modern UI/UX

- **TailwindCSS 4** - Modern utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations and transitions
- **Responsive Design** - Mobile-first approach with adaptive layouts
- **RSuite Components** - Rich UI component library
- **Lucide Icons** - Beautiful and consistent iconography

## 🏗️ Architecture

### Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── admin/             # Admin dashboard with role-based access
│   │   ├── dashboard/     # Analytics and overview
│   │   ├── iam/          # Identity & Access Management
│   │   ├── lessons/      # Lesson management
│   │   ├── stories/      # Story content management
│   │   ├── users/        # User administration
│   │   └── quizzes/      # Quiz management
│   ├── api/              # RESTful API routes
│   │   ├── auth/         # JWT authentication endpoints
│   │   ├── dashboard/    # Analytics API
│   │   ├── lessons/      # Lesson CRUD operations
│   │   ├── stories/      # Story management API
│   │   ├── users/        # User management API
│   │   ├── quizzes/      # Quiz system API
│   │   └── vocabularies/ # Vocabulary management
│   ├── dashboard/        # User learning dashboard
│   ├── login/           # Authentication pages
│   └── profile/         # User profile management
├── core/                 # Core business logic
│   ├── api/             # Advanced API client with interceptors
│   │   ├── api.ts       # Main API client with token management
│   │   ├── tokenManager.ts # JWT token lifecycle management
│   │   ├── errorHandling.ts # Centralized error handling
│   │   └── monitoring.ts    # API performance monitoring
│   ├── auth/            # CASL authorization system
│   │   ├── ability.ts   # Permission definitions and rules
│   │   ├── subjects.ts  # CASL subjects and actions
│   │   ├── AbilityProvider.tsx # React context provider
│   │   └── casl.guard.ts # Server-side authorization guard
│   ├── state/           # State management utilities
│   │   ├── makeStore.ts # Zustand store factory
│   │   └── urlSync.ts   # URL synchronization utilities
│   └── prisma.ts        # Database client configuration
├── features/            # Feature-based modules
│   ├── auth/           # Authentication state management
│   ├── lessons/        # Lesson feature hooks and state
│   ├── stories/        # Story management features
│   ├── users/          # User management features
│   ├── vocabularies/   # Vocabulary learning features
│   └── quizzes/        # Quiz system features
├── components/         # Reusable UI components
│   ├── auth/          # Authentication components
│   ├── admin/         # Admin-specific components
│   ├── ui/            # Base UI components (Radix UI)
│   └── debug/         # Development debugging tools
├── lib/               # Utility libraries
│   ├── audit.ts       # Audit logging utilities
│   ├── notifications.ts # Notification system
│   ├── learning-analytics.ts # Learning analytics
│   └── logger.ts      # Structured logging
└── types/             # TypeScript type definitions
    ├── api.ts         # API response types
    ├── schema.ts      # Database schema types
    └── prisma-extensions.ts # Prisma type extensions

prisma/
├── schema.prisma      # Comprehensive database schema
├── seed.ts           # Database seeding with sample data
└── migrations/       # Database migration history
```

### Database Schema

The application uses a comprehensive PostgreSQL schema with **40+ entities** organized into logical domains:

#### 🏢 **Multi-tenancy & Security**

- `Tenant` - Organization isolation
- `Role`, `Permission` - RBAC system
- `UserToRole`, `RolePermission`, `UserPermission` - Permission mappings
- `ResourcePolicy` - ABAC policies
- `AuditLog` - Complete audit trail

#### 👥 **Core Entities**

- `User` - User accounts with 11 role types
- `Course`, `Unit`, `Lesson` - Learning content hierarchy
- `Story`, `StoryVersion`, `StoryChunk` - Story-based content
- `Vocabulary`, `GrammarPoint` - Learning materials

#### 🎵 **Media & Content**

- `Audio` - Audio assets with WaveSurfer.js support
- `Exercise`, `Question`, `Choice` - Interactive exercises
- `Quiz`, `QuizResult` - Assessment system
- `Tag`, `StoryTag` - Content categorization

#### 📊 **Progress & Analytics**

- `UserProgress` - Learning progress tracking
- `UserVocabularyProgress` - Vocabulary mastery
- `LearningSession` - Real-time session analytics
- `Notification` - User notification system
- `RemixJob` - AI story remixing jobs

#### 🔧 **System Features**

- `Approval` - Content approval workflow
- Advanced indexing for performance
- Comprehensive enum types for type safety
- Multi-level content status management

## 🛠️ Getting Started

### Prerequisites

- **Node.js 18+** (LTS recommended)
- **PostgreSQL 14+**
- **Redis** (for caching and sessions)
- **npm** or **yarn** package manager

### Quick Setup with Docker

The fastest way to get started is using Docker Compose:

```bash
# Clone the repository
git clone <repository>
cd my-app

# Start all services (PostgreSQL + Redis + MailHog)
docker-compose up -d

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env if needed (default values work with Docker)

# Set up database
npm run db:generate
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Manual Installation

1. **Clone and install dependencies:**

```bash
git clone <repository>
cd my-app
npm install
```

2. **Set up services:**

```bash
# Install and start PostgreSQL
# Install and start Redis
# Or use Docker: docker-compose up -d db redis
```

3. **Configure environment:**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/edtech_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
NEXTAUTH_SECRET="your-nextauth-secret"

# Redis (optional, for caching)
REDIS_URL="redis://localhost:6379"

# AWS S3 (for audio files)
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_S3_BUCKET="your-bucket-name"
# Set to "true" to stream files instead of redirecting to a signed URL
AUDIO_STREAM="false"
```

The endpoint `GET /api/learning/stories/[id]/audio` uses these settings to
either redirect clients to a signed S3 URL or stream the audio file directly
when `AUDIO_STREAM` is set to `true`.

4. **Set up the database:**

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

5. **Start development:**

```bash
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev              # Start with Turbopack (faster)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint code checking

# Database Operations
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes (dev)
npm run db:migrate       # Run migrations (production)
npm run db:seed          # Seed sample data
npm run db:studio        # Open Prisma Studio GUI
npm run db:reset         # Reset DB and reseed

# Testing
npm run test             # Run Jest tests
npm run test:watch       # Watch mode testing
npm run test:coverage    # Coverage report

# Documentation & Storybook
npm run storybook        # Start Storybook dev server
npm run build-storybook  # Build Storybook static files
```

### Default Login Credentials

After seeding, you can login with:

```
Super Admin:
Email: admin@example.com
Password: admin123

Student:
Email: student@example.com
Password: student123

Content Creator:
Email: creator@example.com
Password: creator123
```

## 🔐 Advanced Authorization System (CASL)

The application implements a sophisticated **RBAC + ABAC** authorization system using CASL with caching and performance optimizations:

### 👥 User Roles (11 Types)

| Role              | Description                | Key Permissions          |
| ----------------- | -------------------------- | ------------------------ |
| `super_admin`     | System super administrator | Full system access       |
| `admin`           | System administrator       | Manage all resources     |
| `org_admin`       | Organization administrator | Manage tenant resources  |
| `curriculum_lead` | Curriculum designer        | Create/approve content   |
| `content_creator` | Content creator            | Create stories/exercises |
| `instructor`      | Teaching instructor        | Assign lessons, grade    |
| `coach`           | Learning coach             | Mentor students, grade   |
| `voice_artist`    | Audio content creator      | Create/manage audio      |
| `qa`              | Quality assurance          | Review/approve content   |
| `student`         | Regular learner            | Access published content |
| `guest`           | Guest user                 | Limited public access    |

### 🎯 Actions & Subjects

**Actions**: `manage`, `create`, `read`, `update`, `delete`, `publish`, `approve`, `assign`, `grade`, `remix`, `export`

**Subjects**: `Tenant`, `User`, `Role`, `Course`, `Unit`, `Lesson`, `Story`, `StoryVersion`, `Quiz`, `Question`, `AudioAsset`, `UserProgress`, etc.

### 💡 Usage Examples

#### React Components with Guards

```jsx
import { Can } from '@/shared/components/Can';

// Conditional rendering based on permissions
<Can I="create" a="Lesson">
  <CreateLessonButton />
</Can>

<Can I="update" a={{ __type: 'Story', id: storyId, tenantId }}>
  <EditStoryButton />
</Can>

// Role-based components
<RoleBasedButton
  requiredRoles={['content_creator', 'curriculum_lead']}
  action="create"
  subject="Story"
>
  Create Story
</RoleBasedButton>
```

#### Programmatic Permission Checks

```typescript
import { useAbility } from '@/core/auth/AbilityProvider';

function StoryActions({ story }) {
  const ability = useAbility();

  const canEdit = ability.can('update', {
    __type: 'Story',
    id: story.id,
    tenantId: story.tenantId,
    createdBy: story.createdBy
  });

  const canPublish = ability.can('publish', {
    __type: 'Story',
    id: story.id,
    status: story.status,
    isApproved: story.isApproved
  });

  return (
    <div>
      {canEdit && <EditButton />}
      {canPublish && <PublishButton />}
    </div>
  );
}
```

#### Server-side Authorization

```typescript
import { caslGuardWithPolicies } from "@/core/auth/casl.guard";

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);

  // Define required permissions
  const rules = [
    { action: "update", subject: "Story" },
    { action: "publish", subject: "Story" },
  ];

  // Check permissions with ABAC policies
  const { allowed, error } = await caslGuardWithPolicies(rules, user);

  if (!allowed) {
    return NextResponse.json({ error }, { status: 403 });
  }

  // Proceed with authorized operation
}
```

### 🚀 Performance Features

- **Ability Caching**: Built-in 5-minute cache for ability objects
- **Lazy Loading**: Abilities built only when needed
- **Optimized Selectors**: Efficient permission checking
- **Background Cleanup**: Automatic cache expiration

## 🛠️ Technology Stack

### 🎯 Core Technologies

| Category      | Technology | Version | Purpose                         |
| ------------- | ---------- | ------- | ------------------------------- |
| **Framework** | Next.js    | 15.3.5  | React framework with App Router |
| **Runtime**   | React      | 19.0.0  | UI library with latest features |
| **Language**  | TypeScript | 5.x     | Type-safe development           |
| **Database**  | PostgreSQL | 14+     | Primary data storage            |
| **ORM**       | Prisma     | 6.13.0  | Type-safe database operations   |
| **Caching**   | Redis      | Latest  | Session and data caching        |

### 🔐 Authentication & Authorization

| Technology      | Purpose          | Features                       |
| --------------- | ---------------- | ------------------------------ |
| **CASL**        | Authorization    | RBAC + ABAC with caching       |
| **JWT**         | Authentication   | Secure token-based auth        |
| **bcryptjs**    | Password hashing | Secure password storage        |
| **NextAuth.js** | Auth framework   | OAuth and credential providers |

### 🎨 UI & Styling

| Technology        | Purpose               | Benefits                  |
| ----------------- | --------------------- | ------------------------- |
| **TailwindCSS**   | Utility-first CSS     | Rapid UI development      |
| **Radix UI**      | Accessible primitives | WCAG compliant components |
| **Framer Motion** | Animations            | Smooth transitions        |
| **RSuite**        | Component library     | Rich UI components        |
| **Lucide React**  | Icons                 | Beautiful icon system     |

### 📊 State Management

| Technology          | Use Case     | Benefits                   |
| ------------------- | ------------ | -------------------------- |
| **TanStack Query**  | Server state | Caching, background sync   |
| **Zustand**         | Client state | Lightweight, performant    |
| **React Hook Form** | Form state   | Validation and performance |

### 🧪 Testing & Quality

| Technology          | Purpose           | Coverage           |
| ------------------- | ----------------- | ------------------ |
| **Jest**            | Unit testing      | Core logic testing |
| **Testing Library** | Component testing | User-centric tests |
| **Storybook**       | Component docs    | Visual testing     |
| **ESLint**          | Code linting      | Code quality       |
| **Prettier**        | Code formatting   | Consistent style   |

### 🎵 Media & Audio

| Technology             | Purpose             | Features               |
| ---------------------- | ------------------- | ---------------------- |
| **WaveSurfer.js**      | Audio visualization | Interactive waveforms  |
| **React Audio Player** | Audio playback      | Custom audio controls  |
| **AWS S3**             | File storage        | Scalable media storage |

### 📦 Key Dependencies

````json
{
  "dependencies": {
    "@casl/ability": "^6.7.3",
    "@casl/react": "^5.0.0",
    "@tanstack/react-query": "^5.40.0",
    "@prisma/client": "^6.13.0",
    "next": "15.3.5",
    "react": "^19.0.0",
    "zustand": "^5.0.7",
    "framer-motion": "^11.11.17",
    "wavesurfer.js": "^7.8.6",
    "zod": "^3.23.8"
  }
}
```

## ⚡ Performance Optimizations

### 🚀 Next.js 15 Features

- **Turbopack**: Ultra-fast bundler for development (3x faster than Webpack)
- **App Router**: Optimized routing with nested layouts and streaming
- **Server Components**: Reduced client-side JavaScript bundle
- **Streaming SSR**: Progressive page loading with Suspense
- **Image Optimization**: Automatic WebP/AVIF conversion with lazy loading

### 🎯 Database Optimizations

- **Strategic Indexing**: 25+ optimized database indexes for fast queries
- **Query Optimization**: Prisma query analysis and N+1 prevention
- **Connection Pooling**: Efficient database connection management
- **Caching Layer**: Redis for frequently accessed data and sessions
- **Pagination**: Cursor-based pagination for large datasets

### 🔄 State Management Performance

- **Shallow Selectors**: Prevent unnecessary re-renders with Zustand
- **Selector Caching**: Memoized state selectors for complex computations
- **Lazy Loading**: Components and routes loaded on demand
- **Bundle Splitting**: Optimized code splitting per feature
- **Tree Shaking**: Unused code elimination in production builds

### 📊 Monitoring & Analytics

- **Performance Metrics**: Core Web Vitals tracking (LCP, FID, CLS)
- **Error Monitoring**: Comprehensive error logging and alerting
- **API Monitoring**: Response time and error rate tracking
- **User Analytics**: Learning behavior insights and engagement metrics
- **Resource Usage**: Memory and CPU monitoring in production

## 📚 Learning Method: Jewish-Style Story Embedding

The platform implements a unique **"Jewish-style story embedding"** (truyện chêm) methodology for enhanced vocabulary acquisition:

### 🎯 Core Methodology

1. **Original Vietnamese Stories** - Engaging base narratives that students can relate to
2. **Strategic English Embedding** - English vocabulary naturally woven into Vietnamese context
3. **Contextual Learning** - Words learned through meaningful story context rather than isolation
4. **Progressive Difficulty** - Embedding ratio increases with learner proficiency
5. **Audio-Visual Integration** - Native pronunciation with visual text highlighting

### 📊 Story Types & Embedding Strategies

| Story Type   | Description                 | Embedding Focus                       | Ratio  |
| ------------ | --------------------------- | ------------------------------------- | ------ |
| `original`   | Pure Vietnamese stories     | No embedding                          | 0%     |
| `chemdanhtu` | Noun-focused embedding      | English nouns in Vietnamese context   | 10-20% |
| `chemdongtu` | Verb-focused embedding      | English verbs with Vietnamese grammar | 15-25% |
| `chemtinhtu` | Adjective-focused embedding | English descriptors                   | 10-15% |
| `custom`     | Mixed embedding approach    | Balanced vocabulary types             | 20-40% |

### 🔄 Learning Workflow

```mermaid
graph TD
    A[Original Story] --> B[Vocabulary Selection]
    B --> C[Strategic Embedding]
    C --> D[Audio Recording]
    D --> E[Interactive Exercises]
    E --> F[Progress Tracking]
    F --> G[Spaced Repetition]
    G --> H[Mastery Assessment]
````

### 💡 Example Implementation

**Original Vietnamese**: "Cô gái đi đến cửa hàng để mua bánh mì."

**Embedded Version**: "Cô gái đi đến **store** để mua **bread**."

**Learning Benefits**:

- Context preservation maintains story flow
- Natural vocabulary acquisition through meaningful use
- Cultural bridge between Vietnamese and English
- Reduced cognitive load compared to pure English content

## 🎯 State Management Architecture

The application uses a sophisticated **dual-state** architecture optimized for performance:

### 🔄 TanStack Query (Server State)

- **API Data Caching** - Intelligent background synchronization
- **Optimistic Updates** - Immediate UI feedback with rollback
- **Background Refetching** - Keep data fresh automatically
- **Error Handling** - Comprehensive retry and error recovery
- **Infinite Queries** - Efficient pagination and loading

### 🏪 Zustand (Client State)

- **UI State Management** - Forms, modals, filters, pagination
- **URL Synchronization** - Shareable application state
- **Performance Optimized** - Shallow selectors and minimal re-renders
- **DevTools Integration** - Excellent debugging experience
- **Persistence Layer** - Optional state persistence

### 📁 Feature-based Organization

```typescript
// Example: Users feature state management
src/features/users/
├── hooks.ts          # TanStack Query hooks
├── state.ts          # Zustand UI state
└── components/       # Feature components

// Usage in components
function UserList() {
  // Server state (TanStack Query)
  const { data: users, isLoading } = useUsersQuery({ search, page });

  // UI state (Zustand)
  const { search, page } = useUsersFilters();
  const { setSearch, setPage } = useUsersActions();

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} />
      <UserTable data={users} loading={isLoading} />
      <Pagination page={page} onPageChange={setPage} />
    </div>
  );
}
```

## 📊 Advanced Features

### 🔍 Learning Analytics & Insights

The platform provides comprehensive learning analytics powered by real-time session tracking:

```typescript
// Learning session tracking
const session = await startLearningSession({
  userId: user.id,
  courseId: course.id,
  lessonId: lesson.id,
  storyId: story.id,
});

// Real-time analytics
const analytics = await getUserLearningAnalytics(userId, tenantId);
// Returns: totalStudyTime, accuracy, streaks, progress trends
```

**Key Metrics**:

- Study time tracking with session analytics
- Vocabulary mastery progression
- Learning streaks and consistency
- Performance trends and insights
- Interaction heatmaps

### 🔔 Smart Notification System

Multi-channel notification system with intelligent delivery:

```typescript
// Contextual notifications
await createCourseUpdateNotification(
  courseId,
  "New lesson available: Advanced Grammar",
  userId,
  tenantId
);

// Achievement notifications
await createAchievementNotification(
  "vocabulary_master",
  "Congratulations! You've mastered 100 vocabulary words!",
  userId,
  tenantId
);
```

**Notification Types**:

- Course updates and new content
- Achievement and milestone celebrations
- Learning reminders and streaks
- Quiz results and feedback
- System announcements

### 🎵 Audio Management System

Advanced audio handling with WaveSurfer.js integration:

- **Multi-format Support**: MP3, WAV, M4A with automatic conversion
- **Waveform Visualization**: Interactive audio waveforms
- **Recording Capabilities**: User voice recording and playback
- **Pronunciation Comparison**: Native vs. user pronunciation analysis
- **Audio Versioning**: Multiple audio versions per story/lesson

### 🔄 AI-Powered Story Remixing

Intelligent content adaptation system:

```typescript
// Create remix job
const remixJob = await createRemixJob({
  storyVersionId: story.id,
  parameters: {
    embedRatio: 0.4, // 40% English embedding
    focusType: "vocabulary", // Focus on vocabulary
    difficulty: "intermediate",
  },
});
```

**Remix Features**:

- Dynamic embedding ratio adjustment
- Difficulty level adaptation
- Focus area customization (grammar, vocabulary, etc.)
- Batch processing capabilities
- Quality assurance workflow

## 🚀 Deployment & Production

### 🐳 Docker Deployment

```bash
# Production build
docker build -t edtech-app .

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### ☁️ Cloud Deployment Options

| Platform             | Pros                           | Configuration              |
| -------------------- | ------------------------------ | -------------------------- |
| **Vercel**           | Next.js optimized, zero-config | `vercel.json`              |
| **Railway**          | Simple PostgreSQL setup        | `railway.toml`             |
| **AWS ECS**          | Full control, scalable         | `ecs-task-definition.json` |
| **Google Cloud Run** | Serverless, cost-effective     | `cloudbuild.yaml`          |

### 🔧 Environment Configuration

```env
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secure-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret

# AWS S3 for file storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-audio-bucket

# Optional: Monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id
# Login API rate limiting
LOGIN_RATE_LIMIT_MAX=5
LOGIN_RATE_LIMIT_WINDOW_MS=60000
```

`LOGIN_RATE_LIMIT_MAX` defines how many login attempts are allowed from a single IP within `LOGIN_RATE_LIMIT_WINDOW_MS` milliseconds before a `429` response is returned.

## 🧪 Testing Strategy

### 🔬 Testing Stack

- **Unit Tests**: Jest + Testing Library
- **Integration Tests**: API route testing
- **E2E Tests**: Playwright (planned)
- **Component Tests**: Storybook + Chromatic

```bash
# Run test suite
npm run test              # Unit tests
npm run test:coverage     # Coverage report
npm run test:watch        # Watch mode

# Storybook testing
npm run storybook         # Component testing
npm run build-storybook   # Build static docs
```

### 📊 Performance Monitoring

- **Core Web Vitals**: LCP, FID, CLS tracking
- **API Performance**: Response time monitoring
- **Database Queries**: Prisma query optimization
- **Bundle Analysis**: Next.js bundle analyzer
- **Error Tracking**: Comprehensive error logging

## 📚 Documentation & Resources

### 📖 Comprehensive Guides

- **[State Management Guide](./docs/STATE_MANAGEMENT.md)** - TanStack Query + Zustand architecture
- **[Zustand Best Practices](./docs/ZUSTAND_BEST_PRACTICES.md)** - Performance optimization guide
- **[New Features Guide](./docs/NEW_FEATURES_GUIDE.md)** - Latest schema features usage
- **[Authentication Setup](./AUTHENTICATION_IMPROVEMENTS.md)** - JWT and CASL configuration
- **[Database Setup](./DATABASE_SETUP.md)** - Prisma and PostgreSQL setup
- **[Schema Migration Guide](./docs/SCHEMA_MIGRATION.md)** - Database migration procedures

### 🎯 API Documentation

The application provides comprehensive API documentation:

- **REST API**: Full OpenAPI 3.0 specification
- **Authentication**: JWT token management
- **Authorization**: CASL permission examples
- **Error Handling**: Standardized error responses
- **Rate Limiting**: API usage guidelines

### 🔧 Development Tools

- **Prisma Studio**: Database GUI at `http://localhost:5555`
- **Storybook**: Component library at `http://localhost:6006`
- **MailHog**: Email testing at `http://localhost:8027`
- **Redis Insight**: Redis monitoring (optional)

## 🤝 Contributing

We welcome contributions to this innovative EdTech platform! Here's how to get started:

### 🛠️ Development Workflow

1. **Fork & Clone**: Fork the repository and clone locally
2. **Setup**: Follow the installation guide above
3. **Branch**: Create feature branches from `main`
4. **Code**: Follow TypeScript and React best practices
5. **Test**: Ensure all tests pass and add new tests
6. **PR**: Submit pull request with detailed description

### 📋 Code Standards

- **TypeScript**: Strict mode enabled, full type coverage
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality assurance
- **Conventional Commits**: Semantic commit messages

### 🎯 Areas for Contribution

- **Learning Analytics**: Advanced metrics and insights
- **AI Integration**: Enhanced story remixing algorithms
- **Mobile App**: React Native companion app
- **Accessibility**: WCAG 2.1 AA compliance improvements
- **Internationalization**: Multi-language support
- **Performance**: Optimization and caching strategies

## 📄 License & Usage

This project is **proprietary software** designed for educational purposes.

**Key Points**:

- Educational use encouraged
- Commercial use requires permission
- Contributions welcome under CLA
- Open source components remain under their respective licenses

---

## 🌟 Acknowledgments

Built with love for English language learners worldwide. Special thanks to:

- The Vietnamese English learning community
- Open source contributors and maintainers
- Educational technology researchers
- Beta testers and early adopters

**Happy Learning! 🎓✨**
