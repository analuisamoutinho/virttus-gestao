"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/ui";
import { TextArea, FormError } from "@/components/ui/form";
import { MANAGER_DIMENSIONS } from "@/lib/manager-feedback";
import { submitManagerFeedback } from "@/server/actions/manager-feedback";
import type { ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;
const SCALE = [1, 2, 3, 4, 5];

export function AnonymousForm({ token, managerName }: { token: string; managerName: string }) {
  const [state, action, pending] = useFormState(submitManagerFeedback, initial);

  if (state?.ok) {
    return (
      <div className="rounded-card border border-border bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-2xl text-success">
          ✓
        </div>
        <h2 className="font-sora text-xl font-bold text-deep">Obrigado pelo seu feedback</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Ele foi enviado de forma anônima. Você pode voltar a este link quando quiser e enviar um novo.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="token" value={token} />
      {/* Campo-isca contra robôs: invisível para pessoas. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Não preencha
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="rounded-card border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h2 className="font-sora text-base font-bold text-deep">Como {managerName} atua com você?</h2>
        <p className="mt-1 text-xs text-muted">1 = discordo totalmente · 5 = concordo totalmente</p>
        <div className="mt-5 flex flex-col gap-6">
          {MANAGER_DIMENSIONS.map((d) => (
            <fieldset key={d.key}>
              <legend className="text-sm font-semibold text-deep">{d.prompt}</legend>
              <div className="mt-2 flex gap-2">
                {SCALE.map((n) => (
                  <label key={n} className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name={`rating_${d.key}`}
                      value={n}
                      required
                      className="peer sr-only"
                    />
                    <span className="flex h-11 items-center justify-center rounded-sm border border-border bg-surface text-sm font-bold text-muted transition hover:border-border-strong peer-checked:border-transparent peer-checked:bg-grad peer-checked:text-white peer-checked:shadow-glow-blue peer-focus-visible:ring-2 peer-focus-visible:ring-blue/40">
                      {n}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-sm sm:p-6">
        <TextArea label="O que seu gestor deve CONTINUAR fazendo?" name="keepText" maxLength={1500} />
        <TextArea label="O que deveria COMEÇAR a fazer?" name="startText" maxLength={1500} />
        <TextArea label="O que deveria PARAR de fazer?" name="stopText" maxLength={1500} />
        <p className="text-[11px] text-muted">
          Evite detalhes que revelem quem você é (datas, projetos que só você fez). Os comentários são lidos
          sem identificação.
        </p>
      </div>

      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      <Button type="submit" disabled={pending} className="w-full py-3">
        {pending ? "Enviando…" : "Enviar feedback anônimo"}
      </Button>
    </form>
  );
}
