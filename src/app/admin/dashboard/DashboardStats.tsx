"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/core/api/api";

interface DashboardStats {
  users: {
    total: number;
    active: number;
  };
  lessons: {
    total: number;
    byStatus: Record<string, number>;
  };
  vocabularies: {
    total: number;
  };
  stories: {
    total: number;
    totalChunks: number;
    byType: Record<string, number>;
  };
  quizzes: {
    total: number;
    totalQuestions: number;
    totalResults: number;
  };
  recentActivity: Array<{
    id: number;
    type: string;
    title?: string;
    name?: string;
    email?: string;
    level?: string;
    storyType?: string;
    createdAt: string;
  }>;
  summary: {
    totalContent: number;
    totalInteractions: number;
    activeUsers: number;
  };
}

export default function DashboardStats() {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api<DashboardStats>("/api/dashboard/stats"),
    staleTime: 5 * 60_000, // 5 minutes
    gcTime: 10 * 60_000,
  });

  if (isLoading) {
    return <div className="text-center py-8">Đang tải thống kê...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">Lỗi khi tải dữ liệu</div>
    );
  }

  if (!stats) {
    return <div className="text-center py-8">Không có dữ liệu</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Tổng người dùng
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.users.total}
              </p>
              <p className="text-sm text-green-600">
                {stats.users.active} hoạt động
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng nội dung</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.summary.totalContent}
              </p>
              <p className="text-sm text-gray-500">Lessons, Stories, Quizzes</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Lượt tương tác
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.summary.totalInteractions}
              </p>
              <p className="text-sm text-gray-500">Quiz attempts</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg
                className="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Người dùng hoạt động
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.summary.activeUsers}
              </p>
              <p className="text-sm text-gray-500">30 ngày qua</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lessons Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lessons</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tổng số lessons:</span>
              <span className="font-semibold">{stats.lessons.total}</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Theo trạng thái:
              </p>
              {stats.lessons.byStatus &&
                Object.entries(stats.lessons.byStatus).map(
                  ([status, count]) => (
                    <div
                      key={status}
                      className="flex justify-between items-center pl-4"
                    >
                      <span className="text-sm text-gray-600">{status}:</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  )
                )}
            </div>
          </div>
        </div>

        {/* Vocabularies Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Vocabularies
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tổng số từ vựng:</span>
              <span className="font-semibold">{stats.vocabularies.total}</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Từ vựng theo lessons
              </p>
              <div className="text-sm text-gray-600">
                Tổng số từ vựng được phân bổ trong các lessons
              </div>
            </div>
          </div>
        </div>

        {/* Stories Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stories</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tổng số stories:</span>
              <span className="font-semibold">{stats.stories.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tổng chunks:</span>
              <span className="font-semibold">{stats.stories.totalChunks}</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Theo loại:</p>
              {Object.entries(stats.stories.byType).map(([type, count]) => (
                <div
                  key={type}
                  className="flex justify-between items-center pl-4"
                >
                  <span className="text-sm text-gray-600 capitalize">
                    {type}:
                  </span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quizzes Stats */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quizzes</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tổng số quizzes:</span>
              <span className="font-semibold">{stats.quizzes.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tổng câu hỏi:</span>
              <span className="font-semibold">
                {stats.quizzes.totalQuestions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Lượt làm bài:</span>
              <span className="font-semibold">
                {stats.quizzes.totalResults}
              </span>
            </div>
            {stats.quizzes.total > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Trung bình câu hỏi/quiz:
                </span>
                <span className="font-semibold">
                  {Math.round(
                    stats.quizzes.totalQuestions / stats.quizzes.total
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Hoạt động gần đây
        </h3>
        <div className="space-y-3">
          {stats.recentActivity.map((activity, index) => (
            <div
              key={`${activity.type}-${activity.id}`}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.type === "user"
                      ? "bg-blue-500"
                      : activity.type === "lesson"
                      ? "bg-green-500"
                      : activity.type === "story"
                      ? "bg-purple-500"
                      : "bg-orange-500"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.type === "user"
                      ? `Người dùng: ${activity.name || activity.email}`
                      : activity.type === "lesson"
                      ? `Lesson: ${activity.title} (Level ${activity.level})`
                      : activity.type === "story"
                      ? `Story: ${activity.title} (${activity.storyType})`
                      : `Quiz: ${activity.title}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  activity.type === "user"
                    ? "bg-blue-100 text-blue-800"
                    : activity.type === "lesson"
                    ? "bg-green-100 text-green-800"
                    : activity.type === "story"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {activity.type}
              </span>
            </div>
          ))}
        </div>

        {stats.recentActivity.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            Chưa có hoạt động nào
          </div>
        )}
      </div>
    </div>
  );
}
