"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { assertMemberInOrg } from "@/server/members";
import { writeAuditLog } from "@/server/audit";
import {
  createPdiSchema,
  addPdiActionSchema,
  updatePdiActionSchema,
} from "@/lib/validations/pdi";
import type { ActionResult } from "@/server/actions/team";

const emptyToNull = (v: FormDataEntryValue | null) =>
  v === null || v === "" ? undefined : v;

export async function createPdi(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = createPdiSchema.safeParse({
    teamMemberId: formData.get("teamMemberId"),
    quarter: formData.get("quarter"),
    focusVirtue: formData.get("focusVirtue"),
    competency: formData.get("competency"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await assertMemberInOrg(org.id, parsed.data.teamMemberId);

  // Regra: 1 PDI por liderado por trimestre (unique no schema).
  const dup = await db.pDI.findFirst({
    where: { teamMemberId: parsed.data.teamMemberId, quarter: parsed.data.quarter },
    select: { id: true },
  });
  if (dup) {
    return {
      ok: false,
      error: "Já existe um PDI para este liderado neste trimestre.",
    };
  }

  const pdi = await db.pDI.create({
    data: {
      organizationId: org.id,
      teamMemberId: parsed.data.teamMemberId,
      quarter: parsed.data.quarter,
      focusVirtue: parsed.data.focusVirtue,
      competency: parsed.data.competency,
    },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "pdi.create",
    entity: "PDI",
    entityId: pdi.id,
  });

  revalidatePath("/pdi");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function addPdiAction(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org } = await getContext();

  const parsed = addPdiActionSchema.safeParse({
    pdiId: formData.get("pdiId"),
    text: formData.get("text"),
    dueDate: emptyToNull(formData.get("dueDate")),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const pdi = await db.pDI.findFirst({
    where: { id: parsed.data.pdiId, organizationId: org.id },
    select: { id: true },
  });
  if (!pdi) return { ok: false, error: "PDI não encontrado." };

  await db.pDIAction.create({
    data: {
      pdiId: pdi.id,
      text: parsed.data.text,
      dueDate: parsed.data.dueDate ?? null,
    },
  });

  revalidatePath("/pdi");
  return { ok: true };
}

export async function updatePdiAction(
  actionId: string,
  data: { done?: boolean; evidence?: string },
): Promise<void> {
  const { org } = await getContext();

  const parsed = updatePdiActionSchema.safeParse({ actionId, ...data });
  if (!parsed.success) return;

  const item = await db.pDIAction.findFirst({
    where: { id: actionId, pdi: { organizationId: org.id } },
    select: { id: true },
  });
  if (!item) return;

  await db.pDIAction.update({
    where: { id: item.id },
    data: {
      done: parsed.data.done,
      evidence: parsed.data.evidence,
    },
  });
  revalidatePath("/pdi");
}
