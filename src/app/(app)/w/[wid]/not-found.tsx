import Link from "next/link";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="text-3xl">Strani ni mogoče najti</h1>
        <p className="text-ink-soft">Povezava ni veljavna ali pa šola ne obstaja več.</p>
        <LinkButton href="/" variant="primary">Nazaj na začetek</LinkButton>
        <Link href="/nova-sola" className="sr-only">Nova šola</Link>
      </div>
    </main>
  );
}
