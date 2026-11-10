import { and, asc, between, desc, eq, gte, inArray, lt, lte, ne, sql } from "drizzle-orm";
import { db } from "./index";
import { lessons, slots, students, workspaces } from "./schema";
import { endTime, timeToMin } from "@/lib/date";
import type { LessonView } from "@/lib/types";
import type { LessonStatus } from "@/lib/status";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: string) => UUID.test(s);

export async function listWorkspaces(userId: string) {
  return db.select().from(workspaces).where(eq(workspaces.userId, userId)).orderBy(asc(workspaces.createdAt));
}

export async function getWorkspace(userId: string, id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)));
  return row ?? null;
}

export async function listStudents(workspaceId: string) {
  return db
    .select()
    .from(students)
    .where(eq(students.workspaceId, workspaceId))
    .orderBy(asc(students.lastName), asc(students.firstName));
}

export async function getStudent(workspaceId: string, id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select()
    .from(students)
    .where(and(eq(students.id, id), eq(students.workspaceId, workspaceId)));
  return row ?? null;
}

const lessonCols = {
  id: lessons.id,
  workspaceId: lessons.workspaceId,
  studentId: lessons.studentId,
  firstName: students.firstName,
  lastName: students.lastName,
  slotId: lessons.slotId,
  date: lessons.date,
  startTime: lessons.startTime,
  durationMin: lessons.durationMin,
  subject: lessons.subject,
  status: lessons.status,
  note: lessons.note,
};

type LessonRow = {
  id: string; workspaceId: string; studentId: string; firstName: string; lastName: string;
  slotId: string | null; date: string; startTime: string; durationMin: number;
  subject: string | null; status: LessonStatus; note: string | null;
};

export const toLessonView = (r: LessonRow): LessonView => ({
  id: r.id,
  workspaceId: r.workspaceId,
  studentId: r.studentId,
  studentName: `${r.firstName} ${r.lastName}`,
  slotId: r.slotId,
  date: r.date,
  startTime: r.startTime,
  durationMin: r.durationMin,
  subject: r.subject,
  status: r.status,
  note: r.note,
});

export async function lessonsBetween(workspaceId: string, from: string, to: string): Promise<LessonView[]> {
  const rows = await db
    .select(lessonCols)
    .from(lessons)
    .innerJoin(students, eq(students.id, lessons.studentId))
    .where(and(eq(lessons.workspaceId, workspaceId), between(lessons.date, from, to)))
    .orderBy(asc(lessons.date), asc(lessons.startTime));
  return rows.map(toLessonView);
}

export async function getLesson(workspaceId: string, id: string): Promise<LessonView | null> {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select(lessonCols)
    .from(lessons)
    .innerJoin(students, eq(students.id, lessons.studentId))
    .where(and(eq(lessons.id, id), eq(lessons.workspaceId, workspaceId)));
  return row ? toLessonView(row) : null;
}

/** Ure, ki so že mimo, a še niso potrjene (opravljeno/izostanek/odpadlo). */
export async function pendingLessons(workspaceId: string, today: string, nowTime: string, limit = 50) {
  const rows = await db
    .select(lessonCols)
    .from(lessons)
    .innerJoin(students, eq(students.id, lessons.studentId))
    .where(and(eq(lessons.workspaceId, workspaceId), eq(lessons.status, "planned"), lte(lessons.date, today)))
    .orderBy(desc(lessons.date), desc(lessons.startTime))
    .limit(limit + 20);
  return rows
    .map(toLessonView)
    .filter((l) => l.date < today || timeToMin(endTime(l.startTime, l.durationMin)) <= timeToMin(nowTime))
    .slice(0, limit);
}

export async function upcomingLessons(workspaceId: string, from: string, limit = 6) {
  const rows = await db
    .select(lessonCols)
    .from(lessons)
    .innerJoin(students, eq(students.id, lessons.studentId))
    .where(and(eq(lessons.workspaceId, workspaceId), gte(lessons.date, from), ne(lessons.status, "cancelled")))
    .orderBy(asc(lessons.date), asc(lessons.startTime))
    .limit(limit);
  return rows.map(toLessonView);
}

