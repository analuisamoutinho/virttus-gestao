"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { TextArea, FormError } from "@/components/ui/form";
import { updateProfile } from "@/server/actions/profile";
import type { ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;

export type ProfileValues = {
  motivators: string | null;
  feedbackPrefs: string | null;
  communicationStyle: string | null;
  strengths: string | null;
  watchouts: string | null;
  aspirations: string | null;
};

export function ProfileForm({
  teamMemberId,
  values,
}: {
  teamMemberId: string;
  values: ProfileValues;
}) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="teamMemberId" value={teamMemberId} />
      <TextArea
        label="Motivadores"
        name="motivators"
        defaultValue={values.motivators ?? ""}
        placeholder="O que energiza essa pessoa…"
      />
      <TextArea
        label="Preferências de feedback"
        name="feedbackPrefs"
        defaultValue={values.feedbackPrefs ?? ""}
        placeholder="Como prefere receber feedback…"
      />
      <TextArea
        label="Estilo de comunicação"
        name="communicationStyle"
        defaultValue={values.communicationStyle ?? ""}
      />
      <TextArea
        label="Pontos fortes"
        name="strengths"
        defaultValue={values.strengths ?? ""}
      />
      <TextArea
        label="Pontos de atenção"
        name="watchouts"
        defaultValue={values.watchouts ?? ""}
      />
      <TextArea
        label="Aspirações"
        name="aspirations"
        defaultValue={values.aspirations ?? ""}
      />
      {state && !state.ok ? (
        <FormError>{state.error}</FormError>
      ) : state?.ok ? (
        <p className="text-sm text-green-700">Perfil salvo.</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar perfil"}
      </Button>
    </form>
  );
}
