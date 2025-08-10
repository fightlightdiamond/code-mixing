import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/app/get-query-client";
import AdminUserList from "./AdminUserList";
import { handleAdminPageSSR } from "../ssr-utils";
import { log } from "@/lib/logger";
import type { QueryParams } from "@/types/api";

interface AdminUsersPageProps {
  searchParams: Promise<QueryParams & {
    role?: string;
  }>;
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const qc = getQueryClient();

  // Parse search params with proper typing
  const params = await searchParams;
  const search = params.search || "";
  const page = params.page ? parseInt(params.page.toString(), 10) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize.toString(), 10) : 20;
  const role = params.role || "";

  // Use centralized SSR handling for authenticated routes
  handleAdminPageSSR({
    routeName: 'admin/users',
    skipPrefetch: true,
    logPerformance: true
  });
  
  log.ssr('Admin users page rendering', 'admin/users', {
    search,
    page,
    pageSize,
    role
  });

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
