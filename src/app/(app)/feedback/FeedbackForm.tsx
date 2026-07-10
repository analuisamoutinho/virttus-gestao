"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { TextArea, SelectField, FormError } from "@/components/ui/form";
import { VirtueOptions } from "@/components/VirtueBadge";
import { createFeedback } from "@/server/actions/feedback";
import type { ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;
type MemberOpt = { id: string; name: string };

export function FeedbackForm({
  members,
  defaultMemberId,
}: {
  members: MemberOpt[];
  defaultMemberId?: string;
}) {
  const [state, action, pending] = useActionState(createFeedback, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      {defaultMemberId ? (
        <input type="hidden" name="teamMemberId" value={defaultMemberId} />
      ) : (
        <SelectField label="Liderado" name="teamMemberId" required defaultValue="">
          <option value="" disabled>
            Selecione…
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </SelectField>
      )}
      <SelectField label="Tipo" name="type" required defaultValue="RECOGNITION">
        <option value="RECOGNITION">Reconhecimento</option>
        <option value="CONSTRUCTIVE">Construtivo</option>
      </SelectField>
      <TextArea
        label="Situação"
        name="situation"
        required
        placeholder="Quando e onde aconteceu…"
      />
      <TextArea
        label="Comportamento"
        name="behavior"
        required
        placeholder="O que a pessoa fez, de forma observável…"
      />
      <TextArea
        label="Impacto"
        name="impact"
        required
        placeholder="Qual foi o efeito no time, no cliente, em você…"
      />
      <SelectField label="Virtude relacionada (opcional)" name="virtue" defaultValue="">
        <VirtueOptions />
      </SelectField>
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Registrando…" : "Registrar feedback"}
      </Button>
    </form>
  );
}
