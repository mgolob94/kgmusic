import Link from "next/link";
import { listWorkspaces } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { WorkspaceForm } from "@/components/workspace/workspace-form";

export const metadata = { title: "Nova šola" };

export default async function NewWorkspacePage() {
  const user = await requireUser();
  const existing = await listWorkspaces(user.id);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="staff pb-2">
        <h1 className="text-3xl">{existing.length === 0 ? "Dobrodošli" : "Nova šola"}</h1>
      </div>
      <p className="text-ink-soft">
        {existing.length === 0
          ? "Vsaka glasbena šola ima svoje učence in svoj urnik. Začnite s prvo."
          : "Nova šola dobi povsem ločen seznam učencev in urnik."}
      </p>
      <WorkspaceForm />
      {existing.length > 0 && (
        <Link href="/" className="min-h-11 py-2 text-center text-sm font-medium text-primary underline underline-offset-4">
          Nazaj
        </Link>
      )}
    </main>
  );
}
