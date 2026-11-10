"use client";

import { useState } from "react";
import { CircleCheck, CircleMinus, CircleX } from "lucide-react";
import { useSetStatus } from "@/components/workspace/use-lesson-actions";
import type { LessonStatus } from "@/lib/status";

const OPTIONS: { status: LessonStatus; label: string; icon: typeof CircleCheck; tone: string }[] = [
  { status: "attended", label: "Prisoten", icon: CircleCheck, tone: "hover:bg-attended-soft hover:text-attended hover:border-attended/40" },
  { status: "absent_excused", label: "Opravičen", icon: CircleMinus, tone: "hover:bg-excused-soft hover:text-excused hover:border-excused/40" },
  { status: "absent_unexcused", label: "Neopravičen", icon: CircleX, tone: "hover:bg-unexcused-soft hover:text-unexcused hover:border-unexcused/40" },
];

/** Označi uro z enim dotikom; razveljavitev je v toastu. */
export function QuickMark({ lessonId, studentName }: { lessonId: string; studentName: string }) {
  const setStatus = useSetStatus();
  const [busy, setBusy] = useState<LessonStatus | null>(null);

  return (
    <div role="group" aria-label={`Zabeleži uro: ${studentName}`} className="flex flex-wrap gap-2">
      {OPTIONS.map(({ status, label, icon: Icon, tone }) => (
        <button
          key={status}
          type="button"
          disabled={busy !== null}
          onClick={async () => {
            setBusy(status);
            await setStatus(lessonId, status);
            setBusy(null);
          }}
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 text-sm font-medium text-ink-soft transition-colors disabled:opacity-50 ${tone}`}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
