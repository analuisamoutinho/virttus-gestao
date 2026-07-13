import Link from "next/link";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { listMembers } from "@/server/members";
import { hasFeature } from "@/server/plan/gate";
import { PLAN_LIMITS } from "@/server/plan/limits";
import { Card, EmptyState } from "@/components/ui";
import { ConversationScriptCard } from "@/components/ConversationScriptCard";
import { ConversationForm } from "./ConversationForm";

export default async function ConversaPage() {
  const { org } = await getContext();

  // Feature gating: construtor de conversa é Pro+.
  if (!hasFeature(org, "conversation_builder")) {
    return (
      <div>
        <h1 className="mb-6 font-sora text-2xl font-bold text-deep">Conversa</h1>
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
      <h1 className="mb-6 font-sora text-2xl font-bold text-deep">Conversa</h1>

      {members.length === 0 ? (
        <EmptyState
          icon="◌"
          title="Cadastre a equipe primeiro"
          description="Você precisa de pelo menos um liderado para gerar um roteiro de conversa."
          action={
            <Link href="/equipe" className="text-sm font-semibold text-purple">
              Ir para Equipe →
            </Link>
          }
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

          <Card className="h-fit">
            <h2 className="mb-1 font-sora text-lg font-semibold text-deep">Novo roteiro</h2>
            <p className="mb-3 text-xs text-muted">
              Abertura · Perguntas socráticas · Fechamento
            </p>
            <ConversationForm members={members} />
          </Card>
        </div>
      )}
    </div>
  );
}
