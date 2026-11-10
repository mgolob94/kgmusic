"use client";

import Link from "next/link";
import { addDays, format } from "date-fns";
import { Mic, Piano } from "lucide-react";
import { useNow } from "@/components/workspace/use-now";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { calHref } from "@/lib/calendar";
import { toDate, toIso, weekStartIso, monthStartIso, WEEKDAYS } from "@/lib/date";
import { holidayName } from "@/lib/holidays";
import { subjectOf } from "@/lib/status";
import type { LessonView } from "@/lib/types";

export function MonthGrid({
  date, lessons, now: initialNow, filters,
}: {
  date: string;
  lessons: LessonView[];
  now: { date: string; time: string; minutes: number };
  filters: { subject?: string; student?: string };
}) {
  const { workspace, openLesson } = useWorkspace();
  const now = useNow(initialNow);
  const start = weekStartIso(monthStartIso(date));
  const days = Array.from({ length: 42 }, (_, i) => toIso(addDays(toDate(start), i)));
  const month = date.slice(5, 7);
  const rows = days.slice(35).every((d) => d.slice(5, 7) !== month) ? 5 : 6;
  const shown = days.slice(0, rows * 7);

  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-soft">
      <div className="grid grid-cols-7 border-b border-line text-center text-xs text-ink-soft" aria-hidden>
        {WEEKDAYS.map((d) => <span key={d.value} className="py-2">{d.short}</span>)}
      </div>
      <div className="grid grid-cols-7">
        {shown.map((d, i) => {
          const list = lessons.filter((l) => l.date === d);
          const inMonth = d.slice(5, 7) === month;
          const isToday = d === now.date;
          const holiday = holidayName(d);
          return (
            <div
              key={d}
              className={`min-h-20 border-line p-1 md:min-h-28 md:p-1.5 ${i % 7 ? "border-l" : ""} ${i >= 7 ? "border-t" : ""} ${inMonth ? "" : "bg-sunken/50"}`}
            >
              <Link
                href={calHref(workspace.id, { view: "day", date: d, ...filters })}
                aria-label={`${format(toDate(d), "d. M.")}${holiday ? `, ${holiday}` : ""}, ur: ${list.length}`}
                aria-current={isToday ? "date" : undefined}
                className={`grid size-8 place-items-center rounded-full text-sm tnum hover:bg-sunken ${isToday ? "bg-primary font-semibold text-on-primary hover:bg-primary" : inMonth ? "" : "text-ink-faint"} ${holiday && !isToday ? "text-unexcused" : ""}`}
              >
                {format(toDate(d), "d")}
              </Link>
              {/* telefon: samo število */}
              {list.length > 0 && (
                <p className="mt-1 text-center text-xs font-semibold text-primary md:hidden">{list.length}</p>
              )}
              {/* večji zasloni: kratke vrstice */}
              <ul className="mt-1 hidden flex-col gap-0.5 md:flex">
                {list.slice(0, 3).map((l) => {
                  const sub = subjectOf(l.subject);
                  const Icon = sub === "petje" ? Mic : Piano;
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => openLesson(l)}
                        className={`flex w-full items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-left text-xs ${sub === "petje" ? "bg-petje-soft" : "bg-klavir-soft"} ${l.status === "cancelled" ? "line-through opacity-70" : ""}`}
                      >
                        <Icon className="size-3 shrink-0" aria-hidden />
                        <span className="tnum">{l.startTime}</span>
                        <span className="truncate">{l.studentName}</span>
                      </button>
                    </li>
                  );
                })}
                {list.length > 3 && (
                  <li>
                    <Link href={calHref(workspace.id, { view: "day", date: d, ...filters })} className="px-1.5 text-xs text-ink-soft hover:underline">
                      še {list.length - 3}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
