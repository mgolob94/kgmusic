import { addDaysIso, fmtDayLong, monthEndIso, monthStartIso, nowLjubljana } from "@/lib/date";
import { holidayName } from "@/lib/holidays";
import { lessonsBetween, listStudents, pendingLessons, statusCounts, upcomingLessons } from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getWorkspace } from "@/db/queries";
import { NextUpCard, TodayPanel } from "@/components/dashboard/today-panel";
import { PendingList, UpcomingList } from "@/components/dashboard/lesson-list";
import { StatsStrip } from "@/components/dashboard/stats-strip";
import { MiniMonth } from "@/components/dashboard/mini-month";

export const dynamic = "force-dynamic";
export const metadata = { title: "Danes" };

export default async function DashboardPage({ params }: { params: Promise<{ wid: string }> }) {
  const { wid } = await params;
  const user = await requireUser();
  const ws = await getWorkspace(user.id, wid);
  if (!ws) notFound();

  const now = nowLjubljana();
  const today = now.date;
  const [todayLessons, pending, upcoming, counts, studs, monthLessons] = await Promise.all([
    lessonsBetween(ws.id, today, today),
    pendingLessons(ws.id, today, now.time, 200),
    upcomingLessons(ws.id, addDaysIso(today, 1), 6),
    statusCounts(ws.id, monthStartIso(today), monthEndIso(today)),
    listStudents(ws.id),
    lessonsBetween(ws.id, monthStartIso(today), monthEndIso(today)),
  ]);

  const perDay: Record<string, number> = {};
  for (const l of monthLessons) if (l.status !== "cancelled") perDay[l.date] = (perDay[l.date] ?? 0) + 1;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl md:text-4xl">Danes</h1>
        <p className="text-ink-soft">{fmtDayLong(today)}</p>
      </header>

      <StatsStrip counts={counts} pending={pending.length} activeStudents={studs.filter((s) => s.active).length} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="flex flex-col gap-5">
          <TodayPanel lessons={todayLessons} now={now} holiday={holidayName(today)} />
          <PendingList lessons={pending.slice(0, 8)} total={pending.length} />
        </div>
        <div className="flex flex-col gap-5">
          <NextUpCard lessons={todayLessons} now={now} />
          <MiniMonth workspaceId={ws.id} today={today} daysWithLessons={perDay} />
          <UpcomingList lessons={upcoming} />
        </div>
      </div>
    </div>
  );
}
