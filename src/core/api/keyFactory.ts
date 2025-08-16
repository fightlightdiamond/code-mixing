// Enhanced query key factory with hierarchical structure
export const keyFactory = {
  // Root keys
  all: (entity: string) => [entity] as const,

  // List operations with normalized params
  list: (entity: string, params?: Record<string, unknown>) => {
    const normalizedParams = params ? normalizeParams(params) : undefined;
    return [entity, "list", normalizedParams] as const;
  },

  // Detail operations
  detail: (entity: string, id: string | number) => [entity, "detail", { id }] as const,

  // Search operations
  search: (entity: string, query: string, filters?: Record<string, unknown>) => {
    const normalizedFilters = filters ? normalizeParams(filters) : undefined;
    return [entity, "search", { query, filters: normalizedFilters }] as const;
  },

  // Infinite queries
  infinite: (entity: string, params?: Record<string, unknown>) => {
    const normalizedParams = params ? normalizeParams(params) : undefined;
    return [entity, "infinite", normalizedParams] as const;
  },

  // Related data
  related: (entity: string, id: string | number, relation: string, params?: Record<string, unknown>) => {
    const normalizedParams = params ? normalizeParams(params) : undefined;
    return [entity, "detail", { id }, "related", relation, normalizedParams] as const;
  },

  // Aggregations
  aggregation: (entity: string, type: string, params?: Record<string, unknown>) => {
    const normalizedParams = params ? normalizeParams(params) : undefined;
    return [entity, "aggregation", type, normalizedParams] as const;
  },
} as const;

// Normalize parameters for consistent cache keys
function normalizeParams<T extends Record<string, unknown>>(params: T): T {
  const normalized: Record<string, unknown> = {};

  // Sort keys for consistent ordering
  const sortedKeys = Object.keys(params).sort();

  for (const key of sortedKeys) {
    const value = params[key as keyof T];

    // Skip undefined values
    if (value === undefined) continue;

    // Normalize arrays
    if (Array.isArray(value)) {
      normalized[key] = [...value].sort();
    }
    // Normalize objects
    else if (value && typeof value === 'object') {
      normalized[key] = normalizeParams(value as Record<string, unknown>);
    }
    // Keep primitives as-is
    else {
      normalized[key] = value;
    }
  }

  return normalized as T;
}

// Query key utilities
export const queryKeyUtils = {
  // Check if a key matches a pattern
  matches: (key: readonly unknown[], pattern: readonly unknown[]): boolean => {
    if (pattern.length > key.length) return false;

    return pattern.every((patternItem, index) => {
      const keyItem = key[index];

      if (patternItem === undefined) return true;
      if (typeof patternItem === 'object' && patternItem !== null) {
        return JSON.stringify(keyItem) === JSON.stringify(patternItem);
      }
      return keyItem === patternItem;
    });
  },

  // Extract entity from key
  getEntity: (key: readonly unknown[]): string | undefined => {
    return typeof key[0] === 'string' ? key[0] : undefined;
  },

  // Extract operation type from key
  getOperation: (key: readonly unknown[]): string | undefined => {
    return typeof key[1] === 'string' ? key[1] : undefined;
  },

  // Create invalidation patterns
  invalidationPatterns: {
    allEntity: (entity: string) => [entity],
    allLists: (entity: string) => [entity, "list"],
    allDetails: (entity: string) => [entity, "detail"],
    specificDetail: (entity: string, id: string | number) => [entity, "detail", { id }],
  },
};
