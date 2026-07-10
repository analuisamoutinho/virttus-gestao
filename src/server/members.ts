import { db } from "@/server/db";

// Garante que o liderado pertence à organização do contexto. Toda action que
// recebe um teamMemberId do cliente DEVE passar por aqui (isolamento LGPD).
export async function assertMemberInOrg(
  organizationId: string,
  teamMemberId: string,
): Promise<void> {
  const found = await db.teamMember.findFirst({
    where: { id: teamMemberId, organizationId },
    select: { id: true },
  });
  if (!found) throw new Error("Liderado não encontrado nesta organização.");
}

export function listMembers(organizationId: string) {
  return db.teamMember.findMany({
    where: { organizationId, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
}
