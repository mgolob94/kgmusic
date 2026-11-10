import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { inviteCode, registrationOpen } from "@/lib/registration";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Registracija" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getUser()) redirect("/");
  const open = registrationOpen();
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="staff mb-6 pb-2">
          <h1 className="font-display text-4xl">KG Music</h1>
        </div>
        {open ? (
          <>
            <p className="mb-6 text-ink-soft">Ustvarite račun in dodajte svojo prvo šolo.</p>
            <RegisterForm inviteRequired={!!inviteCode()} />
          </>
        ) : (
          <p className="rounded-2xl bg-surface p-5 text-ink-soft shadow-soft">
            Registracija je trenutno zaprta. Če že imate račun, se prijavite.
          </p>
        )}
        <p className="mt-5 text-center text-sm text-ink-soft">
          Že imate račun?{" "}
          <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">
            Prijava
          </Link>
        </p>
      </div>
    </main>
  );
}
