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

export interface Rule {
  action: Actions;
  subject: Subjects;
  conditions?: any;
  fields?: string[];
}
