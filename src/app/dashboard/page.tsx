"use client";
import { logger } from '@/lib/logger';

import { RoleBasedLink } from "@/components/auth/RoleBasedLink";
import { RoleBasedButton } from "@/components/auth/RoleBasedButton";
import { Require } from "@/core/auth/Require";
import { FadeIn } from "@/components/ui/fade-in";

export default function DashboardPage() {
  return (
    <Require action="read" subject="Lesson">
      <FadeIn className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FadeIn className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Học tập tương tác</h2>
            <RoleBasedLink
              href="/learning"
              action="read"
              subject="Story"
              className="text-blue-600 hover:underline block mb-2"
            >
              Học qua truyện chêm
            </RoleBasedLink>
            <p className="text-sm text-gray-600">
              Học tiếng Anh tự nhiên thông qua câu chuyện có chêm từ tiếng Anh
            </p>
          </FadeIn>

          <FadeIn className="bg-white rounded-lg shadow p-6" delay={0.05}>
            <h2 className="text-xl font-semibold mb-4">Lessons</h2>
            <RoleBasedLink
              href="/lessons"
              action="read"
              subject="Lesson"
              className="text-blue-600 hover:underline"
            >
              View Lessons
            </RoleBasedLink>
          </FadeIn>

          <FadeIn className="bg-white rounded-lg shadow p-6" delay={0.1}>
            <h2 className="text-xl font-semibold mb-4">Stories</h2>
            <RoleBasedLink
              href="/stories"
              action="read"
              subject="Story"
              className="text-blue-600 hover:underline"
            >
              View Stories
            </RoleBasedLink>

            <RoleBasedButton
              action="create"
              subject="Story"
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => logger.info("Create story")}
            >
              Create New Story
            </RoleBasedButton>
          </FadeIn>

          <FadeIn className="bg-white rounded-lg shadow p-6" delay={0.15}>
            <h2 className="text-xl font-semibold mb-4">Admin</h2>
            <RoleBasedLink
              href="/admin/stories"
              action="manage"
              subject="Story"
              className="text-blue-600 hover:underline"
            >
              Admin Stories
            </RoleBasedLink>
          </FadeIn>
        </div>
      </FadeIn>
    </Require>
  );
}
