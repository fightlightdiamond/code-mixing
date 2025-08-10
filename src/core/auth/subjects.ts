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

// CASL conditions type - based on MongoDB-style queries
type CASLConditions = {
  [key: string]: any; // Field conditions
} | ((item: any) => boolean); // Function-based conditions

export interface Rule {
  action: Actions;
  subject: Subjects;
  conditions?: CASLConditions;
  fields?: string[];
}
