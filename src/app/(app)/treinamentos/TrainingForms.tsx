"use client";

import { useTransition } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui";
import { TextField, TextArea, SelectField, FormError } from "@/components/ui/form";
import { VirtueOptions } from "@/components/VirtueBadge";
import {
  createTraining,
  updateTrainingStatus,
  deleteTraining,
  seedDefaultTrainings,
} from "@/server/actions/training";
import type { ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;

export function NewTrainingForm() {
  const [state, action, pending] = useFormState(createTraining, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      <TextField label="Título" name="title" required placeholder="Ex.: S1 — Método NAMTAB" />
      <TextField label="Módulo / mês" name="module" placeholder="Ex.: Mês 2 — Método científico" />
      <TextField label="Data e hora" name="scheduledAt" type="datetime-local" required />
      <SelectField label="Virtude foco (opcional)" name="focusVirtue" defaultValue="">
        <VirtueOptions />
      </SelectField>
      <TextArea label="Descrição" name="description" placeholder="O que será ensinado/praticado…" />
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Adicionando…" : "Adicionar treinamento"}
      </Button>
    </form>
  );
}

export function SeedTrainingsButton() {
  const [state, action, pending] = useFormState(seedDefaultTrainings, initial);
  return (
    <form action={action} className="flex flex-col items-center gap-2">
      <Button type="submit" disabled={pending} variant="outline">
        {pending ? "Carregando…" : "Carregar cronograma padrão (jul–out)"}
      </Button>
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
    </form>
  );
}

export function TrainingStatusControls({
  id,
  status,
  tone = "light",
}: {
  id: string;
  status: "PLANNED" | "DONE" | "CANCELED";
  tone?: "light" | "dark";
}) {
  const [pending, start] = useTransition();
  const primary =
    tone === "dark"
      ? "text-white hover:text-white/80"
      : "text-purple hover:underline";
  const muted =
    tone === "dark"
      ? "text-white/60 hover:text-white"
      : "text-muted hover:underline";
  const danger =
    tone === "dark" ? "text-red-200 hover:text-white" : "text-danger hover:underline";
  return (
    <div className="flex items-center gap-3">
      {status !== "DONE" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => updateTrainingStatus(id, "DONE"))}
          className={`text-xs font-semibold transition ${primary}`}
        >
          Marcar concluído
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => updateTrainingStatus(id, "PLANNED"))}
          className={`text-xs font-medium transition ${muted}`}
        >
          Reabrir
        </button>
      )}
      {status !== "CANCELED" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => updateTrainingStatus(id, "CANCELED"))}
          className={`text-xs font-medium transition ${muted}`}
        >
          Cancelar
        </button>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (confirm("Remover este treinamento?")) start(() => deleteTraining(id));
        }}
        className={`ml-auto text-xs font-medium transition ${danger}`}
      >
        Excluir
      </button>
    </div>
  );
}
