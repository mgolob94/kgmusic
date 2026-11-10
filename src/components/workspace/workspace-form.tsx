"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createWorkspace, updateWorkspace } from "@/app/actions/workspace";
import { Button } from "@/components/ui/button";
import { Field, FormError, inputClass } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { workspaceSchema, type WorkspaceInput } from "@/lib/schemas";

/** Barve šol – samo oznaka (pika, rob); besedilo ne temelji na njih. */
export const WORKSPACE_COLORS = ["#1d5b63", "#a04268", "#2a5688", "#8a6200", "#4d7c0f", "#b4532a"];

export function WorkspaceForm({ workspace }: { workspace?: { id: string; name: string; color: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<WorkspaceInput>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: workspace?.name ?? "", color: workspace?.color ?? WORKSPACE_COLORS[0] },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const r = workspace ? await updateWorkspace(workspace.id, values) : await createWorkspace(values);
    if (!r.ok) {
      for (const [k, m] of Object.entries(r.fieldErrors ?? {})) setError(k as keyof WorkspaceInput, { message: m });
      return setFormError(r.error);
    }
    if (workspace) return toast({ message: "Spremembe so shranjene." });
    router.push(`/w/${(r.data as { id: string }).id}`);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 rounded-2xl bg-surface p-5 shadow-soft">
      <Field label="Ime šole" htmlFor="ws-name" error={errors.name?.message}>
        <input id="ws-name" autoComplete="off" placeholder="Glasbena šola …" className={inputClass} aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Barva oznake</legend>
        <div className="flex flex-wrap gap-2">
          {WORKSPACE_COLORS.map((c) => (
            <label
              key={c}
              className="relative grid size-11 cursor-pointer place-items-center rounded-full border-2 border-transparent has-[:checked]:border-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
            >
              <input type="radio" value={c} className="sr-only" aria-label={`Barva ${c}`} {...register("color")} />
              <span className="size-7 rounded-full" style={{ background: c }} />
            </label>
          ))}
        </div>
      </fieldset>
      <FormError message={formError} />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Shranjujem …" : workspace ? "Shrani" : "Ustvari šolo"}
      </Button>
    </form>
  );
}
