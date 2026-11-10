"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { updateLesson } from "@/app/actions/lesson";
import { STATUS_ICON } from "@/components/ui/badges";
import { useToast } from "@/components/ui/toast";
import { useNow } from "@/components/workspace/use-now";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { calHref, layoutDay } from "@/lib/calendar";
import { endTime, fmtDate, minToTime, timeToMin, WEEKDAYS, isoWeekday, toDate } from "@/lib/date";
import { holidayName } from "@/lib/holidays";
import { STATUS_META, subjectOf } from "@/lib/status";
import type { LessonView } from "@/lib/types";
import { Mic, Piano } from "lucide-react";
import { format } from "date-fns";

const HOUR_PX = 64;
const SNAP = 15;

type Now = { date: string; time: string; minutes: number };

export function WeekGrid({
  days, lessons, now: initialNow, filters,
}: {
  days: string[];
  lessons: LessonView[];
  now: Now;
  filters: { subject?: string; student?: string };
}) {
  const { workspace, openLesson, openNewLesson } = useWorkspace();
  const toast = useToast();
  const now = useNow(initialNow);
  const [moved, setMoved] = useState<Record<string, Partial<LessonView>>>({});
  const [overDay, setOverDay] = useState<string | null>(null);
  const drag = useRef<{ id: string; grabMin: number } | null>(null);

  // Ko strežnik pošlje sveže podatke, optimistične popravke zavržemo.
  useEffect(() => setMoved({}), [lessons]);

  const view = useMemo(() => lessons.map((l) => ({ ...l, ...moved[l.id] })), [lessons, moved]);
  const single = days.length === 1;

  const { startH, endH } = useMemo(() => {
    let s = 8, e = 20;
    for (const l of view) {
      s = Math.min(s, Math.floor(timeToMin(l.startTime) / 60));
      e = Math.max(e, Math.ceil((timeToMin(l.startTime) + l.durationMin) / 60));
    }
    return { startH: s, endH: Math.min(24, e) };
  }, [view]);
  const height = (endH - startH) * HOUR_PX;
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const top = (min: number) => ((min - startH * 60) / 60) * HOUR_PX;

  async function dropOn(day: string, e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setOverDay(null);
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const l = view.find((x) => x.id === d.id);
    if (!l) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const raw = startH * 60 + ((e.clientY - rect.top) / HOUR_PX) * 60 - d.grabMin;
    const snapped = Math.min(Math.max(Math.round(raw / SNAP) * SNAP, 0), 24 * 60 - l.durationMin);
    const startTime = minToTime(snapped);
    if (day === l.date && startTime === l.startTime) return;

    const before = { date: l.date, startTime: l.startTime };
    setMoved((m) => ({ ...m, [l.id]: { date: day, startTime } }));
    const r = await updateLesson(workspace.id, l.id, {
      date: day, startTime, durationMin: l.durationMin, subject: subjectOf(l.subject) ?? "klavir",
    });
    if (!r.ok) {
      setMoved((m) => ({ ...m, [l.id]: before }));
      return toast({ message: r.error, tone: "error" });
    }
    toast({
      message: r.data.conflictCount
        ? `Ura je premaknjena, a se prekriva z drugo uro (${fmtDate(day)} ob ${startTime}).`
        : `Ura je premaknjena na ${format(toDate(day), "d. M.")} ob ${startTime}.`,
      tone: r.data.conflictCount ? "error" : "success",
      action: {
        label: "Razveljavi",
        onClick: async () => {
          setMoved((m) => ({ ...m, [l.id]: before }));
          const u = await updateLesson(workspace.id, l.id, r.data.previous);
          if (!u.ok) toast({ message: u.error, tone: "error" });
        },
      },
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-soft">
      {/* glava dni */}
      <div className="grid border-b border-line" style={{ gridTemplateColumns: `3.25rem repeat(${days.length}, minmax(0, 1fr))` }}>
        <div aria-hidden />
        {days.map((d) => {
          const isToday = d === now.date;
          const h = holidayName(d);
          const wd = WEEKDAYS.find((w) => w.value === isoWeekday(d))!;
          return (
            <Link
              key={d}
              href={calHref(workspace.id, { view: "day", date: d, ...filters })}
              aria-current={isToday ? "date" : undefined}
              className="flex flex-col items-center gap-0.5 border-l border-line px-1 py-2 hover:bg-sunken"
            >
              <span className="text-xs text-ink-soft">{single ? wd.label : wd.short}</span>
              <span className={`grid size-8 place-items-center rounded-full font-display text-lg tnum ${isToday ? "bg-primary text-on-primary" : ""}`}>
                {format(toDate(d), "d")}
              </span>
              <span className={`h-4 max-w-full truncate text-[0.6875rem] ${h ? "text-unexcused" : "text-transparent"}`}>{h ?? "."}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid" style={{ gridTemplateColumns: `3.25rem repeat(${days.length}, minmax(0, 1fr))` }}>
        <div className="relative" style={{ height }} aria-hidden>
          {hours.map((h) => (
            <span key={h} className="absolute right-2 -translate-y-1/2 text-xs text-ink-faint tnum" style={{ top: (h - startH) * HOUR_PX + (h === startH ? 8 : 0) }}>
              {String(h).padStart(2, "0")}:00
            </span>
          ))}
        </div>

        {days.map((d) => {
          const dayLessons = view.filter((l) => l.date === d);
          const placed = layoutDay(dayLessons);
          const isToday = d === now.date;
          const holiday = holidayName(d);
          return (
            <div
              key={d}
              role="group"
              aria-label={`${fmtDate(d)}${holiday ? `, ${holiday}` : ""}`}
              className={`relative border-l border-line ${overDay === d ? "bg-primary-soft/60" : holiday ? "bg-sunken/60" : ""}`}
              style={{
                height,
                backgroundImage: `repeating-linear-gradient(to bottom, var(--line) 0 1px, transparent 1px ${HOUR_PX}px)`,
              }}
              onDragOver={(e) => { e.preventDefault(); setOverDay(d); }}
              onDragLeave={() => setOverDay((cur) => (cur === d ? null : cur))}
              onDrop={(e) => void dropOn(d, e)}
              onClick={(e) => {
                if (e.target !== e.currentTarget) return;
                const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
                const min = Math.floor((startH * 60 + (y / HOUR_PX) * 60) / SNAP) * SNAP;
                openNewLesson({ date: d, startTime: minToTime(min) });
              }}
            >
              {isToday && now.minutes >= startH * 60 && now.minutes <= endH * 60 && (
                <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: top(now.minutes) }} aria-hidden>
                  <span className="playhead-dot -ml-1 size-2.5 rounded-full bg-primary" />
                  <span className="h-px flex-1 bg-primary" />
                </div>
              )}
              {placed.map(({ lesson: l, col, cols }) => {
                const s = timeToMin(l.startTime);
                const past = d < now.date || (d === now.date && s + l.durationMin <= now.minutes);
                const sub = subjectOf(l.subject);
                const StatusIcon = STATUS_ICON[l.status];
                const SubIcon = sub === "petje" ? Mic : Piano;
                const h = Math.max((l.durationMin / 60) * HOUR_PX, 30);
                return (
                  <button
                    key={l.id}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      drag.current = { id: l.id, grabMin: ((e.clientY - r.top) / HOUR_PX) * 60 };
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", l.id);
                    }}
                    onDragEnd={() => { drag.current = null; setOverDay(null); }}
                    onClick={() => openLesson(l)}
                    aria-label={`${l.studentName}, ${l.startTime}–${endTime(l.startTime, l.durationMin)}, ${STATUS_META[l.status].label}`}
                    className={`absolute z-10 flex cursor-grab flex-col overflow-hidden rounded-lg border-l-4 px-1.5 py-1 text-left text-xs leading-tight transition-shadow hover:shadow-soft active:cursor-grabbing
                      ${sub === "petje" ? "border-petje bg-petje-soft text-ink" : "border-klavir bg-klavir-soft text-ink"}
                      ${past ? "opacity-70" : ""} ${l.status === "cancelled" ? "border-dashed" : ""}`}
                    style={{
                      top: top(s),
                      height: h - 2,
                      left: `calc(${(col / cols) * 100}% + 2px)`,
                      width: `calc(${100 / cols}% - 4px)`,
                    }}
                  >
                    <span className="flex items-start justify-between gap-1">
                      <span className={`truncate font-semibold ${l.status === "cancelled" ? "line-through" : ""}`}>{l.studentName}</span>
                      <StatusIcon className="mt-px size-3.5 shrink-0" aria-hidden />
                    </span>
                    {h >= 44 && (
                      <span className="flex items-center gap-1 text-ink-soft tnum">
                        <SubIcon className="size-3 shrink-0" aria-hidden />
                        {l.startTime}–{endTime(l.startTime, l.durationMin)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
