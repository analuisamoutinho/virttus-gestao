import type { CandidateStatus, JobStatus } from "@prisma/client";

export const CANDIDATE_STATUS_LABEL: Record<CandidateStatus, string> = {
  BANCO: "No banco",
  EM_PROCESSO: "Em processo",
  ENTREVISTA: "Entrevista",
  PROPOSTA: "Proposta",
  CONTRATADO: "Contratado",
  DESCARTADO: "Descartado",
};

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  OPEN: "Aberta",
  PAUSED: "Pausada",
  CLOSED: "Encerrada",
};
