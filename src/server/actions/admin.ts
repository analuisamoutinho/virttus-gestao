"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { writeAuditLog } from "@/server/audit";
import { updateUserRoleSchema } from "@/lib/validations/admin";
import type { ActionResult } from "@/server/actions/team";

export async function updateUserRole(userId: string, role: string): Promise<ActionResult> {
  const ctx = await getContext();
  if (ctx.role !== "ADMIN") return { ok: false, error: "Apenas administradores podem alterar papéis." };

  const parsed = updateUserRoleSchema.safeParse({ userId, role });
  if (!parsed.success) return { ok: false, error: "Dados inválidos." };

  if (parsed.data.userId === ctx.userId) {
    return { ok: false, error: "Você não pode alterar o seu próprio papel." };
  }

  const target = await db.user.findFirst({
    where: { id: parsed.data.userId, organizationId: ctx.org.id },
    select: { id: true, role: true },
  });
  if (!target) return { ok: false, error: "Usuário não encontrado nesta organização." };

  await db.user.update({ where: { id: target.id }, data: { role: parsed.data.role } });
  await writeAuditLog({
    organizationId: ctx.org.id,
    actorId: ctx.userId,
    action: "user.role",
    entity: "User",
    entityId: target.id,
    metadata: { from: target.role, to: parsed.data.role },
  });

  revalidatePath("/admin");
  return { ok: true };
}
