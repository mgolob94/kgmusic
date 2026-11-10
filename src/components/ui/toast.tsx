"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";

type ToastInput = {
  message: string;
  tone?: "success" | "error";
  /** Npr. »Razveljavi« – ob kliku se toast zapre in kliče onClick. */
  action?: { label: string; onClick: () => void | Promise<void> };
};
type ToastItem = ToastInput & { id: number };

const ToastCtx = createContext<(t: ToastInput) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (t: ToastInput) => {
      const id = ++seq.current;
      setItems((l) => [...l.slice(-2), { ...t, id }]);
      setTimeout(() => dismiss(id), t.action ? 8000 : 4500);
    },
    [dismiss],
  );
  const value = useMemo(() => push, [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="toast pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-paper shadow-float"
          >
            {t.tone === "error" ? (
              <CircleAlert className="size-5 shrink-0" aria-hidden />
            ) : (
              <CircleCheck className="size-5 shrink-0" aria-hidden />
            )}
            <span className="min-w-0 flex-1">{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="-my-2 min-h-11 shrink-0 rounded-lg px-3 font-semibold underline underline-offset-4"
                onClick={() => {
                  dismiss(t.id);
                  void t.action!.onClick();
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
