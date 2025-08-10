"use client";

import { useQuery } from "@tanstack/react-query";
import {
  buildUsersListQuery,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  User,
} from "@/features/users/hooks";
import { useUsersFilters, useUsersFilterActions } from "@/features/users/state";
import { useState } from "react";

interface UserFormData {
  name: string;
  email: string;
  role: "student" | "coach" | "admin";
}

export default function AdminUserList() {
  const { search, page, pageSize } = useUsersFilters();
  const { setSearch, setPage, setPageSize, reset } = useUsersFilterActions();

  // Local state for forms
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    role: "student",
  });

  // Query and mutations
  const q = useQuery(buildUsersListQuery({ search }));
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  
  // Safely extract users array (query hook handles API response internally)
  const users = q.data || [];

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser.mutateAsync(formData);
      setShowCreateForm(false);
      setFormData({ name: "", email: "", role: "student" });
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await updateUser.mutateAsync({
        id: editingUser.id,
        data: formData,
      });
      setEditingUser(null);
      setFormData({ name: "", email: "", role: "student" });
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (
      window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.name}"?`)
    ) {
      try {
        await deleteUser.mutateAsync(user.id);
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setShowCreateForm(false);
    setFormData({ name: "", email: "", role: "student" });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "student":
        return "Học viên";
      case "coach":
        return "Giảng viên";
      case "admin":
        return "Quản trị viên";
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return { bg: "#fef3c7", color: "#92400e" };
      case "coach":
        return { bg: "#dbeafe", color: "#1e40af" };
      case "student":
        return { bg: "#f3e8ff", color: "#7c3aed" };
      default:
        return { bg: "#f3f4f6", color: "#374151" };
    }
  };

  return (
    <div>
      {/* Controls */}
      <div
        style={{
          backgroundColor: "white",
          padding: 24,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          marginBottom: 24,
          boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo tên hoặc email..."
            style={{
              minWidth: 300,
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
            }}
          />

          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value))}
            style={{
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
            }}
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>

          <button
            onClick={reset}
            style={{
              padding: "12px 20px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              backgroundColor: "white",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Đặt lại
          </button>

          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingUser(null);
              setFormData({ name: "", email: "", role: "student" });
            }}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: 8,
              backgroundColor: "#2563eb",
              color: "white",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              marginLeft: "auto",
            }}
          >
            + Thêm người dùng
          </button>
        </div>
      </div>

      {/* User Form */}
      {(showCreateForm || editingUser) && (
        <div
          style={{
            backgroundColor: "white",
            padding: 24,
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            marginBottom: 24,
            boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.06)",
          }}
        >
          <h3
            style={{
              margin: 0,
              marginBottom: 20,
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
          </h3>

          <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 200px",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  Tên *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                  }}
                  placeholder="Nhập tên người dùng"
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                  }}
                  placeholder="Nhập email"
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  Vai trò
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as any })
                  }
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                  }}
                >
                  <option value="student">Học viên</option>
                  <option value="coach">Giảng viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="submit"
                disabled={createUser.isPending || updateUser.isPending}
                style={{
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: 8,
                  backgroundColor: "#16a34a",
                  color: "white",
                  cursor:
                    createUser.isPending || updateUser.isPending
                      ? "not-allowed"
                      : "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  opacity:
                    createUser.isPending || updateUser.isPending ? 0.7 : 1,
                }}
              >
                {createUser.isPending || updateUser.isPending
                  ? "Đang xử lý..."
                  : editingUser
                  ? "Cập nhật"
                  : "Tạo người dùng"}
              </button>

              <button
                type="button"
                onClick={cancelEdit}
                style={{
                  padding: "12px 24px",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        }}
      >
        {q.isPending ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p>Đang tải danh sách người dùng...</p>
          </div>
        ) : q.isError ? (
          <div style={{ padding: 40, textAlign: "center", color: "#ef4444" }}>
            <p>Lỗi: {(q.error as Error).message}</p>
          </div>
        ) : q.data && q.data.length > 0 ? (
          <>
            {/* Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr 1fr 120px 150px 120px 150px",
                backgroundColor: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
                padding: "16px 24px",
                fontWeight: 600,
                fontSize: 14,
                color: "#374151",
              }}
            >
              <div>ID</div>
              <div>Tên</div>
              <div>Email</div>
              <div>Vai trò</div>
              <div>Ngày tạo</div>
              <div>Trạng thái</div>
              <div style={{ textAlign: "center" }}>Thao tác</div>
            </div>

            {/* Rows */}
            {users.map((user: User) => {
              const roleColor = getRoleBadgeColor(user.role);
              return (
                <div
                  key={user.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr 1fr 120px 150px 120px 150px",
                    padding: "16px 24px",
                    borderBottom: "1px solid #f3f4f6",
                    fontSize: 14,
                    alignItems: "center",
                  }}
                >
                  <div style={{ color: "#9ca3af", fontWeight: 500 }}>
                    #{user.id}
                  </div>

                  <div style={{ fontWeight: 500, color: "#1f2937" }}>
                    {user.name}
                  </div>

                  <div style={{ color: "#6b7280" }}>{user.email}</div>

                  <div>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor: roleColor.bg,
                        color: roleColor.color,
                      }}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </div>

                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </div>

                  <div>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                      }}
                    >
                      Hoạt động
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "center",
                    }}
                  >
                    <button
                      onClick={() => startEdit(user)}
                      style={{
                        padding: "6px 12px",
                        border: "1px solid #2563eb",
                        borderRadius: 6,
                        backgroundColor: "white",
                        color: "#2563eb",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      Sửa
                    </button>

                    <button
                      onClick={() => handleDeleteUser(user)}
                      disabled={deleteUser.isPending}
                      style={{
                        padding: "6px 12px",
                        border: "1px solid #ef4444",
                        borderRadius: 6,
                        backgroundColor: "white",
                        color: "#ef4444",
                        cursor: deleteUser.isPending
                          ? "not-allowed"
                          : "pointer",
                        fontSize: 12,
                        fontWeight: 500,
                        opacity: deleteUser.isPending ? 0.7 : 1,
                      }}
                    >
                      {deleteUser.isPending ? "..." : "Xóa"}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
            <p>Không tìm thấy người dùng nào</p>
          </div>
        )}
      </div>

      {/* Stats */}
      {q.data && (
        <div
          style={{
            marginTop: 16,
            fontSize: 14,
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          Hiển thị {q.data.length} người dùng
          {search && ` (tìm kiếm: "${search}")`}
        </div>
      )}
    </div>
  );
}
