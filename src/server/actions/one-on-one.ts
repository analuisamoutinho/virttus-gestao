"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { assertMemberInOrg } from "@/server/members";
import { writeAuditLog } from "@/server/audit";
import {
  createOneOnOneSchema,
  completeOneOnOneSchema,
  addActionItemSchema,
} from "@/lib/validations/one-on-one";
import type { ActionResult } from "@/server/actions/team";

const emptyToNull = (v: FormDataEntryValue | null) =>
  v === null || v === "" ? undefined : v;

export async function createOneOnOne(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = createOneOnOneSchema.safeParse({
    teamMemberId: formData.get("teamMemberId"),
    scheduledAt: formData.get("scheduledAt"),
    agenda: emptyToNull(formData.get("agenda")),
    focusVirtue: emptyToNull(formData.get("focusVirtue")),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await assertMemberInOrg(org.id, parsed.data.teamMemberId);

  const created = await db.oneOnOne.create({
    data: {
      organizationId: org.id,
      teamMemberId: parsed.data.teamMemberId,
      scheduledAt: parsed.data.scheduledAt,
      agenda: parsed.data.agenda || null,
      focusVirtue: parsed.data.focusVirtue ? parsed.data.focusVirtue : null,
      status: "SCHEDULED",
    },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "oneonone.create",
    entity: "OneOnOne",
    entityId: created.id,
  });

  revalidatePath("/um-a-um");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function completeOneOnOne(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = completeOneOnOneSchema.safeParse({
    oneOnOneId: formData.get("oneOnOneId"),
    notes: emptyToNull(formData.get("notes")),
    mood: emptyToNull(formData.get("mood")),
    focusVirtue: emptyToNull(formData.get("focusVirtue")),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  // Isolamento: só atualiza se o 1:1 for da org.
  const existing = await db.oneOnOne.findFirst({
    where: { id: parsed.data.oneOnOneId, organizationId: org.id },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "1:1 não encontrado." };

  await db.oneOnOne.update({
    where: { id: existing.id },
    data: {
      status: "DONE",
      notes: parsed.data.notes || null,
      mood: parsed.data.mood ?? null,
      focusVirtue: parsed.data.focusVirtue ? parsed.data.focusVirtue : undefined,
    },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "oneonone.complete",
    entity: "OneOnOne",
    entityId: existing.id,
  });

  revalidatePath("/um-a-um");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function addActionItem(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org } = await getContext();

  const parsed = addActionItemSchema.safeParse({
    oneOnOneId: formData.get("oneOnOneId"),
    text: formData.get("text"),
    dueDate: emptyToNull(formData.get("dueDate")),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const parent = await db.oneOnOne.findFirst({
    where: { id: parsed.data.oneOnOneId, organizationId: org.id },
    select: { id: true },
  });
  if (!parent) return { ok: false, error: "1:1 não encontrado." };

  await db.actionItem.create({
    data: {
      oneOnOneId: parent.id,
      text: parsed.data.text,
      dueDate: parsed.data.dueDate ?? null,
    },
  });

  revalidatePath("/um-a-um");
  return { ok: true };
}

export async function toggleActionItem(id: string, done: boolean): Promise<void> {
  const { org } = await getContext();
  // Verifica pertencimento via join com o 1:1 da org.
  const item = await db.actionItem.findFirst({
    where: { id, oneOnOne: { organizationId: org.id } },
    select: { id: true },
  });
  if (!item) return;
  await db.actionItem.update({ where: { id: item.id }, data: { done } });
  revalidatePath("/um-a-um");
}
