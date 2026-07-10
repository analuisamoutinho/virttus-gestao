import Link from "next/link";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { listMembers } from "@/server/members";
import { Card, EmptyState } from "@/components/ui";
import { VirtueBadge } from "@/components/VirtueBadge";
import { formatDateTime } from "@/lib/format";
import {
  NewOneOnOneForm,
  CompleteOneOnOneForm,
  AddActionItemForm,
} from "./OneOnOneForms";
import { ActionItemToggle } from "./ActionItemToggle";

export default async function OneOnOnePage() {
  const { org } = await getContext();

  const [members, oneOnOnes] = await Promise.all([
    listMembers(org.id),
    db.oneOnOne.findMany({
      where: { organizationId: org.id },
      orderBy: { scheduledAt: "desc" },
      take: 50,
      include: {
        teamMember: { select: { id: true, name: true } },
        actionItems: { orderBy: { done: "asc" } },
      },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-sora text-2xl font-bold text-deep">1:1s</h1>

      {members.length === 0 ? (
        <EmptyState
          icon="◍"
          title="Cadastre a equipe primeiro"
          description="Você precisa de pelo menos um liderado para agendar 1:1s."
          action={
            <Link href="/equipe" className="text-sm font-semibold text-purple">
              Ir para Equipe →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-3">
            {oneOnOnes.length === 0 ? (
              <EmptyState
                icon="◍"
                title="Nenhum 1:1 ainda"
                description="Agende o primeiro 1:1 usando o formulário ao lado. Pauta, notas, mood e ações ficam registrados no histórico."
              />
            ) : (
              oneOnOnes.map((o) => (
                <Card key={o.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/equipe/${o.teamMember.id}`}
                        className="font-sora text-sm font-semibold text-deep hover:text-blue"
                      >
                        {o.teamMember.name}
                      </Link>
                      <p className="text-xs text-muted">{formatDateTime(o.scheduledAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {o.focusVirtue ? <VirtueBadge virtue={o.focusVirtue} /> : null}
                      <StatusPill status={o.status} />
                    </div>
                  </div>

                  {o.agenda ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-deep">{o.agenda}</p>
                  ) : null}
                  {o.notes ? (
                    <p className="mt-2 whitespace-pre-wrap rounded-sm bg-bg p-2 text-sm text-muted">
                      {o.notes}
                    </p>
                  ) : null}

                  {/* Ações de follow-up */}
                  {o.actionItems.length > 0 ? (
                    <ul className="mt-3">
                      {o.actionItems.map((a) => (
                        <ActionItemToggle
                          key={a.id}
                          id={a.id}
                          done={a.done}
                          text={a.text}
                          dueDate={a.dueDate ? a.dueDate.toLocaleDateString("pt-BR") : null}
                        />
                      ))}
                    </ul>
                  ) : null}
                  <AddActionItemForm oneOnOneId={o.id} />

                  {o.status !== "DONE" ? <CompleteOneOnOneForm oneOnOneId={o.id} /> : null}
                </Card>
              ))
            )}
          </div>

          <Card className="h-fit">
            <h2 className="mb-3 font-sora text-lg font-semibold text-deep">Agendar 1:1</h2>
            <NewOneOnOneForm members={members} />
          </Card>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "SCHEDULED" | "DONE" | "CANCELED" }) {
  const map = {
    SCHEDULED: { label: "Agendado", cls: "bg-grad-soft text-blue" },
    DONE: { label: "Realizado", cls: "bg-green-50 text-green-700" },
    CANCELED: { label: "Cancelado", cls: "bg-bg text-muted" },
  } as const;
  const s = map[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
