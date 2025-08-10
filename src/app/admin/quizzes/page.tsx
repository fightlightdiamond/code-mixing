import { Suspense } from "react";
import AdminQuizzesList from "./AdminQuizzesList";

export default function AdminQuizzesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Quizzes</h1>
        <p className="text-gray-600">Quản lý các bài kiểm tra và câu hỏi</p>
      </div>

      <Suspense fallback={<div>Loading quizzes...</div>}>
        <AdminQuizzesList />
      </Suspense>
    </div>
  );
}
