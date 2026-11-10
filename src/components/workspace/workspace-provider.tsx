"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Student } from "@/db/schema";
import type { LessonView } from "@/lib/types";
import { LessonSheet } from "./lesson-sheet";
import { StudentSheet } from "./student-form";
import { SlotSheet } from "./slot-form";

export type WorkspaceInfo = {
  id: string;
  name: string;
  color: string;
  seasonStartMonth: number;
  seasonEndMonth: number;
};
export type StudentOption = { id: string; name: string };

type NewLessonDefaults = { date?: string; startTime?: string; studentId?: string };

type Ctx = {
  workspace: WorkspaceInfo;
  students: StudentOption[];
  openLesson: (l: LessonView) => void;
  openNewLesson: (d?: NewLessonDefaults) => void;
  openStudentForm: (s?: Student) => void;
  openNewSlot: (d?: { studentId?: string }) => void;
};

const WorkspaceCtx = createContext<Ctx | null>(null);
export function useWorkspace() {
  const c = useContext(WorkspaceCtx);
  if (!c) throw new Error("useWorkspace izven WorkspaceProvider");
  return c;
}

type Panel =
  | { kind: "lesson"; lesson: LessonView }
  | { kind: "newLesson"; defaults: NewLessonDefaults }
  | { kind: "student"; student?: Student }
  | { kind: "slot"; studentId?: string };

export function WorkspaceProvider({
  workspace,
  students,
  children,
}: {
  workspace: WorkspaceInfo;
  students: StudentOption[];
  children: ReactNode;
}) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [open, setOpen] = useState(false);
  const [seq, setSeq] = useState(0);

  const show = useCallback((p: Panel) => {
    setPanel(p);
    setSeq((n) => n + 1);
    setOpen(true);
  }, []);

  // Zapomni zadnjo šolo, da jo ob naslednjem obisku odpremo takoj.
  useEffect(() => {
    document.cookie = `kg_ws=${workspace.id}; path=/; max-age=31536000; samesite=lax`;
  }, [workspace.id]);

  const value = useMemo<Ctx>(
    () => ({
      workspace,
      students,
      openLesson: (lesson) => show({ kind: "lesson", lesson }),
      openNewLesson: (defaults = {}) => show({ kind: "newLesson", defaults }),
      openStudentForm: (student) => show({ kind: "student", student }),
      openNewSlot: (d = {}) => show({ kind: "slot", studentId: d.studentId }),
    }),
    [workspace, students, show],
  );

  const close = useCallback((o: boolean) => setOpen(o), []);

  return (
    <WorkspaceCtx.Provider value={value}>
      {children}
      {panel?.kind === "lesson" && (
        <LessonSheet key={`l${seq}`} open={open} onOpenChange={close} mode="view" lesson={panel.lesson} />
      )}
      {panel?.kind === "newLesson" && (
        <LessonSheet key={`n${seq}`} open={open} onOpenChange={close} mode="new" defaults={panel.defaults} />
      )}
      {panel?.kind === "student" && (
        <StudentSheet key={`s${seq}`} open={open} onOpenChange={close} student={panel.student} />
      )}
      {panel?.kind === "slot" && (
        <SlotSheet key={`t${seq}`} open={open} onOpenChange={close} studentId={panel.studentId} />
      )}
    </WorkspaceCtx.Provider>
  );
}
