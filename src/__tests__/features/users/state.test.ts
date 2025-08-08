/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import {
  useUsersFilters,
  useUsersFilterActions,
  useUsersModal,
} from "@/features/users/state";

describe("Users State", () => {
  describe("useUsersFilters", () => {
    it("should return initial filter state", () => {
      const { result } = renderHook(() => useUsersFilters());

      expect(result.current).toEqual({
        search: "",
        page: 1,
        pageSize: 10,
        sortBy: null,
      });
    });
  });

  describe("useUsersFilterActions", () => {
    it("should update search and reset page to 1", () => {
      const { result: filtersResult } = renderHook(() => useUsersFilters());
      const { result: actionsResult } = renderHook(() =>
        useUsersFilterActions()
      );

      act(() => {
        actionsResult.current.setSearch("test search");
      });

      expect(filtersResult.current.search).toBe("test search");
      expect(filtersResult.current.page).toBe(1);
    });

    it("should update page", () => {
      const { result: filtersResult } = renderHook(() => useUsersFilters());
      const { result: actionsResult } = renderHook(() =>
        useUsersFilterActions()
      );

      act(() => {
        actionsResult.current.setPage(3);
      });

      expect(filtersResult.current.page).toBe(3);
    });

    it("should update page size and reset page to 1", () => {
      const { result: filtersResult } = renderHook(() => useUsersFilters());
      const { result: actionsResult } = renderHook(() =>
        useUsersFilterActions()
      );

      // First set page to something other than 1
      act(() => {
        actionsResult.current.setPage(5);
      });

      expect(filtersResult.current.page).toBe(5);

      // Then change page size
      act(() => {
        actionsResult.current.setPageSize(20);
      });

      expect(filtersResult.current.pageSize).toBe(20);
      expect(filtersResult.current.page).toBe(1); // Should reset to 1
    });

    it("should update sort by and reset page to 1", () => {
      const { result: filtersResult } = renderHook(() => useUsersFilters());
      const { result: actionsResult } = renderHook(() =>
        useUsersFilterActions()
      );

      // First set page to something other than 1
      act(() => {
        actionsResult.current.setPage(3);
      });

      expect(filtersResult.current.page).toBe(3);

      // Then change sort
      act(() => {
        actionsResult.current.setSortBy("name");
      });

      expect(filtersResult.current.sortBy).toBe("name");
      expect(filtersResult.current.page).toBe(1); // Should reset to 1
    });

    it("should reset all filters to initial state", () => {
      const { result: filtersResult } = renderHook(() => useUsersFilters());
      const { result: actionsResult } = renderHook(() =>
        useUsersFilterActions()
      );

      // Change some values
      act(() => {
        actionsResult.current.setSearch("test");
        actionsResult.current.setPage(5);
        actionsResult.current.setPageSize(50);
        actionsResult.current.setSortBy("email");
      });

      // Verify they changed
      expect(filtersResult.current.search).toBe("test");
      expect(filtersResult.current.page).toBe(1); // Should be 1 due to search reset
      expect(filtersResult.current.pageSize).toBe(50);
      expect(filtersResult.current.sortBy).toBe("email");

      // Reset
      act(() => {
        actionsResult.current.reset();
      });

      // Verify reset to initial state
      expect(filtersResult.current).toEqual({
        search: "",
        page: 1,
        pageSize: 10,
        sortBy: null,
      });
    });
  });

  describe("useUsersModal", () => {
    it("should return initial modal state", () => {
      const { result } = renderHook(() => useUsersModal());

      expect(result.current.modalOpen).toBe(false);
      expect(result.current.selectedId).toBe(null);
    });

    it("should open modal with user id", () => {
      const { result } = renderHook(() => useUsersModal());

      act(() => {
        result.current.openModal(123);
      });

      expect(result.current.modalOpen).toBe(true);
      expect(result.current.selectedId).toBe(123);
    });

    it("should open modal without user id", () => {
      const { result } = renderHook(() => useUsersModal());

      act(() => {
        result.current.openModal();
      });

      expect(result.current.modalOpen).toBe(true);
      expect(result.current.selectedId).toBe(null);
    });

    it("should close modal and clear selected id", () => {
      const { result } = renderHook(() => useUsersModal());

      // First open modal with id
      act(() => {
        result.current.openModal(456);
      });

      expect(result.current.modalOpen).toBe(true);
      expect(result.current.selectedId).toBe(456);

      // Then close modal
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.modalOpen).toBe(false);
      expect(result.current.selectedId).toBe(null);
    });

    it("should set selected id", () => {
      const { result } = renderHook(() => useUsersModal());

      act(() => {
        result.current.setSelectedId(789);
      });

      expect(result.current.selectedId).toBe(789);
    });
  });
});
