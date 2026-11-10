import Link from "next/link";
import { fmtDuration } from "@/lib/date";
import type { StatusCounts } from "@/db/queries";

export function StatsStrip({ counts, pending, activeStudents }: { counts: StatusCounts; pending: number; activeStudents: number }) {
  const absences = counts.absent_excused + counts.absent_unexcused;
  const items = [
    { label: "Opravljeno ta mesec", value: String(counts.attended), sub: counts.attended ? fmtDuration(counts.attendedMinutes) : "ur še ni" },
    { label: "Čaka na zabeležbo", value: String(pending), sub: pending ? "Odpri seznam" : "Vse zabeleženo", href: pending ? "#nepotrjene" : undefined },
    { label: "Izostanki ta mesec", value: String(absences), sub: `${counts.absent_excused} opravičenih · ${counts.absent_unexcused} neopravičenih` },
    { label: "Aktivni učenci", value: String(activeStudents), sub: "v tej šoli" },
  ];
  return (
    <dl className="grid grid-cols-2 divide-line rounded-2xl bg-surface shadow-soft sm:grid-cols-4 sm:divide-x [&>div]:p-4 max-sm:[&>div:nth-child(n+3)]:border-t max-sm:[&>div:nth-child(even)]:border-l max-sm:[&>div]:border-line">
      {items.map((it) => {
        const body = (
          <>
            <dt className="text-sm text-ink-soft">{it.label}</dt>
            <dd className="mt-1 font-display text-3xl font-semibold tnum">{it.value}</dd>
            <dd className="text-xs text-ink-faint">{it.sub}</dd>
          </>
        );
        return it.href ? (
          <Link key={it.label} href={it.href} className="block rounded-2xl hover:bg-sunken">
            <div className="p-4">{body}</div>
          </Link>
        ) : (
          <div key={it.label}>{body}</div>
        );
      })}
    </dl>
  );
}
