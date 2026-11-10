import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { registrationOpen } from "@/lib/registration";
import { LoginForm } from "./login-form";

export const metadata = { title: "Prijava" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getUser()) redirect("/");
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="staff mb-6 pb-2">
          <h1 className="font-display text-4xl">KG Music</h1>
        </div>
        <p className="mb-6 text-ink-soft">Evidenca ur za učiteljico klavirja in petja.</p>
        <LoginForm />
        {registrationOpen() && (
          <p className="mt-5 text-center text-sm text-ink-soft">
            Nimate računa?{" "}
            <Link href="/registracija" className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">
              Registracija
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
