"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/ui";
import { TextField, FormError } from "@/components/ui/form";
import { updateTeamMember, removeTeamMember } from "@/server/actions/team";
import type { ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;

export function EditMemberForm({
  teamMemberId,
  values,
}: {
  teamMemberId: string;
  values: { name: string; role: string | null; email: string | null };
}) {
  const [state, action, pending] = useFormState(updateTeamMember, initial);
  const [removeState, removeAction, removePending] = useFormState(removeTeamMember, initial);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="teamMemberId" value={teamMemberId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Nome" name="name" defaultValue={values.name} required />
          <TextField label="Cargo" name="role" defaultValue={values.role ?? ""} />
        </div>
        <TextField label="E-mail" name="email" type="email" defaultValue={values.email ?? ""} />
        {state && !state.ok ? (
          <FormError>{state.error}</FormError>
        ) : state?.ok ? (
          <p className="text-sm text-green-700">Dados atualizados.</p>
        ) : null}
        <Button type="submit" variant="outline" disabled={pending} className="self-start">
          {pending ? "Salvando…" : "Salvar dados"}
        </Button>
      </form>

      <form
        action={removeAction}
        onSubmit={(e) => {
          if (
            !confirm(
              `Remover ${values.name} da equipe? O histórico (1:1s, feedbacks, metas, PDI) é mantido, mas a pessoa some das listas ativas.`,
            )
          ) {
            e.preventDefault();
          }
        }}
        className="border-t border-border pt-4"
      >
        <input type="hidden" name="teamMemberId" value={teamMemberId} />
        {removeState && !removeState.ok ? <FormError>{removeState.error}</FormError> : null}
        <Button type="submit" variant="ghost" disabled={removePending} className="text-danger hover:bg-danger-soft">
          {removePending ? "Removendo…" : "Remover liderado"}
        </Button>
      </form>
    </div>
  );
}
