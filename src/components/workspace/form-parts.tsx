"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
import { Mic, Piano } from "lucide-react";
import { Field, inputClass } from "@/components/ui/field";
import { SUBJECT_LABEL, SUBJECTS } from "@/lib/status";

const ICON = { klavir: Piano, petje: Mic } as const;

export function SubjectPicker({ register, error }: { register: UseFormRegisterReturn; error?: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">Predmet</legend>
      <div className="grid grid-cols-2 gap-2">
        {SUBJECTS.map((s) => {
          const Icon = ICON[s];
          return (
            <label
              key={s}
              className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-3 font-medium
                         has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary
                         has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
            >
              <input type="radio" value={s} className="sr-only" {...register} />
              <Icon className="size-4" aria-hidden />
              {SUBJECT_LABEL[s]}
            </label>
          );
        })}
      </div>
      {error && <p role="alert" className="mt-1.5 text-sm text-unexcused">{error}</p>}
    </fieldset>
  );
}

const DURATIONS = [30, 45, 60, 90];

export function DurationField({
  id,
  register,
  value,
  onPick,
  error,
}: {
  id: string;
  register: UseFormRegisterReturn;
  value: number;
  onPick: (n: number) => void;
  error?: string;
}) {
  return (
    <Field label="Trajanje (minute)" htmlFor={id} error={error}>
      <div className="flex flex-wrap items-center gap-2">
        {DURATIONS.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={value === d}
            onClick={() => onPick(d)}
            className={`min-h-11 min-w-14 rounded-xl border px-3 text-sm font-medium transition-colors ${
              value === d ? "border-primary bg-primary-soft text-primary" : "border-line-strong bg-surface hover:bg-sunken"
            }`}
          >
            {d}
          </button>
        ))}
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={10}
          max={240}
          step={5}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClass} !w-24`}
          {...register}
        />
      </div>
    </Field>
  );
}
