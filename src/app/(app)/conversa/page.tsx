import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { listMembers } from "@/server/members";
import { hasFeature } from "@/server/plan/gate";
import { PLAN_LIMITS } from "@/server/plan/limits";
import { Card, EmptyState, PageHeader, SectionTitle, ButtonLink } from "@/components/ui";
import { ConversationScriptCard } from "@/components/ConversationScriptCard";
import { ConversationForm } from "./ConversationForm";

export default async function ConversaPage() {
  const { org } = await getContext();

  // Feature gating: construtor de conversa é Pro+.
  if (!hasFeature(org, "conversation_builder")) {
    return (
      <div>
        <PageHeader
          icon="chat"
          eyebrow="Construtor de roteiros"
          title="Conversa"
          subtitle="Roteiros para conversas difíceis a partir do perfil do liderado."
        />
        <EmptyState
          icon="◌"
          title="Recurso do plano Pro"
          description={`O construtor de conversa gera roteiros para conversas difíceis a partir do perfil pessoal do liderado. Disponível a partir do plano Pro (${PLAN_LIMITS.PRO.priceLabel}).`}
        />
      </div>
    );
  }

  const [members, scripts] = await Promise.all([
    listMembers(org.id),
    db.conversationScript.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { teamMember: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        icon="chat"
        eyebrow="Construtor de roteiros"
        title="Conversa"
        subtitle="Abertura, perguntas socráticas e fechamento — personalizados por pessoa."
      />

      {members.length === 0 ? (
        <EmptyState
          icon="◌"
          title="Cadastre a equipe primeiro"
          description="Você precisa de pelo menos um liderado para gerar um roteiro de conversa."
          action={<ButtonLink href="/equipe" icon="team">Ir para Equipe</ButtonLink>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-3">
            {scripts.length === 0 ? (
              <EmptyState
                icon="◌"
                title="Nenhum roteiro gerado ainda"
                description="Escolha o tipo de conversa e descreva o contexto ao lado — o roteiro sai com abertura, perguntas socráticas e fechamento."
              />
            ) : (
              scripts.map((s) => (
                <ConversationScriptCard
                  key={s.id}
                  script={{ ...s, memberName: s.teamMember.name }}
                />
              ))
            )}
          </div>

          <Card className="h-fit lg:sticky lg:top-24">
            <SectionTitle hint="Abertura · Perguntas socráticas · Fechamento">
              Novo roteiro
            </SectionTitle>
            <ConversationForm members={members} />
          </Card>
        </div>
      )}
    </div>
  );
}
