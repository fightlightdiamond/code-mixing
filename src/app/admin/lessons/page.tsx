import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/app/get-query-client";
import AdminLessonList from "./AdminLessonList";
import { handleAdminPageSSR } from "../ssr-utils";
import { log } from "@/lib/logger";
import type { QueryParams } from "@/types/api";

interface AdminLessonsPageProps {
  searchParams: Promise<QueryParams & {
    level?: string;
  }>;
}

export default async function AdminLessonsPage({
  searchParams,
}: AdminLessonsPageProps) {
  const qc = getQueryClient();

  // Parse search params with proper typing
  const params = await searchParams;
  const search = params.search || "";
  const level = params.level || "";

  // Use centralized SSR handling for authenticated routes
  handleAdminPageSSR({
    routeName: 'admin/lessons',
    skipPrefetch: true,
    logPerformance: true
  });
  
  log.ssr('Admin lessons page rendering', 'admin/lessons', {
    search,
    level
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
          📚 Quản lý bài học
        </h1>
        <p
          style={{
            color: "#64748b",
            fontSize: 18,
            margin: 0,
          }}
        >
          Tạo và quản lý các bài học tiếng Anh theo chủ đề IT
        </p>
      </div>

      <HydrationBoundary state={dehydrate(qc)}>
        <AdminLessonList />
      </HydrationBoundary>
    </div>
  );
}
