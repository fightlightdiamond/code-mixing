"use client";
import { logger } from '@/lib/logger';

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  buildQuizzesListQuery,
  useCreateQuiz,
  useUpdateQuiz,
  useDeleteQuiz,
  type Quiz,
  type CreateQuizData,
  type UpdateQuizData,
} from "@/features/quizzes/hooks";
import {
  useQuizzesFilters,
  useQuizzesFilterActions,
  useQuizzesSelection,
} from "@/features/quizzes/state";

export default function AdminQuizzesList() {
  const filters = useQuizzesFilters();
  const { setSearch, setLessonId } = useQuizzesFilterActions();
  const { selectedId, setSelectedId } = useQuizzesSelection();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Queries
  const { data: quizzes = [], isLoading } = useQuery(
    buildQuizzesListQuery({
      ...filters,
      lessonId: filters.lessonId || undefined,
    })
  );

  // Mutations
  const createMutation = useCreateQuiz();
  const updateMutation = useUpdateQuiz();
  const deleteMutation = useDeleteQuiz();

  const handleCreate = async (data: CreateQuizData) => {
    try {
      await createMutation.mutateAsync(data);
      setShowCreateModal(false);
    } catch (error) {
      logger.error("Error creating quiz:", undefined, error as Error);
    }
  };

  const handleUpdate = async (data: UpdateQuizData) => {
    if (!selectedId) return;

    try {
      await updateMutation.mutateAsync({ id: selectedId, data });
      setShowEditModal(false);
      setSelectedId(null);
    } catch (error) {
      logger.error("Error updating quiz:", undefined, error as Error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa quiz này?")) return;

    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      logger.error("Error deleting quiz:", undefined, error as Error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Đang tải quizzes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc mô tả..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lesson ID
            </label>
            <input
              type="number"
              value={filters.lessonId || ""}
              onChange={(e) =>
                setLessonId(e.target.value ? parseInt(e.target.value) : null)
              }
              placeholder="Lọc theo lesson..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Tìm thấy {quizzes.length} quizzes
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Tạo Quiz Mới
          </button>
        </div>
      </div>

      {/* Quizzes List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quiz
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lesson
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Câu hỏi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lượt làm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {quiz.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {quiz.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {quiz.lesson ? (
                      <span className="text-sm text-gray-900">
                        {quiz.lesson.title}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {quiz._count.questions} câu
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {quiz._count.userResults}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(quiz.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedId(quiz.id);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(quiz.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={deleteMutation.isPending}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {quizzes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không tìm thấy quizzes nào
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateQuizModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedId && (
        <EditQuizModal
          quizId={selectedId}
          onClose={() => {
            setShowEditModal(false);
            setSelectedId(null);
          }}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}

// Create Quiz Modal Component
function CreateQuizModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (data: CreateQuizData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CreateQuizData>({
    title: "",
    description: "",
    lessonId: undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Tạo Quiz Mới</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lesson ID
              </label>
              <input
                type="number"
                value={formData.lessonId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lessonId: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Đang tạo..." : "Tạo Quiz"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Quiz Modal Component
function EditQuizModal({
  quizId,
  onClose,
  onSubmit,
  isLoading,
}: {
  quizId: number;
  onClose: () => void;
  onSubmit: (data: UpdateQuizData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<UpdateQuizData>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Chỉnh sửa Quiz</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề
              </label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Đang cập nhật..." : "Cập nhật"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
