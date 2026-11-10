"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays, CalendarPlus, ChevronDown, Download, LayoutDashboard, LogOut, Plus, Settings, UserPlus, Users, Repeat,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Sheet } from "@/components/ui/sheet";
import { useWorkspace } from "@/components/workspace/workspace-provider";

type School = { id: string; name: string; color: string };

const NAV = [
  { href: "", label: "Danes", icon: LayoutDashboard },
  { href: "/koledar", label: "Koledar", icon: CalendarDays },
  { href: "/ucenci", label: "Učenci", icon: Users },
  { href: "/izvoz", label: "Izvoz", icon: Download },
] as const;

function useActive(base: string) {
  const pathname = usePathname();
  return (href: string) => (href === "" ? pathname === base : pathname.startsWith(base + href));
}

export function AppShell({ schools, children }: { schools: School[]; children: ReactNode }) {
  const { workspace } = useWorkspace();
  const base = `/w/${workspace.id}`;
  const isActive = useActive(base);
  const [schoolsOpen, setSchoolsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="min-h-dvh md:pl-64">
      {/* Namizje: stranska vrstica */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface md:flex">
        <div className="staff px-5 pb-2 pt-6">
          <Link href={base} className="font-display text-2xl font-semibold">KG Music</Link>
        </div>
        <div className="mt-4 px-3">
          <p className="px-2 pb-1 text-sm font-medium text-ink-soft">Šola</p>
          <SchoolList schools={schools} currentId={workspace.id} />
        </div>
        <nav aria-label="Glavna navigacija" className="mt-5 flex flex-col gap-1 px-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={base + href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium transition-colors ${
                isActive(href) ? "bg-primary-soft text-primary" : "text-ink-soft hover:bg-sunken hover:text-ink"
              }`}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pt-4">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-medium text-on-primary hover:bg-primary-hover"
          >
            <Plus className="size-5" aria-hidden /> Dodaj
          </button>
        </div>
        <div className="mt-auto flex flex-col gap-1 border-t border-line p-3">
          <Link
            href={`${base}/nastavitve`}
            aria-current={isActive("/nastavitve") ? "page" : undefined}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-ink-soft hover:bg-sunken hover:text-ink aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary"
          >
            <Settings className="size-5" aria-hidden /> Nastavitve šole
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-ink-soft hover:bg-sunken hover:text-ink">
              <LogOut className="size-5" aria-hidden /> Odjava
            </button>
          </form>
        </div>
      </aside>

      {/* Telefon: zgornja vrstica */}
      <header className="sticky top-0 z-30 flex items-center border-b border-line bg-paper/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
        <button
          type="button"
          onClick={() => setSchoolsOpen(true)}
          className="-ml-2 flex min-h-12 items-center gap-2.5 rounded-xl px-2 font-display text-lg font-semibold"
          aria-label={`Šola: ${workspace.name}. Zamenjaj šolo`}
        >
          <span className="size-3 rounded-full" style={{ background: workspace.color }} aria-hidden />
          <span className="max-w-[16rem] truncate">{workspace.name}</span>
          <ChevronDown className="size-4 text-ink-soft" aria-hidden />
        </button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-5 md:px-8 md:pb-12 md:pt-8">{children}</main>

      {/* Telefon: spodnja navigacija + gumb Dodaj */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        aria-label="Dodaj"
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-30 grid size-14 place-items-center rounded-full bg-primary text-on-primary shadow-float hover:bg-primary-hover md:hidden"
      >
        <Plus className="size-6" aria-hidden />
      </button>
      <nav
        aria-label="Glavna navigacija"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={label}
            href={base + href}
            aria-current={isActive(href) ? "page" : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
              isActive(href) ? "text-primary" : "text-ink-soft"
            }`}
          >
            <span className={`grid h-7 w-14 place-items-center rounded-full ${isActive(href) ? "bg-primary-soft" : ""}`}>
              <Icon className="size-5" aria-hidden />
            </span>
            {label}
          </Link>
        ))}
      </nav>

      <Sheet open={schoolsOpen} onOpenChange={setSchoolsOpen} title="Šole">
        <div onClick={(e) => (e.target as HTMLElement).closest("a") && setSchoolsOpen(false)} className="flex flex-col gap-4">
          <SchoolList schools={schools} currentId={workspace.id} />
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <Link href={`${base}/nastavitve`} className="flex min-h-11 items-center gap-3 rounded-xl px-3 hover:bg-sunken">
              <Settings className="size-5 text-ink-soft" aria-hidden /> Nastavitve šole
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 hover:bg-sunken">
                <LogOut className="size-5 text-ink-soft" aria-hidden /> Odjava
              </button>
            </form>
          </div>
        </div>
      </Sheet>

      <AddSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function SchoolList({ schools, currentId }: { schools: School[]; currentId: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {schools.map((s) => (
        <li key={s.id}>
          <Link
            href={`/w/${s.id}`}
            aria-current={s.id === currentId ? "true" : undefined}
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium hover:bg-sunken aria-[current=true]:bg-sunken"
          >
            <span className="size-3 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{s.name}</span>
            {s.id === currentId && <span className="text-xs text-ink-faint">Odprta</span>}
          </Link>
        </li>
      ))}
      <li>
        <Link href="/nova-sola" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-primary hover:bg-primary-soft">
          <Plus className="size-4" aria-hidden /> Nova šola
        </Link>
      </li>
    </ul>
  );
}

function AddSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { workspace, openNewLesson, openNewSlot, openStudentForm } = useWorkspace();
  const items = [
    { label: "Tedenski termin", hint: "Ponavlja se vsak teden skozi sezono", icon: Repeat, run: () => openNewSlot() },
    { label: "Enkratna ura", hint: "Nadomestna ali dodatna ura", icon: CalendarPlus, run: () => openNewLesson() },
    { label: "Nov učenec", hint: "Podatki, kontakt staršev, GDPR", icon: UserPlus, run: () => openStudentForm() },
  ];
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Dodaj" description={workspace.name}>
      <ul className="flex flex-col gap-2">
        {items.map(({ label, hint, icon: Icon, run }) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                setTimeout(run, 180);
              }}
              className="flex min-h-16 w-full items-center gap-4 rounded-xl border border-line-strong bg-surface px-4 text-left hover:bg-sunken"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-medium">{label}</span>
                <span className="block text-sm text-ink-soft">{hint}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
