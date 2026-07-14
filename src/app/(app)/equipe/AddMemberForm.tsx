"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/ui";
import { TextField, FormError } from "@/components/ui/form";
import { addTeamMember, type ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;

export function AddMemberForm({ atLimit }: { atLimit: boolean }) {
  const [state, action, pending] = useFormState(addTeamMember, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      <TextField label="Nome" name="name" placeholder="Bruno Souza" required />
      <TextField label="Cargo (opcional)" name="role" placeholder="Analista" />
      <TextField label="E-mail (opcional)" name="email" type="email" placeholder="bruno@acme.com" />
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      <Button type="submit" variant="outline" disabled={pending || atLimit}>
        {pending ? "Adicionando..." : "+ Adicionar liderado"}
      </Button>
    </form>
  );
}
