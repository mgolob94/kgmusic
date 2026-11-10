"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormError, inputClass } from "@/components/ui/field";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl bg-surface p-5 shadow-soft">
      <Field label="E-naslov" htmlFor="email">
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
      </Field>
      <Field label="Geslo" htmlFor="password">
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      <FormError message={state.error} />
      <Button type="submit" disabled={pending}>{pending ? "Prijavljam …" : "Prijava"}</Button>
    </form>
  );
}
