"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { addDaysIso, weekStartIso } from "@/lib/date";
import { calHref, rangeTitle, shiftDate, type CalView } from "@/lib/calendar";
import type { LessonView } from "@/lib/types";
import { Agenda } from "./agenda";
import { MonthGrid } from "./month-grid";
import { WeekGrid } from "./week-grid";

type Now = { date: string; time: string; minutes: number };

const SEGMENTS: { view: Exclude<CalView, "auto">; label: string }[] = [
  { view: "day", label: "Dan" },
  { view: "week", label: "Teden" },
  { view: "month", label: "Mesec" },
  { view: "agenda", label: "Seznam" },
];

export function CalendarView({
  view, date, lessons, now, subject, student,
}: {
  view: CalView;
  date: string;
  lessons: LessonView[];
  now: Now;
  subject?: string;
  student?: string;
}) {
  const { workspace, students, openNewLesson } = useWorkspace();
  const router = useRouter();
  const filters = { subject, student };
  const href = (v: CalView, d: string) => calHref(workspace.id, { view: v, date: d, ...filters });
  const navView: CalView = view === "auto" ? "week" : view === "agenda" ? "week" : view;
  const week = Array.from({ length: 7 }, (_, i) => addDaysIso(weekStartIso(date), i));

  // Razredi morajo biti zapisani dobesedno, da jih Tailwind zazna.
  const segClass = (v: Exclude<CalView, "auto">) => {
    if (view === v) return "bg-primary-soft text-primary";
    if (view === "auto" && v === "week") return "text-ink-soft hover:bg-sunken md:bg-primary-soft md:text-primary";
    if (view === "auto" && v === "agenda") return "bg-primary-soft text-primary md:bg-transparent md:text-ink-soft md:hover:bg-sunken";
    return "text-ink-soft hover:bg-sunken";
  };

  const setFilter = (key: "subject" | "student", value: string) =>
    router.replace(calHref(workspace.id, { view, date, subject, student, [key]: value || undefined }));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl">Koledar</h1>
          <p className="text-ink-soft tnum" aria-live="polite">{rangeTitle(navView, date)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={href(view, shiftDate(navView, date, -1))} aria-label="Nazaj" className={buttonClass("secondary", "icon")}>
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <Link href={href(view, now.date)} className={buttonClass("secondary")}>Danes</Link>
          <Link href={href(view, shiftDate(navView, date, 1))} aria-label="Naprej" className={buttonClass("secondary", "icon")}>
            <ChevronRight className="size-5" aria-hidden />
          </Link>
          <Button className="max-md:hidden" onClick={() => openNewLesson({ date })}>
            <CalendarPlus className="size-4" aria-hidden /> Nova ura
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <nav aria-label="Pogled koledarja" className="flex rounded-xl border border-line-strong bg-surface p-1">
          {SEGMENTS.map((s) => (
            <Link
              key={s.view}
              href={href(s.view, date)}
              aria-current={view === s.view ? "page" : undefined}
              className={`grid min-h-10 min-w-16 place-items-center rounded-lg px-3 text-sm font-medium transition-colors ${segClass(s.view)}`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
        <label className="sr-only" htmlFor="f-subject">Predmet</label>
        <select id="f-subject" value={subject ?? ""} onChange={(e) => setFilter("subject", e.target.value)} className={`${inputClass} !w-auto`}>
          <option value="">Vsi predmeti</option>
          <option value="klavir">Klavir</option>
          <option value="petje">Petje</option>
        </select>
        <label className="sr-only" htmlFor="f-student">Učenec</label>
        <select id="f-student" value={student ?? ""} onChange={(e) => setFilter("student", e.target.value)} className={`${inputClass} !w-auto max-w-full`}>
          <option value="">Vsi učenci</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {view === "auto" && (
        <>
          <div className="hidden md:block"><WeekGrid days={week} lessons={lessons} now={now} filters={filters} /></div>
          <div className="md:hidden"><Agenda days={week} lessons={lessons} today={now.date} /></div>
        </>
      )}
      {view === "week" && <WeekGrid days={week} lessons={lessons} now={now} filters={filters} />}
      {view === "day" && <WeekGrid days={[date]} lessons={lessons} now={now} filters={filters} />}
      {view === "month" && <MonthGrid date={date} lessons={lessons} now={now} filters={filters} />}
      {view === "agenda" && <Agenda days={week} lessons={lessons} today={now.date} />}

      <p className="hidden text-sm text-ink-faint md:block">
        Namig: uro povlečete na drug dan ali čas, da jo premaknete; klik na prazno polje doda novo uro.
      </p>
    </div>
  );
}
