"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, Pencil, Repeat, Trash2 } from "lucide-react";
import { createLesson, deleteLesson, setLessonNote, updateLesson } from "@/app/actions/lesson";
import { Button } from "@/components/ui/button";
import { StatusBadge, STATUS_ICON, STATUS_TONE, SubjectBadge } from "@/components/ui/badges";
import { Field, FormError, inputClass } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { endTime, fmtDayLong, todayIso } from "@/lib/date";
import { lessonCreateSchema, lessonEditSchema, type LessonCreateInput, type LessonEditInput } from "@/lib/schemas";
import { STATUS_META, subjectOf, type LessonStatus } from "@/lib/status";
import type { Conflict, LessonView } from "@/lib/types";
import { ConflictNotice } from "./conflict-notice";
import { DurationField, SubjectPicker } from "./form-parts";
import { useSetStatus } from "./use-lesson-actions";
import { useWorkspace } from "./workspace-provider";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
} & (
  | { mode: "view"; lesson: LessonView; defaults?: undefined }
  | { mode: "new"; defaults: { date?: string; startTime?: string; studentId?: string }; lesson?: undefined }
);

export function LessonSheet(props: Props) {
  const { open, onOpenChange } = props;
  const [cur, setCur] = useState<LessonView | null>(props.mode === "view" ? props.lesson : null);

  if (props.mode === "new") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} title="Nova enkratna ura" description="Nadomestna ali dodatna ura izven tedenskega urnika">
        <NewLessonForm defaults={props.defaults} onDone={() => onOpenChange(false)} />
      </Sheet>
    );
  }
  const lesson = cur!;
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={lesson.studentName}
      description={`${fmtDayLong(lesson.date)} · ${lesson.startTime}–${endTime(lesson.startTime, lesson.durationMin)}`}
    >
      <LessonBody lesson={lesson} setLesson={setCur} onClose={() => onOpenChange(false)} />
    </Sheet>
  );
}

const MARKS: LessonStatus[] = ["attended", "absent_excused", "absent_unexcused", "cancelled"];

