"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { writeAuditLog } from "@/server/audit";
import { submitManagerFeedbackSchema } from "@/lib/validations/manager-feedback";
import { DIMENSION_KEYS } from "@/lib/manager-feedback";
import { newAnonToken, weekStart } from "@/server/services/manager-feedback";
import type { ActionResult } from "@/server/actions/team";

// Pública (sem login): quem tem o link do gestor responde. Nada sobre quem
// enviou é lido ou guardado — nem sessão, nem IP, nem user-agent — e o horário
// é reduzido à semana. O `website` é um campo-isca invisível contra robôs.
export async function submitManagerFeedback(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  if (formData.get("website")) return { ok: true }; // robô: finge sucesso

  const ratings: Record<string, FormDataEntryValue | null> = {};
  for (const k of DIMENSION_KEYS) ratings[k] = formData.get(`rating_${k}`);

  const text = (name: string) => {
    const v = formData.get(name);
    return typeof v === "string" && v.trim() ? v : undefined;
  };

  const parsed = submitManagerFeedbackSchema.safeParse({
    token: formData.get("token"),
    ratings,
    keepText: text("keepText"),
    startText: text("startText"),
    stopText: text("stopText"),
  });
  if (!parsed.success) {
    const missingRating = DIMENSION_KEYS.some((k) => !ratings[k]);
    return {
      ok: false,
      error: missingRating
        ? "Dê uma nota de 1 a 5 em todas as perguntas."
        : (parsed.error.issues[0]?.message ?? "Dados inválidos."),
    };
  }

  const manager = await db.user.findUnique({
    where: { anonFeedbackToken: parsed.data.token },
    select: { id: true, organizationId: true },
  });
  if (!manager?.organizationId) {
    return { ok: false, error: "Este link não é mais válido. Peça um novo ao seu gestor." };
  }

  await db.managerFeedback.create({
    data: {
      organizationId: manager.organizationId,
      managerId: manager.id,
      ratings: parsed.data.ratings,
      keepText: parsed.data.keepText ?? null,
      startText: parsed.data.startText ?? null,
      stopText: parsed.data.stopText ?? null,
      weekOf: weekStart(new Date()),
    },
  });

  return { ok: true };
}

// Gera (ou rotaciona) o link do gestor. O próprio gestor ou um admin da org.
export async function regenerateFeedbackLink(targetUserId?: string): Promise<ActionResult> {
  const { org, userId, role } = await getContext();
  const targetId = targetUserId ?? userId;
  if (targetId !== userId && role !== "ADMIN") {
    return { ok: false, error: "Apenas o administrador pode gerar o link de outro gestor." };
  }

  const target = await db.user.findFirst({
    where: { id: targetId, organizationId: org.id },
    select: { id: true },
  });
  if (!target) return { ok: false, error: "Usuário não encontrado." };

  await db.user.update({
    where: { id: target.id },
    data: { anonFeedbackToken: newAnonToken() },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "managerFeedback.link",
    entity: "User",
    entityId: target.id,
  });

  revalidatePath("/feedback-gestor");
  revalidatePath("/admin");
  return { ok: true };
}
