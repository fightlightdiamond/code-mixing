import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/app/get-query-client";
import AdminUserList from "./AdminUserList";
import { buildUsersListQuery } from "@/features/users/hooks";

interface AdminUsersPageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
    pageSize?: string;
    role?: string;
  }>;
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const qc = getQueryClient();

  // Parse search params for prefetching
  const params = await searchParams;
  const search = params.search || "";
  const page = params.page ? parseInt(params.page, 10) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : 20;
  const role = params.role || "";

  // Prefetch users data
  try {
    await qc.prefetchQuery(buildUsersListQuery({ search }));
  } catch (error) {
    console.error("Failed to prefetch users:", error);
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#1e293b",
            margin: 0,
            marginBottom: 8,
          }}
        >
          👥 Quản lý người dùng
        </h1>
        <p
          style={{
            color: "#64748b",
            fontSize: 18,
            margin: 0,
          }}
        >
          Quản lý tài khoản học viên, giảng viên và quản trị viên
        </p>
      </div>

      <HydrationBoundary state={dehydrate(qc)}>
        <AdminUserList />
      </HydrationBoundary>
    </div>
  );
}
