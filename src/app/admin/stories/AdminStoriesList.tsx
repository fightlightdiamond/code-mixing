"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  buildStoriesListQuery,
  buildTagsListQuery,
  useCreateStory,
  useUpdateStory,
  useDeleteStory,
  useBulkUpdateStories,
  useBulkDeleteStories,
  type CreateStoryData,
  type UpdateStoryData,
  type Story,
  type StoryType,
  type DifficultyLevel,
  type ContentStatus,
  type StoryTag,
} from "@/features/stories/hooks";
import { buildLessonsListQuery } from "@/features/lessons/hooks";

interface StoriesFilters {
  search: string;
  lessonId: string | null;
  storyType: StoryType | "";
  difficulty: DifficultyLevel | "";
  status: ContentStatus | "";
  tagIds: string[];
}

export default function AdminStoriesList() {
  const filters = useStoriesFilters();
  const { setSearch, setLessonId, setStoryType } = useStoriesFilterActions();
  const { selectedId, setSelectedId } = useStoriesSelection();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Queries
  const { data: stories = [], isLoading } = useQuery(
    buildStoriesListQuery(filters)
  );

  // Mutations
  const createMutation = useCreateStory();
  const updateMutation = useUpdateStory();
  const deleteMutation = useDeleteStory();

  const handleCreate = async (data: CreateStoryData) => {
    try {
      await createMutation.mutateAsync(data);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating story:", error);
    }
  };

  const handleUpdate = async (data: UpdateStoryData) => {
    if (!selectedId) return;

    try {
      await updateMutation.mutateAsync({ id: selectedId, data });
      setShowEditModal(false);
      setSelectedId(null);
    } catch (error) {
      console.error("Error updating story:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa story này?")) return;

    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting story:", error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Đang tải stories...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc nội dung..."
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Story Type
            </label>
            <select
              value={filters.storyType}
              onChange={(e) => setStoryType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả loại</option>
              <option value="original">Original</option>
              <option value="chemdanhtu">Noun Embedding</option>
              <option value="chemdongtu">Verb Embedding</option>
              <option value="chemtinhtu">Adjective Embedding</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Tìm thấy {stories.length} stories
          </span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Tạo Story Mới
          </button>
        </div>
      </div>

      {/* Stories List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Story
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lesson
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chunks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chem Ratio
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
              {stories.map((story) => (
                <tr key={story.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {story.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {story.content}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {story.lesson ? (
                      <span className="text-sm text-gray-900">
                        {story.lesson.title}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {story.storyType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {story.chunks.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {story.chemRatio}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(story.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedId(story.id);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(story.id)}
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

        {stories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Không tìm thấy stories nào
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateStoryModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedId && (
        <EditStoryModal
          storyId={selectedId}
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

// Create Story Modal Component
function CreateStoryModal({
  onClose,
  onSubmit,
  isLoading,
}: {
  onClose: () => void;
  onSubmit: (data: CreateStoryData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CreateStoryData>({
    title: "",
    content: "",
    storyType: "original",
    chemRatio: 0.3,
    lessonId: undefined,
  });

  // Fetch lessons for the dropdown
  const { data: lessons = [] } = useQuery(buildLessonsListQuery());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Tạo Story Mới</h2>

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
                Nội dung *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Story Type
                </label>
                <select
                  value={formData.storyType}
                  onChange={(e) =>
                    setFormData({ ...formData, storyType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="original">Original</option>
                  <option value="chemdanhtu">Noun Embedding</option>
                  <option value="chemdongtu">Verb Embedding</option>
                  <option value="chemtinhtu">Adjective Embedding</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chem Ratio
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.chemRatio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chemRatio: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lesson
              </label>
              <select
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
              >
                <option value="">Không chọn</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
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
                {isLoading ? "Đang tạo..." : "Tạo Story"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Edit Story Modal Component
function EditStoryModal({
  storyId,
  onClose,
  onSubmit,
  isLoading,
}: {
  storyId: number;
  onClose: () => void;
  onSubmit: (data: UpdateStoryData) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<UpdateStoryData>({});

  // Fetch lessons for the dropdown
  const { data: lessons = [] } = useQuery(buildLessonsListQuery());
  const { data: stories = [] } = useQuery(buildStoriesListQuery());

  // Find the current story to get its lessonId
  const currentStory = stories.find((story) => story.id === storyId);

  useEffect(() => {
    if (currentStory && currentStory.lesson) {
      setFormData((prev) => ({
        ...prev,
        lessonId: currentStory.lesson?.id,
      }));
    }
  }, [currentStory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Chỉnh sửa Story</h2>

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
                Nội dung
              </label>
              <textarea
                value={formData.content || ""}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lesson
              </label>
              <select
                value={formData.lessonId || currentStory?.lesson?.id || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lessonId: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Không chọn</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
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
