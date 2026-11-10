"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createStudent, updateStudent } from "@/app/actions/student";
import { Button } from "@/components/ui/button";
import { Field, FormError, inputClass } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import type { Student } from "@/db/schema";
import { fmtDate } from "@/lib/date";
import { studentSchema, type StudentInput } from "@/lib/schemas";
import { useWorkspace } from "./workspace-provider";

export function StudentSheet({
  open,
  onOpenChange,
  student,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  student?: Student;
}) {
  const { workspace, openNewSlot } = useWorkspace();
  const toast = useToast();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: student?.firstName ?? "",
      lastName: student?.lastName ?? "",
      birthYear: student?.birthYear ? String(student.birthYear) : "",
      phone: student?.phone ?? "",
      parentName: student?.parentName ?? "",
      parentPhone: student?.parentPhone ?? "",
      parentEmail: student?.parentEmail ?? "",
      notes: student?.notes ?? "",
      gdprConsent: student?.gdprConsent ?? false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const r = student
      ? await updateStudent(workspace.id, student.id, values)
      : await createStudent(workspace.id, values);
    if (!r.ok) {
      for (const [k, msg] of Object.entries(r.fieldErrors ?? {})) setError(k as keyof StudentInput, { message: msg });
      setFormError(r.error);
      return;
    }
    onOpenChange(false);
    if (student) {
      toast({ message: "Podatki učenca so shranjeni." });
      return;
    }
    const id = (r.data as { id: string }).id;
    toast({
      message: `Učenec ${values.firstName} ${values.lastName} je dodan.`,
      action: { label: "Dodaj termin", onClick: () => openNewSlot({ studentId: id }) },
    });
    router.push(`/w/${workspace.id}/ucenci/${id}`);
  });

  const err = (k: keyof StudentInput) => errors[k]?.message as string | undefined;
  const a11y = (k: keyof StudentInput) => ({
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `${k}-error` : undefined,
  });

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={student ? "Uredi učenca" : "Nov učenec"}
      description={workspace.name}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ime" htmlFor="firstName" error={err("firstName")}>
            <input id="firstName" autoComplete="off" className={inputClass} {...a11y("firstName")} {...register("firstName")} />
          </Field>
          <Field label="Priimek" htmlFor="lastName" error={err("lastName")}>
            <input id="lastName" autoComplete="off" className={inputClass} {...a11y("lastName")} {...register("lastName")} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Letnica rojstva" htmlFor="birthYear" error={err("birthYear")}>
            <input id="birthYear" inputMode="numeric" maxLength={4} placeholder="2014" className={inputClass} {...a11y("birthYear")} {...register("birthYear")} />
          </Field>
          <Field label="Telefon učenca" htmlFor="phone" error={err("phone")}>
            <input id="phone" type="tel" autoComplete="off" className={inputClass} {...a11y("phone")} {...register("phone")} />
          </Field>
        </div>

        <div className="rounded-2xl border border-line bg-paper p-4">
          <h3 className="mb-3 font-display text-base">Kontakt staršev ali skrbnika</h3>
          <div className="flex flex-col gap-3">
            <Field label="Ime in priimek" htmlFor="parentName" error={err("parentName")}>
              <input id="parentName" autoComplete="off" className={inputClass} {...a11y("parentName")} {...register("parentName")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefon" htmlFor="parentPhone" error={err("parentPhone")}>
                <input id="parentPhone" type="tel" autoComplete="off" className={inputClass} {...a11y("parentPhone")} {...register("parentPhone")} />
              </Field>
              <Field label="E-naslov" htmlFor="parentEmail" error={err("parentEmail")}>
                <input id="parentEmail" type="email" autoComplete="off" className={inputClass} {...a11y("parentEmail")} {...register("parentEmail")} />
              </Field>
            </div>
          </div>
        </div>

        <Field label="Opombe" htmlFor="notes" error={err("notes")}>
          <textarea id="notes" rows={3} className={`${inputClass} py-2.5`} {...a11y("notes")} {...register("notes")} />
        </Field>

        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-line-strong bg-surface p-3.5">
          <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]" {...register("gdprConsent")} />
          <span className="text-sm">
            <span className="font-medium">Privolitev za obdelavo osebnih podatkov (GDPR)</span>
            <span className="block text-ink-soft">
              {student?.gdprConsent && student.gdprConsentDate
                ? `Privolitev podana ${fmtDate(student.gdprConsentDate)}.`
                : "Pri mladoletnih učencih jo poda starš ali skrbnik. Datum se zabeleži ob prvem shranjevanju."}
            </span>
          </span>
        </label>

        <FormError message={formError} />
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Shranjujem …" : "Shrani"}
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Prekliči
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
