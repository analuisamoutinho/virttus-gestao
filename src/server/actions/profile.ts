"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { assertMemberInOrg } from "@/server/members";
import { writeAuditLog } from "@/server/audit";
import { updateProfileSchema } from "@/lib/validations/profile";
import type { ActionResult } from "@/server/actions/team";

export async function updateProfile(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = updateProfileSchema.safeParse({
    teamMemberId: formData.get("teamMemberId"),
    feedbackPrefs: formData.get("feedbackPrefs") ?? undefined,
    motivators: formData.get("motivators") ?? undefined,
    communicationStyle: formData.get("communicationStyle") ?? undefined,
    strengths: formData.get("strengths") ?? undefined,
    watchouts: formData.get("watchouts") ?? undefined,
    aspirations: formData.get("aspirations") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { teamMemberId, ...fields } = parsed.data;
  await assertMemberInOrg(org.id, teamMemberId);

  await db.personalProfile.upsert({
    where: { teamMemberId },
    update: fields,
    create: { teamMemberId, ...fields },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "profile.update",
    entity: "PersonalProfile",
    entityId: teamMemberId,
  });

  revalidatePath(`/equipe/${teamMemberId}`);
  return { ok: true };
}
