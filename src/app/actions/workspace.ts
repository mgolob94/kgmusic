"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { authorize, ok, run, UserError } from "@/lib/action-utils";
import { requireUserOrThrow } from "@/lib/auth";
import { workspaceSchema, type WorkspaceInput } from "@/lib/schemas";

export async function createWorkspace(input: WorkspaceInput) {
  return run(async () => {
    const user = await requireUserOrThrow();
    const data = workspaceSchema.parse(input);
    const [row] = await db.insert(workspaces).values({ userId: user.id, ...data }).returning({ id: workspaces.id });
    revalidatePath("/", "layout");
    return ok({ id: row.id });
  });
}

export async function updateWorkspace(id: string, input: WorkspaceInput) {
  return run(async () => {
    await authorize(id);
    const data = workspaceSchema.parse(input);
    await db.update(workspaces).set(data).where(eq(workspaces.id, id));
    revalidatePath("/", "layout");
    return ok(undefined);
  });
}

/** Trajen izbris šole z vsemi učenci in urami – zahteva vpis imena šole. */
export async function deleteWorkspace(id: string, confirmName: string) {
  return run(async () => {
    const { workspace } = await authorize(id);
    if (confirmName.trim() !== workspace.name) throw new UserError("Ime se ne ujema. Šola ni izbrisana.");
    await db.delete(workspaces).where(eq(workspaces.id, id));
    revalidatePath("/", "layout");
    return ok(undefined);
  });
}
