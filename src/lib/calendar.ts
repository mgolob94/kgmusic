import { addMonths, format } from "date-fns";
import { sl } from "date-fns/locale";
import { addDaysIso, fmtDayLong, fmtMonth, monthStartIso, toDate, toIso, weekStartIso } from "./date";
import { timeToMin } from "./date";
import type { LessonView } from "./types";

export const VIEWS = ["auto", "day", "week", "month", "agenda"] as const;
export type CalView = (typeof VIEWS)[number];

export type CalParams = { view: CalView; date: string; subject?: string; student?: string };

export function calHref(workspaceId: string, p: CalParams) {
  const q = new URLSearchParams();
  if (p.view !== "auto") q.set("view", p.view);
  q.set("date", p.date);
  if (p.subject) q.set("subject", p.subject);
  if (p.student) q.set("student", p.student);
  return `/w/${workspaceId}/koledar?${q}`;
}

/** Razpon datumov, ki ga pogled potrebuje. */
export function rangeFor(view: CalView, date: string) {
  if (view === "day") return { from: date, to: date };
  if (view === "month") {
    const from = weekStartIso(monthStartIso(date));
    return { from, to: addDaysIso(from, 41) };
  }
  const from = weekStartIso(date);
  return { from, to: addDaysIso(from, 6) };
}

export function shiftDate(view: CalView, date: string, dir: 1 | -1) {
  if (view === "day") return addDaysIso(date, dir);
  if (view === "month") return toIso(addMonths(toDate(monthStartIso(date)), dir));
  return addDaysIso(date, 7 * dir);
}

export function rangeTitle(view: CalView, date: string) {
  if (view === "day") return fmtDayLong(date);
  if (view === "month") return fmtMonth(date);
  const a = weekStartIso(date);
  const b = addDaysIso(a, 6);
  const sameMonth = a.slice(0, 7) === b.slice(0, 7);
  return sameMonth
    ? `${format(toDate(a), "d.", { locale: sl })}–${format(toDate(b), "d. MMMM yyyy", { locale: sl })}`
    : `${format(toDate(a), "d. MMM", { locale: sl })} – ${format(toDate(b), "d. MMM yyyy", { locale: sl })}`;
}

export type Placed = { lesson: LessonView; col: number; cols: number };

/** Razporedi prekrivajoče se ure v stolpce znotraj enega dne (kot Google Koledar). */
export function layoutDay(lessons: LessonView[]): Placed[] {
  const sorted = [...lessons].sort(
    (a, b) => timeToMin(a.startTime) - timeToMin(b.startTime) || b.durationMin - a.durationMin,
  );
  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const cols = Math.max(1, colEnds.length);
    for (const p of cluster) p.cols = cols;
    cluster = [];
    colEnds = [];
    clusterEnd = -1;
  };
  for (const lesson of sorted) {
    const s = timeToMin(lesson.startTime);
    const e = s + lesson.durationMin;
    if (s >= clusterEnd && cluster.length) flush();
    let col = colEnds.findIndex((end) => end <= s);
    if (col === -1) col = colEnds.length;
    colEnds[col] = e;
    clusterEnd = Math.max(clusterEnd, e);
    const placed = { lesson, col, cols: 1 };
    cluster.push(placed);
    out.push(placed);
  }
  flush();
  return out;
}
