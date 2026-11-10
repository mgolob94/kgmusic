"use client";

import { useState } from "react";
import { Repeat } from "lucide-react";
import { updateSlotEnd } from "@/app/actions/lesson";
import { SubjectBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { addDaysIso, endTime, fmtDate, todayIso, WEEKDAYS } from "@/lib/date";

export type SlotRowData = {
  id: string;
  weekday: number;
  startTime: string;
  durationMin: number;
  subject: string | null;
  startDate: string;
  endDate: string;
};

/** Ena tedenska serija: prikaz + prilagoditev konca (podaljšaj do avgusta, skrajšaj, končaj od danes). */
export function SlotRow({ slot }: { slot: SlotRowData }) {
  const { workspace } = useWorkspace();
  const toast = useToast();
  const [end, setEnd] = useState(slot.endDate);
  const [busy, setBusy] = useState(false);
  const today = todayIso();
  const finished = slot.endDate < today;
  const day = WEEKDAYS.find((w) => w.value === slot.weekday)!;

  async function apply(newEnd: string) {
    setBusy(true);
    const r = await updateSlotEnd(workspace.id, slot.id, newEnd);
    setBusy(false);
    if (!r.ok) return toast({ message: r.error, tone: "error" });
    const { added, removed, previousEnd } = r.data;
    setEnd(newEnd);
    toast({
      message: added ? `Dodanih terminov: ${added}.` : removed ? `Odstranjenih nezabeleženih terminov: ${removed}.` : "Konec serije je spremenjen.",
      action: {
        label: "Razveljavi",
        onClick: async () => {
          const u = await updateSlotEnd(workspace.id, slot.id, previousEnd);
          if (u.ok) setEnd(previousEnd);
          else toast({ message: u.error, tone: "error" });
        },
      },
    });
  }

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Repeat className="size-4 text-ink-faint" aria-hidden />
        <span className="font-semibold">Vsak {day.label.toLowerCase()} ob {slot.startTime}–{endTime(slot.startTime, slot.durationMin)}</span>
        <SubjectBadge subject={slot.subject} />
        {finished && <span className="rounded-full bg-cancelled-soft px-2 py-0.5 text-xs font-semibold text-cancelled">Zaključena</span>}
      </div>
      <p className="text-sm text-ink-soft tnum">Od {fmtDate(slot.startDate)} do {fmtDate(slot.endDate)}</p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={`end-${slot.id}`} className="text-sm font-medium">Konec serije</label>
          <input id={`end-${slot.id}`} type="date" value={end} min={slot.startDate} onChange={(e) => setEnd(e.target.value)} className={`${inputClass} !w-auto`} />
        </div>
        <Button variant="secondary" disabled={busy || end === slot.endDate || !end} onClick={() => void apply(end)}>
          {end > slot.endDate ? "Podaljšaj" : "Spremeni konec"}
        </Button>
        {!finished && (
          <Button variant="ghost" disabled={busy} onClick={() => void apply(addDaysIso(today, -1))}>
            Končaj od danes
          </Button>
        )}
      </div>
    </li>
  );
}
