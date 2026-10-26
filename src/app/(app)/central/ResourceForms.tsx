"use client";

import { useTransition } from "react";
import { useFormState } from "react-dom";
import { Button, Icon } from "@/components/ui";
import { TextField, TextArea, SelectField, FormError } from "@/components/ui/form";
import { VirtueOptions } from "@/components/VirtueBadge";
import { RESOURCE_META, RESOURCE_TYPE_ORDER } from "@/lib/resource-meta";
import { createResource, toggleResourcePin, deleteResource } from "@/server/actions/resource";
import type { ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;

export function NewResourceForm() {
  const [state, action, pending] = useFormState(createResource, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      <SelectField label="Tipo" name="type" defaultValue="LIVRO">
        {RESOURCE_TYPE_ORDER.map((t) => (
          <option key={t} value={t}>
            {RESOURCE_META[t].label}
          </option>
        ))}
      </SelectField>
      <TextField label="Título" name="title" required placeholder="Ex.: Virtuous Leadership" />
      <TextField label="Autor / canal" name="author" placeholder="Ex.: Alexandre Havard" />
      <TextField label="Link" name="url" type="url" placeholder="https://…" />
      <SelectField label="Virtude relacionada (opcional)" name="focusVirtue" defaultValue="">
        <VirtueOptions />
      </SelectField>
      <TextField label="Tags" name="tags" placeholder="liderança, feedback, gestão de tempo" hint="Separe por vírgula." />
      <TextArea label="Por que indicar?" name="description" placeholder="O que o time ganha com isso, capítulo/episódio recomendado…" />
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      {state?.ok ? (
        <p className="rounded-sm bg-success-soft px-3 py-2 text-sm font-medium text-success">Indicação salva.</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Indicar conteúdo"}
      </Button>
    </form>
  );
}

export function ResourceActions({ id, pinned }: { id: string; pinned: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => toggleResourcePin(id))}
        className={`inline-flex items-center gap-1 text-xs font-semibold transition ${
          pinned ? "text-purple" : "text-muted hover:text-deep"
        }`}
        aria-pressed={pinned}
      >
        <Icon.pin width={13} height={13} />
        {pinned ? "Fixado" : "Fixar"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Remover esta indicação do mural?")) start(() => deleteResource(id));
        }}
        className="ml-auto text-xs font-medium text-danger hover:underline"
      >
        Excluir
      </button>
    </div>
  );
}
