"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { startPracticeSchema, practiceMessageSchema } from "@/lib/validations/practice";
import { getScenario, type Band, type Difficulty } from "@/lib/feedback-scenarios";
import { buildDebrief, ruleBasedReply, type PracticeMessage } from "@/lib/feedback-trainer";
import { llmPersonaReply, llmCoach } from "@/server/services/feedback-trainer-llm";
import type { ActionResult } from "@/server/actions/team";
import type { Prisma } from "@prisma/client";

const MAX_LEADER_TURNS = 30;

function readMessages(raw: unknown): PracticeMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (m): m is PracticeMessage =>
      !!m &&
      typeof m === "object" &&
      ((m as PracticeMessage).role === "leader" || (m as PracticeMessage).role === "persona") &&
      typeof (m as PracticeMessage).content === "string",
  );
}

export async function startPractice(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = startPracticeSchema.safeParse({
    scenarioKey: formData.get("scenarioKey"),
    difficulty: formData.get("difficulty") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const scenario = getScenario(parsed.data.scenarioKey);
  if (!scenario) return { ok: false, error: "Cenário inexistente." };

  const practice = await db.feedbackPractice.create({
    data: {
      organizationId: org.id,
      userId,
      scenarioKey: scenario.key,
      difficulty: parsed.data.difficulty,
      messages: [
        { role: "persona", content: scenario.greeting, at: new Date().toISOString() },
      ] as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/treino-feedback");
  redirect(`/treino-feedback/${practice.id}`);
}

export type SendResult =
  | { ok: true; messages: PracticeMessage[]; trust: number; band: Band }
  | { ok: false; error: string };

export async function sendPracticeMessage(practiceId: string, content: string): Promise<SendResult> {
  const { org, userId } = await getContext();

  const parsed = practiceMessageSchema.safeParse({ practiceId, content });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const practice = await db.feedbackPractice.findFirst({
    where: { id: parsed.data.practiceId, organizationId: org.id, userId },
  });
  if (!practice) return { ok: false, error: "Treino não encontrado." };
  if (practice.status === "COMPLETED") return { ok: false, error: "Este treino já foi encerrado." };

  const scenario = getScenario(practice.scenarioKey);
  if (!scenario) return { ok: false, error: "Cenário inexistente." };
  const difficulty = practice.difficulty as Difficulty;

  const history = readMessages(practice.messages);
  const leaderTurns = history.filter((m) => m.role === "leader").length;
  if (leaderTurns >= MAX_LEADER_TURNS) {
    return { ok: false, error: "Limite de falas atingido. Encerre o treino para ver a avaliação." };
  }

  const leaderMsg: PracticeMessage = {
    role: "leader",
    content: parsed.data.content,
    at: new Date().toISOString(),
  };
  const withLeader = [...history, leaderMsg];
  const leaderTexts = withLeader.filter((m) => m.role === "leader").map((m) => m.content);

  const rules = ruleBasedReply(scenario, difficulty, leaderTexts);
  const llmText = await llmPersonaReply({
    scenario,
    difficulty,
    history: withLeader,
    trust: rules.trust,
    band: rules.band,
  });

  const reply: PracticeMessage = {
    role: "persona",
    content: llmText ?? rules.content,
    at: new Date().toISOString(),
  };
  const messages = [...withLeader, reply];

  await db.feedbackPractice.update({
    where: { id: practice.id },
    data: {
      messages: messages as unknown as Prisma.InputJsonValue,
      engine: llmText ? "llm" : "rules",
    },
  });

  return { ok: true, messages, trust: rules.trust, band: rules.band };
}

export async function finishPractice(practiceId: string): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const practice = await db.feedbackPractice.findFirst({
    where: { id: practiceId, organizationId: org.id, userId },
  });
  if (!practice) return { ok: false, error: "Treino não encontrado." };
  if (practice.status === "COMPLETED") return { ok: true };

  const scenario = getScenario(practice.scenarioKey);
  if (!scenario) return { ok: false, error: "Cenário inexistente." };
  const difficulty = practice.difficulty as Difficulty;

  const history = readMessages(practice.messages);
  const leaderTexts = history.filter((m) => m.role === "leader").map((m) => m.content);
  if (leaderTexts.length === 0) {
    return { ok: false, error: "Faça pelo menos uma fala antes de encerrar o treino." };
  }

  const debrief = buildDebrief(difficulty, leaderTexts);
  const coach = await llmCoach({ scenario, history, debrief });
  if (coach) debrief.coach = coach;

  await db.feedbackPractice.update({
    where: { id: practice.id },
    data: {
      status: "COMPLETED",
      score: debrief.score,
      debrief: debrief as unknown as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/treino-feedback");
  revalidatePath(`/treino-feedback/${practice.id}`);
  return { ok: true };
}

export async function deletePractice(practiceId: string): Promise<void> {
  const { org, userId } = await getContext();

  await db.feedbackPractice.deleteMany({
    where: { id: practiceId, organizationId: org.id, userId },
  });
  revalidatePath("/treino-feedback");
  redirect("/treino-feedback");
}
