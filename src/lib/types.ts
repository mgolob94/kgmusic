import type { LessonStatus } from "./status";

export type LessonView = {
  id: string;
  workspaceId: string;
  studentId: string;
  studentName: string;
  slotId: string | null;
  date: string;
  startTime: string;
  durationMin: number;
  subject: string | null;
  status: LessonStatus;
  note: string | null;
};

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type Conflict = { date: string; startTime: string; studentName: string; workspaceName: string };
