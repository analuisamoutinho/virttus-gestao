"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/ui";
import { TextField, TextArea, SelectField, FormError } from "@/components/ui/form";
import { VirtueOptions } from "@/components/VirtueBadge";
import {
  createOneOnOne,
  completeOneOnOne,
  addActionItem,
} from "@/server/actions/one-on-one";
import type { ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;

type MemberOpt = { id: string; name: string };

export function NewOneOnOneForm({
  members,
  defaultMemberId,
}: {
  members: MemberOpt[];
  defaultMemberId?: string;
}) {
  const [state, action, pending] = useFormState(createOneOnOne, initial);
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
      <TextField label="Data e hora" name="scheduledAt" type="datetime-local" required />
      <SelectField label="Virtude em foco (opcional)" name="focusVirtue" defaultValue="">
        <VirtueOptions />
      </SelectField>
      <TextArea label="Pauta (opcional)" name="agenda" placeholder="Tópicos para conversar…" />
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Agendando…" : "Agendar 1:1"}
      </Button>
    </form>
  );
}

export function CompleteOneOnOneForm({ oneOnOneId }: { oneOnOneId: string }) {
  const [state, action, pending] = useFormState(completeOneOnOne, initial);
  return (
    <form action={action} className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
      <input type="hidden" name="oneOnOneId" value={oneOnOneId} />
      <TextArea label="Notas da conversa" name="notes" placeholder="O que foi conversado…" />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Mood (1–5)" name="mood" defaultValue="">
          <option value="">—</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </SelectField>
        <SelectField label="Virtude em foco" name="focusVirtue" defaultValue="">
          <VirtueOptions />
        </SelectField>
      </div>
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Salvando…" : "Marcar como realizado"}
      </Button>
    </form>
  );
}

export function AddActionItemForm({ oneOnOneId }: { oneOnOneId: string }) {
  const [state, action, pending] = useFormState(addActionItem, initial);
  return (
    <form action={action} className="mt-2 flex items-end gap-2">
      <input type="hidden" name="oneOnOneId" value={oneOnOneId} />
      <div className="flex-1">
        <TextField label="Nova ação de follow-up" name="text" placeholder="Ex.: enviar material…" />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        +
      </Button>
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
    </form>
  );
}
