import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, Phone, ShieldAlert, ShieldCheck } from "lucide-react";
import { DeleteStudent, StudentActions } from "@/components/students/student-actions";
import { SlotRow } from "@/components/students/slot-row";
import { StatusBadge, STATUS_ICON, STATUS_TONE } from "@/components/ui/badges";
import { EmptyState } from "@/components/ui/states";
import {
  getStudent, getWorkspace, recentLessonsForStudent, slotsForStudent, statusCounts,
} from "@/db/queries";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtDuration, todayIso, fmtDayShort } from "@/lib/date";
import { STATUS_META, SUBJECT_LABEL, subjectOf } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function StudentPage({ params }: { params: Promise<{ wid: string; sid: string }> }) {
  const { wid, sid } = await params;
  const user = await requireUser();
  const ws = await getWorkspace(user.id, wid);
  if (!ws) notFound();
  const student = await getStudent(ws.id, sid);
  if (!student) notFound();

  const today = todayIso();
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7));
  const seasonYear = m >= ws.seasonStartMonth ? y : y - 1;
  const seasonFrom = `${seasonYear}-${String(ws.seasonStartMonth).padStart(2, "0")}-01`;

  const [slots, counts, recent] = await Promise.all([
    slotsForStudent(student.id),
    statusCounts(ws.id, seasonFrom, today, student.id),
    recentLessonsForStudent(student.id, today),
  ]);
  const full = `${student.firstName} ${student.lastName}`;
  const summary = (["attended", "absent_excused", "absent_unexcused", "cancelled"] as const).map((s) => ({ s, n: counts[s] }));

  return (
    <div className="flex flex-col gap-5">
      <Link href={`/w/${ws.id}/ucenci`} className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1 rounded-xl px-2 text-sm font-medium text-ink-soft hover:bg-sunken">
        <ChevronLeft className="size-4" aria-hidden /> Vsi učenci
      </Link>

      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl">{full}</h1>
          <p className="text-ink-soft">
            {student.birthYear ? `Letnik ${student.birthYear}` : "Letnica ni vpisana"}
            {!student.active && " · Arhiviran"}
          </p>
        </div>
        <StudentActions student={student} />
      </header>

      {!student.active && (
        <p className="rounded-xl bg-cancelled-soft px-4 py-3 text-sm text-cancelled">
          Učenec je arhiviran. Prihodnje ure ostanejo v koledarju, dokler ne skrajšate serij.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="contact-h" className="rounded-2xl bg-surface p-5 shadow-soft">
          <h2 id="contact-h" className="mb-3 text-lg">Kontakt</h2>
          <dl className="flex flex-col gap-3 text-[0.9375rem]">
            <Contact label="Učenec" value={student.phone} kind="tel" />
            <div>
              <dt className="text-sm text-ink-soft">Starš ali skrbnik</dt>
              <dd className="font-medium">{student.parentName || <span className="font-normal text-ink-faint">Ni vpisan</span>}</dd>
            </div>
            <Contact label="Telefon staršev" value={student.parentPhone} kind="tel" />
            <Contact label="E-naslov staršev" value={student.parentEmail} kind="mail" />
          </dl>
          <div className={`mt-4 flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm ${student.gdprConsent ? "bg-attended-soft text-attended" : "bg-excused-soft text-excused"}`}>
            {student.gdprConsent ? <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
            <span>
              {student.gdprConsent
                ? `GDPR privolitev podana${student.gdprConsentDate ? ` ${fmtDate(student.gdprConsentDate)}` : ""}.`
                : "GDPR privolitev še ni podana. Označite jo pri urejanju učenca."}
            </span>
          </div>
          {student.notes && <p className="mt-4 whitespace-pre-line text-sm text-ink-soft">{student.notes}</p>}
        </section>

        <section aria-labelledby="stats-h" className="rounded-2xl bg-surface p-5 shadow-soft">
          <h2 id="stats-h" className="text-lg">Od {fmtDate(seasonFrom)} do danes</h2>
          <p className="mb-3 text-sm text-ink-soft">Opravljeno skupaj: {fmtDuration(counts.attendedMinutes)}</p>
          <ul className="grid grid-cols-2 gap-2">
            {summary.map(({ s, n }) => {
              const Icon = STATUS_ICON[s];
              return (
                <li key={s} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${STATUS_TONE[s]}`}>
                  <Icon className="size-5 shrink-0" aria-hidden />
                  <span>
                    <span className="block font-display text-2xl font-semibold leading-none tnum">{n}</span>
                    <span className="text-xs">{STATUS_META[s].label}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section aria-labelledby="slots-h" className="rounded-2xl bg-surface p-5 shadow-soft">
        <h2 id="slots-h" className="mb-3 text-lg">Tedenski termini</h2>
        {slots.length === 0 ? (
          <EmptyState title="Brez tedenskega termina">Dodajte termin, ki se ponavlja vsak teden do konca sezone.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {slots.map((t) => (
              <SlotRow key={t.id} slot={{ id: t.id, weekday: t.weekday, startTime: t.startTime, durationMin: t.durationMin, subject: t.subject, startDate: t.startDate, endDate: t.endDate }} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="recent-h" className="rounded-2xl bg-surface p-5 shadow-soft">
        <h2 id="recent-h" className="mb-3 text-lg">Zadnje ure</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-soft">Še ni preteklih ur.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {recent.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 first:pt-0">
                <Link href={`/w/${ws.id}/koledar?view=day&date=${l.date}`} className="w-28 text-sm tnum text-primary hover:underline">
                  {fmtDayShort(l.date)}
                </Link>
                <span className="text-sm tnum">{l.startTime}</span>
                <span className="text-sm text-ink-soft">{subjectOf(l.subject) ? SUBJECT_LABEL[subjectOf(l.subject)!] : ""}</span>
                <span className="ml-auto"><StatusBadge status={l.status} short /></span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DeleteStudent student={student} />
    </div>
  );
}

function Contact({ label, value, kind }: { label: string; value: string | null; kind: "tel" | "mail" }) {
  const Icon = kind === "tel" ? Phone : Mail;
  return (
    <div>
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd>
        {value ? (
          <a href={kind === "tel" ? `tel:${value.replace(/\s/g, "")}` : `mailto:${value}`} className="inline-flex min-h-11 items-center gap-2 font-medium text-primary hover:underline">
            <Icon className="size-4" aria-hidden /> {value}
          </a>
        ) : (
          <span className="text-ink-faint">Ni vpisan</span>
        )}
      </dd>
    </div>
  );
}
