"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addMonths, endOfMonth, format } from "date-fns";
import { CalendarPlus, TriangleAlert, UserPlus } from "lucide-react";
import { createSlot } from "@/app/actions/lesson";
import { Button } from "@/components/ui/button";
import { Field, FormError, inputClass } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { endTime, fmtDate, isoWeekday, seasonDefaults, todayIso, toDate, toIso, WEEKDAYS } from "@/lib/date";
import { seriesDates } from "@/lib/recurrence";
import { slotSchema, type SlotInput } from "@/lib/schemas";
import type { Conflict } from "@/lib/types";
import { DurationField, SubjectPicker } from "./form-parts";
import { ConflictNotice } from "./conflict-notice";
import { useWorkspace } from "./workspace-provider";

type Result = { created: number; skippedHolidays: number; conflicts: Conflict[]; conflictCount: number };

export function SlotSheet({
  open,
  onOpenChange,
  studentId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  studentId?: string;
}) {
  const { workspace, students, openStudentForm } = useWorkspace();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const season = useMemo(
    () => seasonDefaults(todayIso(), workspace.seasonStartMonth, workspace.seasonEndMonth),
    [workspace.seasonStartMonth, workspace.seasonEndMonth],
  );
  const extendedEnd = useMemo(() => toIso(endOfMonth(addMonths(toDate(season.end), 2))), [season.end]);

  const {
    register, handleSubmit, setError, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<SlotInput>({
    resolver: zodResolver(slotSchema),
    defaultValues: {
      studentId: studentId ?? "",
      subject: "klavir",
      weekday: isoWeekday(season.start),
      startTime: "15:00",
      durationMin: 45,
      startDate: season.start,
      endDate: season.end,
      skipHolidays: true,
    },
  });
  const v = watch();

  const preview = useMemo(() => {
    const okDates = /^\d{4}-\d{2}-\d{2}$/.test(v.startDate) && /^\d{4}-\d{2}-\d{2}$/.test(v.endDate);
    if (!okDates || !/^\d{2}:\d{2}$/.test(v.startTime) || !(v.durationMin > 0)) return null;
    const { dates, skippedHolidays } = seriesDates({
      weekday: Number(v.weekday), startDate: v.startDate, endDate: v.endDate, skipHolidays: v.skipHolidays,
    });
    return { n: dates.length, skipped: skippedHolidays.length, first: dates[0], last: dates.at(-1) };
  }, [v.weekday, v.startDate, v.endDate, v.skipHolidays, v.startTime, v.durationMin]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const r = await createSlot(workspace.id, values);
    if (!r.ok) {
      for (const [k, msg] of Object.entries(r.fieldErrors ?? {})) setError(k as keyof SlotInput, { message: msg });
      setFormError(r.error);
      return;
    }
    toast({ message: `Ustvarjenih ${r.data.created} terminov.` });
    if (r.data.conflictCount > 0) setResult(r.data);
    else onOpenChange(false);
  });

  const err = (k: keyof SlotInput) => errors[k]?.message as string | undefined;
  const weekday = WEEKDAYS.find((d) => d.value === Number(v.weekday));

  if (students.length === 0) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} title="Nov tedenski termin" description={workspace.name}>
        <EmptyState
          icon={<UserPlus className="size-6" aria-hidden />}
          title="Najprej dodajte učenca"
          action={<Button onClick={() => openStudentForm()}>Dodaj učenca</Button>}
        >
          Tedenski termin je vedno vezan na učenca.
        </EmptyState>
      </Sheet>
    );
  }

  if (result) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} title="Termini so ustvarjeni" description={workspace.name}>
        <div className="flex flex-col gap-4">
          <p>
            Ustvarjenih je <strong>{result.created}</strong> terminov.
          </p>
          <ConflictNotice conflicts={result.conflicts} total={result.conflictCount} />
          <Button onClick={() => onOpenChange(false)}>Končano</Button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Nov tedenski termin" description={workspace.name}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Učenec" htmlFor="studentId" error={err("studentId")}>
          <select id="studentId" className={inputClass} aria-invalid={!!errors.studentId} {...register("studentId")}>
            <option value="">Izberite …</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>

        <SubjectPicker register={register("subject")} error={err("subject")} />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Dan v tednu" htmlFor="weekday" error={err("weekday")}>
            <select id="weekday" className={inputClass} {...register("weekday", { valueAsNumber: true })}>
              {WEEKDAYS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Ura začetka" htmlFor="startTime" error={err("startTime")}>
            <input id="startTime" type="time" step={300} className={inputClass} aria-invalid={!!errors.startTime} {...register("startTime")} />
          </Field>
        </div>

        <DurationField
          id="durationMin"
          register={register("durationMin", { valueAsNumber: true })}
          value={Number(v.durationMin)}
          onPick={(n) => setValue("durationMin", n, { shouldValidate: true })}
          error={err("durationMin")}
        />

        <div className="rounded-2xl border border-line bg-paper p-4">
          <h3 className="mb-3 font-display text-base">Obdobje ponavljanja</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Od" htmlFor="startDate" error={err("startDate")}>
              <input id="startDate" type="date" className={inputClass} aria-invalid={!!errors.startDate} {...register("startDate")} />
            </Field>
            <Field label="Do" htmlFor="endDate" error={err("endDate")}>
              <input id="endDate" type="date" className={inputClass} aria-invalid={!!errors.endDate} {...register("endDate")} />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[season.end, extendedEnd].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setValue("endDate", d, { shouldValidate: true })}
                className="min-h-9 rounded-full border border-line-strong bg-surface px-3 text-sm hover:bg-sunken"
              >
                Do {format(toDate(d), "d. M.")}
              </button>
            ))}
          </div>
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" className="size-5 accent-[var(--primary)]" {...register("skipHolidays")} />
            Preskoči državne praznike
          </label>
        </div>

        {preview && preview.n > 0 && weekday && (
          <p className="flex items-start gap-2 rounded-xl bg-primary-soft px-3.5 py-3 text-sm text-ink" aria-live="polite">
            <CalendarPlus className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              Vsak {weekday.label.toLowerCase()} ob {v.startTime}–{endTime(v.startTime, Number(v.durationMin))}:{" "}
              <strong>{preview.n} terminov</strong> od {fmtDate(preview.first)} do {fmtDate(preview.last!)}.
              {preview.skipped > 0 && ` Preskočenih praznikov: ${preview.skipped}.`}
            </span>
          </p>
        )}
        {preview && preview.n === 0 && (
          <p className="flex items-start gap-2 rounded-xl bg-excused-soft px-3.5 py-3 text-sm text-excused">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            V izbranem obdobju ni nobenega termina.
          </p>
        )}

        <FormError message={formError} />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Ustvarjam termine …" : "Ustvari termine"}
        </Button>
      </form>
    </Sheet>
  );
}
