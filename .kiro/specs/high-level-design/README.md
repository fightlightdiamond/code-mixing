# High-Level Design Documentation

> **📚 Complete Documentation Index**: This is the main navigation hub for all system documentation. Use the table of contents below to find specific information quickly.

This directory contains comprehensive design documentation for the EdTech English Learning Platform using the "Jewish-style story embedding" (truyện chêm) methodology.

## 📋 Table of Contents

### 🎯 Core Documentation

1. **[Requirements](./requirements.md)** - Business requirements and acceptance criteria
2. **[System Design](./design.md)** - Technical architecture and implementation details
3. **[Visual Diagrams](./visual-architecture-diagrams.md)** - System architecture visualizations
4. **[Implementation Tasks](./tasks.md)** - Development roadmap and progress tracking

### 📚 Extended Documentation

5. **[API Documentation](../../docs/API_DOCUMENTATION.md)** - REST API reference and examples
6. **[Performance Guide](../../docs/PERFORMANCE_OPTIMIZATION_GUIDE.md)** - Optimization strategies
7. **[Developer Onboarding](../../docs/DEVELOPER_ONBOARDING.md)** - Getting started guide
8. **[Database Guide](../../docs/DATABASE_SCHEMA_GUIDE.md)** - Schema and data modeling

### 🔧 Setup & Configuration

9. **[Main README](../../README.md)** - Project overview and quick start
10. **[Authentication Setup](../../AUTHENTICATION_IMPROVEMENTS.md)** - Security implementation
11. **[Database Setup](../../DATABASE_SETUP.md)** - Database configuration
12. **[Learning Module](../../src/app/learning/README.md)** - Story-based learning system

### 📖 Navigation & Reference

