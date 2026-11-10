import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listWorkspaces } from "@/db/queries";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  const list = await listWorkspaces(user.id);
  if (list.length === 0) redirect("/nova-sola");
  const last = (await cookies()).get("kg_ws")?.value;
  const target = list.find((w) => w.id === last) ?? list[0];
  redirect(`/w/${target.id}`);
}
