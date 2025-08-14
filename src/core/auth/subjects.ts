export type Actions =
  | "manage"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "publish"
  | "approve"
  | "assign"
  | "grade"
  | "remix"
  | "export";

export type Subjects =
  | "Tenant"
  | "User"
  | "Role"
  | "Course"
  | "Unit"
  | "Lesson"
  | "Story"
  | "StoryVersion"
  | "ClozeConfig"
  | "AudioAsset"
  | "Exercise"
  | "Question"
  | "Choice"
  | "Quiz"
  | "QuizResult"
  | "Tag"
  | "RemixJob"
  | "UserProgress"
  | "Approval"
  | "all";

// Use CASL's built-in types instead of custom ones
import type { RawRuleFrom } from '@casl/ability';
import type { PrismaQuery } from '@casl/prisma';

// Use CASL's RawRuleFrom type which is more accurate than custom Rule
export type Rule = RawRuleFrom<[Actions, Subjects], PrismaQuery>;
