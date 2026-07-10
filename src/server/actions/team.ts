"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { getContext } from "@/server/context";
import { assertCanAddMember, PlanLimitError } from "@/server/plan/gate";
import { writeAuditLog } from "@/server/audit";
import { createOrgSchema, addMemberSchema } from "@/lib/validations/team";
import { slugify } from "@/lib/slug";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Cria a organização e promove o usuário a ADMIN. Passo 0 do onboarding.
export async function createOrganization(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sessão expirada." };

  const parsed = createOrgSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existing = await db.user.findUnique({
    where: { id: session.user.id },
    select: { organizationId: true },
  });
  if (existing?.organizationId) redirect("/onboarding");

  // slug único
  const base = slugify(parsed.data.name) || "org";
  let slug = base;
  for (let i = 1; await db.organization.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  const org = await db.organization.create({
    data: {
      name: parsed.data.name,
      slug,
      users: { connect: { id: session.user.id } },
    },
  });
  await db.user.update({
    where: { id: session.user.id },
    data: { organizationId: org.id, role: "ADMIN" },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: session.user.id,
    action: "org.create",
    entity: "Organization",
    entityId: org.id,
  });

  redirect("/onboarding");
}

// Adiciona liderado — gating de plano aplicado ANTES da criação.
export async function addTeamMember(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = addMemberSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role") ?? undefined,
    email: formData.get("email") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await assertCanAddMember(org);
  } catch (err) {
    if (err instanceof PlanLimitError) return { ok: false, error: err.message };
    throw err;
  }

  const member = await db.teamMember.create({
    data: {
      organizationId: org.id,
      leaderId: userId,
      name: parsed.data.name,
      role: parsed.data.role || null,
      email: parsed.data.email || null,
      profile: { create: {} },
    },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "member.create",
    entity: "TeamMember",
    entityId: member.id,
  });

  revalidatePath("/onboarding");
  revalidatePath("/equipe");
  return { ok: true };
}

export async function finishOnboarding(): Promise<void> {
  const { org } = await getContext();
  await db.organization.update({
    where: { id: org.id },
    data: { onboardedAt: new Date() },
  });
  redirect("/dashboard");
}
