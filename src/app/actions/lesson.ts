"use server";

import { and, eq, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { lessons, slots } from "@/db/schema";
import { findConflicts, getLesson, getSlot, getStudent } from "@/db/queries";
import { authorize, ok, run, UserError } from "@/lib/action-utils";
import { addDaysIso, toDate } from "@/lib/date";
import { differenceInCalendarDays } from "date-fns";
import { MAX_SERIES_DAYS, seriesDates } from "@/lib/recurrence";
import {
  lessonCreateSchema, lessonEditSchema, slotSchema, statusSchema,
  type LessonCreateInput, type LessonEditInput, type SlotInput,
} from "@/lib/schemas";
import type { Conflict } from "@/lib/types";
import type { LessonStatus } from "@/lib/status";

const refresh = (wid: string) => revalidatePath(`/w/${wid}`, "layout");
const limitConflicts = (c: Conflict[]) => ({ conflicts: c.slice(0, 5), conflictCount: c.length });

export async function setLessonStatus(workspaceId: string, id: string, status: LessonStatus) {
  return run(async () => {
    await authorize(workspaceId);
    const s = statusSchema.parse(status);
    const lesson = await getLesson(workspaceId, id);
    if (!lesson) throw new UserError("Ure ni mogoče najti.");
    await db.update(lessons).set({ status: s }).where(eq(lessons.id, id));
    refresh(workspaceId);
    return ok({ previous: lesson.status });
  });
}

export async function setLessonNote(workspaceId: string, id: string, note: string) {
  return run(async () => {
    await authorize(workspaceId);
    const text = note.trim().slice(0, 1000);
    const res = await db
      .update(lessons)
      .set({ note: text || null })
      .where(and(eq(lessons.id, id), eq(lessons.workspaceId, workspaceId)))
      .returning({ id: lessons.id });
    if (res.length === 0) throw new UserError("Ure ni mogoče najti.");
    refresh(workspaceId);
    return ok(undefined);
  });
}

/** Premik / sprememba posamezne ure (tudi povlek v koledarju). Serija ostane nespremenjena. */
export async function updateLesson(workspaceId: string, id: string, input: LessonEditInput) {
  return run(async () => {
    const { user } = await authorize(workspaceId);
    const data = lessonEditSchema.parse(input);
    const lesson = await getLesson(workspaceId, id);
    if (!lesson) throw new UserError("Ure ni mogoče najti.");
    await db.update(lessons).set(data).where(eq(lessons.id, id));
    const conflicts = await findConflicts(user.id, [data], [id]);
    refresh(workspaceId);
    return ok({
      previous: { date: lesson.date, startTime: lesson.startTime, durationMin: lesson.durationMin, subject: (lesson.subject ?? "klavir") as LessonEditInput["subject"] },
      ...limitConflicts(conflicts),
    });
  });
}

/** Enkratna (nadomestna) ura izven tedenske serije. */
export async function createLesson(workspaceId: string, input: LessonCreateInput) {
  return run(async () => {
    const { user } = await authorize(workspaceId);
    const data = lessonCreateSchema.parse(input);
    const student = await getStudent(workspaceId, data.studentId);
    if (!student) throw new UserError("Učenca ni mogoče najti.");
    const [row] = await db.insert(lessons).values({ workspaceId, ...data }).returning({ id: lessons.id });
    const conflicts = await findConflicts(user.id, [data], [row.id]);
    refresh(workspaceId);
    return ok({ id: row.id, ...limitConflicts(conflicts) });
  });
}

/** Brisanje je dovoljeno samo za enkratne ure; ure iz serije se označijo kot "odpadlo". */
export async function deleteLesson(workspaceId: string, id: string) {
  return run(async () => {
    await authorize(workspaceId);
    const lesson = await getLesson(workspaceId, id);
    if (!lesson) throw new UserError("Ure ni mogoče najti.");
    if (lesson.slotId) throw new UserError("Ura je del serije. Označite jo kot »odpadlo«.");
    await db.delete(lessons).where(eq(lessons.id, id));
    refresh(workspaceId);
    return ok({ snapshot: lesson });
  });
}

/** Nov tedenski termin: ustvari serijo in vse ure med začetkom in koncem. */
export async function createSlot(workspaceId: string, input: SlotInput) {
  return run(async () => {
    const { user } = await authorize(workspaceId);
    const data = slotSchema.parse(input);
    const student = await getStudent(workspaceId, data.studentId);
    if (!student) throw new UserError("Učenca ni mogoče najti.");
    if (differenceInCalendarDays(toDate(data.endDate), toDate(data.startDate)) > MAX_SERIES_DAYS) {
      throw new UserError("Serija je predolga (največ približno 2 leti). Skrajšajte obdobje.");
    }
    const { dates, skippedHolidays } = seriesDates({
      weekday: data.weekday, startDate: data.startDate, endDate: data.endDate, skipHolidays: data.skipHolidays,
    });
    if (dates.length === 0) throw new UserError("V izbranem obdobju ni nobenega termina.");

    const conflicts = await findConflicts(
      user.id,
      dates.map((date) => ({ date, startTime: data.startTime, durationMin: data.durationMin })),
    );

    const slotId = await db.transaction(async (tx) => {
      const [slot] = await tx
        .insert(slots)
        .values({
          workspaceId, studentId: data.studentId, weekday: data.weekday, startTime: data.startTime,
          durationMin: data.durationMin, subject: data.subject, startDate: data.startDate,
          endDate: data.endDate, skipHolidays: data.skipHolidays,
        })
        .returning({ id: slots.id });
      await tx.insert(lessons).values(
        dates.map((date) => ({
          workspaceId, studentId: data.studentId, slotId: slot.id, date,
          startTime: data.startTime, durationMin: data.durationMin, subject: data.subject,
        })),
      );
      return slot.id;
    });
    refresh(workspaceId);
    return ok({ slotId, created: dates.length, skippedHolidays: skippedHolidays.length, ...limitConflicts(conflicts) });
  });
}

/**
 * Podaljša ali skrajša serijo. Podaljšanje doda manjkajoče ure, skrajšanje odstrani
 * samo še nezabeležene ure po novem koncu (zabeležene ostanejo). Razveljavitev = klic s starim koncem.
 */
export async function updateSlotEnd(workspaceId: string, slotId: string, endDate: string) {
  return run(async () => {
    await authorize(workspaceId);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new UserError("Izberite veljaven datum.");
    const slot = await getSlot(workspaceId, slotId);
    if (!slot) throw new UserError("Serije ni mogoče najti.");
    if (differenceInCalendarDays(toDate(endDate), toDate(slot.startDate)) > MAX_SERIES_DAYS) {
      throw new UserError("Serija je predolga (največ približno 2 leti).");
    }
    let added = 0;
    let removed = 0;
    await db.transaction(async (tx) => {
      if (endDate > slot.endDate) {
        const { dates } = seriesDates({
          weekday: slot.weekday, startDate: addDaysIso(slot.endDate, 1), endDate, skipHolidays: slot.skipHolidays,
        });
        if (dates.length) {
          const res = await tx
            .insert(lessons)
            .values(
              dates.map((date) => ({
                workspaceId, studentId: slot.studentId, slotId: slot.id, date,
                startTime: slot.startTime, durationMin: slot.durationMin, subject: slot.subject,
              })),
            )
            .onConflictDoNothing()
            .returning({ id: lessons.id });
          added = res.length;
        }
      } else if (endDate < slot.endDate) {
        const res = await tx
          .delete(lessons)
          .where(and(eq(lessons.slotId, slot.id), gt(lessons.date, endDate), eq(lessons.status, "planned")))
          .returning({ id: lessons.id });
        removed = res.length;
      }
      await tx.update(slots).set({ endDate }).where(eq(slots.id, slot.id));
    });
    refresh(workspaceId);
    return ok({ previousEnd: slot.endDate, added, removed });
  });
}
