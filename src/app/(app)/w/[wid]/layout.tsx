import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { WorkspaceProvider } from "@/components/workspace/workspace-provider";
import { getWorkspace, listStudents, listWorkspaces } from "@/db/queries";
import { requireUser } from "@/lib/auth";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ wid: string }>;
}) {
  const { wid } = await params;
  const user = await requireUser();
  const ws = await getWorkspace(user.id, wid);
  if (!ws) notFound();
  const [all, studs] = await Promise.all([listWorkspaces(user.id), listStudents(ws.id)]);

  return (
    <WorkspaceProvider
      workspace={{
        id: ws.id, name: ws.name, color: ws.color,
        seasonStartMonth: ws.seasonStartMonth, seasonEndMonth: ws.seasonEndMonth,
      }}
      students={studs.filter((s) => s.active).map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }))}
    >
      <AppShell schools={all.map((w) => ({ id: w.id, name: w.name, color: w.color }))}>{children}</AppShell>
    </WorkspaceProvider>
  );
}
