# Next.js + TanStack Query + Zustand Starter

A modern Next.js application with optimized state management using TanStack Query v5 for server state and Zustand for client/UI state.

## 🚀 Features

- **Next.js 15** with App Router
- **TanStack Query v5** for server state management
- **Zustand** for client/UI state management
- **TypeScript** for type safety
- **Prisma** for database management
- **URL synchronization** for shareable filters
- **Optimistic updates** and error handling
- **Performance optimized** with shallow selectors

## 🏗️ Architecture

### State Management Philosophy

- **Server State** (TanStack Query): API calls, caching, background sync
- **Client State** (Zustand): UI interactions, filters, modals, forms
- **Clear separation**: No server data in Zustand, no UI state in Query

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── core/
│   ├── api/               # API client and utilities
│   └── state/             # Zustand store factory and utilities
├── features/              # Feature-based organization
│   ├── users/
│   │   ├── state.ts       # UI state (Zustand)
│   │   └── hooks.ts       # Server state (TanStack Query)
│   └── products/
│       ├── state.ts
│       └── hooks.ts
└── components/            # Reusable UI components
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or use Docker)

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repository>
cd my-app
npm install
```

2. **Set up the database:**

```bash
# Copy environment variables
cp .env.example .env

# Update DATABASE_URL in .env with your PostgreSQL connection string

# Generate Prisma client and push schema
npm run db:generate
npm run db:push
npm run db:seed
```

3. **Start the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 State Management Guide

### When to use Zustand vs TanStack Query

**Use Zustand for:**

- Form inputs and validation state
- UI interactions (modals, dropdowns, tabs)
- Client-side filters and pagination
- User preferences and settings
- Component-specific state

**Use TanStack Query for:**

- API data fetching and caching
- Server state synchronization
- Background refetching
- Optimistic updates
- Error handling and retries

### Example Usage

```typescript
// Feature UI state (Zustand)
const { search, page, setSearch, setPage } = useUsersFilters();

// Server data (TanStack Query)
const q = useQuery(buildUsersListQuery({ search, page }));

// URL synchronization
useEffect(() => {
  syncToURL({ search, page });
}, [search, page]);
```

For detailed documentation, see [State Management Guide](./docs/STATE_MANAGEMENT.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
