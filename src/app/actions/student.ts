"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { students } from "@/db/schema";
import { getStudent } from "@/db/queries";
import { authorize, ok, run, UserError } from "@/lib/action-utils";
import { todayIso } from "@/lib/date";
import { studentSchema, type StudentInput } from "@/lib/schemas";

const blank = (v: string) => (v.trim() === "" ? null : v.trim());

function toRow(d: StudentInput, existingConsentDate: string | null) {
  return {
    firstName: d.firstName,
    lastName: d.lastName,
    birthYear: d.birthYear ? Number(d.birthYear) : null,
    phone: blank(d.phone),
    parentName: blank(d.parentName),
    parentPhone: blank(d.parentPhone),
    parentEmail: blank(d.parentEmail),
    notes: blank(d.notes),
    gdprConsent: d.gdprConsent,
    gdprConsentDate: d.gdprConsent ? (existingConsentDate ?? todayIso()) : null,
  };
}

export async function createStudent(workspaceId: string, input: StudentInput) {
  return run(async () => {
    await authorize(workspaceId);
    const data = studentSchema.parse(input);
    const [row] = await db
      .insert(students)
      .values({ workspaceId, ...toRow(data, null) })
      .returning({ id: students.id });
    revalidatePath(`/w/${workspaceId}`, "layout");
    return ok({ id: row.id });
  });
}

export async function updateStudent(workspaceId: string, id: string, input: StudentInput) {
  return run(async () => {
    await authorize(workspaceId);
    const existing = await getStudent(workspaceId, id);
    if (!existing) throw new UserError("Učenca ni mogoče najti.");
    const data = studentSchema.parse(input);
    await db.update(students).set(toRow(data, existing.gdprConsentDate)).where(eq(students.id, id));
    revalidatePath(`/w/${workspaceId}`, "layout");
    return ok(undefined);
  });
}

/** Arhiviranje (učenec ne vpliva več na urnik, zgodovina ostane). Razveljavitev = active: true. */
export async function setStudentActive(workspaceId: string, id: string, active: boolean) {
  return run(async () => {
    await authorize(workspaceId);
    const existing = await getStudent(workspaceId, id);
    if (!existing) throw new UserError("Učenca ni mogoče najti.");
    await db.update(students).set({ active }).where(and(eq(students.id, id), eq(students.workspaceId, workspaceId)));
    revalidatePath(`/w/${workspaceId}`, "layout");
    return ok(undefined);
  });
}

/** Trajen izbris (pravica do izbrisa po GDPR) – zahteva vpis polnega imena. */
export async function deleteStudent(workspaceId: string, id: string, confirmName: string) {
  return run(async () => {
    await authorize(workspaceId);
    const existing = await getStudent(workspaceId, id);
    if (!existing) throw new UserError("Učenca ni mogoče najti.");
    if (confirmName.trim() !== `${existing.firstName} ${existing.lastName}`) {
      throw new UserError("Ime se ne ujema. Učenec ni izbrisan.");
    }
    await db.delete(students).where(eq(students.id, id));
    revalidatePath(`/w/${workspaceId}`, "layout");
    return ok(undefined);
  });
}
