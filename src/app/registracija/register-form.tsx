"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormError, inputClass } from "@/components/ui/field";

export function RegisterForm({ inviteRequired }: { inviteRequired: boolean }) {
  const [state, action, pending] = useActionState<RegisterState, FormData>(registerAction, {});
  const fe = state.fieldErrors ?? {};
  const a11y = (k: string) => ({ "aria-invalid": !!fe[k], "aria-describedby": fe[k] ? `${k}-error` : undefined });
  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl bg-surface p-5 shadow-soft">
      <Field label="E-naslov" htmlFor="email" error={fe.email}>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} {...a11y("email")} />
      </Field>
      <Field label="Geslo" htmlFor="password" error={fe.password} hint="Vsaj 10 znakov.">
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className={inputClass} {...a11y("password")} />
      </Field>
      <Field label="Ponovite geslo" htmlFor="password2" error={fe.password2}>
        <input id="password2" name="password2" type="password" autoComplete="new-password" required className={inputClass} {...a11y("password2")} />
      </Field>
      {inviteRequired && (
        <Field label="Vabilna koda" htmlFor="invite" error={fe.invite} hint="Kodo ste prejeli od skrbnika aplikacije.">
          <input id="invite" name="invite" autoComplete="off" required className={inputClass} {...a11y("invite")} />
        </Field>
      )}
      <FormError message={state.error} />
      <Button type="submit" disabled={pending}>{pending ? "Ustvarjam račun …" : "Ustvari račun"}</Button>
    </form>
  );
}
