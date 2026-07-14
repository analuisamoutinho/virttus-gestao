"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { getContext } from "@/server/context";
import { assertCanAddMember, PlanLimitError } from "@/server/plan/gate";
import { assertMemberInOrg } from "@/server/members";
import { writeAuditLog } from "@/server/audit";
import {
  createOrgSchema,
  addMemberSchema,
  updateTeamMemberSchema,
  removeTeamMemberSchema,
} from "@/lib/validations/team";
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
  if (existing?.organizationId) redirect("/equipe");

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
      onboardedAt: new Date(),
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

  redirect("/equipe");
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

// Edita nome/cargo/e-mail de um liderado já cadastrado.
export async function updateTeamMember(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = updateTeamMemberSchema.safeParse({
    teamMemberId: formData.get("teamMemberId"),
    name: formData.get("name"),
    role: formData.get("role") ?? undefined,
    email: formData.get("email") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await assertMemberInOrg(org.id, parsed.data.teamMemberId);

  await db.teamMember.update({
    where: { id: parsed.data.teamMemberId },
    data: {
      name: parsed.data.name,
      role: parsed.data.role || null,
      email: parsed.data.email || null,
    },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "member.update",
    entity: "TeamMember",
    entityId: parsed.data.teamMemberId,
  });

  revalidatePath("/equipe");
  revalidatePath(`/equipe/${parsed.data.teamMemberId}`);
  return { ok: true };
}

// Remove um liderado (soft delete — histórico é preservado, só some das listas ativas).
export async function removeTeamMember(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = removeTeamMemberSchema.safeParse({
    teamMemberId: formData.get("teamMemberId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Liderado inválido." };
  }

  await assertMemberInOrg(org.id, parsed.data.teamMemberId);

  await db.teamMember.update({
    where: { id: parsed.data.teamMemberId },
    data: { active: false },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "member.remove",
    entity: "TeamMember",
    entityId: parsed.data.teamMemberId,
  });

  revalidatePath("/equipe");
  redirect("/equipe");
}
