import Link from "next/link";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { listMembers } from "@/server/members";
import { Card, EmptyState } from "@/components/ui";
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
      <h1 className="mb-6 font-sora text-2xl font-bold text-deep">Metas &amp; OKR</h1>

      {members.length === 0 ? (
        <EmptyState
          icon="◉"
          title="Cadastre a equipe primeiro"
          description="Você precisa de pelo menos um liderado para definir objetivos e key results."
          action={
            <Link href="/equipe" className="text-sm font-semibold text-purple">
              Ir para Equipe →
            </Link>
          }
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

          <Card className="h-fit">
            <h2 className="mb-3 font-sora text-lg font-semibold text-deep">Novo objetivo</h2>
            <NewGoalForm members={members} quarter={currentQuarter()} />
          </Card>
        </div>
      )}
    </div>
  );
}
