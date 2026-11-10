import { NextResponse, type NextRequest } from "next/server";
import { getWorkspace, lessonsBetween } from "@/db/queries";
import { getUser } from "@/lib/auth";
import { monthEndIso } from "@/lib/date";
import { buildPdf } from "@/lib/export-pdf";
import { buildXlsx } from "@/lib/export-xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "sola";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Niste prijavljeni." }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const month = sp.get("month") ?? "";
  const format = sp.get("format");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || (format !== "xlsx" && format !== "pdf")) {
    return NextResponse.json({ error: "Neveljavni parametri." }, { status: 400 });
  }
  const ws = await getWorkspace(user.id, sp.get("workspace") ?? "");
  if (!ws) return NextResponse.json({ error: "Šole ni mogoče najti." }, { status: 404 });

  const from = `${month}-01`;
  const lessons = await lessonsBetween(ws.id, from, monthEndIso(from));
  const input = { workspaceName: ws.name, month, lessons };
  const base = `opravljene-ure_${slug(ws.name)}_${month}`;

  const body = format === "xlsx" ? await buildXlsx(input) : await buildPdf(input);
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf",
      "Content-Disposition": `attachment; filename="${base}.${format}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
