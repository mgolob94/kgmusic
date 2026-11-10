import type { ReactNode } from "react";

export const inputClass =
  "w-full min-h-11 rounded-xl border border-line-strong bg-surface px-3.5 text-[1rem] text-ink " +
  "placeholder:text-ink-faint transition-colors focus-visible:border-primary aria-[invalid=true]:border-unexcused";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-ink-faint">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-unexcused">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-unexcused/30 bg-unexcused-soft px-3.5 py-2.5 text-sm text-unexcused">
      {message}
    </p>
  );
}
