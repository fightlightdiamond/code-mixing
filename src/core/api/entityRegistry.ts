// Enhanced type definitions with better constraints
export interface BaseEntity {
  id: string | number;
  createdAt?: string;
  updatedAt?: string;
}

interface EntityDef<TList extends BaseEntity = BaseEntity, TDetail extends BaseEntity = BaseEntity> {
  entity: "users" | "lessons" | "stories" | "vocabularies" | "quizzes" | "userResults";
  baseUrl: string;
  selectList?: (data: TList[]) => unknown[];
  selectDetail?: (data: TDetail) => unknown;
  tags: readonly string[];
  // Add validation schemas
  listSchema?: (data: unknown) => data is TList[];
  detailSchema?: (data: unknown) => data is TDetail;
  // Add default query options per entity
  defaultQueryOptions?: {
    staleTime?: number;
    gcTime?: number;
    retry?: number | boolean;
  };
}

// Edtech specific entity types
interface User extends BaseEntity {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'coach' | 'admin';
  label?: string;
}

interface Lesson extends BaseEntity {
  id: number;
  title: string;
  description?: string;
  objective?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface Story extends BaseEntity {
  id: number;
  lessonId: number;
  title: string;
  content: string;
  storyType: 'original' | 'chemdanhtu' | 'chemdongtu' | 'chemtinhtu' | 'custom';
  chemRatio?: number;
}

interface Vocabulary extends BaseEntity {
  id: number;
  lessonId: number;
  word: string;
  meaning: string;
  example?: string;
  audioUrl?: string;
}

interface Quiz extends BaseEntity {
  id: number;
  lessonId: number;
  title: string;
  description?: string;
}

interface UserResult extends BaseEntity {
  id: number;
  userId: number;
  lessonId: number;
  quizId?: number;
  score: number;
  recordUrl?: string;
  startedAt: string;
  finishedAt?: string;
}

// Enhanced entity definitions with proper typing for Edtech platform
export const entities = {
  users: {
    entity: "users",
    baseUrl: "/api/users",
    selectList: (rows: User[]) =>
      rows.map(r => ({ ...r, label: `${r.name} <${r.email}>` })),
    tags: ["users"] as const,
    listSchema: (data: unknown): data is User[] =>
      Array.isArray(data) && data.every(item =>
        typeof item === 'object' && item !== null &&
        'id' in item && 'name' in item && 'email' in item
      ),
    defaultQueryOptions: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
    },
  } satisfies EntityDef<User, User>,

  lessons: {
    entity: "lessons",
    baseUrl: "/api/lessons",
    tags: ["lessons"] as const,
    listSchema: (data: unknown): data is Lesson[] =>
      Array.isArray(data) && data.every(item =>
        typeof item === 'object' && item !== null &&
        'id' in item && 'title' in item
      ),
    defaultQueryOptions: {
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
    },
  } satisfies EntityDef<Lesson, Lesson>,

  stories: {
    entity: "stories",
    baseUrl: "/api/stories",
    tags: ["stories"] as const,
    listSchema: (data: unknown): data is Story[] =>
      Array.isArray(data) && data.every(item =>
        typeof item === 'object' && item !== null &&
        'id' in item && 'title' in item && 'content' in item
      ),
    defaultQueryOptions: {
      staleTime: 2 * 60_000,
      gcTime: 15 * 60_000,
    },
  } satisfies EntityDef<Story, Story>,

  vocabularies: {
    entity: "vocabularies",
    baseUrl: "/api/vocabularies",
    tags: ["vocabularies"] as const,
    listSchema: (data: unknown): data is Vocabulary[] =>
      Array.isArray(data) && data.every(item =>
        typeof item === 'object' && item !== null &&
        'id' in item && 'word' in item && 'meaning' in item
      ),
    defaultQueryOptions: {
      staleTime: 10 * 60_000,
      gcTime: 60 * 60_000,
    },
  } satisfies EntityDef<Vocabulary, Vocabulary>,

  quizzes: {
    entity: "quizzes",
    baseUrl: "/api/quizzes",
    tags: ["quizzes"] as const,
    listSchema: (data: unknown): data is Quiz[] =>
      Array.isArray(data) && data.every(item =>
        typeof item === 'object' && item !== null &&
        'id' in item && 'title' in item
      ),
    defaultQueryOptions: {
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
    },
  } satisfies EntityDef<Quiz, Quiz>,

  userResults: {
    entity: "userResults",
    baseUrl: "/api/user-results",
    tags: ["userResults"] as const,
    listSchema: (data: unknown): data is UserResult[] =>
      Array.isArray(data) && data.every(item =>
        typeof item === 'object' && item !== null &&
        'id' in item && 'userId' in item && 'score' in item
      ),
    defaultQueryOptions: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
    },
  } satisfies EntityDef<UserResult, UserResult>,
} as const;

// Exported types
export type EntityName = keyof typeof entities;
