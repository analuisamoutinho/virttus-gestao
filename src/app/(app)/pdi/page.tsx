import Link from "next/link";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { listMembers } from "@/server/members";
import { Card, EmptyState } from "@/components/ui";
import { PdiCard } from "@/components/PdiCard";
import { currentQuarter } from "@/server/services/okr";
import { NewPdiForm } from "./PdiForms";

export default async function PdiPage() {
  const { org } = await getContext();

  const [members, pdis] = await Promise.all([
    listMembers(org.id),
    db.pDI.findMany({
      where: { organizationId: org.id },
      orderBy: [{ quarter: "desc" }, { createdAt: "desc" }],
      include: {
        teamMember: { select: { name: true } },
        actions: { orderBy: { done: "asc" } },
      },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-sora text-2xl font-bold text-deep">PDI</h1>

      {members.length === 0 ? (
        <EmptyState
          icon="◆"
          title="Cadastre a equipe primeiro"
          description="Você precisa de pelo menos um liderado para montar um Plano de Desenvolvimento Individual."
          action={
            <Link href="/equipe" className="text-sm font-semibold text-purple">
              Ir para Equipe →
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-3">
            {pdis.length === 0 ? (
              <EmptyState
                icon="◆"
                title="Nenhum PDI ainda"
                description="Monte 1 competência foco por trimestre, com ações, prazos e evidências de evolução."
              />
            ) : (
              pdis.map((p) => (
                <PdiCard key={p.id} pdi={{ ...p, memberName: p.teamMember.name }} />
              ))
            )}
          </div>

          <Card className="h-fit">
            <h2 className="mb-1 font-sora text-lg font-semibold text-deep">Novo PDI</h2>
            <p className="mb-3 text-xs text-muted">1 competência foco por trimestre.</p>
            <NewPdiForm members={members} quarter={currentQuarter()} />
          </Card>
        </div>
      )}
    </div>
  );
}
