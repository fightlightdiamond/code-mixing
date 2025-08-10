import { Suspense } from "react";
import DashboardStats from "./DashboardStats";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
        <p className="text-gray-600">
          Thống kê và dữ liệu tổng hợp của toàn bộ hệ thống
        </p>
      </div>

      <Suspense fallback={<div>Loading dashboard...</div>}>
        <DashboardStats />
      </Suspense>
    </div>
  );
}
