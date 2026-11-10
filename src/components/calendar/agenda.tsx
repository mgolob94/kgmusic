"use client";

import { CalendarPlus, CalendarX2 } from "lucide-react";
import { StatusBadge, SubjectBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { endTime, fmtDayLong } from "@/lib/date";
import { holidayName } from "@/lib/holidays";
import type { LessonView } from "@/lib/types";

export function Agenda({ days, lessons, today }: { days: string[]; lessons: LessonView[]; today: string }) {
  const { openLesson, openNewLesson } = useWorkspace();
  if (lessons.length === 0) {
    return (
      <EmptyState
        icon={<CalendarX2 className="size-6" aria-hidden />}
        title="V tem obdobju ni ur"
        action={<Button variant="secondary" onClick={() => openNewLesson({ date: days[0] })}><CalendarPlus className="size-4" aria-hidden /> Dodaj enkratno uro</Button>}
      >
        Poskusite drug teden ali spremenite filter.
      </EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {days.map((d) => {
        const list = lessons.filter((l) => l.date === d);
        const holiday = holidayName(d);
        if (list.length === 0 && d !== today && !holiday) return null;
        return (
          <section key={d} aria-labelledby={`ag-${d}`} className="rounded-2xl bg-surface p-4 shadow-soft">
            <h3 id={`ag-${d}`} className="mb-2 flex flex-wrap items-baseline gap-x-2 text-base">
              <span className={d === today ? "text-primary" : ""}>{fmtDayLong(d)}</span>
              {d === today && <span className="text-xs font-sans font-semibold text-primary">Danes</span>}
              {holiday && <span className="text-xs font-sans font-medium text-unexcused">{holiday}</span>}
            </h3>
            {list.length === 0 ? (
              <p className="text-sm text-ink-soft">Ni ur.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {list.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => openLesson(l)}
                      className="grid min-h-14 w-full grid-cols-[3.5rem_1fr] items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-sunken"
                    >
                      <span className="text-sm tnum">
                        <span className="block font-semibold">{l.startTime}</span>
                        <span className="block text-xs text-ink-faint">{endTime(l.startTime, l.durationMin)}</span>
                      </span>
                      <span className="flex flex-col gap-1">
                        <span className={`font-medium ${l.status === "cancelled" ? "line-through" : ""}`}>{l.studentName}</span>
                        <span className="flex flex-wrap gap-1.5">
                          <SubjectBadge subject={l.subject} />
                          {l.status !== "planned" && <StatusBadge status={l.status} short />}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
