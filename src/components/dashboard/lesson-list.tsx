"use client";

import { CircleCheck } from "lucide-react";
import { StatusBadge, SubjectBadge } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/states";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { endTime, fmtDayShort } from "@/lib/date";
import type { LessonView } from "@/lib/types";
import { QuickMark } from "./quick-mark";

/** Ure, ki so že mimo, a še niso zabeležene. */
export function PendingList({ lessons, total }: { lessons: LessonView[]; total: number }) {
  const { openLesson } = useWorkspace();
  return (
    <section aria-labelledby="pending-h" id="nepotrjene" className="rounded-2xl bg-surface p-5 shadow-soft">
      <h2 id="pending-h" className="text-lg">Čaka na zabeležbo</h2>
      <p className="mb-3 text-sm text-ink-soft">Ure, ki so že mimo, a še nimajo prisotnosti.</p>
      {lessons.length === 0 ? (
        <EmptyState icon={<CircleCheck className="size-6" aria-hidden />} title="Vse je zabeleženo">
          Nobena pretekla ura ne čaka na potrditev.
        </EmptyState>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {lessons.map((l) => (
            <li key={l.id} className="py-3 first:pt-0">
              <button type="button" onClick={() => openLesson(l)} className="mb-2 flex min-h-11 w-full flex-wrap items-center gap-x-3 gap-y-1 text-left">
                <span className="font-semibold">{l.studentName}</span>
                <span className="text-sm text-ink-soft tnum">
                  {fmtDayShort(l.date)} · {l.startTime}–{endTime(l.startTime, l.durationMin)}
                </span>
                <SubjectBadge subject={l.subject} />
              </button>
              <QuickMark lessonId={l.id} studentName={l.studentName} />
            </li>
          ))}
        </ul>
      )}
      {total > lessons.length && (
        <p className="mt-3 text-sm text-ink-soft">Prikazanih je prvih {lessons.length} od {total}. Ko jih zabeležite, se pokažejo naslednje.</p>
      )}
    </section>
  );
}

export function UpcomingList({ lessons }: { lessons: LessonView[] }) {
  const { openLesson } = useWorkspace();
  return (
    <section aria-labelledby="upcoming-h" className="rounded-2xl bg-surface p-5 shadow-soft">
      <h2 id="upcoming-h" className="mb-3 text-lg">Prihodnje ure</h2>
      {lessons.length === 0 ? (
        <p className="text-sm text-ink-soft">Ni načrtovanih ur. Dodajte tedenski termin pri učencu.</p>
      ) : (
        <ul className="flex flex-col">
          {lessons.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => openLesson(l)}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left hover:bg-sunken"
              >
                <span className="w-24 shrink-0 text-sm text-ink-soft tnum">{fmtDayShort(l.date)}</span>
                <span className="w-11 shrink-0 text-sm font-semibold tnum">{l.startTime}</span>
                <span className="min-w-0 flex-1 truncate">{l.studentName}</span>
                {l.status !== "planned" && <StatusBadge status={l.status} short />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
