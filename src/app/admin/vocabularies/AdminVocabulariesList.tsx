"use client";
import { logger } from '@/lib/logger';

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  buildVocabulariesListQuery,
  useCreateVocabulary,
  useUpdateVocabulary,
  useDeleteVocabulary,
  type Vocabulary,
  type CreateVocabularyData,
  type UpdateVocabularyData,
} from "@/features/vocabularies/hooks";
import {
  useVocabulariesFilters,
  useVocabulariesFilterActions,
  useVocabulariesSelection,
} from "@/features/vocabularies/state";

export default function AdminVocabulariesList() {
  const filters = useVocabulariesFilters();
  const { setSearch, setLevel } = useVocabulariesFilterActions();
  const { selectedId, setSelectedId } = useVocabulariesSelection();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Queries
  const { data: vocabularies = [], isLoading } = useQuery(
    buildVocabulariesListQuery(filters)
  );

  // Mutations
  const createMutation = useCreateVocabulary();
  const updateMutation = useUpdateVocabulary();
  const deleteMutation = useDeleteVocabulary();

  const handleCreate = async (data: CreateVocabularyData) => {
    try {
      await createMutation.mutateAsync(data);
      setShowCreateModal(false);
    } catch (error) {
      logger.error("Error creating vocabulary:", error);
    }
  };

  const handleUpdate = async (data: UpdateVocabularyData) => {
    if (!selectedId) return;

    try {
      await updateMutation.mutateAsync({ id: selectedId, data });
      setShowEditModal(false);
      setSelectedId(null);
    } catch (error) {
      logger.error("Error updating vocabulary:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa từ vựng này?")) return;

    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      logger.error("Error deleting vocabulary:", error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Đang tải vocabularies...</div>;
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
              placeholder="Tìm theo từ tiếng Anh hoặc tiếng Việt..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cấp độ
            </label>
            <select
              value={filters.level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả cấp độ</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
              <option value="5">Level 5</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Tìm thấy {vocabularies.length} từ vựng
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Thêm Từ Vựng Mới
          </button>
        </div>
      </div>

      {/* Vocabularies List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Từ vựng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nghĩa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cấp độ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phát âm
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
              {vocabularies.map((vocabulary) => (
                <tr key={vocabulary.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {vocabulary.englishWord}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {vocabulary.vietnameseMeaning}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Level {vocabulary.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vocabulary.pronunciation || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(vocabulary.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedId(vocabulary.id);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(vocabulary.id)}
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

        {vocabularies.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không tìm thấy từ vựng nào
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateVocabularyModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedId && (
        <EditVocabularyModal
          vocabularyId={selectedId}
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

// Create Vocabulary Modal Component
function CreateVocabularyModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (data: CreateVocabularyData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CreateVocabularyData>({
    englishWord: "",
    vietnameseMeaning: "",
    level: "1",
    pronunciation: "",
    exampleSentence: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Thêm Từ Vựng Mới</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ tiếng Anh *
              </label>
              <input
                type="text"
                value={formData.englishWord}
                onChange={(e) =>
                  setFormData({ ...formData, englishWord: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nghĩa tiếng Việt *
              </label>
              <input
                type="text"
                value={formData.vietnameseMeaning}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vietnameseMeaning: e.target.value,
                  })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cấp độ *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) =>
                    setFormData({ ...formData, level: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phát âm
                </label>
                <input
                  type="text"
                  value={formData.pronunciation}
                  onChange={(e) =>
                    setFormData({ ...formData, pronunciation: e.target.value })
                  }
                  placeholder="/prəˌnʌnsiˈeɪʃən/"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Câu ví dụ
              </label>
              <textarea
                value={formData.exampleSentence}
                onChange={(e) =>
                  setFormData({ ...formData, exampleSentence: e.target.value })
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
                {isLoading ? "Đang thêm..." : "Thêm Từ Vựng"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Vocabulary Modal Component
function EditVocabularyModal({
  vocabularyId,
  onClose,
  onSubmit,
  isLoading,
}: {
  vocabularyId: number;
  onClose: () => void;
  onSubmit: (data: UpdateVocabularyData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<UpdateVocabularyData>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Chỉnh sửa Từ Vựng</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ tiếng Anh
              </label>
              <input
                type="text"
                value={formData.englishWord || ""}
                onChange={(e) =>
                  setFormData({ ...formData, englishWord: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nghĩa tiếng Việt
              </label>
              <input
                type="text"
                value={formData.vietnameseMeaning || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vietnameseMeaning: e.target.value,
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
                {isLoading ? "Đang cập nhật..." : "Cập nhật"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
