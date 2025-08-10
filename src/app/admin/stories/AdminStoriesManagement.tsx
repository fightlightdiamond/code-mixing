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
} from "@/features/stories/hooks";
import { buildLessonsListQuery } from "@/features/lessons/hooks";
import { CreateStoryModal } from "./components/CreateStoryModal";
import { EditStoryModal } from "./components/EditStoryModal";

interface StoriesFilters {
  search: string;
  lessonId: string | null;
  storyType: StoryType | "";
  difficulty: DifficultyLevel | "";
  status: ContentStatus | "";
  tagIds: string[];
}

export default function AdminStoriesManagement() {
  // State management
  const [filters, setFilters] = useState<StoriesFilters>({
    search: "",
    lessonId: null,
    storyType: "",
    difficulty: "",
    status: "",
    tagIds: [],
  });
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Queries
  const { data: stories = [], isLoading } = useQuery(
    buildStoriesListQuery({
      search: filters.search || undefined,
      lessonId: filters.lessonId || undefined,
      storyType: filters.storyType || undefined,
      difficulty: filters.difficulty || undefined,
      status: filters.status || undefined,
      tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
    })
  );

  const { data: lessons = [] } = useQuery(buildLessonsListQuery());
  const { data: tags = [] } = useQuery(buildTagsListQuery());

  // Mutations
  const createMutation = useCreateStory();
  const updateMutation = useUpdateStory();
  const deleteMutation = useDeleteStory();
  const bulkUpdateMutation = useBulkUpdateStories();
  const bulkDeleteMutation = useBulkDeleteStories();

  // Handlers
  const handleCreate = async (data: CreateStoryData) => {
    try {
      await createMutation.mutateAsync(data);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating story:", error);
    }
  };

  const handleUpdate = async (data: UpdateStoryData) => {
    if (!editingStory) return;
    try {
      await updateMutation.mutateAsync({ id: editingStory.id, data });
      setEditingStory(null);
    } catch (error) {
      console.error("Error updating story:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa story này?")) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting story:", error);
    }
  };

  const handleBulkUpdate = async (data: Partial<UpdateStoryData>) => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateMutation.mutateAsync({ ids: selectedIds, data });
      setSelectedIds([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error("Error bulk updating stories:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} stories?`)) return;
    try {
      await bulkDeleteMutation.mutateAsync(selectedIds);
      setSelectedIds([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error("Error bulk deleting stories:", error);
    }
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === stories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(stories.map(story => story.id));
    }
  };

  const toggleSelectStory = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  // Helper functions
  const getStatusBadgeColor = (status: ContentStatus) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-red-100 text-red-800 border-red-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'elementary': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'upper_intermediate': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      case 'proficient': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Đang tải stories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Stories Toàn diện</h1>
          <p className="text-gray-600 mt-1">Quản lý stories với đầy đủ tính năng và mối quan hệ</p>
        </div>
        <div className="flex space-x-3">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Thao tác hàng loạt ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-sm"
          >
            <span className="mr-2">+</span>
            Tạo Story Mới
          </button>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && selectedIds.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800 font-medium">
              Đã chọn {selectedIds.length} stories
            </span>
            <div className="flex space-x-2">
              <select
                onChange={(e) => e.target.value && handleBulkUpdate({ status: e.target.value as ContentStatus })}
                className="px-3 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Cập nhật trạng thái</option>
                <option value="draft">Draft</option>
                <option value="in_review">In Review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <select
                onChange={(e) => e.target.value && handleBulkUpdate({ difficulty: e.target.value as DifficultyLevel })}
                className="px-3 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Cập nhật độ khó</option>
                <option value="beginner">Beginner</option>
                <option value="elementary">Elementary</option>
                <option value="intermediate">Intermediate</option>
                <option value="upper_intermediate">Upper Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="proficient">Proficient</option>
              </select>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Bộ lọc nâng cao</h3>
          <button
            onClick={() => setFilters({
              search: "",
              lessonId: null,
              storyType: "",
              difficulty: "",
              status: "",
              tagIds: [],
            })}
            className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Tìm theo tiêu đề hoặc nội dung..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lesson
            </label>
            <select
              value={filters.lessonId || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, lessonId: e.target.value || null }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả lessons</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại Story
            </label>
            <select
              value={filters.storyType}
              onChange={(e) => setFilters(prev => ({ ...prev, storyType: e.target.value as StoryType | "" }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả loại</option>
              <option value="original">Original</option>
              <option value="chemdanhtu">Noun Embedding</option>
              <option value="chemdongtu">Verb Embedding</option>
              <option value="chemtinhtu">Adjective Embedding</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Độ khó
            </label>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value as DifficultyLevel | "" }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả độ khó</option>
              <option value="beginner">Beginner</option>
              <option value="elementary">Elementary</option>
              <option value="intermediate">Intermediate</option>
              <option value="upper_intermediate">Upper Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="proficient">Proficient</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as ContentStatus | "" }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <select
              multiple
              value={filters.tagIds}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                setFilters(prev => ({ ...prev, tagIds: selectedOptions }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              size={3}
            >
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Giữ Ctrl/Cmd để chọn nhiều</p>
          </div>
        </div>
      </div>

      {/* Stories Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Stories ({stories.length})
              </h3>
              {stories.length > 0 && (
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === stories.length}
                    onChange={toggleSelectAll}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm text-gray-600">Chọn tất cả</span>
                </label>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {selectedIds.length > 0 && `${selectedIds.length} đã chọn`}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  Chọn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiêu đề & Nội dung
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông tin cơ bản
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags & Metadata
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thống kê
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stories.map((story) => (
                <tr key={story.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(story.id)}
                      onChange={() => toggleSelectStory(story.id)}
                      className="rounded"
                    />
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-gray-900 max-w-md truncate">
                          {story.title}
                        </h4>
                        <button
                          onClick={() => toggleRowExpansion(story.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title={expandedRows.has(story.id) ? "Thu gọn" : "Mở rộng"}
                        >
                          {expandedRows.has(story.id) ? "▼" : "▶"}
                        </button>
                      </div>
                      
                      {expandedRows.has(story.id) && (
                        <div className="text-sm text-gray-600 max-w-md">
                          <p className="line-clamp-4 leading-relaxed">{story.content}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(story.status)}`}>
                          {story.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(story.difficulty)}`}>
                          {story.difficulty}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-500 w-16">Loại:</span>
                        <span>{story.storyType}</span>
                      </div>
                      {story.lesson && (
                        <div className="flex items-center">
                          <span className="font-medium text-gray-500 w-16">Lesson:</span>
                          <span className="truncate max-w-32" title={story.lesson.title}>
                            {story.lesson.title}
                          </span>
                        </div>
                      )}
                      {story.estimatedMinutes && (
                        <div className="flex items-center">
                          <span className="font-medium text-gray-500 w-16">Thời gian:</span>
                          <span>{story.estimatedMinutes} phút</span>
                        </div>
                      )}
                      {story.chemRatio && (
                        <div className="flex items-center">
                          <span className="font-medium text-gray-500 w-16">Chem:</span>
                          <span>{(story.chemRatio * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className="font-medium text-gray-500 w-16">Tác giả:</span>
                        <span className="truncate max-w-24" title={story.creator?.name || 'N/A'}>
                          {story.creator?.name || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {story.tags && story.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {story.tags.slice(0, 3).map((storyTag) => (
                            <span
                              key={storyTag.tag.id}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full border border-blue-200"
                            >
                              {storyTag.tag.name}
                            </span>
                          ))}
                          {story.tags.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                              +{story.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Tạo: {new Date(story.createdAt).toLocaleDateString('vi-VN')}</div>
                        <div>Cập nhật: {new Date(story.updatedAt).toLocaleDateString('vi-VN')}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      {story._count && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Versions:</span>
                            <span className="font-medium">{story._count.versions || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Chunks:</span>
                            <span className="font-medium">{story._count.chunks || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Audio:</span>
                            <span className="font-medium">{story._count.audios || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Sessions:</span>
                            <span className="font-medium">{story._count.learningSessions || 0}</span>
                          </div>
                        </>
                      )}
                      {story.wordCount && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Từ:</span>
                          <span className="font-medium">{story.wordCount}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => setEditingStory(story)}
                        className="text-blue-600 hover:text-blue-900 transition-colors text-left"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(story.id)}
                        className="text-red-600 hover:text-red-900 transition-colors text-left"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy stories nào</h3>
            <p className="text-gray-500 mb-4">Hãy thử điều chỉnh bộ lọc hoặc tạo story mới</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Tạo Story Đầu Tiên
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateStoryModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
          lessons={lessons}
          tags={tags}
        />
      )}

      {editingStory && (
        <EditStoryModal
          story={editingStory}
          onClose={() => setEditingStory(null)}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
          lessons={lessons}
          tags={tags}
        />
      )}
    </div>
  );
}
