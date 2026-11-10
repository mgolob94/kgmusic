"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Phone, Search, ShieldAlert, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export type StudentRow = {
  id: string;
  name: string;
  birthYear: number | null;
  parentName: string | null;
  parentPhone: string | null;
  phone: string | null;
  gdpr: boolean;
  active: boolean;
  slots: string[];
};

export function StudentList({ rows, showArchived }: { rows: StudentRow[]; showArchived: boolean }) {
  const { workspace, openStudentForm } = useWorkspace();
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? rows.filter((r) => r.name.toLowerCase().includes(s)) : rows;
  }, [rows, q]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Users className="size-6" aria-hidden />}
        title={showArchived ? "Ni arhiviranih učencev" : "Še ni učencev"}
        action={!showArchived ? <Button onClick={() => openStudentForm()}><UserPlus className="size-4" aria-hidden /> Dodaj prvega učenca</Button> : undefined}
      >
        {showArchived ? "Arhivirani učenci se pokažejo tukaj." : "Dodajte učenca, nato mu določite tedenski termin."}
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
        <label htmlFor="student-search" className="sr-only">Poišči učenca</label>
        <input id="student-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Poišči po imenu" className={`${inputClass} pl-10`} />
      </div>
      {filtered.length === 0 ? (
        <p className="py-6 text-ink-soft">Noben učenec ne ustreza iskanju »{q}«.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface shadow-soft">
          {filtered.map((r) => (
            <li key={r.id} className="relative flex items-stretch hover:bg-sunken/60">
              <Link href={`/w/${workspace.id}/ucenci/${r.id}`} className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3.5">
                <span className="flex flex-wrap items-center gap-x-2">
                  <span className="font-semibold">{r.name}</span>
                  {r.birthYear && <span className="text-sm text-ink-faint tnum">r. {r.birthYear}</span>}
                  {!r.active && <span className="rounded-full bg-cancelled-soft px-2 py-0.5 text-xs font-semibold text-cancelled">Arhiviran</span>}
                </span>
                <span className="text-sm text-ink-soft">
                  {r.slots.length ? r.slots.join(" · ") : "Brez tedenskega termina"}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${r.gdpr ? "text-attended" : "text-excused"}`}>
                  {r.gdpr ? <ShieldCheck className="size-3.5" aria-hidden /> : <ShieldAlert className="size-3.5" aria-hidden />}
                  {r.gdpr ? "GDPR privolitev podana" : "Manjka GDPR privolitev"}
                </span>
              </Link>
              {(r.parentPhone || r.phone) && (
                <a
                  href={`tel:${(r.parentPhone ?? r.phone)!.replace(/\s/g, "")}`}
                  aria-label={`Pokliči ${r.parentName ?? r.name}`}
                  className="grid w-14 shrink-0 place-items-center text-primary hover:bg-primary-soft"
                >
                  <Phone className="size-5" aria-hidden />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
