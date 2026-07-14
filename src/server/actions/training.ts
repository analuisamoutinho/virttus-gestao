"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { writeAuditLog } from "@/server/audit";
import { createTrainingSchema, updateTrainingStatusSchema } from "@/lib/validations/training";
import type { ActionResult } from "@/server/actions/team";
import type { Virtue } from "@prisma/client";

const emptyToNull = (v: FormDataEntryValue | null) =>
  v === null || v === "" ? undefined : v;

export async function createTraining(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = createTrainingSchema.safeParse({
    title: formData.get("title"),
    description: emptyToNull(formData.get("description")),
    module: emptyToNull(formData.get("module")),
    scheduledAt: formData.get("scheduledAt"),
    focusVirtue: emptyToNull(formData.get("focusVirtue")),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const training = await db.training.create({
    data: {
      organizationId: org.id,
      createdById: userId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      module: parsed.data.module ?? null,
      scheduledAt: parsed.data.scheduledAt,
      focusVirtue: (parsed.data.focusVirtue || undefined) as Virtue | undefined,
    },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "training.create",
    entity: "Training",
    entityId: training.id,
  });

  revalidatePath("/treinamentos");
  return { ok: true };
}

export async function updateTrainingStatus(
  trainingId: string,
  status: "PLANNED" | "DONE" | "CANCELED",
): Promise<void> {
  const { org } = await getContext();

  const parsed = updateTrainingStatusSchema.safeParse({ trainingId, status });
  if (!parsed.success) return;

  const training = await db.training.findFirst({
    where: { id: parsed.data.trainingId, organizationId: org.id },
    select: { id: true },
  });
  if (!training) return;

  await db.training.update({
    where: { id: training.id },
    data: { status: parsed.data.status },
  });
  revalidatePath("/treinamentos");
}

export async function deleteTraining(trainingId: string): Promise<void> {
  const { org } = await getContext();

  const training = await db.training.findFirst({
    where: { id: trainingId, organizationId: org.id },
    select: { id: true },
  });
  if (!training) return;

  await db.training.delete({ where: { id: training.id } });
  revalidatePath("/treinamentos");
}

// Cronograma padrão do setor de Mídia/Tráfego (jul–out/2026), definido junto
// com a liderança. Idempotente: só insere se a org ainda não tiver nenhum
// treinamento cadastrado, para não duplicar em cliques repetidos.
const DEFAULT_TRAININGS: Array<{
  title: string;
  description?: string;
  module: string;
  scheduledAt: string;
  focusVirtue?: Virtue;
}> = [
  {
    title: "Apresentação oficial do FOCEX",
    description: "Apresentação para equipe + CS. Guiar o CS sobre como introduzir a plataforma ao cliente final.",
    module: "Pendências",
    scheduledAt: "2026-07-21T09:00:00",
  },
  {
    title: "Entrega do manual de rotinas do FOCEX",
    description: "Documento padrão das abas de rotinas/pendências para os analistas.",
    module: "Pendências",
    scheduledAt: "2026-07-23T09:00:00",
  },
  {
    title: "S1 — Fundamentos do prompt + projetos no GPT",
    description: "Briefing, identidade visual, restrições, tom de voz; thread mestre de um cliente real.",
    module: "Mês 1 — Engenharia de Prompts e IA aplicada",
    scheduledAt: "2026-07-30T09:00:00",
    focusVirtue: "PRUDENCIA",
  },
  {
    title: "S2 — Claude para relatórios FOCEX",
    description: "Alimentar com dados brutos da planilha operacional (otimizações, anomalias, verba).",
    module: "Mês 1 — Engenharia de Prompts e IA aplicada",
    scheduledAt: "2026-08-06T09:00:00",
    focusVirtue: "PRUDENCIA",
  },
  {
    title: "S3 — Refinamento humano e senso crítico \"anti-robô\"",
    description: "Laboratório de erros: relatório 100% IA dissecado pelo time.",
    module: "Mês 1 — Engenharia de Prompts e IA aplicada",
    scheduledAt: "2026-08-13T09:00:00",
    focusVirtue: "PRUDENCIA",
  },
  {
    title: "S4 — IA no planejamento estratégico e copywriting",
    description: "Pesquisa de concorrentes, wireframes de LP, gatilhos éticos. Entregável: Biblioteca de Prompts da Foco.",
    module: "Mês 1 — Engenharia de Prompts e IA aplicada",
    scheduledAt: "2026-08-20T09:00:00",
    focusVirtue: "PRUDENCIA",
  },
  {
    title: "Treinamento comportamental (externo — Joana)",
    description: "Tema central: \"cumprir o combinado\" (check no SULTS, disponibilidade, registro de tarefas).",
    module: "Transição",
    scheduledAt: "2026-08-27T09:00:00",
    focusVirtue: "JUSTICA",
  },
  {
    title: "S1 — Método NAMTAB",
    description: "Testado / funcionou / observado / próximo passo; preencher ao vivo com conta real.",
    module: "Mês 2 — Análise, estratégia e método científico",
    scheduledAt: "2026-09-03T09:00:00",
    focusVirtue: "AUTOCONTROLE",
  },
  {
    title: "S2 — Auditoria e análise histórica",
    description: "Do check de 30 min (básico) à auditoria de 2h (avançado).",
    module: "Mês 2 — Análise, estratégia e método científico",
    scheduledAt: "2026-09-10T09:00:00",
    focusVirtue: "PRUDENCIA",
  },
  {
    title: "S3 — Os 8 passos do planejamento estratégico",
    description: "Da biblioteca de anúncios ao envio para criação.",
    module: "Mês 2 — Análise, estratégia e método científico",
    scheduledAt: "2026-09-17T09:00:00",
  },
  {
    title: "S4 — Otimização de campanhas por nível",
    description: "Discrepâncias, realocação de verba, campanhas com gasto zero.",
    module: "Mês 2 — Análise, estratégia e método científico",
    scheduledAt: "2026-09-24T09:00:00",
  },
  {
    title: "S1 — Google Meu Negócio / SEO local",
    description: "Auditoria trimestral, QR Code de avaliações, fotos via Zappy.",
    module: "Mês 3 — Expansão de negócio e retenção",
    scheduledAt: "2026-10-01T09:00:00",
    focusVirtue: "CARIDADE",
  },
  {
    title: "S2 — Novos criativos e roteiros",
    description: "Solicitações da 2ª semana do mês, roteiros de vídeo, planejamento visual.",
    module: "Mês 3 — Expansão de negócio e retenção",
    scheduledAt: "2026-10-08T09:00:00",
  },
  {
    title: "S3 — Relatório de 90 dias (SULTS)",
    description: "Compilar evolução: onde o cliente estava × onde está.",
    module: "Mês 3 — Expansão de negócio e retenção",
    scheduledAt: "2026-10-15T09:00:00",
  },
  {
    title: "S4 — Reuniões de resultados e postura avançada",
    description: "Traduzir métricas de plataforma em métricas de negócio; condução de call.",
    module: "Mês 3 — Expansão de negócio e retenção",
    scheduledAt: "2026-10-22T09:00:00",
    focusVirtue: "CORAGEM",
  },
];

export async function seedDefaultTrainings(): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const existing = await db.training.count({ where: { organizationId: org.id } });
  if (existing > 0) {
    return { ok: false, error: "Já existem treinamentos cadastrados nesta organização." };
  }

  await db.training.createMany({
    data: DEFAULT_TRAININGS.map((t) => ({
      organizationId: org.id,
      createdById: userId,
      title: t.title,
      description: t.description ?? null,
      module: t.module,
      scheduledAt: new Date(t.scheduledAt),
      focusVirtue: t.focusVirtue,
    })),
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "training.seedDefault",
    entity: "Training",
    metadata: { count: DEFAULT_TRAININGS.length },
  });

  revalidatePath("/treinamentos");
  return { ok: true };
}
