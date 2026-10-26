"use client";

import { useTransition } from "react";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui";
import { TextField, TextArea, SelectField, FormError } from "@/components/ui/form";
import { VIRTUES } from "@/lib/virtues";
import { CANDIDATE_STATUS_LABEL, JOB_STATUS_LABEL } from "@/lib/talent-meta";
import {
  createOpening,
  updateOpening,
  deleteOpening,
  createCandidate,
  updateCandidate,
  updateCandidateStatus,
  deleteCandidate,
} from "@/server/actions/talent";
import type { ActionResult } from "@/server/actions/team";
import type { CandidateStatus, JobStatus, Virtue } from "@prisma/client";

const initial: ActionResult | null = null;

export type OpeningDefaults = {
  id?: string;
  title?: string;
  area?: string | null;
  location?: string | null;
  description?: string | null;
  status?: JobStatus;
  requiredSkills?: string[];
  desiredSkills?: string[];
  minYears?: number;
  salaryMin?: number | null;
  salaryMax?: number | null;
  targetVirtues?: Virtue[];
};

export function OpeningForm({ opening }: { opening?: OpeningDefaults }) {
  const editing = !!opening?.id;
  const [state, action, pending] = useFormState(editing ? updateOpening : createOpening, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      {editing ? <input type="hidden" name="openingId" value={opening?.id} /> : null}
      <TextField label="Título da vaga" name="title" required defaultValue={opening?.title} placeholder="Ex.: Gestor(a) de tráfego pleno" />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Área" name="area" defaultValue={opening?.area ?? ""} placeholder="Mídia paga" />
        <TextField label="Local / modelo" name="location" defaultValue={opening?.location ?? ""} placeholder="Remoto" />
      </div>
      <SelectField label="Situação" name="status" defaultValue={opening?.status ?? "OPEN"}>
        {(Object.keys(JOB_STATUS_LABEL) as JobStatus[]).map((s) => (
          <option key={s} value={s}>
            {JOB_STATUS_LABEL[s]}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Requisitos obrigatórios (35%)"
        name="requiredSkills"
        defaultValue={opening?.requiredSkills?.join(", ")}
        placeholder="Meta Ads, Google Ads, GA4"
        hint="Separe por vírgula. Contam as habilidades declaradas e o texto do currículo."
      />
      <TextField
        label="Diferenciais (10%)"
        name="desiredSkills"
        defaultValue={opening?.desiredSkills?.join(", ")}
        placeholder="TikTok Ads, SQL, Looker Studio"
      />
      <div className="grid grid-cols-3 gap-3">
        <TextField label="Anos mín. (15%)" name="minYears" type="number" min={0} max={40} defaultValue={opening?.minYears ?? 0} />
        <TextField label="Salário mín." name="salaryMin" type="number" min={0} defaultValue={opening?.salaryMin ?? ""} />
        <TextField label="Salário máx." name="salaryMax" type="number" min={0} defaultValue={opening?.salaryMax ?? ""} />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-semibold text-deep">Virtudes buscadas (20%)</legend>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
          {VIRTUES.map((v) => (
            <label key={v.key} className="flex cursor-pointer items-center gap-2 text-sm text-deep">
              <input
                type="checkbox"
                name="targetVirtues"
                value={v.key}
                defaultChecked={opening?.targetVirtues?.includes(v.key)}
                className="h-4 w-4 rounded border-border text-blue focus:ring-blue/30"
              />
              {v.label}
            </label>
          ))}
        </div>
      </fieldset>
      <TextArea label="Descrição" name="description" defaultValue={opening?.description ?? ""} placeholder="Responsabilidades, contexto, benefícios…" />
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      {state?.ok ? (
        <p className="rounded-sm bg-success-soft px-3 py-2 text-sm font-medium text-success">Salvo.</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : editing ? "Salvar vaga" : "Criar vaga"}
      </Button>
    </form>
  );
}

export type CandidateDefaults = {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  currentRole?: string | null;
  location?: string | null;
  source?: string | null;
  openingId?: string | null;
  yearsExperience?: number;
  skills?: string[];
  salaryExpectation?: number | null;
  resumeText?: string | null;
  notes?: string | null;
  status?: CandidateStatus;
  interviewRating?: number | null;
  virtueRatings?: Partial<Record<Virtue, number>>;
};

export function CandidateForm({
  candidate,
  openings,
  defaultOpeningId,
}: {
  candidate?: CandidateDefaults;
  openings: { id: string; title: string }[];
  defaultOpeningId?: string;
}) {
  const editing = !!candidate?.id;
  const [state, action, pending] = useFormState(editing ? updateCandidate : createCandidate, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      {editing ? <input type="hidden" name="candidateId" value={candidate?.id} /> : null}
      <TextField label="Nome" name="name" required defaultValue={candidate?.name} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="E-mail" name="email" type="email" defaultValue={candidate?.email ?? ""} />
        <TextField label="Telefone" name="phone" defaultValue={candidate?.phone ?? ""} />
      </div>
      <TextField label="LinkedIn" name="linkedinUrl" type="url" defaultValue={candidate?.linkedinUrl ?? ""} placeholder="https://linkedin.com/in/…" />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Cargo atual" name="currentRole" defaultValue={candidate?.currentRole ?? ""} />
        <TextField label="Cidade / local" name="location" defaultValue={candidate?.location ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Vaga" name="openingId" defaultValue={candidate?.openingId ?? defaultOpeningId ?? ""}>
          <option value="">Só no banco de talentos</option>
          {openings.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </SelectField>
        <SelectField label="Etapa" name="status" defaultValue={candidate?.status ?? "BANCO"}>
          {(Object.keys(CANDIDATE_STATUS_LABEL) as CandidateStatus[]).map((s) => (
            <option key={s} value={s}>
              {CANDIDATE_STATUS_LABEL[s]}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Anos de experiência" name="yearsExperience" type="number" min={0} max={60} defaultValue={candidate?.yearsExperience ?? 0} />
        <TextField label="Pretensão salarial" name="salaryExpectation" type="number" min={0} defaultValue={candidate?.salaryExpectation ?? ""} />
      </div>
      <TextField label="Habilidades" name="skills" defaultValue={candidate?.skills?.join(", ")} placeholder="Meta Ads, Google Ads, Excel" hint="Separe por vírgula." />
      <TextField label="Origem" name="source" defaultValue={candidate?.source ?? ""} placeholder="LinkedIn, indicação, site…" />
      <TextArea
        label="Currículo (texto)"
        name="resumeText"
        defaultValue={candidate?.resumeText ?? ""}
        placeholder="Cole o texto do currículo — as habilidades da vaga são buscadas aqui também."
        className="min-h-[120px]"
      />
      <TextArea label="Observações" name="notes" defaultValue={candidate?.notes ?? ""} />

      {editing ? (
        <fieldset className="flex flex-col gap-3 rounded-sm border border-border p-4">
          <legend className="px-1 text-xs font-bold uppercase tracking-wide text-purple">Avaliação da entrevista</legend>
          <SelectField label="Nota geral (1–5)" name="interviewRating" defaultValue={candidate?.interviewRating ?? ""}>
            <option value="">Não avaliada</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </SelectField>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {VIRTUES.map((v) => (
              <SelectField
                key={v.key}
                label={v.label}
                name={`virtue_${v.key}`}
                defaultValue={candidate?.virtueRatings?.[v.key] ?? ""}
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </SelectField>
            ))}
          </div>
          <p className="text-[11px] text-muted">
            As notas por virtude alimentam o fit com as vagas que buscam essas virtudes.
          </p>
        </fieldset>
      ) : null}

      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
      {state?.ok ? (
        <p className="rounded-sm bg-success-soft px-3 py-2 text-sm font-medium text-success">Salvo.</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : editing ? "Salvar candidato" : "Adicionar ao banco de talentos"}
      </Button>
    </form>
  );
}

export function CandidateStatusSelect({ id, status }: { id: string; status: CandidateStatus }) {
  const [pending, start] = useTransition();
  return (
    <select
      value={status}
      disabled={pending}
      aria-label="Etapa do candidato"
      onChange={(e) => start(() => updateCandidateStatus(id, e.target.value))}
      className="rounded-sm border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-deep hover:border-border-strong focus:border-blue focus:outline-none disabled:opacity-60"
    >
      {(Object.keys(CANDIDATE_STATUS_LABEL) as CandidateStatus[]).map((s) => (
        <option key={s} value={s}>
          {CANDIDATE_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

export function DeleteOpeningButton({ openingId }: { openingId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      icon="trash"
      disabled={pending}
      onClick={() => {
        if (confirm("Excluir esta vaga? Os candidatos continuam no banco de talentos.")) {
          start(() => deleteOpening(openingId));
        }
      }}
    >
      Excluir vaga
    </Button>
  );
}

export function DeleteCandidateButton({ candidateId }: { candidateId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      icon="trash"
      disabled={pending}
      onClick={() => {
        if (confirm("Excluir este candidato e todos os dados dele?")) start(() => deleteCandidate(candidateId));
      }}
    >
      Excluir candidato
    </Button>
  );
}
