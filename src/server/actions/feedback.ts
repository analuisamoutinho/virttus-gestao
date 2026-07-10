"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { assertMemberInOrg } from "@/server/members";
import { writeAuditLog } from "@/server/audit";
import { createFeedbackSchema } from "@/lib/validations/feedback";
import type { ActionResult } from "@/server/actions/team";

const emptyToNull = (v: FormDataEntryValue | null) =>
  v === null || v === "" ? undefined : v;

export async function createFeedback(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = createFeedbackSchema.safeParse({
    teamMemberId: formData.get("teamMemberId"),
    type: formData.get("type"),
    situation: formData.get("situation"),
    behavior: formData.get("behavior"),
    impact: formData.get("impact"),
    virtue: emptyToNull(formData.get("virtue")),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await assertMemberInOrg(org.id, parsed.data.teamMemberId);

  const created = await db.feedback.create({
    data: {
      organizationId: org.id,
      teamMemberId: parsed.data.teamMemberId,
      authorId: userId,
      type: parsed.data.type,
      situation: parsed.data.situation,
      behavior: parsed.data.behavior,
      impact: parsed.data.impact,
      virtue: parsed.data.virtue ? parsed.data.virtue : null,
    },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "feedback.create",
    entity: "Feedback",
    entityId: created.id,
    metadata: { type: parsed.data.type },
  });

  revalidatePath("/feedback");
  return { ok: true };
}