function LessonBody({
  lesson,
  setLesson,
  onClose,
}: {
  lesson: LessonView;
  setLesson: (l: LessonView) => void;
  onClose: () => void;
}) {
  const { workspace } = useWorkspace();
  const toast = useToast();
  const setStatus = useSetStatus();
  const [note, setNote] = useState(lesson.note ?? "");
  const [savingNote, setSavingNote] = useState(false);
  const [editing, setEditing] = useState(false);
  const [conflicts, setConflicts] = useState<{ list: Conflict[]; total: number } | null>(null);

  const mark = (s: LessonStatus) =>
    setStatus(lesson.id, s, (applied) => setLesson({ ...lesson, status: applied }));

  async function saveNote() {
    setSavingNote(true);
    const r = await setLessonNote(workspace.id, lesson.id, note);
    setSavingNote(false);
    if (!r.ok) return toast({ message: r.error, tone: "error" });
    setLesson({ ...lesson, note: note.trim() || null });
    toast({ message: "Opomba je shranjena." });
  }

  async function remove() {
    const r = await deleteLesson(workspace.id, lesson.id);
    if (!r.ok) return toast({ message: r.error, tone: "error" });
    const s = r.data.snapshot;
    onClose();
    toast({
      message: "Ura je izbrisana.",
      action: {
        label: "Razveljavi",
        onClick: async () => {
          const u = await createLesson(workspace.id, {
            studentId: s.studentId, date: s.date, startTime: s.startTime,
            durationMin: s.durationMin, subject: subjectOf(s.subject) ?? "klavir",
          });
          if (!u.ok) toast({ message: u.error, tone: "error" });
        },
      },
    });
  }

  const dirtyNote = note.trim() !== (lesson.note ?? "");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <SubjectBadge subject={lesson.subject} />
        <StatusBadge status={lesson.status} />
        <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
          {lesson.slotId ? (<><Repeat className="size-3.5" aria-hidden /> Tedenski termin</>) : "Enkratna ura"}
        </span>
      </div>

      <section aria-labelledby="mark-h">
        <h3 id="mark-h" className="mb-2 text-sm font-medium">Kaj se je zgodilo?</h3>
        <div className="grid grid-cols-2 gap-2">
          {MARKS.map((s) => {
            const Icon = STATUS_ICON[s];
            const active = lesson.status === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => void mark(s)}
                className={`flex min-h-14 flex-col items-start justify-center gap-0.5 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors ${
                  active ? `${STATUS_TONE[s]} border-current` : "border-line-strong bg-surface hover:bg-sunken"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {STATUS_META[s].label}
              </button>
            );
          })}
        </div>
        {lesson.status !== "planned" && (
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => void mark("planned")}>
            Vrni med načrtovane
          </Button>
        )}
      </section>

      <section>
        <Field label="Opomba k uri" htmlFor="lesson-note" hint="Npr. kaj ste vadili ali kaj naj učenec ponovi.">
          <textarea
            id="lesson-note"
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${inputClass} py-2.5`}
          />
        </Field>
        {dirtyNote && (
          <Button size="sm" className="mt-2" onClick={() => void saveNote()} disabled={savingNote}>
            {savingNote ? "Shranjujem …" : "Shrani opombo"}
          </Button>
        )}
      </section>

      {conflicts && <ConflictNotice conflicts={conflicts.list} total={conflicts.total} />}

      {editing ? (
        <EditLessonForm
          lesson={lesson}
          onCancel={() => setEditing(false)}
          onSaved={(l, c) => {
            setLesson(l);
            setConflicts(c.total ? c : null);
            setEditing(false);
          }}
        />
      ) : (
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="size-4" aria-hidden /> Premakni ali uredi
          </Button>
          <Link
            href={`/w/${workspace.id}/ucenci/${lesson.studentId}`}
            onClick={onClose}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 font-medium text-primary hover:bg-primary-soft"
          >
            Profil učenca <ArrowUpRight className="size-4" aria-hidden />
          </Link>
          {!lesson.slotId && (
            <Button variant="ghost" onClick={() => void remove()} className="text-unexcused">
              <Trash2 className="size-4" aria-hidden /> Izbriši
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function EditLessonForm({
  lesson,
  onCancel,
  onSaved,
}: {
  lesson: LessonView;
  onCancel: () => void;
  onSaved: (l: LessonView, c: { list: Conflict[]; total: number }) => void;
}) {
  const { workspace } = useWorkspace();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, setError, formState: { errors, isSubmitting } } = useForm<LessonEditInput>({
    resolver: zodResolver(lessonEditSchema),
    defaultValues: {
      date: lesson.date, startTime: lesson.startTime, durationMin: lesson.durationMin,
      subject: subjectOf(lesson.subject) ?? "klavir",
    },
  });
  const duration = Number(watch("durationMin"));

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const r = await updateLesson(workspace.id, lesson.id, values);
    if (!r.ok) {
      for (const [k, m] of Object.entries(r.fieldErrors ?? {})) setError(k as keyof LessonEditInput, { message: m });
      return setFormError(r.error);
    }
    const prev = r.data.previous;
    onSaved({ ...lesson, ...values }, { list: r.data.conflicts, total: r.data.conflictCount });
    toast({
      message: "Ura je spremenjena.",
      action: {
        label: "Razveljavi",
        onClick: async () => {
          const u = await updateLesson(workspace.id, lesson.id, prev);
          if (!u.ok) toast({ message: u.error, tone: "error" });
        },
      },
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-4">
      <h3 className="font-display text-base">Premik te ure</h3>
      <p className="-mt-2 text-sm text-ink-soft">Spremeni samo to uro. Ostali termini v seriji ostanejo.</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Datum" htmlFor="e-date" error={errors.date?.message}>
          <input id="e-date" type="date" className={inputClass} {...register("date")} />
        </Field>
        <Field label="Ura začetka" htmlFor="e-time" error={errors.startTime?.message}>
          <input id="e-time" type="time" step={300} className={inputClass} {...register("startTime")} />
        </Field>
      </div>
      <DurationField
        id="e-dur"
        register={register("durationMin", { valueAsNumber: true })}
        value={duration}
        onPick={(n) => setValue("durationMin", n, { shouldValidate: true })}
        error={errors.durationMin?.message}
      />
      <SubjectPicker register={register("subject")} error={errors.subject?.message} />
      <FormError message={formError} />
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting ? "Shranjujem …" : "Shrani"}</Button>
        <Button variant="secondary" onClick={onCancel}>Prekliči</Button>
      </div>
    </form>
  );
}

function NewLessonForm({
  defaults,
  onDone,
}: {
  defaults: { date?: string; startTime?: string; studentId?: string };
  onDone: () => void;
}) {
  const { workspace, students, openStudentForm } = useWorkspace();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, setError, formState: { errors, isSubmitting } } = useForm<LessonCreateInput>({
    resolver: zodResolver(lessonCreateSchema),
    defaultValues: {
      studentId: defaults.studentId ?? "",
      date: defaults.date ?? todayIso(),
      startTime: defaults.startTime ?? "15:00",
      durationMin: 45,
      subject: "klavir",
    },
  });
  const duration = Number(watch("durationMin"));

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const r = await createLesson(workspace.id, values);
    if (!r.ok) {
      for (const [k, m] of Object.entries(r.fieldErrors ?? {})) setError(k as keyof LessonCreateInput, { message: m });
      return setFormError(r.error);
    }
    onDone();
    toast({
      message: r.data.conflictCount ? "Ura je dodana, a se prekriva z drugo uro." : "Ura je dodana.",
      tone: r.data.conflictCount ? "error" : "success",
    });
  });

  if (students.length === 0) {
    return <Button onClick={() => { onDone(); openStudentForm(); }}>Najprej dodaj učenca</Button>;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Učenec" htmlFor="n-student" error={errors.studentId?.message}>
        <select id="n-student" className={inputClass} {...register("studentId")}>
          <option value="">Izberite …</option>
          {students.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
      </Field>
      <SubjectPicker register={register("subject")} error={errors.subject?.message} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Datum" htmlFor="n-date" error={errors.date?.message}>
          <input id="n-date" type="date" className={inputClass} {...register("date")} />
        </Field>
        <Field label="Ura začetka" htmlFor="n-time" error={errors.startTime?.message}>
          <input id="n-time" type="time" step={300} className={inputClass} {...register("startTime")} />
        </Field>
      </div>
      <DurationField
        id="n-dur"
        register={register("durationMin", { valueAsNumber: true })}
        value={duration}
        onPick={(n) => setValue("durationMin", n, { shouldValidate: true })}
        error={errors.durationMin?.message}
      />
      <FormError message={formError} />
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Dodajam …" : "Dodaj uro"}</Button>
    </form>
  );
}
