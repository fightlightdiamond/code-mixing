import React, { useState, useEffect } from "react";
import {
  type UpdateStoryData,
  type Story,
  type StoryType,
  type DifficultyLevel,
  type ContentStatus,
} from "@/features/stories/hooks";

interface EditStoryModalProps {
  story: Story;
  onClose: () => void;
  onSubmit: (data: UpdateStoryData) => void;
  isLoading: boolean;
  lessons: { id: string; title: string }[];
  tags: { id: string; name: string }[];
}

export function EditStoryModal({
  story,
  onClose,
  onSubmit,
  isLoading,
  lessons,
  tags,
}: EditStoryModalProps) {
  const [formData, setFormData] = useState<UpdateStoryData>({
    title: story.title,
    content: story.content,
    storyType: story.storyType,
    difficulty: story.difficulty,
    estimatedMinutes: story.estimatedMinutes,
    chemRatio: story.chemRatio,
    lessonId: story.lesson?.id,
    status: story.status,
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Initialize selected tags from story
  useEffect(() => {
    if (story.tags) {
      setSelectedTags(story.tags.map(storyTag => storyTag.id));
    }
  }, [story.tags]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tagIds: selectedTags,
      estimatedMinutes: formData.estimatedMinutes ? Number(formData.estimatedMinutes) : undefined,
      chemRatio: formData.chemRatio ? Number(formData.chemRatio) : undefined,
    });
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Chỉnh sửa Story</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Story Info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-500">ID:</span>
                <span className="ml-2 text-gray-900 font-mono">{story.id}</span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Tạo:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(story.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-500">Cập nhật:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(story.updatedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tiêu đề story..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson
                </label>
                <select
                  value={formData.lessonId || ""}
                  onChange={(e) => setFormData({ ...formData, lessonId: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Không chọn lesson</option>
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
                  value={formData.storyType}
                  onChange={(e) => setFormData({ ...formData, storyType: e.target.value as StoryType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
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
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
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
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian ước tính (phút)
                </label>
                <input
                  type="number"
                  value={formData.estimatedMinutes || ""}
                  onChange={(e) => setFormData({ ...formData, estimatedMinutes: e.target.value ? Number(e.target.value) : undefined })}
                  min="1"
                  max="300"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ví dụ: 15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chem Ratio (0-1)
                </label>
                <input
                  type="number"
                  value={formData.chemRatio || ""}
                  onChange={(e) => setFormData({ ...formData, chemRatio: e.target.value ? Number(e.target.value) : undefined })}
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ví dụ: 0.75"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập nội dung story..."
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Số ký tự: {formData.content?.length || 0}</span>
                <span>Từ gốc: {story.content.length} ký tự</span>
              </div>
            </div>

            {/* Tags Selection */}
            {tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tags
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={() => toggleTag(tag.id)}
                        className="mr-2 rounded"
                      />
                      <span className="text-sm text-gray-700 truncate" title={tag.name}>
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Đã chọn {selectedTags.length} tags (gốc: {story.tags?.length || 0})
                </p>
              </div>
            )}

            {/* Related Information */}
            {(story._count || story.wordCount) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Thông tin liên quan</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {story._count && (
                    <>
                      <div>
                        <span className="text-blue-700">Versions:</span>
                        <span className="ml-2 font-medium">{story._count.versions || 0}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Chunks:</span>
                        <span className="ml-2 font-medium">{story._count.chunks || 0}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Audio:</span>
                        <span className="ml-2 font-medium">{story._count.audios || 0}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Sessions:</span>
                        <span className="ml-2 font-medium">{story._count.learningSessions || 0}</span>
                      </div>
                    </>
                  )}
                  {story.wordCount && (
                    <div>
                      <span className="text-blue-700">Số từ:</span>
                      <p className="line-clamp-4 leading-relaxed">{formData.content || story.content}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title?.trim() || !formData.content?.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {isLoading ? "Đang cập nhật..." : "Cập nhật Story"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
