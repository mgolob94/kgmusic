"use server";

import bcrypt from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession } from "@/lib/auth";
import { inviteCode, registrationOpen } from "@/lib/registration";

// Preprosta zaščita pred ugibanjem gesla (v pomnilniku; za eno instanco povsem dovolj).
const attempts = new Map<string, { n: number; until: number }>();
const MAX = 6;
const WINDOW = 15 * 60 * 1000;

export type LoginState = { error?: string };

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${ip}|${email}`;

  const rec = attempts.get(key);
  if (rec && rec.until > Date.now() && rec.n >= MAX) {
    return { error: "Preveč poskusov. Poskusite znova čez nekaj minut." };
  }

  const [user] = email ? await db.select().from(users).where(eq(users.email, email)) : [];
  // Primerjava tudi, če uporabnik ne obstaja – enak čas odziva.
  const hash = user?.passwordHash ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const valid = await bcrypt.compare(password, hash).catch(() => false);

  if (!user || !valid) {
    const n = rec && rec.until > Date.now() ? rec.n + 1 : 1;
    attempts.set(key, { n, until: Date.now() + WINDOW });
    return { error: "E-naslov ali geslo ni pravilno." };
  }
  attempts.delete(key);
  await createSession(user);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

// ── Registracija ──
const registerAttempts = new Map<string, { n: number; until: number }>();
const REG_MAX = 5;

const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().max(160).regex(/^\S+@\S+\.\S+$/, "Vnesite veljaven e-naslov."),
    password: z
      .string()
      .min(10, "Geslo mora imeti vsaj 10 znakov.")
      .refine((p) => new TextEncoder().encode(p).length <= 72, "Geslo je predolgo (največ 72 znakov)."),
    password2: z.string(),
  })
  .refine((v) => v.password === v.password2, { path: ["password2"], message: "Gesli se ne ujemata." });

export type RegisterState = { error?: string; fieldErrors?: Record<string, string> };

function sameSecret(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function registerAction(_: RegisterState, formData: FormData): Promise<RegisterState> {
  if (!registrationOpen()) return { error: "Registracija je trenutno zaprta." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rec = registerAttempts.get(ip);
  if (rec && rec.until > Date.now() && rec.n >= REG_MAX) {
    return { error: "Preveč poskusov. Poskusite znova čez nekaj minut." };
  }
  const bump = () =>
    registerAttempts.set(ip, { n: rec && rec.until > Date.now() ? rec.n + 1 : 1, until: Date.now() + WINDOW });

  const required = inviteCode();
  if (required && !sameSecret(String(formData.get("invite") ?? "").trim(), required)) {
    bump();
    return { fieldErrors: { invite: "Vabilna koda ni pravilna." } };
  }

  const parsed = registerSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
    password2: formData.get("password2") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { fieldErrors };
  }

  const { email, password } = parsed.data;
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (exists) {
    bump();
    return { fieldErrors: { email: "S tem e-naslovom je račun že ustvarjen. Prijavite se." } };
  }

  let user: { id: string; email: string };
  try {
    [user] = await db
      .insert(users)
      .values({ email, passwordHash: await bcrypt.hash(password, 12) })
      .returning({ id: users.id, email: users.email });
  } catch (e) {
    // Hkratna registracija z istim e-naslovom (unikatni indeks).
    if ((e as { code?: string }).code === "23505") {
      return { fieldErrors: { email: "S tem e-naslovom je račun že ustvarjen. Prijavite se." } };
    }
    throw e;
  }
  await createSession(user);
  redirect("/nova-sola");
}
