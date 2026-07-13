"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/ui";
import { TextArea, SelectField, FormError } from "@/components/ui/form";
import { VirtueOptions } from "@/components/VirtueBadge";
import { CONVERSATION_TYPES } from "@/lib/conversation";
import { createConversationScript } from "@/server/actions/conversation";
import type { ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;
type MemberOpt = { id: string; name: string };

export function ConversationForm({
  members,
  defaultMemberId,
}: {
  members: MemberOpt[];
  defaultMemberId?: string;
}) {
  const [state, action, pending] = useFormState(createConversationScript, initial);
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
      <SelectField label="Tipo de conversa" name="type" required defaultValue="">
        <option value="" disabled>
          Selecione…
        </option>
        {CONVERSATION_TYPES.map((t) => (
          <option key={t.key} value={t.key}>
            {t.label}
          </option>
        ))}
      </SelectField>
      <TextArea
        label="Contexto"
        name="situation"
        required
        placeholder="O que aconteceu e o que você quer resolver nessa conversa…"
      />
      <SelectField label="Virtude em foco (opcional)" name="focusVirtue" defaultValue="">
        <VirtueOptions />
      </SelectField>
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Gerando…" : "Gerar roteiro"}
      </Button>
    </form>
  );
}
