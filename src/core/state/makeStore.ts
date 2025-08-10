"use client";

import { create } from "zustand";
import {
  devtools,
  persist,
  createJSONStorage,
  subscribeWithSelector,
} from "zustand/middleware";
import { shallow } from "zustand/shallow";

interface StoreOptions<T> {
  name?: string;
  persist?: boolean;
  persistKey?: string;
  partialize?: (state: T) => Partial<T>;
}

/**
 * Enhanced store factory with devtools, persist, and subscribeWithSelector middleware
 *
 * @example
 * ```ts
 * interface CounterState {
 *   count: number;
 *   increment: () => void;
 *   reset: () => void;
 * }
 *
 * export const useCounterStore = makeStore<CounterState>(
 *   (set) => ({
 *     count: 0,
 *     increment: () => set((state) => ({ count: state.count + 1 })),
 *     reset: () => set({ count: 0 }),
 *   }),
 *   {
 *     name: "counter-ui",
 *     persist: true,
 *     partialize: (state) => ({ count: state.count }) // Only persist count
 *   }
 * );
 *
 * // Usage with shallow selector to prevent unnecessary re-renders
 * const { count, increment } = useCounterStore(
 *   (state) => ({ count: state.count, increment: state.increment }),
 *   shallow
 * );
 * ```
 */
export function makeStore<T>(
  initializer: (set: any, get: any, api: any) => T,
  options: StoreOptions<T> = {}
) {
  const {
    name,
    persist: shouldPersist = false,
    persistKey,
    partialize,
  } = options;

  let store = create<T>()(
    subscribeWithSelector(
      devtools(
        shouldPersist
          ? persist(initializer, {
              name: persistKey || name || "zustand-store",
              storage: createJSONStorage(() => sessionStorage),
              partialize,
            })
          : initializer,
        {
          name:
            process.env.NODE_ENV === "development"
              ? `ui-${name || "store"}`
              : undefined,
          enabled: process.env.NODE_ENV === "development",
        }
      )
    )
  );

  return store;
}

/**
 * Re-export shallow for convenience
 * Use this to prevent unnecessary re-renders when selecting multiple values
 *
 * @example
 * ```ts
 * const { search, page, setSearch } = useUsersUI(
 *   (state) => ({
 *     search: state.search,
 *     page: state.page,
 *     setSearch: state.setSearch
 *   }),
 *   shallow
 * );
 * ```
 */
export { shallow };

/**
 * Utility type for creating selector functions
 */
export type Selector<T, U> = (state: T) => U;

/**
 * Helper for creating typed selectors
 */
export function createSelector<T, U>(selector: Selector<T, U>) {
  return selector;
}
