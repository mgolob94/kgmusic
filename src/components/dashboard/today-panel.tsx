"use client";

import { Fragment } from "react";
import { CalendarPlus, Clock, Music2 } from "lucide-react";
import { StatusBadge, SubjectBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { useNow } from "@/components/workspace/use-now";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { endTime, fmtDuration, timeToMin } from "@/lib/date";
import type { LessonView } from "@/lib/types";
import { QuickMark } from "./quick-mark";

type Now = { date: string; time: string; minutes: number };

function phase(l: LessonView, now: Now): "past" | "current" | "future" {
  const s = timeToMin(l.startTime);
  const e = s + l.durationMin;
  if (now.minutes >= e) return "past";
  if (now.minutes >= s) return "current";
  return "future";
}

export function TodayPanel({ lessons, now: initial, holiday }: { lessons: LessonView[]; now: Now; holiday: string | null }) {
  const now = useNow(initial);
  const { openLesson, openNewLesson } = useWorkspace();
  const active = lessons.filter((l) => l.status !== "cancelled");
  const remaining = active.filter((l) => phase(l, now) !== "past").length;
  const firstFuture = lessons.findIndex((l) => timeToMin(l.startTime) > now.minutes);
  const nowIndex = firstFuture === -1 ? lessons.length : firstFuture;

  return (
    <section aria-labelledby="today-h" className="rounded-2xl bg-surface shadow-soft">
      <div className="staff rounded-t-2xl border-b border-line px-5 pb-3 pt-4">
        <h2 id="today-h" className="text-xl">Urnik za danes</h2>
        <p className="text-sm text-ink-soft">
          {lessons.length === 0
            ? "Danes ni ur."
            : remaining === 0
              ? "Vse današnje ure so za vami."
              : `Ostaja še ${remaining} od ${active.length}.`}
        </p>
      </div>

      {lessons.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<Music2 className="size-6" aria-hidden />}
            title={holiday ? holiday : "Prost dan"}
            action={
              <Button variant="secondary" onClick={() => openNewLesson()}>
                <CalendarPlus className="size-4" aria-hidden /> Dodaj enkratno uro
              </Button>
            }
          >
            {holiday ? "Danes je državni praznik. Tedenski termini so ob praznikih preskočeni." : "Za danes ni vpisanih ur."}
          </EmptyState>
        </div>
      ) : (
        <ol className="flex flex-col px-3 py-3 sm:px-5">
          {lessons.map((l, i) => {
            const p = phase(l, now);
            const cancelled = l.status === "cancelled";
            return (
              <Fragment key={l.id}>
                {i === nowIndex && <NowLine time={now.time} />}
                <li className={`grid grid-cols-[3.5rem_1fr] gap-3 py-2 sm:grid-cols-[4.5rem_1fr] ${p === "past" || cancelled ? "opacity-75" : ""}`}>
                  <div className="pt-3 text-right tnum">
                    <p className="font-semibold">{l.startTime}</p>
                    <p className="text-xs text-ink-faint">{endTime(l.startTime, l.durationMin)}</p>
                  </div>
                  <div
                    className={`rounded-xl border p-3 ${
                      p === "current" && !cancelled ? "border-primary bg-primary-soft" : "border-line bg-paper"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => openLesson(l)}
                      className="flex w-full min-h-11 flex-col items-start gap-1.5 text-left"
                    >
                      <span className="flex w-full flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`font-semibold ${cancelled ? "line-through" : ""}`}>{l.studentName}</span>
                        {p === "current" && !cancelled && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                            <span className="playhead-dot size-2 rounded-full bg-primary" aria-hidden /> Poteka zdaj
                          </span>
                        )}
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <SubjectBadge subject={l.subject} />
                        {l.status !== "planned" && <StatusBadge status={l.status} />}
                        <span className="text-xs text-ink-faint">{fmtDuration(l.durationMin)}</span>
                      </span>
                      {l.note && <span className="text-sm text-ink-soft">{l.note}</span>}
                    </button>
                    {l.status === "planned" && p !== "future" && (
                      <div className="mt-2 border-t border-line/70 pt-2">
                        <QuickMark lessonId={l.id} studentName={l.studentName} />
                      </div>
                    )}
                  </div>
                </li>
              </Fragment>
            );
          })}
          {nowIndex === lessons.length && <NowLine time={now.time} />}
        </ol>
      )}
    </section>
  );
}

function NowLine({ time }: { time: string }) {
  return (
    <li aria-label={`Zdaj je ${time}`} className="grid grid-cols-[3.5rem_1fr] items-center gap-3 sm:grid-cols-[4.5rem_1fr]">
      <span className="text-right text-xs font-semibold text-primary tnum">{time}</span>
      <span className="flex items-center" aria-hidden>
        <span className="playhead-dot size-2.5 rounded-full bg-primary" />
        <span className="h-px flex-1 bg-primary" />
      </span>
    </li>
  );
}

export function NextUpCard({ lessons, now: initial }: { lessons: LessonView[]; now: Now }) {
  const now = useNow(initial);
  const { openLesson } = useWorkspace();
  const candidates = lessons.filter((l) => l.status !== "cancelled" && phase(l, now) !== "past");
  const next = candidates[0];

  if (!next) {
    return (
      <section aria-labelledby="next-h" className="rounded-2xl bg-surface p-5 shadow-soft">
        <h2 id="next-h" className="text-lg">Naslednja ura</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {lessons.length === 0 ? "Danes ni ur." : "Za danes je konec. Hvala za današnje delo."}
        </p>
      </section>
    );
  }
  const current = phase(next, now) === "current";
  const mins = timeToMin(next.startTime) - now.minutes;

  return (
    <section aria-labelledby="next-h" className="rounded-2xl bg-primary p-5 text-on-primary shadow-soft">
      <h2 id="next-h" className="flex items-center gap-2 text-sm font-medium opacity-90 font-sans">
        <Clock className="size-4" aria-hidden />
        {current ? "Poteka zdaj" : mins < 60 ? `Čez ${mins} min` : `Ob ${next.startTime}`}
      </h2>
      <p className="mt-2 font-display text-2xl font-semibold leading-tight">{next.studentName}</p>
      <p className="mt-1 tnum opacity-90">
        {next.startTime}–{endTime(next.startTime, next.durationMin)} · {next.subject === "petje" ? "petje" : "klavir"}
      </p>
      {next.note && <p className="mt-3 rounded-lg bg-on-primary/10 px-3 py-2 text-sm">{next.note}</p>}
      <button
        type="button"
        onClick={() => openLesson(next)}
        className="mt-4 min-h-11 rounded-xl bg-on-primary px-4 font-medium text-primary hover:opacity-90"
      >
        Odpri uro
      </button>
    </section>
  );
}
