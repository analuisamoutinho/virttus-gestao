import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { listMembers } from "@/server/members";
import { Card, EmptyState, PageHeader, SectionTitle, ButtonLink } from "@/components/ui";
import { GoalCard } from "@/components/GoalCard";
import { currentQuarter } from "@/server/services/okr";
import { NewGoalForm } from "./GoalForms";

export default async function MetasPage() {
  const { org } = await getContext();

  const [members, goals] = await Promise.all([
    listMembers(org.id),
    db.goal.findMany({
      where: { organizationId: org.id },
      orderBy: [{ quarter: "desc" }, { createdAt: "desc" }],
      include: {
        teamMember: { select: { name: true } },
        keyResults: true,
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        icon="goals"
        eyebrow="Objetivos & resultados-chave"
        title="Metas & OKR"
        subtitle="Progresso calculado automaticamente a partir dos key results."
      />

      {members.length === 0 ? (
        <EmptyState
          icon="◉"
          title="Cadastre a equipe primeiro"
          description="Você precisa de pelo menos um liderado para definir objetivos e key results."
          action={<ButtonLink href="/equipe" icon="team">Ir para Equipe</ButtonLink>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-3">
            {goals.length === 0 ? (
              <EmptyState
                icon="◉"
                title="Nenhum objetivo ainda"
                description="Crie um objetivo com seus key results. O progresso é calculado automaticamente a partir do avanço dos KRs."
              />
            ) : (
              goals.map((g) => (
                <GoalCard key={g.id} goal={{ ...g, memberName: g.teamMember.name }} />
              ))
            )}
          </div>

          <Card className="h-fit lg:sticky lg:top-24">
            <SectionTitle hint="Defina o objetivo e seus KRs.">Novo objetivo</SectionTitle>
            <NewGoalForm members={members} quarter={currentQuarter()} />
          </Card>
        </div>
      )}
    </div>
  );
}
