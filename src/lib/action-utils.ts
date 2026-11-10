import { ZodError } from "zod";
import { getWorkspace } from "@/db/queries";
import { requireUserOrThrow } from "./auth";
import type { ActionResult } from "./types";

export class UserError extends Error {}

export async function authorize(workspaceId: string) {
  const user = await requireUserOrThrow();
  const workspace = await getWorkspace(user.id, workspaceId);
  if (!workspace) throw new UserError("Te šole ni mogoče najti.");
  return { user, workspace };
}

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });

/** Zavije akcijo: napake pretvori v prijazno sporočilo, validacijske v napake polj. */
export async function run<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of e.issues) fieldErrors[issue.path.join(".") || "_"] ??= issue.message;
      return { ok: false, error: "Preverite označena polja.", fieldErrors };
    }
    if (e instanceof UserError) return { ok: false, error: e.message };
    if (e instanceof Error && e.message.startsWith("Seja")) return { ok: false, error: e.message };
    console.error("[action]", e);
    return { ok: false, error: "Nekaj je šlo narobe. Poskusite znova." };
  }
}
