"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, ArchiveRestore, CalendarPlus, Pencil, Trash2, UserPlus } from "lucide-react";
import { deleteStudent, setStudentActive } from "@/app/actions/student";
import { Button } from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import type { Student } from "@/db/schema";

export function NewStudentButton() {
  const { openStudentForm } = useWorkspace();
  return (
    <Button onClick={() => openStudentForm()}>
      <UserPlus className="size-4" aria-hidden /> Nov učenec
    </Button>
  );
}

export function StudentActions({ student }: { student: Student }) {
  const { workspace, openStudentForm, openNewSlot } = useWorkspace();
  const toast = useToast();

  async function archive(active: boolean) {
    const r = await setStudentActive(workspace.id, student.id, active);
    if (!r.ok) return toast({ message: r.error, tone: "error" });
    toast({
      message: active ? "Učenec je spet aktiven." : "Učenec je arhiviran.",
      action: { label: "Razveljavi", onClick: async () => { await setStudentActive(workspace.id, student.id, !active); } },
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {student.active && (
        <Button onClick={() => openNewSlot({ studentId: student.id })}>
          <CalendarPlus className="size-4" aria-hidden /> Tedenski termin
        </Button>
      )}
      <Button variant="secondary" onClick={() => openStudentForm(student)}>
        <Pencil className="size-4" aria-hidden /> Uredi
      </Button>
      {student.active ? (
        <Button variant="ghost" onClick={() => void archive(false)}>
          <Archive className="size-4" aria-hidden /> Arhiviraj
        </Button>
      ) : (
        <Button variant="secondary" onClick={() => void archive(true)}>
          <ArchiveRestore className="size-4" aria-hidden /> Obnovi
        </Button>
      )}
    </div>
  );
}

/** Trajen izbris (GDPR): zahteva vpis polnega imena, ker ga ni mogoče razveljaviti. */
export function DeleteStudent({ student }: { student: Student }) {
  const { workspace } = useWorkspace();
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const full = `${student.firstName} ${student.lastName}`;

  return (
    <details className="rounded-2xl border border-unexcused/30 bg-surface p-4">
      <summary className="min-h-11 cursor-pointer py-2 font-medium text-unexcused">Trajno izbriši učenca</summary>
      <div className="mt-2 flex flex-col gap-3">
        <p className="text-sm text-ink-soft">
          Izbrišejo se osebni podatki, serije in vse zabeležene ure. Tega ni mogoče razveljaviti. Če učenca le ne poučujete več, ga raje arhivirajte.
        </p>
        <Field label={`Za potrditev vpišite »${full}«`} htmlFor="del-name">
          <input id="del-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" className={inputClass} />
        </Field>
        <Button
          variant="danger"
          disabled={busy || name.trim() !== full}
          onClick={async () => {
            setBusy(true);
            const r = await deleteStudent(workspace.id, student.id, name);
            setBusy(false);
            if (!r.ok) return toast({ message: r.error, tone: "error" });
            toast({ message: `${full} je izbrisan.` });
            router.push(`/w/${workspace.id}/ucenci`);
          }}
        >
          <Trash2 className="size-4" aria-hidden /> Izbriši trajno
        </Button>
      </div>
    </details>
  );
}
