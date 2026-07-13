"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui";
import { TextField, SelectField, FormError } from "@/components/ui/form";
import { VirtueOptions } from "@/components/VirtueBadge";
import { createPdi, addPdiAction, updatePdiAction } from "@/server/actions/pdi";
import type { ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;
type MemberOpt = { id: string; name: string };

export function NewPdiForm({
  members,
  quarter,
  defaultMemberId,
}: {
  members: MemberOpt[];
  quarter: string;
  defaultMemberId?: string;
}) {
  const [state, action, pending] = useFormState(createPdi, initial);
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
      <SelectField label="Virtude foco" name="focusVirtue" required defaultValue="">
        <option value="" disabled>
          Selecione…
        </option>
        <VirtueOptions />
      </SelectField>
      <TextField
        label="Competência foco"
        name="competency"
        required
        placeholder="Ex.: dar feedback difícil com clareza"
      />
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Criando…" : "Criar PDI do trimestre"}
      </Button>
    </form>
  );
}

export function AddPdiActionForm({ pdiId }: { pdiId: string }) {
  const [state, action, pending] = useFormState(addPdiAction, initial);
  return (
    <form action={action} className="mt-2 flex items-end gap-2">
      <input type="hidden" name="pdiId" value={pdiId} />
      <div className="flex-1">
        <TextField label="Nova ação" name="text" placeholder="Ex.: ler capítulo X e aplicar…" />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        +
      </Button>
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
    </form>
  );
}

export function PdiActionRow({
  id,
  text,
  done,
  evidence,
}: {
  id: string;
  text: string;
  done: boolean;
  evidence: string | null;
}) {
  const [pending, start] = useTransition();
  const [showEvidence, setShowEvidence] = useState(false);

  return (
    <li className="border-b border-border py-2 last:border-0">
      <div className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={done}
          disabled={pending}
          onChange={(e) =>
            start(() => updatePdiAction(id, { done: e.target.checked }))
          }
          className="h-4 w-4 accent-purple"
        />
        <span className={done ? "text-muted line-through" : "text-deep"}>{text}</span>
        <button
          type="button"
          onClick={() => setShowEvidence((s) => !s)}
          className="ml-auto text-xs font-medium text-purple"
        >
          {evidence ? "Evidência ✓" : "+ evidência"}
        </button>
      </div>
      {showEvidence ? (
        <form
          action={(fd) => {
            const val = String(fd.get("evidence") ?? "");
            start(() => updatePdiAction(id, { evidence: val }));
            setShowEvidence(false);
          }}
          className="mt-2 flex items-end gap-2"
        >
          <textarea
            name="evidence"
            defaultValue={evidence ?? ""}
            placeholder="Evidência de evolução…"
            className="min-h-[48px] flex-1 rounded-sm border border-border bg-white px-2 py-1 text-xs outline-none focus:border-blue"
          />
          <Button type="submit" variant="outline" className="text-xs" disabled={pending}>
            salvar
          </Button>
        </form>
      ) : null}
    </li>
  );
}
