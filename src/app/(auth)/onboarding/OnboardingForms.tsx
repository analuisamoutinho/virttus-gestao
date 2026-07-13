"use client";

import { useFormState } from "react-dom";
import { Button, Card } from "@/components/ui";
import {
  createOrganization,
  addTeamMember,
  type ActionResult,
} from "@/server/actions/team";

const initial: ActionResult | null = null;

export function CreateOrgForm() {
  const [state, action, pending] = useFormState(createOrganization, initial);
  return (
    <Card className="w-full max-w-md">
      <h2 className="font-sora text-xl font-bold text-deep">Crie sua organização</h2>
      <p className="mt-1 text-sm text-muted">
        Cada empresa é um espaço isolado. Você será o administrador.
      </p>
      <form action={action} className="mt-5 flex flex-col gap-3">
        <Field label="Nome da empresa" name="name" placeholder="Acme Ltda" required />
        {state && !state.ok ? <ErrorText>{state.error}</ErrorText> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Continuar"}
        </Button>
      </form>
    </Card>
  );
}

export function AddMemberForm({ atLimit }: { atLimit: boolean }) {
  const [state, action, pending] = useFormState(addTeamMember, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome" name="name" placeholder="Bruno Souza" required />
        <Field label="Cargo (opcional)" name="role" placeholder="Analista" />
      </div>
      <Field label="E-mail (opcional)" name="email" type="email" placeholder="bruno@acme.com" />
      {state && !state.ok ? <ErrorText>{state.error}</ErrorText> : null}
      <Button type="submit" variant="outline" disabled={pending || atLimit}>
        {pending ? "Adicionando..." : "+ Adicionar liderado"}
      </Button>
    </form>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="flex flex-col gap-1 text-left">
      <span className="text-xs font-medium text-muted">{label}</span>
      <input
        className="rounded-sm border border-border bg-white px-3 py-2 text-sm text-deep outline-none focus:border-blue"
        {...props}
      />
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-red-600">{children}</p>;
}
