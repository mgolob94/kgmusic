import { notFound } from "next/navigation";
import { CalendarView } from "@/components/calendar/calendar-view";
import { getWorkspace, isUuid, lessonsBetween } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { rangeFor, VIEWS, type CalView } from "@/lib/calendar";
import { nowLjubljana } from "@/lib/date";

export const dynamic = "force-dynamic";
export const metadata = { title: "Koledar" };

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ wid: string }>;
  searchParams: Promise<{ view?: string; date?: string; subject?: string; student?: string }>;
}) {
  const { wid } = await params;
  const sp = await searchParams;
  const user = await requireUser();
  const ws = await getWorkspace(user.id, wid);
  if (!ws) notFound();

  const now = nowLjubljana();
  const view: CalView = (VIEWS as readonly string[]).includes(sp.view ?? "") ? (sp.view as CalView) : "auto";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : now.date;
  const subject = sp.subject === "klavir" || sp.subject === "petje" ? sp.subject : undefined;
  const student = sp.student && isUuid(sp.student) ? sp.student : undefined;

  const { from, to } = rangeFor(view, date);
  const all = await lessonsBetween(ws.id, from, to);
  const lessons = all.filter((l) => (!subject || l.subject === subject) && (!student || l.studentId === student));

  return <CalendarView view={view} date={date} lessons={lessons} now={now} subject={subject} student={student} />;
}
