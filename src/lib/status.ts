export const STATUSES = ["planned", "attended", "absent_excused", "absent_unexcused", "cancelled"] as const;
export type LessonStatus = (typeof STATUSES)[number];

export const STATUS_META: Record<LessonStatus, { label: string; short: string; done: string }> = {
  planned: { label: "Načrtovano", short: "Načrtovano", done: "Vrnjeno med načrtovane" },
  attended: { label: "Opravljeno", short: "Prisoten", done: "Označeno kot opravljeno" },
  absent_excused: { label: "Opravičen izostanek", short: "Opravičen", done: "Označeno kot opravičen izostanek" },
  absent_unexcused: { label: "Neopravičen izostanek", short: "Neopravičen", done: "Označeno kot neopravičen izostanek" },
  cancelled: { label: "Odpadlo", short: "Odpadlo", done: "Ura je odpadla" },
};

export const SUBJECTS = ["klavir", "petje"] as const;
export type Subject = (typeof SUBJECTS)[number];
export const SUBJECT_LABEL: Record<Subject, string> = { klavir: "Klavir", petje: "Petje" };

export const subjectOf = (s: string | null | undefined): Subject | null =>
  s === "klavir" || s === "petje" ? s : null;

/** Ura, ki je bila (že) izvedena in jo je treba potrditi. */
export const needsConfirmation = (status: LessonStatus) => status === "planned";
