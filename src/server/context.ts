import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import type { Organization, Role } from "@prisma/client";

export type AppContext = {
  userId: string;
  role: Role;
  org: Organization;
};

// Contexto autenticado + tenant resolvido, por request. Redireciona quando
// não há sessão (→ /login) ou quando o usuário ainda não tem org (→ /onboarding).
export const getContext = cache(async (): Promise<AppContext> => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id: userId, organizationId, role } = session.user;
  if (!organizationId) redirect("/onboarding");

  const org = await db.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org) redirect("/onboarding");

  return { userId, role, org };
});

// Versão que não redireciona — usada no fluxo de onboarding.
export const getSessionUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});
