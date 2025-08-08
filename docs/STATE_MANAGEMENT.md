# State Management Architecture

This project uses a clear separation between **server state** (TanStack Query) and **client/UI state** (Zustand) to optimize performance and maintainability.

## 🎯 Separation of Concerns

### TanStack Query (Server State)

- **Purpose**: Handles all server data fetching, caching, and synchronization
- **Responsibilities**:
  - API calls and data fetching
  - Server response caching
  - Background refetching
  - Optimistic updates for mutations
  - Error handling and retries

### Zustand (Client/UI State)

- **Purpose**: Manages local UI state and user interactions
- **Responsibilities**:
  - Form inputs and filters
  - Pagination state
  - Modal visibility
  - Selected items
  - UI preferences

## 🏗️ Architecture Patterns

### Store Structure

```
src/
├── core/state/
│   ├── makeStore.ts          # Store factory with middleware
│   └── urlSync.ts            # URL synchronization utilities
└── features/
    ├── users/
    │   ├── state.ts          # UI state for users feature
    │   └── hooks.ts          # TanStack Query hooks
    └── products/
        ├── state.ts          # UI state for products feature
        └── hooks.ts          # TanStack Query hooks
```

### Store Naming Convention

- **Store**: `use<Feature>UI` (e.g., `useUsersUI`, `useProductsUI`)
- **Selectors**: `use<Feature>Filters`, `use<Feature>Actions`
- **DevTools**: `ui-<feature>` prefix for easy identification

## 📝 Usage Examples

### 1. Basic Store Creation

```typescript
// src/features/users/state.ts
"use client";

import { makeStore, shallow, createSelector } from "@/core/state/makeStore";

interface UsersUIState {
  search: string;
  page: number;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
}

export const useUsersUI = makeStore<UsersUIState>(
  (set) => ({
    search: "",
    page: 1,
    setSearch: (search) => set({ search, page: 1 }),
    setPage: (page) => set({ page }),
  }),
  { name: "users-ui", persist: false }
);

// Optimized selectors
export const useUsersFilters = () =>
  useUsersUI((state) => ({ search: state.search, page: state.page }), shallow);
```

### 2. Component Integration

```typescript
// Component using both Query and Zustand
"use client";

export default function UserList() {
  // UI state from Zustand
  const { search, page } = useUsersFilters();
  const { setSearch, setPage } = useUsersFilterActions();

  // Server state from TanStack Query
  const q = useQuery(buildUsersListQuery({ search, page }));

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      {/* Render query data */}
    </div>
  );
}
```

### 3. URL Synchronization

```typescript
// Sync state with URL parameters
const { syncToURL, readFromURL } = useURLSync({ debounceMs: 300 });

// Read from URL on mount
useEffect(() => {
  const params = readFromURL(["search", "page"]);
  if (params.search) setSearch(params.search);
  if (params.page) setPage(parseInt(params.page));
}, []);

// Sync to URL when state changes
useEffect(() => {
  syncToURL({ search, page });
}, [search, page]);
```

## ⚡ Performance Optimizations

### 1. Shallow Selectors

Always use shallow comparison for multi-value selectors:

```typescript
const { search, page, setSearch } = useUsersUI(
  (state) => ({
    search: state.search,
    page: state.page,
    setSearch: state.setSearch,
  }),
  shallow // Prevents re-renders when other state changes
);
```

### 2. Narrow Selectors

Create specific selectors for different use cases:

```typescript
// ✅ Good - narrow selectors
export const useUsersFilters = () =>
  useUsersUI(
    (state) => ({
      search: state.search,
      page: state.page,
    }),
    shallow
  );

export const useUsersActions = () =>
  useUsersUI(
    (state) => ({
      setSearch: state.setSearch,
      setPage: state.setPage,
    }),
    shallow
  );

// ❌ Avoid - selecting entire state
const allState = useUsersUI(); // Will re-render on any change
```

### 3. Query Key Synchronization

Keep TanStack Query keys in sync with Zustand state:

```typescript
// Query key includes all filter parameters
const q = useQuery(buildUsersListQuery({ search, page, pageSize, sortBy }));
```

## 🔧 Configuration

### Store Options

```typescript
makeStore(initializer, {
  name: "feature-ui", // DevTools name
  persist: false, // Session persistence (default: false)
  persistKey: "custom-key", // Custom storage key
  partialize: (state) => ({
    // What to persist
    search: state.search,
  }),
});
```

### Middleware Stack

Each store automatically includes:

- **DevTools**: Debug state in browser (dev only)
- **Persist**: Optional session storage
- **SubscribeWithSelector**: Advanced subscriptions

## 🚫 Anti-Patterns

### ❌ Don't Store Server Data in Zustand

```typescript
// ❌ Bad - duplicating server state
const useUsersUI = makeStore((set) => ({
  users: [], // This belongs in TanStack Query
  loading: false, // This belongs in TanStack Query
  setUsers: (users) => set({ users }),
}));
```

### ❌ Don't Put UI State in Query

```typescript
// ❌ Bad - UI state in query key
const q = useQuery({
  queryKey: ["users", { modalOpen: true }], // UI state doesn't belong here
  queryFn: fetchUsers,
});
```

### ❌ Don't Create Monolithic Stores

```typescript
// ❌ Bad - one giant store for everything
const useAppStore = makeStore(() => ({
  // Users state
  usersSearch: "",
  usersPage: 1,
  // Products state
  productsSearch: "",
  productsPage: 1,
  // Orders state...
}));

// ✅ Good - feature-specific stores
const useUsersUI = makeStore(/* users state */);
const useProductsUI = makeStore(/* products state */);
```

## 🧪 Testing

### Testing Zustand Stores

```typescript
import { act, renderHook } from "@testing-library/react";
import { useUsersUI } from "./state";

test("should update search and reset page", () => {
  const { result } = renderHook(() => useUsersUI());

  act(() => {
    result.current.setSearch("test");
  });

  expect(result.current.search).toBe("test");
  expect(result.current.page).toBe(1); // Should reset to page 1
});
```

## 📚 Best Practices

1. **One store per feature** - Keep stores focused and small
2. **No server state in Zustand** - Use TanStack Query for all server data
3. **Shallow selectors** - Prevent unnecessary re-renders
4. **URL sync for shareable state** - Filters, pagination, etc.
5. **DevTools naming** - Use consistent `ui-<feature>` prefix
6. **No persistence by default** - Only persist when necessary
7. **AbortSignal support** - Always pass signal to API calls

This architecture ensures optimal performance, clear separation of concerns, and excellent developer experience.
