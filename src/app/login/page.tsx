import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Prijava" };

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
      </div>
    </main>
  );
}
