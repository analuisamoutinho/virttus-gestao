"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { assertMemberInOrg } from "@/server/members";
import { assertFeature, PlanLimitError } from "@/server/plan/gate";
import { writeAuditLog } from "@/server/audit";
import { createConversationScriptSchema } from "@/lib/validations/conversation";
import { generateConversationScript } from "@/server/services/conversation-engine";
import type { ActionResult } from "@/server/actions/team";

export async function createConversationScript(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const { org, userId } = await getContext();

  try {
    assertFeature(org, "conversation_builder");
  } catch (err) {
    if (err instanceof PlanLimitError) return { ok: false, error: err.message };
    throw err;
  }

  const parsed = createConversationScriptSchema.safeParse({
    teamMemberId: formData.get("teamMemberId"),
    type: formData.get("type"),
    situation: formData.get("situation"),
    focusVirtue: formData.get("focusVirtue"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await assertMemberInOrg(org.id, parsed.data.teamMemberId);

  const member = await db.teamMember.findFirst({
    where: { id: parsed.data.teamMemberId, organizationId: org.id },
    include: { profile: true },
  });
  if (!member) return { ok: false, error: "Liderado não encontrado." };

  const focusVirtue = parsed.data.focusVirtue || null;
  const script = generateConversationScript({
    memberName: member.name,
    type: parsed.data.type,
    situation: parsed.data.situation,
    focusVirtue,
    profile: member.profile,
  });

  const saved = await db.conversationScript.create({
    data: {
      organizationId: org.id,
      teamMemberId: member.id,
      type: parsed.data.type,
      situation: parsed.data.situation,
      focusVirtue,
      opening: script.opening,
      questions: script.questions,
      closing: script.closing,
      engine: "rules",
    },
  });

  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "conversation.create",
    entity: "ConversationScript",
    entityId: saved.id,
  });

  revalidatePath("/conversa");
  return { ok: true };
}
