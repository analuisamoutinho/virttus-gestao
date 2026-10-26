"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { writeAuditLog } from "@/server/audit";
import { createResourceSchema } from "@/lib/validations/resource";
import type { ActionResult } from "@/server/actions/team";
import type { Virtue } from "@prisma/client";

const emptyToUndef = (v: FormDataEntryValue | null) => (v === null || v === "" ? undefined : v);

export async function createResource(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = createResourceSchema.safeParse({
    type: emptyToUndef(formData.get("type")),
    title: formData.get("title"),
    author: emptyToUndef(formData.get("author")),
    url: emptyToUndef(formData.get("url")),
    description: emptyToUndef(formData.get("description")),
    focusVirtue: emptyToUndef(formData.get("focusVirtue")),
    tags: emptyToUndef(formData.get("tags")),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const d = parsed.data;

  const resource = await db.devResource.create({
    data: {
      organizationId: org.id,
      createdById: userId,
      type: d.type,
      title: d.title,
      author: d.author ?? null,
      url: d.url ?? null,
      description: d.description ?? null,
      focusVirtue: (d.focusVirtue || undefined) as Virtue | undefined,
      tags: d.tags,
    },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "resource.create",
    entity: "DevResource",
    entityId: resource.id,
  });

  revalidatePath("/central");
  return { ok: true };
}

export async function toggleResourcePin(resourceId: string): Promise<void> {
  const { org } = await getContext();

  const resource = await db.devResource.findFirst({
    where: { id: resourceId, organizationId: org.id },
    select: { id: true, pinned: true },
  });
  if (!resource) return;

  await db.devResource.update({ where: { id: resource.id }, data: { pinned: !resource.pinned } });
  revalidatePath("/central");
}

export async function deleteResource(resourceId: string): Promise<void> {
  const { org } = await getContext();

  const resource = await db.devResource.findFirst({
    where: { id: resourceId, organizationId: org.id },
    select: { id: true },
  });
  if (!resource) return;

  await db.devResource.delete({ where: { id: resource.id } });
  revalidatePath("/central");
}
