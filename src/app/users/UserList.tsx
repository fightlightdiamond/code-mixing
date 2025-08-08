"use client";
import { useQuery } from "@tanstack/react-query";
import {
  buildUsersListQuery,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  User,
} from "@/features/users/hooks";
import {
  useUsersFilters,
  useUsersFilterActions,
  useUsersModal,
} from "@/features/users/state";
import { useState } from "react";

export default function UserList() {
  const { search, page, pageSize, sortBy } = useUsersFilters();
  const { setSearch, setPage, setPageSize, setSortBy, reset } =
    useUsersFilterActions();
  const { modalOpen, selectedId, openModal, closeModal } = useUsersModal();

  // TanStack Query with Zustand state
  const q = useQuery(buildUsersListQuery({ search }));

  // Mutations
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  return (
    <section>
      {/* Filters and Controls */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          style={{ minWidth: 200 }}
        />

        <select
          value={pageSize}
          onChange={(e) => setPageSize(parseInt(e.target.value))}
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
        </select>

        <select
          value={sortBy || ""}
          onChange={(e) => setSortBy(e.target.value || null)}
        >
          <option value="">No sorting</option>
          <option value="name">Sort by Name</option>
          <option value="email">Sort by Email</option>
          <option value="created">Sort by Created</option>
        </select>

        <button onClick={reset} style={{ marginLeft: "auto" }}>
          Reset Filters
        </button>

        <button
          onClick={() =>
            createUser.mutate({
              name: "New User",
              email: `user${Date.now()}@example.com`,
            })
          }
          disabled={createUser.isPending}
        >
          {createUser.isPending ? "Creating..." : "Add User"}
        </button>
      </div>

      {/* Results */}
      {q.isPending ? (
        <p>Loading users...</p>
      ) : q.isError ? (
        <p style={{ color: "red" }}>Error: {(q.error as Error).message}</p>
      ) : (
        <>
          <div style={{ marginBottom: 12, fontSize: 14, color: "#666" }}>
            Showing {q.data?.length || 0} users
            {search && ` matching "${search}"`}
            {sortBy && ` sorted by ${sortBy}`}
          </div>

          <ul style={{ display: "grid", gap: 8 }}>
            {q.data?.map((u: User) => (
              <li
                key={u.id}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  padding: 8,
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  backgroundColor: selectedId === u.id ? "#f0f8ff" : "white",
                }}
              >
                <span style={{ minWidth: 180, flex: 1 }}>
                  {u.label ?? `${u.name} <${u.email}>`}
                </span>

                <button
                  onClick={() => openModal(u.id)}
                  style={{ fontSize: 12 }}
                >
                  View
                </button>

                <button
                  onClick={() =>
                    updateUser.mutate({
                      id: u.id,
                      data: { name: u.name + "!" },
                    })
                  }
                  disabled={updateUser.isPending}
                  style={{ fontSize: 12 }}
                >
                  {updateUser.isPending ? "..." : "Update"}
                </button>

                <button
                  onClick={() => deleteUser.mutate(u.id)}
                  disabled={deleteUser.isPending}
                  style={{ fontSize: 12, color: "red" }}
                >
                  {deleteUser.isPending ? "..." : "Delete"}
                </button>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              marginTop: 16,
              alignItems: "center",
            }}
          >
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>

            <span style={{ fontSize: 14 }}>Page {page}</span>

            <button
              onClick={() => setPage(page + 1)}
              disabled={!q.data || q.data.length < pageSize}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Simple Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 24,
              borderRadius: 8,
              minWidth: 300,
            }}
          >
            <h3>User Details</h3>
            <p>Selected User ID: {selectedId}</p>
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
}
