"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession } from "@/lib/auth";

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
