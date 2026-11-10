"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/** Na telefonu spodnji list, na večjih zaslonih stranski panel. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay fixed inset-0 z-40 bg-ink/40" />
        <Dialog.Content
          className="sheet fixed z-50 flex max-h-[92dvh] flex-col bg-surface shadow-float outline-none
                     inset-x-0 bottom-0 rounded-t-2xl
                     md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[28rem] md:rounded-none md:rounded-l-2xl"
          aria-describedby={description ? undefined : undefined}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 pb-3 pt-4">
            <div className="min-w-0">
              <Dialog.Title className="font-display text-xl font-semibold leading-tight">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-sm text-ink-soft">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Zapri"
              className="-mr-2 grid size-11 shrink-0 place-items-center rounded-xl text-ink-soft hover:bg-sunken"
            >
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </header>
          <div className="overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
