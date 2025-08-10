"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

interface URLSyncOptions {
  debounceMs?: number;
  replace?: boolean;
}

/**
 * Hook for syncing state with URL search parameters
 *
 * @example
 * ```ts
 * const { syncToURL, readFromURL } = useURLSync({
 *   debounceMs: 300,
 *   replace: true
 * });
 *
 * // Read from URL on mount
 * useEffect(() => {
 *   const params = readFromURL(['search', 'page', 'pageSize', 'sortBy']);
 *   if (params.search) setSearch(params.search);
 *   if (params.page) setPage(parseInt(params.page));
 * }, []);
 *
 * // Sync to URL when state changes
 * useEffect(() => {
 *   syncToURL({ search, page, pageSize, sortBy });
 * }, [search, page, pageSize, sortBy]);
 * ```
 */
export function useURLSync(options: URLSyncOptions = {}) {
  const { debounceMs = 300, replace = true } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncToURL = useCallback(
    (params: Record<string, string | number | boolean | null | undefined>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce the URL update
      timeoutRef.current = setTimeout(() => {
        const newSearchParams = new URLSearchParams(searchParams.toString());

        // Update or remove parameters
        Object.entries(params).forEach(([key, value]) => {
          if (value === null || value === undefined || value === "") {
            newSearchParams.delete(key);
          } else {
            newSearchParams.set(key, value.toString());
          }
        });

        // Update URL
        const newURL = `${window.location.pathname}${
          newSearchParams.toString() ? `?${newSearchParams.toString()}` : ""
        }`;

        if (replace) {
          router.replace(newURL);
        } else {
          router.push(newURL);
        }
      }, debounceMs);
    },
    [router, searchParams, debounceMs, replace]
  );

  const readFromURL = useCallback(
    (keys: string[]): Record<string, string | null> => {
      const result: Record<string, string | null> = {};
      keys.forEach((key) => {
        result[key] = searchParams.get(key);
      });
      return result;
    },
    [searchParams]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { syncToURL, readFromURL };
}

/**
 * Utility function to parse URL parameters with type conversion
 */
export function parseURLParams(params: Record<string, string | null>) {
  return {
    search: params.search || "",
    page: params.page ? parseInt(params.page, 10) : 1,
    pageSize: params.pageSize ? parseInt(params.pageSize, 10) : 10,
    sortBy: params.sortBy || null,
    sortOrder: (params.sortOrder as "asc" | "desc") || "asc",
  };
}