export type StatusCounts = Record<LessonStatus, number> & { attendedMinutes: number };

export async function statusCounts(
  workspaceId: string,
  from: string,
  to: string,
  studentId?: string,
): Promise<StatusCounts> {
  const rows = await db
    .select({
      status: lessons.status,
      n: sql<number>`count(*)::int`,
      minutes: sql<number>`coalesce(sum(${lessons.durationMin}), 0)::int`,
    })
    .from(lessons)
    .where(
      and(
        eq(lessons.workspaceId, workspaceId),
        between(lessons.date, from, to),
        studentId ? eq(lessons.studentId, studentId) : undefined,
      ),
    )
    .groupBy(lessons.status);
  const out: StatusCounts = {
    planned: 0, attended: 0, absent_excused: 0, absent_unexcused: 0, cancelled: 0, attendedMinutes: 0,
  };
  for (const r of rows) {
    out[r.status] = r.n;
    if (r.status === "attended") out.attendedMinutes = r.minutes;
  }
  return out;
}

export async function slotsForStudent(studentId: string) {
  return db.select().from(slots).where(eq(slots.studentId, studentId)).orderBy(asc(slots.weekday), asc(slots.startTime));
}

export async function getSlot(workspaceId: string, id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db.select().from(slots).where(and(eq(slots.id, id), eq(slots.workspaceId, workspaceId)));
  return row ?? null;
}

export async function recentLessonsForStudent(studentId: string, today: string, limit = 12) {
  return db
    .select({
      id: lessons.id, date: lessons.date, startTime: lessons.startTime,
      durationMin: lessons.durationMin, status: lessons.status, subject: lessons.subject,
    })
    .from(lessons)
    .where(and(eq(lessons.studentId, studentId), lt(lessons.date, today)))
    .orderBy(desc(lessons.date), desc(lessons.startTime))
    .limit(limit);
}

/**
 * Prekrivanja z drugimi urami učiteljice – tudi v drugi šoli (ne more biti na dveh mestih hkrati).
 */
export async function findConflicts(
  userId: string,
  items: { date: string; startTime: string; durationMin: number }[],
  excludeLessonIds: string[] = [],
) {
  if (items.length === 0) return [];
  const dates = [...new Set(items.map((i) => i.date))];
  const rows = await db
    .select({
      id: lessons.id,
      date: lessons.date,
      startTime: lessons.startTime,
      durationMin: lessons.durationMin,
      firstName: students.firstName,
      lastName: students.lastName,
      workspaceName: workspaces.name,
    })
    .from(lessons)
    .innerJoin(workspaces, eq(workspaces.id, lessons.workspaceId))
    .innerJoin(students, eq(students.id, lessons.studentId))
    .where(and(eq(workspaces.userId, userId), inArray(lessons.date, dates), ne(lessons.status, "cancelled")));

  const byDate = new Map<string, typeof rows>();
  for (const r of rows) {
    if (excludeLessonIds.includes(r.id)) continue;
    byDate.set(r.date, [...(byDate.get(r.date) ?? []), r]);
  }
  const out: { date: string; startTime: string; studentName: string; workspaceName: string }[] = [];
  for (const it of items) {
    const s = timeToMin(it.startTime);
    const e = s + it.durationMin;
    for (const r of byDate.get(it.date) ?? []) {
      const rs = timeToMin(r.startTime);
      if (s < rs + r.durationMin && rs < e) {
        out.push({ date: it.date, startTime: r.startTime, studentName: `${r.firstName} ${r.lastName}`, workspaceName: r.workspaceName });
      }
    }
  }
  return out;
}

/** Poročilo za izvoz: vse ure v mesecu. */
export async function monthLessons(workspaceId: string, from: string, to: string) {
  return lessonsBetween(workspaceId, from, to);
}
