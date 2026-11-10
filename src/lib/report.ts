import { endTime, fmtDate } from "./date";
import { STATUS_META, SUBJECT_LABEL, subjectOf } from "./status";
import type { LessonView } from "./types";

export type ReportRow = {
  studentId: string;
  studentName: string;
  subject: string;
  attended: number;
  minutes: number;
  excused: number;
  unexcused: number;
  cancelled: number;
  planned: number;
};

/** Povzetek po učencu in predmetu. Obračun (cene) se doda kasneje – tukaj so samo števila in minute. */
export function buildReport(lessons: LessonView[]) {
  const map = new Map<string, ReportRow>();
  for (const l of lessons) {
    const sub = subjectOf(l.subject);
    const key = `${l.studentId}|${sub ?? ""}`;
    const row =
      map.get(key) ??
      { studentId: l.studentId, studentName: l.studentName, subject: sub ? SUBJECT_LABEL[sub] : "", attended: 0, minutes: 0, excused: 0, unexcused: 0, cancelled: 0, planned: 0 };
    if (l.status === "attended") { row.attended++; row.minutes += l.durationMin; }
    else if (l.status === "absent_excused") row.excused++;
    else if (l.status === "absent_unexcused") row.unexcused++;
    else if (l.status === "cancelled") row.cancelled++;
    else row.planned++;
    map.set(key, row);
  }
  const rows = [...map.values()].sort((a, b) => a.studentName.localeCompare(b.studentName, "sl") || a.subject.localeCompare(b.subject, "sl"));
  const totals = rows.reduce(
    (t, r) => ({
      attended: t.attended + r.attended, minutes: t.minutes + r.minutes, excused: t.excused + r.excused,
      unexcused: t.unexcused + r.unexcused, cancelled: t.cancelled + r.cancelled, planned: t.planned + r.planned,
    }),
    { attended: 0, minutes: 0, excused: 0, unexcused: 0, cancelled: 0, planned: 0 },
  );
  return { rows, totals };
}

export const detailRow = (l: LessonView) => ({
  date: fmtDate(l.date),
  from: l.startTime,
  to: endTime(l.startTime, l.durationMin),
  minutes: l.durationMin,
  student: l.studentName,
  subject: subjectOf(l.subject) ? SUBJECT_LABEL[subjectOf(l.subject)!] : "",
  status: STATUS_META[l.status].label,
  note: l.note ?? "",
});

export const hoursDecimal = (min: number) => Math.round((min / 60) * 100) / 100;
