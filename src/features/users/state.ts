"use client";

import { makeStore, shallow } from "@/core/state/makeStore";

// UI State interface for Users feature
interface UsersUIState {
  // Filter and pagination state
  search: string;
  page: number;
  pageSize: number;
  sortBy: string | null;

  // Modal and selection state
  modalOpen: boolean;
  selectedId: number | null;

  // Actions
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSortBy: (sortBy: string | null) => void;
  openModal: (id?: number) => void;
  closeModal: () => void;
  setSelectedId: (id: number | null) => void;
  reset: () => void;
}

// Initial state
const initialState = {
  search: "",
  page: 1,
  pageSize: 10,
  sortBy: null,
  modalOpen: false,
  selectedId: null,
};

// Create the store with devtools and no persistence by default
export const useUsersUI = makeStore<UsersUIState>(
  (set) => ({
    ...initialState,

    // Filter actions
    setSearch: (search: string) => set({ search, page: 1 }), // Reset to page 1 on search
    setPage: (page: number) => set({ page }),
    setPageSize: (pageSize: number) => set({ pageSize, page: 1 }), // Reset to page 1 on page size change
    setSortBy: (sortBy: string | null) => set({ sortBy, page: 1 }), // Reset to page 1 on sort change

    // Modal actions
    openModal: (id?: number) =>
      set({ modalOpen: true, selectedId: id || null }),
    closeModal: () => set({ modalOpen: false, selectedId: null }),
    setSelectedId: (selectedId: number | null) => set({ selectedId }),

    // Reset action
    reset: () => set(initialState),
  }),
  {
    name: "users-ui",
    persist: false, // UI state typically shouldn't persist across sessions
  }
);

// ✅ Individual selectors - tránh infinite loop hoàn toàn
export const useUsersSearch = () => useUsersUI((state) => state.search);
export const useUsersPage = () => useUsersUI((state) => state.page);
export const useUsersPageSize = () => useUsersUI((state) => state.pageSize);
export const useUsersSortBy = () => useUsersUI((state) => state.sortBy);

export const useUsersSetSearch = () => useUsersUI((state) => state.setSearch);
export const useUsersSetPage = () => useUsersUI((state) => state.setPage);
export const useUsersSetPageSize = () =>
  useUsersUI((state) => state.setPageSize);
export const useUsersSetSortBy = () => useUsersUI((state) => state.setSortBy);
export const useUsersReset = () => useUsersUI((state) => state.reset);

export const useUsersModalOpen = () => useUsersUI((state) => state.modalOpen);
export const useUsersSelectedId = () => useUsersUI((state) => state.selectedId);
export const useUsersOpenModal = () => useUsersUI((state) => state.openModal);
export const useUsersCloseModal = () => useUsersUI((state) => state.closeModal);
export const useUsersSetSelectedId = () =>
  useUsersUI((state) => state.setSelectedId);

// ✅ Convenience hooks - combine individual hooks
export const useUsersFilters = () => ({
  search: useUsersSearch(),
  page: useUsersPage(),
  pageSize: useUsersPageSize(),
  sortBy: useUsersSortBy(),
});

export const useUsersFilterActions = () => ({
  setSearch: useUsersSetSearch(),
  setPage: useUsersSetPage(),
  setPageSize: useUsersSetPageSize(),
  setSortBy: useUsersSetSortBy(),
  reset: useUsersReset(),
});

export const useUsersModal = () => ({
  modalOpen: useUsersModalOpen(),
  selectedId: useUsersSelectedId(),
  openModal: useUsersOpenModal(),
  closeModal: useUsersCloseModal(),
  setSelectedId: useUsersSetSelectedId(),
});
