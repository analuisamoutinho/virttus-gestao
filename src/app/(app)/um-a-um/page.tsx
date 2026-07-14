import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { listMembers } from "@/server/members";
import {
  Card,
  EmptyState,
  PageHeader,
  SectionTitle,
  Avatar,
  Badge,
  ButtonLink,
  Icon,
} from "@/components/ui";
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
      <PageHeader
        icon="oneOnOne"
        eyebrow="Conversas 1:1"
        title="1:1s"
        subtitle="Pauta, notas, mood e ações de acompanhamento — tudo registrado."
      />

      {members.length === 0 ? (
        <EmptyState
          icon="◍"
          title="Cadastre a equipe primeiro"
          description="Você precisa de pelo menos um liderado para agendar 1:1s."
          action={<ButtonLink href="/equipe" icon="team">Ir para Equipe</ButtonLink>}
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
                <Card key={o.id} hover>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={o.teamMember.name} size="sm" />
                      <div>
                        <a
                          href={`/equipe/${o.teamMember.id}`}
                          className="font-sora text-sm font-semibold text-deep hover:text-blue"
                        >
                          {o.teamMember.name}
                        </a>
                        <p className="flex items-center gap-1 text-xs text-muted">
                          <Icon.clock width={12} height={12} />
                          {formatDateTime(o.scheduledAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {o.focusVirtue ? <VirtueBadge virtue={o.focusVirtue} /> : null}
                      <StatusPill status={o.status} />
                    </div>
                  </div>

                  {o.agenda ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-deep">{o.agenda}</p>
                  ) : null}
                  {o.notes ? (
                    <p className="mt-2 whitespace-pre-wrap rounded-sm border border-border bg-bg p-3 text-sm text-muted">
                      {o.notes}
                    </p>
                  ) : null}

                  {/* Ações de follow-up */}
                  {o.actionItems.length > 0 ? (
                    <ul className="mt-3 flex flex-col gap-1">
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

          <Card className="h-fit lg:sticky lg:top-24">
            <SectionTitle hint="Registre pauta e virtude foco.">Agendar 1:1</SectionTitle>
            <NewOneOnOneForm members={members} />
          </Card>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: "SCHEDULED" | "DONE" | "CANCELED" }) {
  const map = {
    SCHEDULED: { label: "Agendado", tone: "blue" as const },
    DONE: { label: "Realizado", tone: "success" as const },
    CANCELED: { label: "Cancelado", tone: "neutral" as const },
  };
  const s = map[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}
