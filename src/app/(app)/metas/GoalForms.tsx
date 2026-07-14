"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui";
import { TextField, TextArea, SelectField, FormError } from "@/components/ui/form";
import { createGoal, updateKeyResult } from "@/server/actions/goal";
import type { ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;
type MemberOpt = { id: string; name: string };

export function NewGoalForm({
  members,
  quarter,
  defaultMemberId,
}: {
  members: MemberOpt[];
  quarter: string;
  defaultMemberId?: string;
}) {
  const [state, action, pending] = useFormState(createGoal, initial);
  const [krCount, setKrCount] = useState(2);

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
      <TextField label="Trimestre" name="quarter" defaultValue={quarter} required />
      <TextArea label="Objetivo" name="objective" required placeholder="Aonde queremos chegar…" />

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted">Key Results</span>
        {Array.from({ length: krCount }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_70px_60px] gap-2">
            <input
              name="kr_title"
              placeholder={`KR ${i + 1}`}
              className="rounded-sm border border-border bg-white px-3 py-2 text-sm outline-none focus:border-blue"
            />
            <input
              name="kr_target"
              type="number"
              step="any"
              placeholder="meta"
              className="rounded-sm border border-border bg-white px-2 py-2 text-sm outline-none focus:border-blue"
            />
            <input
              name="kr_unit"
              placeholder="un."
              className="rounded-sm border border-border bg-white px-2 py-2 text-sm outline-none focus:border-blue"
            />
          </div>
        ))}
        {krCount < 6 ? (
          <button
            type="button"
            onClick={() => setKrCount((c) => c + 1)}
            className="self-start text-xs font-medium text-purple"
          >
            + Adicionar KR
          </button>
        ) : null}
      </div>

      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Criando…" : "Criar objetivo"}
      </Button>
    </form>
  );
}

export function UpdateKrForm({
  keyResultId,
  current,
}: {
  keyResultId: string;
  current: number;
}) {
  const [state, action, pending] = useFormState(updateKeyResult, initial);
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="keyResultId" value={keyResultId} />
      <input
        name="current"
        type="number"
        step="any"
        defaultValue={current}
        className="w-20 rounded-sm border border-border bg-white px-2 py-1 text-xs outline-none focus:border-blue"
      />
      <Button type="submit" variant="outline" className="px-2 py-1 text-xs" disabled={pending}>
        {pending ? "…" : "ok"}
      </Button>
      {state && !state.ok ? <span className="text-xs text-danger">!</span> : null}
    </form>
  );
}
