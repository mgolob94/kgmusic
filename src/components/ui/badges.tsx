import { Ban, CircleCheck, CircleMinus, CircleX, Clock, Mic, Piano, type LucideIcon } from "lucide-react";
import { STATUS_META, SUBJECT_LABEL, subjectOf, type LessonStatus } from "@/lib/status";

export const STATUS_ICON: Record<LessonStatus, LucideIcon> = {
  planned: Clock,
  attended: CircleCheck,
  absent_excused: CircleMinus,
  absent_unexcused: CircleX,
  cancelled: Ban,
};

export const STATUS_TONE: Record<LessonStatus, string> = {
  planned: "bg-sunken text-ink-soft",
  attended: "bg-attended-soft text-attended",
  absent_excused: "bg-excused-soft text-excused",
  absent_unexcused: "bg-unexcused-soft text-unexcused",
  cancelled: "bg-cancelled-soft text-cancelled",
};

export function StatusBadge({ status, short = false }: { status: LessonStatus; short?: boolean }) {
  const Icon = STATUS_ICON[status];
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[status]}`}>
      <Icon className="size-3.5" aria-hidden />
      {short ? meta.short : meta.label}
    </span>
  );
}

export const SUBJECT_TONE = { klavir: "bg-klavir-soft text-klavir", petje: "bg-petje-soft text-petje" } as const;
export const SUBJECT_ICON = { klavir: Piano, petje: Mic } as const;

export function SubjectBadge({ subject }: { subject: string | null }) {
  const s = subjectOf(subject);
  if (!s) return null;
  const Icon = SUBJECT_ICON[s];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${SUBJECT_TONE[s]}`}>
      <Icon className="size-3.5" aria-hidden />
      {SUBJECT_LABEL[s]}
    </span>
  );
}
