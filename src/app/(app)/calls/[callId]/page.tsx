import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, PageHeader, SectionTitle, Badge, ButtonLink, Icon } from "@/components/ui";
import { CALL_KIND_META } from "@/lib/call-kinds";
import { extractHighlights } from "@/lib/transcript";
import { formatDateTime } from "@/lib/format";
import { DeleteCallButton, DeleteTranscriptButton, TranscriptForm } from "../CallForms";

export default async function CallDetailPage({ params }: { params: { callId: string } }) {
  const { org } = await getContext();

  const call = await db.call.findFirst({
    where: { id: params.callId, organizationId: org.id },
    include: { transcript: true },
  });
  if (!call) notFound();

  const meta = CALL_KIND_META[call.kind];
  const highlights = call.transcript ? extractHighlights(call.transcript.content) : null;

  return (
    <div>
      <PageHeader
        icon="calendar"
        eyebrow={meta.label}
        title={call.title}
        subtitle={`${formatDateTime(call.scheduledAt)} · ${call.durationMin} min`}
        actions={
          <>
            <ButtonLink href="/calls" variant="outline" size="sm" icon="chevronLeft">
              Calendário
            </ButtonLink>
            <DeleteCallButton callId={call.id} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <SectionTitle
              hint={
                call.transcript
                  ? `Origem: ${call.transcript.source === "upload" ? "arquivo importado" : "colada manualmente"} · atualizada em ${formatDateTime(call.transcript.updatedAt)}`
                  : "Ainda sem transcrição."
              }
              action={call.transcript ? <DeleteTranscriptButton callId={call.id} /> : null}
            >
              Transcrição
            </SectionTitle>
            {call.transcript ? (
              <>
                <pre className="max-h-[560px] overflow-y-auto whitespace-pre-wrap rounded-sm bg-bg p-4 font-sans text-sm leading-relaxed text-deep">
                  {call.transcript.content}
                </pre>
                <details className="group mt-4">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-purple hover:underline">
                    Substituir transcrição
                  </summary>
                  <div className="mt-3">
                    <TranscriptForm callId={call.id} initialContent={call.transcript.content} />
                  </div>
                </details>
              </>
            ) : (
              <TranscriptForm callId={call.id} />
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <SectionTitle>Detalhes</SectionTitle>
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Tipo</dt>
                <dd className="mt-1">
                  <Badge tone="deep">{meta.label}</Badge>
                </dd>
              </div>
              {call.participants ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Participantes</dt>
                  <dd className="mt-1 text-deep">{call.participants}</dd>
                </div>
              ) : null}
              {call.meetingUrl ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Reunião</dt>
                  <dd className="mt-1">
                    <a
                      href={call.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-blue hover:underline"
                    >
                      Abrir link <Icon.external width={14} height={14} />
                    </a>
                  </dd>
                </div>
              ) : null}
              {call.notes ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Pauta</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-deep">{call.notes}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          {highlights && (highlights.decisions.length > 0 || highlights.actionItems.length > 0) ? (
            <Card>
              <SectionTitle hint="Trechos com marcadores de decisão ou encaminhamento (busca por palavras-chave).">
                Destaques
              </SectionTitle>
              {highlights.decisions.length > 0 ? (
                <div className="mb-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-purple">Decisões</p>
                  <ul className="flex list-disc flex-col gap-1.5 pl-4 text-sm text-deep">
                    {highlights.decisions.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {highlights.actionItems.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-blue">Próximos passos</p>
                  <ul className="flex list-disc flex-col gap-1.5 pl-4 text-sm text-deep">
                    {highlights.actionItems.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </Card>
          ) : null}

          <Link href="/calls" className="text-xs font-semibold text-muted hover:text-deep">
            ← Voltar ao calendário
          </Link>
        </div>
      </div>
    </div>
  );
}
