"use client";

import { useCallback } from "react";
import { setLessonStatus } from "@/app/actions/lesson";
import { useToast } from "@/components/ui/toast";
import { STATUS_META, type LessonStatus } from "@/lib/status";
import { useWorkspace } from "./workspace-provider";

/** Zabeleži prisotnost; ob uspehu pokaže toast z možnostjo razveljavitve (namesto potrditvenega okna). */
export function useSetStatus() {
  const { workspace } = useWorkspace();
  const toast = useToast();

  return useCallback(
    async (lessonId: string, status: LessonStatus, onApplied?: (s: LessonStatus) => void) => {
      const r = await setLessonStatus(workspace.id, lessonId, status);
      if (!r.ok) {
        toast({ message: r.error, tone: "error" });
        return false;
      }
      onApplied?.(status);
      const previous = r.data.previous;
      toast({
        message: STATUS_META[status].done,
        action: {
          label: "Razveljavi",
          onClick: async () => {
            const u = await setLessonStatus(workspace.id, lessonId, previous);
            if (u.ok) onApplied?.(previous);
            else toast({ message: u.error, tone: "error" });
          },
        },
      });
      return true;
    },
    [workspace.id, toast],
  );
}
