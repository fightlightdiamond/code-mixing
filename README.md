# English Learning Platform - EdTech Application

A comprehensive English learning platform built with Next.js, featuring story-based learning with embedded vocabulary (Jewish-style story embedding method), role-based access control, and multi-tenancy support.

## 🚀 Overview

This is an advanced EdTech application designed for English language learning through interactive stories. The platform uses a unique "Jewish-style story embedding" method (truyện chêm) where English vocabulary is naturally integrated into Vietnamese stories to enhance learning retention.

## ✨ Key Features

### 🎓 Learning Features
- **Story-based Learning**: Interactive stories with embedded English vocabulary
- **Multi-level Content**: Beginner, Intermediate, and Advanced levels
- **Audio Integration**: Native pronunciation and user recording capabilities
- **Interactive Exercises**: Multiple choice, fill-in-the-blank, drag-and-drop
- **Progress Tracking**: Comprehensive user progress monitoring
- **Vocabulary Management**: Spaced repetition system for vocabulary retention
- **Quiz System**: Adaptive quizzes with detailed results

### 🔐 Technical Features
- **Next.js 15** with App Router and React 19
- **CASL Authorization** - Fine-grained permission system
- **Multi-tenancy** - Support for multiple organizations
- **TanStack Query v5** - Server state management
- **Zustand** - Client state management
- **Prisma ORM** - Database management with PostgreSQL
- **NextAuth.js** - Authentication system
- **TypeScript** - Full type safety
- **Storybook** - Component documentation
- **Jest** - Testing framework

### 🎨 UI/UX Features
- **TailwindCSS** - Modern styling
- **Radix UI** - Accessible component library
- **Framer Motion** - Smooth animations
- **Responsive Design** - Mobile-first approach
- **Dark/Light Mode** support

## 🏗️ Architecture

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── lessons/       # Lesson management
│   │   ├── stories/       # Story management
│   │   ├── users/         # User management
│   │   └── vocabularies/  # Vocabulary management
│   ├── dashboard/         # User dashboard
│   ├── login/            # Authentication pages
│   └── users/            # User management pages
├── core/                  # Core business logic
│   ├── api/              # API client and utilities
│   ├── auth/             # CASL authorization system
│   │   ├── ability.ts    # Permission definitions
│   │   ├── subjects.ts   # CASL subjects and actions
│   │   └── AbilityProvider.tsx # React provider
│   └── state/            # Global state management
├── features/             # Feature modules
│   ├── auth/             # Authentication features
│   ├── lessons/          # Lesson management
│   ├── stories/          # Story management
│   ├── users/            # User management
│   ├── vocabularies/     # Vocabulary features
│   └── quizzes/          # Quiz system
├── components/           # Reusable UI components
├── shared/              # Shared utilities
│   └── components/      # Shared components (Can.tsx)
└── stories/             # Storybook stories

prisma/
├── schema.prisma        # Database schema
└── seed.ts             # Database seeding
```

### Database Schema

The application uses a comprehensive PostgreSQL schema with the following main entities:

- **Multi-tenancy**: `Tenant`, `Role`, `UserToRole`
- **Core Entities**: `User`, `Course`, `Unit`, `Lesson`
- **Content**: `Story`, `StoryVersion`, `StoryChunk`, `Vocabulary`
- **Media**: `Audio`, `AudioAsset`
- **Assessment**: `Exercise`, `Question`, `Quiz`, `QuizResult`
- **Progress**: `UserProgress`, `UserVocabularyProgress`
- **System**: `Tag`, `Approval`, `RemixJob`

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repository>
cd my-app
npm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your database URL and other configurations
```

3. **Set up the database:**

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

4. **Start the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Available Scripts

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database and reseed

# Testing
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Documentation
npm run storybook        # Start Storybook
npm run build-storybook  # Build Storybook

# Code Quality
npm run lint             # Run ESLint
```

## 🔐 CASL Authorization System

The application implements a comprehensive role-based access control system using CASL:

### User Roles
- `student` - Regular learners
- `coach` - Learning coaches
- `admin` - System administrators
- `super_admin` - Super administrators
- `org_admin` - Organization administrators
- `curriculum_lead` - Curriculum designers
- `content_creator` - Content creators
- `instructor` - Instructors
- `voice_artist` - Audio content creators
- `qa` - Quality assurance
- `guest` - Guest users

### Subjects and Actions

Defined in `src/core/auth/subjects.ts`:

**Actions**: `manage`, `create`, `read`, `update`, `delete`, `publish`, `approve`, `assign`, `grade`, `remix`, `export`

**Subjects**: `Tenant`, `User`, `Role`, `Course`, `Unit`, `Lesson`, `Story`, `StoryVersion`, `Quiz`, `Question`, etc.

### Usage Examples

```jsx
// UI Guards
<Can I="create" a="Lesson">
  <button>Create New Lesson</button>
</Can>

<Can I="update" a={{ __type: 'Story', id: storyId }}>
  <EditButton />
</Can>

// Programmatic checks
const ability = useAbility();
if (ability.can('publish', { __type: 'Story', id })) {
  publishStory(id);
}
```

## 📚 Learning Method: Jewish-Style Story Embedding

The platform uses a unique learning methodology where English vocabulary is naturally embedded within Vietnamese stories:

1. **Original Stories** - Base Vietnamese stories
2. **Vocabulary Embedding** - Strategic placement of English words
3. **Audio Integration** - Native pronunciation support
4. **Interactive Exercises** - Reinforcement activities
5. **Progress Tracking** - Spaced repetition system

## 🎯 User Roles and Permissions

### Students
- Access assigned courses and lessons
- Complete exercises and quizzes
- Track learning progress
- Record and practice pronunciation

### Content Creators
- Create and edit stories
- Manage vocabulary lists
- Design exercises and quizzes
- Upload audio content

### Administrators
- Manage users and roles
- Oversee content approval
- Monitor system analytics
- Configure tenant settings

## 🚀 Deployment

The application is optimized for deployment on:

- **Vercel** (recommended for Next.js)
- **Railway** or **Heroku** (with PostgreSQL)
- **Docker** containers
- **AWS** or **Google Cloud**

## 📖 Documentation

For detailed documentation, see:
- [Authentication Setup](./AUTHENTICATION_IMPROVEMENTS.md)
- [Database Setup](./DATABASE_SETUP.md)
- [Login Configuration](./LOGIN_SETUP.md)

## 🤝 Contributing

This is an educational platform designed to revolutionize English learning through innovative story-based methods. Contributions are welcome!

## 📄 License

This project is proprietary software for educational purposes.
