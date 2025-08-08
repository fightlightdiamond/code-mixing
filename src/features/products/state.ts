"use client";

import { makeStore, shallow, createSelector } from "@/core/state/makeStore";

// UI State interface for Products feature
interface ProductsUIState {
  // Filter and pagination state
  search: string;
  page: number;
  pageSize: number;
  sortBy: string | null;

  // Product-specific filters
  category: string | null;
  priceRange: [number, number] | null;
  inStock: boolean | null;

  // Selection state
  selectedId: number | null;

  // Actions
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSortBy: (sortBy: string | null) => void;
  setCategory: (category: string | null) => void;
  setPriceRange: (range: [number, number] | null) => void;
  setInStock: (inStock: boolean | null) => void;
  setSelectedId: (id: number | null) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  search: "",
  page: 1,
  pageSize: 12, // Different default for products
  sortBy: null,
  category: null,
  priceRange: null,
  inStock: null,
  selectedId: null,
};

// Create the store
export const useProductsUI = makeStore<ProductsUIState>(
  (set, get) => ({
    ...initialState,

    // Filter actions
    setSearch: (search: string) => set({ search, page: 1 }),
    setPage: (page: number) => set({ page }),
    setPageSize: (pageSize: number) => set({ pageSize, page: 1 }),
    setSortBy: (sortBy: string | null) => set({ sortBy, page: 1 }),
    setCategory: (category: string | null) => set({ category, page: 1 }),
    setPriceRange: (priceRange: [number, number] | null) =>
      set({ priceRange, page: 1 }),
    setInStock: (inStock: boolean | null) => set({ inStock, page: 1 }),

    // Selection actions
    setSelectedId: (selectedId: number | null) => set({ selectedId }),

    // Reset action
    reset: () => set(initialState),
  }),
  {
    name: "products-ui",
    persist: false,
  }
);

// Optimized selectors
export const useProductsFilters = () =>
  useProductsUI(
    createSelector((state) => ({
      search: state.search,
      page: state.page,
      pageSize: state.pageSize,
      sortBy: state.sortBy,
      category: state.category,
      priceRange: state.priceRange,
      inStock: state.inStock,
    })),
    shallow
  );

export const useProductsFilterActions = () =>
  useProductsUI(
    createSelector((state) => ({
      setSearch: state.setSearch,
      setPage: state.setPage,
      setPageSize: state.setPageSize,
      setSortBy: state.setSortBy,
      setCategory: state.setCategory,
      setPriceRange: state.setPriceRange,
      setInStock: state.setInStock,
      reset: state.reset,
    })),
    shallow
  );

// Selector for URL sync (only the params that should be synced)
export const useProductsURLState = () =>
  useProductsUI(
    createSelector((state) => ({
      search: state.search,
      page: state.page,
      pageSize: state.pageSize,
      sortBy: state.sortBy,
    })),
    shallow
  );
