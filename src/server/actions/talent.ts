"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { writeAuditLog } from "@/server/audit";
import { jobOpeningSchema, candidateSchema, virtueRatingsSchema, CANDIDATE_STATUSES } from "@/lib/validations/talent";
import { VIRTUES } from "@/lib/virtues";
import type { ActionResult } from "@/server/actions/team";
import { Prisma, type Virtue } from "@prisma/client";

const emptyToUndef = (v: FormDataEntryValue | null) => (v === null || v === "" ? undefined : v);

function openingInput(formData: FormData) {
  return {
    title: formData.get("title"),
    area: emptyToUndef(formData.get("area")),
    location: emptyToUndef(formData.get("location")),
    description: emptyToUndef(formData.get("description")),
    status: emptyToUndef(formData.get("status")),
    requiredSkills: emptyToUndef(formData.get("requiredSkills")),
    desiredSkills: emptyToUndef(formData.get("desiredSkills")),
    minYears: emptyToUndef(formData.get("minYears")),
    salaryMin: emptyToUndef(formData.get("salaryMin")),
    salaryMax: emptyToUndef(formData.get("salaryMax")),
    targetVirtues: formData.getAll("targetVirtues"),
  };
}

export async function createOpening(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = jobOpeningSchema.safeParse(openingInput(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  const opening = await db.jobOpening.create({
    data: {
      organizationId: org.id,
      createdById: userId,
      title: d.title,
      area: d.area ?? null,
      location: d.location ?? null,
      description: d.description ?? null,
      status: d.status,
      requiredSkills: d.requiredSkills,
      desiredSkills: d.desiredSkills,
      minYears: d.minYears,
      salaryMin: d.salaryMin ?? null,
      salaryMax: d.salaryMax ?? null,
      targetVirtues: d.targetVirtues as Virtue[],
    },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "opening.create",
    entity: "JobOpening",
    entityId: opening.id,
  });

  revalidatePath("/talentos");
  return { ok: true };
}

export async function updateOpening(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const openingId = String(formData.get("openingId") ?? "");
  const parsed = jobOpeningSchema.safeParse(openingInput(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  const existing = await db.jobOpening.findFirst({
    where: { id: openingId, organizationId: org.id },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Vaga não encontrada." };

  await db.jobOpening.update({
    where: { id: existing.id },
    data: {
      title: d.title,
      area: d.area ?? null,
      location: d.location ?? null,
      description: d.description ?? null,
      status: d.status,
      requiredSkills: d.requiredSkills,
      desiredSkills: d.desiredSkills,
      minYears: d.minYears,
      salaryMin: d.salaryMin ?? null,
      salaryMax: d.salaryMax ?? null,
      targetVirtues: d.targetVirtues as Virtue[],
    },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "opening.update",
    entity: "JobOpening",
    entityId: existing.id,
  });

  revalidatePath("/talentos");
  revalidatePath(`/talentos/vagas/${existing.id}`);
  return { ok: true };
}

export async function deleteOpening(openingId: string): Promise<void> {
  const { org, userId } = await getContext();

  const existing = await db.jobOpening.findFirst({
    where: { id: openingId, organizationId: org.id },
    select: { id: true },
  });
  if (!existing) return;

  // Candidatos permanecem no banco de talentos (openingId vira null).
  await db.jobOpening.delete({ where: { id: existing.id } });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "opening.delete",
    entity: "JobOpening",
    entityId: existing.id,
  });
  revalidatePath("/talentos");
  redirect("/talentos");
}

function candidateInput(formData: FormData) {
  return {
    name: formData.get("name"),
    email: emptyToUndef(formData.get("email")),
    phone: emptyToUndef(formData.get("phone")),
    linkedinUrl: emptyToUndef(formData.get("linkedinUrl")),
    currentRole: emptyToUndef(formData.get("currentRole")),
    location: emptyToUndef(formData.get("location")),
    source: emptyToUndef(formData.get("source")),
    openingId: emptyToUndef(formData.get("openingId")),
    yearsExperience: emptyToUndef(formData.get("yearsExperience")),
    skills: emptyToUndef(formData.get("skills")),
    salaryExpectation: emptyToUndef(formData.get("salaryExpectation")),
    resumeText: emptyToUndef(formData.get("resumeText")),
    notes: emptyToUndef(formData.get("notes")),
    status: emptyToUndef(formData.get("status")),
    interviewRating: emptyToUndef(formData.get("interviewRating")),
  };
}

// Notas por virtude vêm como campos `virtue_<CHAVE>` (1–5); vazio = não avaliada.
function readVirtueRatings(formData: FormData): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  const out: Record<string, number> = {};
  for (const v of VIRTUES) {
    const raw = formData.get(`virtue_${v.key}`);
    if (raw === null || raw === "") continue;
    out[v.key] = Number(raw);
  }
  const parsed = virtueRatingsSchema.safeParse(out);
  return parsed.success && Object.keys(parsed.data).length > 0
    ? (parsed.data as Prisma.InputJsonValue)
    : Prisma.JsonNull;
}

async function assertOpeningInOrg(orgId: string, openingId: string | undefined) {
  if (!openingId) return true;
  const found = await db.jobOpening.findFirst({
    where: { id: openingId, organizationId: orgId },
    select: { id: true },
  });
  return !!found;
}

export async function createCandidate(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = candidateSchema.safeParse(candidateInput(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;
  if (!(await assertOpeningInOrg(org.id, d.openingId))) {
    return { ok: false, error: "Vaga não encontrada." };
  }

  const candidate = await db.candidate.create({
    data: {
      organizationId: org.id,
      createdById: userId,
      openingId: d.openingId ?? null,
      name: d.name,
      email: d.email ?? null,
      phone: d.phone ?? null,
      linkedinUrl: d.linkedinUrl ?? null,
      currentRole: d.currentRole ?? null,
      location: d.location ?? null,
      source: d.source ?? null,
      yearsExperience: d.yearsExperience,
      skills: d.skills,
      salaryExpectation: d.salaryExpectation ?? null,
      resumeText: d.resumeText ?? null,
      notes: d.notes ?? null,
      status: d.status,
      interviewRating: d.interviewRating ?? null,
    },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "candidate.create",
    entity: "Candidate",
    entityId: candidate.id,
  });

  revalidatePath("/talentos");
  return { ok: true };
}

export async function updateCandidate(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const candidateId = String(formData.get("candidateId") ?? "");
  const parsed = candidateSchema.safeParse(candidateInput(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  const existing = await db.candidate.findFirst({
    where: { id: candidateId, organizationId: org.id },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Candidato não encontrado." };
  if (!(await assertOpeningInOrg(org.id, d.openingId))) {
    return { ok: false, error: "Vaga não encontrada." };
  }

  await db.candidate.update({
    where: { id: existing.id },
    data: {
      openingId: d.openingId ?? null,
      name: d.name,
      email: d.email ?? null,
      phone: d.phone ?? null,
      linkedinUrl: d.linkedinUrl ?? null,
      currentRole: d.currentRole ?? null,
      location: d.location ?? null,
      source: d.source ?? null,
      yearsExperience: d.yearsExperience,
      skills: d.skills,
      salaryExpectation: d.salaryExpectation ?? null,
      resumeText: d.resumeText ?? null,
      notes: d.notes ?? null,
      status: d.status,
      interviewRating: d.interviewRating ?? null,
      virtueRatings: readVirtueRatings(formData),
    },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "candidate.update",
    entity: "Candidate",
    entityId: existing.id,
  });

  revalidatePath("/talentos");
  revalidatePath(`/talentos/candidatos/${existing.id}`);
  return { ok: true };
}

export async function updateCandidateStatus(candidateId: string, status: string): Promise<void> {
  const { org, userId } = await getContext();
  if (!(CANDIDATE_STATUSES as readonly string[]).includes(status)) return;

  const existing = await db.candidate.findFirst({
    where: { id: candidateId, organizationId: org.id },
    select: { id: true },
  });
  if (!existing) return;

  await db.candidate.update({
    where: { id: existing.id },
    data: { status: status as (typeof CANDIDATE_STATUSES)[number] },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "candidate.status",
    entity: "Candidate",
    entityId: existing.id,
    metadata: { status },
  });
  revalidatePath("/talentos");
}

export async function deleteCandidate(candidateId: string): Promise<void> {
  const { org, userId } = await getContext();

  const existing = await db.candidate.findFirst({
    where: { id: candidateId, organizationId: org.id },
    select: { id: true },
  });
  if (!existing) return;

  await db.candidate.delete({ where: { id: existing.id } });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "candidate.delete",
    entity: "Candidate",
    entityId: existing.id,
  });
  revalidatePath("/talentos");
  redirect("/talentos");
}
