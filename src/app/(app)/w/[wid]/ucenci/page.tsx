import Link from "next/link";
import { notFound } from "next/navigation";
import { NewStudentButton } from "@/components/students/student-actions";
import { StudentList, type StudentRow } from "@/components/students/student-list";
import { getWorkspace, listStudents, slotsForWorkspace } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { todayIso, WEEKDAYS } from "@/lib/date";

export const dynamic = "force-dynamic";
export const metadata = { title: "Učenci" };

export default async function StudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ wid: string }>;
  searchParams: Promise<{ arhiv?: string }>;
}) {
  const { wid } = await params;
  const { arhiv } = await searchParams;
  const user = await requireUser();
  const ws = await getWorkspace(user.id, wid);
  if (!ws) notFound();

  const showArchived = arhiv === "1";
  const today = todayIso();
  const [studs, slots] = await Promise.all([listStudents(ws.id), slotsForWorkspace(ws.id)]);

  const rows: StudentRow[] = studs
    .filter((s) => s.active !== showArchived)
    .map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      birthYear: s.birthYear,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      phone: s.phone,
      gdpr: s.gdprConsent,
      active: s.active,
      slots: slots
        .filter((t) => t.studentId === s.id && t.endDate >= today)
        .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime))
        .map((t) => `${WEEKDAYS.find((w) => w.value === t.weekday)!.short} ${t.startTime}`),
    }));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl">Učenci</h1>
          <p className="text-ink-soft">{ws.name}</p>
        </div>
        <NewStudentButton />
      </header>
      <nav aria-label="Filter učencev" className="flex gap-2">
        <Link href={`/w/${ws.id}/ucenci`} aria-current={!showArchived ? "page" : undefined} className="min-h-10 rounded-full border border-line-strong px-4 py-2 text-sm font-medium aria-[current=page]:border-primary aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary">
          Aktivni
        </Link>
        <Link href={`/w/${ws.id}/ucenci?arhiv=1`} aria-current={showArchived ? "page" : undefined} className="min-h-10 rounded-full border border-line-strong px-4 py-2 text-sm font-medium aria-[current=page]:border-primary aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary">
          Arhivirani
        </Link>
      </nav>
      <StudentList rows={rows} showArchived={showArchived} />
    </div>
  );
}
