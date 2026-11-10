import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center">
      {icon && <div className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">{icon}</div>}
      <h3 className="font-display text-lg">{title}</h3>
      {children && <p className="max-w-sm text-sm text-ink-soft">{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title = "Nalaganje ni uspelo", message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-unexcused/30 bg-unexcused-soft px-6 py-10 text-center">
      <TriangleAlert className="size-8 text-unexcused" aria-hidden />
      <h3 className="font-display text-lg text-ink">{title}</h3>
      <p className="max-w-sm text-sm text-ink-soft">{message ?? "Podatkov ni bilo mogoče prebrati. Preverite povezavo in poskusite znova."}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 rounded-xl bg-primary px-4 font-medium text-on-primary hover:bg-primary-hover"
        >
          Poskusi znova
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}
