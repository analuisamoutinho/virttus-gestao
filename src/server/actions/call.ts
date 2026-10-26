"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { writeAuditLog } from "@/server/audit";
import { createCallSchema, saveTranscriptSchema } from "@/lib/validations/call";
import { cleanTranscript } from "@/lib/transcript";
import type { ActionResult } from "@/server/actions/team";

const emptyToUndef = (v: FormDataEntryValue | null) => (v === null || v === "" ? undefined : v);

export async function createCall(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = createCallSchema.safeParse({
    title: formData.get("title"),
    kind: emptyToUndef(formData.get("kind")),
    scheduledAt: formData.get("scheduledAt"),
    durationMin: emptyToUndef(formData.get("durationMin")),
    meetingUrl: emptyToUndef(formData.get("meetingUrl")),
    participants: emptyToUndef(formData.get("participants")),
    notes: emptyToUndef(formData.get("notes")),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const call = await db.call.create({
    data: {
      organizationId: org.id,
      createdById: userId,
      title: parsed.data.title,
      kind: parsed.data.kind,
      scheduledAt: parsed.data.scheduledAt,
      durationMin: parsed.data.durationMin,
      meetingUrl: parsed.data.meetingUrl ?? null,
      participants: parsed.data.participants ?? null,
      notes: parsed.data.notes ?? null,
    },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "call.create",
    entity: "Call",
    entityId: call.id,
  });

  revalidatePath("/calls");
  return { ok: true };
}

export async function deleteCall(callId: string): Promise<void> {
  const { org, userId } = await getContext();

  const call = await db.call.findFirst({
    where: { id: callId, organizationId: org.id },
    select: { id: true },
  });
  if (!call) return;

  await db.call.delete({ where: { id: call.id } });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "call.delete",
    entity: "Call",
    entityId: call.id,
  });
  revalidatePath("/calls");
  redirect("/calls");
}

export async function saveTranscript(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = saveTranscriptSchema.safeParse({
    callId: formData.get("callId"),
    content: formData.get("content"),
    source: emptyToUndef(formData.get("source")),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const call = await db.call.findFirst({
    where: { id: parsed.data.callId, organizationId: org.id },
    select: { id: true },
  });
  if (!call) return { ok: false, error: "Call não encontrada." };

  const content = cleanTranscript(parsed.data.content);
  if (content.length < 10) return { ok: false, error: "A transcrição ficou vazia após a limpeza." };

  await db.callTranscript.upsert({
    where: { callId: call.id },
    create: { callId: call.id, organizationId: org.id, content, source: parsed.data.source },
    update: { content, source: parsed.data.source },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "call.transcript.save",
    entity: "Call",
    entityId: call.id,
  });

  revalidatePath("/calls");
  revalidatePath(`/calls/${call.id}`);
  return { ok: true };
}

export async function deleteTranscript(callId: string): Promise<void> {
  const { org, userId } = await getContext();

  const transcript = await db.callTranscript.findFirst({
    where: { callId, organizationId: org.id },
    select: { id: true },
  });
  if (!transcript) return;

  await db.callTranscript.delete({ where: { id: transcript.id } });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "call.transcript.delete",
    entity: "Call",
    entityId: callId,
  });
  revalidatePath(`/calls/${callId}`);
}
