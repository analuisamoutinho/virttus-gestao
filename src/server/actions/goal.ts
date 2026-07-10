"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { assertMemberInOrg } from "@/server/members";
import { writeAuditLog } from "@/server/audit";
import { createGoalSchema, updateKrSchema } from "@/lib/validations/goal";
import { goalProgress } from "@/server/services/okr";
import type { ActionResult } from "@/server/actions/team";

// Recalcula e persiste o progresso do objetivo a partir dos KRs.
async function recomputeGoalProgress(goalId: string): Promise<void> {
  const krs = await db.keyResult.findMany({
    where: { goalId },
    select: { current: true, target: true },
  });
  await db.goal.update({
    where: { id: goalId },
    data: { progress: goalProgress(krs) },
  });
}

export async function createGoal(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  // KRs chegam como arrays paralelos kr_title[], kr_target[], kr_unit[]
  const titles = formData.getAll("kr_title").map(String);
  const targets = formData.getAll("kr_target").map(String);
  const units = formData.getAll("kr_unit").map(String);
  const keyResults = titles
    .map((title, i) => ({ title, target: targets[i], unit: units[i] || undefined }))
    .filter((kr) => kr.title.trim() !== "");

  const parsed = createGoalSchema.safeParse({
    teamMemberId: formData.get("teamMemberId"),
    objective: formData.get("objective"),
    quarter: formData.get("quarter"),
    keyResults,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await assertMemberInOrg(org.id, parsed.data.teamMemberId);

  const goal = await db.goal.create({
    data: {
      organizationId: org.id,
      teamMemberId: parsed.data.teamMemberId,
      objective: parsed.data.objective,
      quarter: parsed.data.quarter,
      keyResults: {
        create: parsed.data.keyResults.map((kr) => ({
          title: kr.title,
          target: kr.target,
          unit: kr.unit || null,
        })),
      },
    },
  });
  await recomputeGoalProgress(goal.id);
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "goal.create",
    entity: "Goal",
    entityId: goal.id,
  });

  revalidatePath("/metas");
  return { ok: true };
}

export async function updateKeyResult(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org } = await getContext();

  const parsed = updateKrSchema.safeParse({
    keyResultId: formData.get("keyResultId"),
    current: formData.get("current"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  // Isolamento: KR precisa pertencer a um goal da org.
  const kr = await db.keyResult.findFirst({
    where: { id: parsed.data.keyResultId, goal: { organizationId: org.id } },
    select: { id: true, goalId: true },
  });
  if (!kr) return { ok: false, error: "Key result não encontrado." };

  await db.keyResult.update({
    where: { id: kr.id },
    data: { current: parsed.data.current },
  });
  await recomputeGoalProgress(kr.goalId);

  revalidatePath("/metas");
  return { ok: true };
}
