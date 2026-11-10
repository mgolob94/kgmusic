import Link from "next/link";
import { addDays, format, getDay, startOfMonth } from "date-fns";
import { holidayName } from "@/lib/holidays";
import { fmtMonth, toDate, toIso, WEEKDAYS } from "@/lib/date";

/** Strežniška komponenta: mesečni pregled s pikami za dneve z urami. Klik odpre dan v koledarju. */
export function MiniMonth({ workspaceId, today, daysWithLessons }: { workspaceId: string; today: string; daysWithLessons: Record<string, number> }) {
  const first = startOfMonth(toDate(today));
  const lead = (getDay(first) + 6) % 7; // ponedeljek = 0
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i - lead));
  const month = format(first, "M");

  return (
    <section aria-labelledby="mini-h" className="rounded-2xl bg-surface p-5 shadow-soft">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="mini-h" className="text-lg">{fmtMonth(today)}</h2>
        <Link href={`/w/${workspaceId}/koledar?view=month&date=${today}`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Odpri koledar
        </Link>
      </div>
      <div className="grid grid-cols-7 text-center text-xs text-ink-faint" aria-hidden>
        {WEEKDAYS.map((d) => <span key={d.value} className="py-1">{d.short}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((d) => {
          const iso = toIso(d);
          const inMonth = format(d, "M") === month;
          const n = daysWithLessons[iso] ?? 0;
          const isToday = iso === today;
          const holiday = holidayName(iso);
          return (
            <Link
              key={iso}
              href={`/w/${workspaceId}/koledar?view=day&date=${iso}`}
              aria-label={`${format(d, "d. M. yyyy")}${n ? `, ${n} ur` : ""}${holiday ? `, ${holiday}` : ""}`}
              aria-current={isToday ? "date" : undefined}
              className={`relative mx-auto grid size-10 place-items-center rounded-full text-sm tnum hover:bg-sunken ${
                inMonth ? "" : "text-ink-faint/70"
              } ${isToday ? "bg-primary font-semibold text-on-primary hover:bg-primary" : ""} ${holiday && !isToday ? "text-unexcused" : ""}`}
            >
              {format(d, "d")}
              {n > 0 && (
                <span aria-hidden className={`absolute bottom-1 size-1 rounded-full ${isToday ? "bg-on-primary" : "bg-primary"}`} />
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
