"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/ui";
import { TextField, FormError } from "@/components/ui/form";
import { localLogin } from "@/server/actions/local-auth";
import type { ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;

export function LocalLoginForm() {
  const [state, action, pending] = useFormState(localLogin, initial);
  return (
    <form action={action} className="flex flex-col gap-3 text-left">
      <TextField label="Seu nome" name="name" placeholder="Ana Líder" required />
      <TextField label="Seu e-mail" name="email" type="email" placeholder="voce@empresa.com" required />
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-center text-xs text-muted">
        Login local — sem senha. Use sempre o mesmo e-mail para voltar à sua conta.
      </p>
    </form>
  );
}
