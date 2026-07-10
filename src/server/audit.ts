import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

// Log de auditoria para ações de RH/admin (LGPD). Best-effort: nunca quebra
// a operação principal.
export async function writeAuditLog(params: {
  organizationId: string;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.actorId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        metadata: params.metadata,
      },
    });
  } catch (err) {
    console.error("[audit] falha ao registrar log", err);
  }
}
