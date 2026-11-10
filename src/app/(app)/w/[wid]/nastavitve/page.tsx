import { notFound } from "next/navigation";
import { DeleteWorkspace } from "@/components/workspace/delete-workspace";
import { WorkspaceForm } from "@/components/workspace/workspace-form";
import { getWorkspace } from "@/db/queries";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nastavitve šole" };

export default async function SettingsPage({ params }: { params: Promise<{ wid: string }> }) {
  const { wid } = await params;
  const user = await requireUser();
  const ws = await getWorkspace(user.id, wid);
  if (!ws) notFound();
  return (
    <div className="flex max-w-xl flex-col gap-5">
      <header>
        <h1 className="text-3xl md:text-4xl">Nastavitve šole</h1>
        <p className="text-ink-soft">{ws.name}</p>
      </header>
      <WorkspaceForm workspace={{ id: ws.id, name: ws.name, color: ws.color, seasonStartMonth: ws.seasonStartMonth, seasonEndMonth: ws.seasonEndMonth }} />
      <DeleteWorkspace id={ws.id} name={ws.name} />
    </div>
  );
}