13. **[Complete Documentation Index](./DOCUMENTATION_INDEX.md)** - Master navigation hub for all documentation
14. **[Documentation Summary](./DOCUMENTATION_SUMMARY.md)** - Structure overview and organization details
15. **[Glossary](#-glossary-of-terms-and-acronyms)** - Terms and acronyms reference

> **🔍 Complete Documentation Index**: For comprehensive navigation to all system documentation organized by role and topic, see [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

## 📁 Documentation Structure

### Core Documents

- **[requirements.md](./requirements.md)** - Detailed requirements in EARS format with user stories and acceptance criteria
- **[design.md](./design.md)** - Comprehensive system design document covering architecture, components, and implementation details
- **[visual-architecture-diagrams.md](./visual-architecture-diagrams.md)** - Complete visual diagrams for system understanding
- **[tasks.md](./tasks.md)** - Implementation task list with progress tracking

### Visual Documentation

The visual diagrams are organized into four main categories:

#### 1. System Overview Diagrams

- High-level system architecture
- Technology stack overview
- Multi-tenant architecture
- Deployment architecture

#### 2. Database ERD Diagrams

- Complete entity relationships
- Multi-tenant security model
- Authentication & authorization schema
- Learning content schema
- Progress & analytics schema

#### 3. Component Interaction Diagrams

- Learning session architecture
- Authentication & authorization flow
- Real-time analytics pipeline
- Offline-first synchronization
- Story embedding processing
- Advanced learning analytics
- Security architecture
- Microservices architecture (future)
- DevOps & CI/CD pipeline

#### 4. User Flow Diagrams

- Complete learning journey
- Story creation & approval workflow
- Adaptive learning path
- Multi-tenant user management
- Offline learning experience
- Performance monitoring & analytics

## 🎯 How to Use This Documentation

### For Developers

1. Start with [requirements.md](./requirements.md) to understand business needs
2. Review [design.md](./design.md) for technical architecture
3. Use [visual-architecture-diagrams.md](./visual-architecture-diagrams.md) for visual understanding
4. Follow [tasks.md](./tasks.md) for implementation guidance

### For Product Managers

1. Focus on user stories in [requirements.md](./requirements.md)
2. Review user flow diagrams for experience planning
3. Use learning methodology sections for feature decisions

### For DevOps Engineers

1. Study system architecture diagrams
2. Review deployment and infrastructure sections
3. Follow CI/CD pipeline diagrams for setup

### For QA Engineers

1. Use user flow diagrams for test planning
2. Reference component interactions for integration testing
3. Follow error handling patterns for edge cases

## 🔄 Implementation Workflow

This spec follows a structured workflow:

```
Requirements → Design → Visual Diagrams → Implementation Tasks
```

### Current Status

- ✅ Requirements gathering complete
- ✅ Design document complete
- ✅ Visual diagrams complete
- ✅ Implementation tasks defined
- 🔄 Ready for implementation

### Next Steps

1. Review and approve all documentation
2. Begin implementation following the task list
3. Use visual diagrams as reference during development
4. Update documentation as system evolves

## 📊 Diagram Integration

The visual diagrams are integrated throughout the design document with cross-references:

- **Architecture sections** → System overview diagrams
- **Component sections** → Component interaction diagrams
- **Data model sections** → Database ERD diagrams
- **User experience sections** → User flow diagrams

## 🛠 Maintenance

### When to Update

- New features added to the system
- Database schema changes
- Component architecture modifications
- User flow updates
- Performance optimizations

### How to Update

1. Update the relevant markdown files
2. Regenerate any affected diagrams
3. Update cross-references between documents
4. Validate diagram syntax with Mermaid

## 📋 Requirements Traceability

Each diagram and design section references specific requirements:

- **Requirement 1.1-1.4**: System architecture and components
- **Requirement 2.1-2.4**: Security and authorization
- **Requirement 3.1-3.4**: Learning methodology and user flows
- **Requirement 4.1-4.4**: Developer onboarding and structure
- **Requirement 5.1-5.4**: Deployment and infrastructure
- **Requirement 6.1-6.4**: Testing and quality assurance

## 🔗 Cross-References & Navigation

### 📊 By Topic Area

#### Architecture & Design

- [System Architecture](./design.md#architecture) → [Visual Diagrams](./visual-architecture-diagrams.md#system-overview-diagrams)
- [Component Design](./design.md#components-and-interfaces) → [Component Interaction Diagrams](./visual-architecture-diagrams.md#component-interaction-diagrams)
- [Database Design](./design.md#data-models) → [Database ERD Diagrams](./visual-architecture-diagrams.md#database-erd-diagrams)

#### Security & Authentication

- [Security Requirements](./requirements.md#requirement-2) → [Security Architecture](./design.md#security-architecture)
- [Authentication Flow](./design.md#authentication--authorization-flow) → [Auth Setup Guide](../../AUTHENTICATION_IMPROVEMENTS.md)
- [Multi-tenancy](./design.md#multi-tenant-architecture) → [Database Schema](../../docs/DATABASE_SCHEMA_GUIDE.md)

#### Learning Methodology

- [Learning Requirements](./requirements.md#requirement-3) → [Learning Design](./design.md#learning-methodology-implementation)
- [Story Embedding](./design.md#story-embedding-methodology) → [Learning Module](../../src/app/learning/README.md)
- [User Journeys](./visual-architecture-diagrams.md#user-flow-diagrams) → [API Examples](../../docs/API_EXAMPLES.md)

#### Development & Deployment

- [Developer Requirements](./requirements.md#requirement-4) → [Onboarding Guide](../../docs/DEVELOPER_ONBOARDING.md)
- [Infrastructure Requirements](./requirements.md#requirement-5) → [Performance Guide](../../docs/PERFORMANCE_OPTIMIZATION_GUIDE.md)
- [Testing Requirements](./requirements.md#requirement-6) → [Testing Strategy](./design.md#testing-strategy-and-quality-assurance)

### 🔍 Quick Navigation

#### For New Developers

1. Start with [Main README](../../README.md) for project overview
2. Review [Requirements](./requirements.md) for business context
3. Study [System Design](./design.md) for technical architecture
4. Follow [Developer Onboarding](../../docs/DEVELOPER_ONBOARDING.md) for setup
5. Use [Implementation Tasks](./tasks.md) for development guidance

#### For Product Managers

1. Review [Requirements](./requirements.md) for user stories
2. Study [User Flow Diagrams](./visual-architecture-diagrams.md#user-flow-diagrams)
3. Understand [Learning Methodology](./design.md#learning-methodology-implementation)
4. Check [API Documentation](../../docs/API_DOCUMENTATION.md) for integration planning

#### For DevOps Engineers

1. Study [System Architecture](./design.md#architecture)
2. Review [Infrastructure Requirements](./requirements.md#requirement-5)
3. Follow [Database Setup](../../DATABASE_SETUP.md)
4. Check [Performance Guide](../../docs/PERFORMANCE_OPTIMIZATION_GUIDE.md)

#### For QA Engineers

1. Review [Testing Strategy](./design.md#testing-strategy-and-quality-assurance)
2. Study [User Flow Diagrams](./visual-architecture-diagrams.md#user-flow-diagrams)
3. Use [API Examples](../../docs/API_EXAMPLES.md) for test data
4. Follow [Component Interactions](./visual-architecture-diagrams.md#component-interaction-diagrams)

## 🔗 External References

### Core System Files

- [Prisma Schema](../../prisma/schema.prisma) - Database schema definition
- [Main Application](../../src/app) - Next.js application structure
- [API Routes](../../src/app/api) - Backend API implementation
- [Learning Module](../../src/app/learning) - Story-based learning system

### Documentation Files

- [API Documentation](../../docs/API_DOCUMENTATION.md) - REST API reference
- [API Examples](../../docs/API_EXAMPLES.md) - Request/response examples
- [API Troubleshooting](../../docs/API_TROUBLESHOOTING.md) - Common issues and solutions
- [Performance Guide](../../docs/PERFORMANCE_OPTIMIZATION_GUIDE.md) - Optimization strategies
- [Developer Onboarding](../../docs/DEVELOPER_ONBOARDING.md) - Getting started guide
- [Database Schema Guide](../../docs/DATABASE_SCHEMA_GUIDE.md) - Data modeling reference

### Configuration Files

- [Environment Setup](../../.env.example) - Environment variables template
- [Docker Configuration](../../docker-compose.yml) - Container orchestration
- [Package Configuration](../../package.json) - Dependencies and scripts
- [TypeScript Config](../../tsconfig.json) - Type checking configuration

## 📖 Glossary of Terms and Acronyms

### 🎓 Learning Methodology Terms

| Term                             | Definition                                                                                    | Context                |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------- |
| **Jewish-style Story Embedding** | Learning methodology where English vocabulary is naturally integrated into Vietnamese stories | Core learning approach |
| **Truyện Chêm**                  | Vietnamese term for "embedded stories" - stories with foreign language words inserted         | Vietnamese terminology |
| **Embedding Ratio**              | Percentage of English words embedded in Vietnamese text (e.g., 20% embedding)                 | Content creation       |
| **Chem Chunks**                  | Text segments containing embedded English vocabulary                                          | Story structure        |
| **Progressive Embedding**        | Gradually increasing English word ratio as learner advances                                   | Adaptive learning      |
| **Spaced Repetition**            | Learning technique that increases intervals between reviews of learned material               | Vocabulary retention   |

### 🏗️ Technical Architecture Terms

| Term              | Definition                                                                        | Context           |
| ----------------- | --------------------------------------------------------------------------------- | ----------------- |
| **Multi-tenancy** | Architecture allowing multiple organizations to use the same application instance | System design     |
| **RBAC**          | Role-Based Access Control - permissions based on user roles                       | Security          |
| **ABAC**          | Attribute-Based Access Control - permissions based on attributes and policies     | Advanced security |
| **CASL**          | Code Access Security Library - authorization framework                            | Implementation    |
| **JWT**           | JSON Web Token - secure token format for authentication                           | Authentication    |
| **CSRF**          | Cross-Site Request Forgery - security vulnerability and protection                | Security          |
| **SSR**           | Server-Side Rendering - rendering pages on the server                             | Performance       |
| **ISR**           | Incremental Static Regeneration - updating static pages                           | Next.js feature   |

### 📊 Database & Data Terms

| Term                 | Definition                                                                      | Context             |
| -------------------- | ------------------------------------------------------------------------------- | ------------------- |
| **ORM**              | Object-Relational Mapping - database abstraction layer                          | Prisma              |
| **ERD**              | Entity Relationship Diagram - visual database schema representation             | Database design     |
| **ACID**             | Atomicity, Consistency, Isolation, Durability - database transaction properties | Data integrity      |
| **Tenant Isolation** | Ensuring data separation between different organizations                        | Multi-tenancy       |
| **Audit Trail**      | Record of all system changes and user actions                                   | Compliance          |
| **Schema Migration** | Process of updating database structure                                          | Database management |

### 🎨 Frontend & UI Terms

| Term                  | Definition                                                | Context            |
| --------------------- | --------------------------------------------------------- | ------------------ |
| **PWA**               | Progressive Web App - web app with native app features    | User experience    |
| **Hydration**         | Process of making server-rendered HTML interactive        | React/Next.js      |
| **Code Splitting**    | Dividing code into smaller bundles for better performance | Optimization       |
| **Tree Shaking**      | Removing unused code from final bundle                    | Build optimization |
| **Lazy Loading**      | Loading content only when needed                          | Performance        |
| **Virtual Scrolling** | Rendering only visible items in large lists               | Performance        |

### 🔧 Development & DevOps Terms

| Term                | Definition                                           | Context                 |
| ------------------- | ---------------------------------------------------- | ----------------------- |
| **CI/CD**           | Continuous Integration/Continuous Deployment         | Development workflow    |
| **TDD**             | Test-Driven Development - writing tests before code  | Development methodology |
| **E2E Testing**     | End-to-End Testing - testing complete user workflows | Quality assurance       |
| **Hot Reload**      | Updating code without full page refresh              | Development experience  |
| **Bundle Analysis** | Analyzing JavaScript bundle size and composition     | Performance monitoring  |
| **Service Worker**  | Background script for offline functionality          | PWA feature             |

### 📱 User Experience Terms

| Term                 | Definition                                                       | Context                  |
| -------------------- | ---------------------------------------------------------------- | ------------------------ |
| **WCAG**             | Web Content Accessibility Guidelines                             | Accessibility compliance |
| **A11y**             | Numeronym for "accessibility" (11 letters between A and Y)       | Accessibility            |
| **ARIA**             | Accessible Rich Internet Applications - accessibility attributes | Web standards            |
| **Screen Reader**    | Assistive technology that reads screen content aloud             | Accessibility            |
| **Semantic HTML**    | HTML that conveys meaning, not just presentation                 | Web standards            |
| **Focus Management** | Controlling keyboard focus for accessibility                     | User interaction         |

### 🚀 Performance & Monitoring Terms

| Term                 | Definition                                             | Context                  |
| -------------------- | ------------------------------------------------------ | ------------------------ |
| **Core Web Vitals**  | Google's metrics for user experience (LCP, FID, CLS)   | Performance measurement  |
| **LCP**              | Largest Contentful Paint - loading performance metric  | Web vitals               |
| **FID**              | First Input Delay - interactivity performance metric   | Web vitals               |
| **CLS**              | Cumulative Layout Shift - visual stability metric      | Web vitals               |
| **CDN**              | Content Delivery Network - distributed content serving | Performance              |
| **Caching Strategy** | Method for storing and retrieving frequently used data | Performance optimization |

### 🔐 Security & Compliance Terms

| Term                             | Definition                                          | Context                |
| -------------------------------- | --------------------------------------------------- | ---------------------- |
| **Zero Trust**                   | Security model that verifies every request          | Security architecture  |
| **Principle of Least Privilege** | Giving users minimum necessary permissions          | Security best practice |
| **Data Encryption**              | Converting data into unreadable format for security | Data protection        |
| **Session Management**           | Handling user authentication sessions securely      | Security               |
| **Input Validation**             | Checking user input for security and correctness    | Security               |
| **SQL Injection**                | Security vulnerability in database queries          | Security threat        |

### 📊 Analytics & Learning Terms

| Term                   | Definition                                                  | Context                 |
| ---------------------- | ----------------------------------------------------------- | ----------------------- |
| **Learning Analytics** | Measurement and analysis of learning data                   | Educational technology  |
| **Engagement Metrics** | Measurements of user interaction and participation          | User behavior           |
| **Retention Rate**     | Percentage of users who continue using the system           | Success metrics         |
| **Learning Path**      | Structured sequence of learning activities                  | Educational design      |
| **Adaptive Learning**  | System that adjusts to individual learner needs             | Personalization         |
| **Mastery Learning**   | Approach where learners must master topics before advancing | Educational methodology |

### 🔤 Common Acronyms

| Acronym  | Full Form                         | Usage                 |
| -------- | --------------------------------- | --------------------- |
| **API**  | Application Programming Interface | System integration    |
| **REST** | Representational State Transfer   | API architecture      |
| **HTTP** | HyperText Transfer Protocol       | Web communication     |
| **JSON** | JavaScript Object Notation        | Data format           |
| **SQL**  | Structured Query Language         | Database queries      |
| **CSS**  | Cascading Style Sheets            | Web styling           |
| **DOM**  | Document Object Model             | Web page structure    |
| **SPA**  | Single Page Application           | Web app architecture  |
| **MVC**  | Model-View-Controller             | Software architecture |
| **CRUD** | Create, Read, Update, Delete      | Database operations   |

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Complete - Ready for Implementation
