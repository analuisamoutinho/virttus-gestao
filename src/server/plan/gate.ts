import { db } from "@/server/db";
import type { Organization } from "@prisma/client";
import { PLAN_LIMITS, type Feature } from "./limits";

// Gating central — chamado por server actions ANTES de qualquer criação.
// A UI nunca replica limites; apenas reage ao PlanLimitError.
export class PlanLimitError extends Error {
  constructor(
    public reason: "members" | "leaders" | "feature",
    public plan: Organization["plan"],
    message: string,
  ) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export async function assertCanAddMember(org: Organization): Promise<void> {
  const limit = PLAN_LIMITS[org.plan].maxMembers;
  if (!Number.isFinite(limit)) return;
  const count = await db.teamMember.count({
    where: { organizationId: org.id, active: true },
  });
  if (count >= limit) {
    throw new PlanLimitError(
      "members",
      org.plan,
      `Plano ${PLAN_LIMITS[org.plan].label} permite até ${limit} liderados.`,
    );
  }
}

export async function assertCanAddLeader(org: Organization): Promise<void> {
  const limit = PLAN_LIMITS[org.plan].maxLeaders;
  if (!Number.isFinite(limit)) return;
  const count = await db.user.count({
    where: { organizationId: org.id, role: { in: ["ADMIN", "LEADER"] } },
  });
  if (count >= limit) {
    throw new PlanLimitError(
      "leaders",
      org.plan,
      `Plano ${PLAN_LIMITS[org.plan].label} permite até ${limit} líderes.`,
    );
  }
}

export function hasFeature(org: Organization, feature: Feature): boolean {
  return PLAN_LIMITS[org.plan].features[feature];
}

export function assertFeature(org: Organization, feature: Feature): void {
  if (!hasFeature(org, feature)) {
    throw new PlanLimitError(
      "feature",
      org.plan,
      `Recurso indisponível no plano ${PLAN_LIMITS[org.plan].label}.`,
    );
  }
}
