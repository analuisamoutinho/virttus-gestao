import Link from "next/link";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { hasFeature } from "@/server/plan/gate";
import { PLAN_LIMITS } from "@/server/plan/limits";
import { Card, Kpi, EmptyState } from "@/components/ui";
import { teamRadar, virtueIndex } from "@/server/services/virtue-score";
import { virtueGaps } from "@/server/services/benchmark";
import { isStale } from "@/server/services/alerts";

export default async function RHPage() {
  const { org } = await getContext();

  if (!hasFeature(org, "hr_panel")) {
    return (
      <div>
        <h1 className="mb-6 font-sora text-2xl font-bold text-deep">Painel de RH</h1>
        <EmptyState
          icon="◫"
          title="Recurso do plano Time"
          description={`Visão agregada de todos os times, benchmarks e relatórios. Disponível no plano Time (${PLAN_LIMITS.TIME.priceLabel}).`}
        />
      </div>
    );
  }

  const [leaders, allScores, oneOnOnes, activePdis] = await Promise.all([
    db.user.findMany({
      where: { organizationId: org.id, role: { in: ["ADMIN", "LEADER"] } },
      select: {
        id: true,
        name: true,
        ledMembers: { where: { active: true }, select: { id: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.virtueScore.findMany({
      where: { organizationId: org.id },
      select: { teamMemberId: true, virtue: true, score: true, recordedAt: true },
    }),
    db.oneOnOne.findMany({
      where: { organizationId: org.id, status: "DONE" },
      select: { teamMemberId: true, scheduledAt: true },
      orderBy: { scheduledAt: "desc" },
    }),
    db.pDI.count({ where: { organizationId: org.id } }),
  ]);

  const lastByMember = new Map<string, Date>();
  for (const o of oneOnOnes) {
    if (!lastByMember.has(o.teamMemberId)) lastByMember.set(o.teamMemberId, o.scheduledAt);
  }

  const totalMembers = leaders.reduce((acc, l) => acc + l.ledMembers.length, 0);
  const orgRadar = teamRadar(allScores);
  const orgIndex = virtueIndex(orgRadar);
  const onTime = leaders
    .flatMap((l) => l.ledMembers)
    .filter((m) => !isStale(lastByMember.get(m.id) ?? null)).length;

  const teams = leaders.map((l) => {
    const memberIds = new Set(l.ledMembers.map((m) => m.id));
    const scores = allScores.filter((s) => memberIds.has(s.teamMemberId));
    const radar = teamRadar(scores);
    return {
      leaderId: l.id,
      leaderName: l.name ?? "—",
      memberCount: l.ledMembers.length,
      virtueIndex: virtueIndex(radar),
    };
  });

  const gaps = virtueGaps(orgRadar);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-sora text-2xl font-bold text-deep">Painel de RH</h1>
        <Link href="/rh/relatorio" className="text-sm font-semibold text-purple">
          Ver relatório trimestral →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Liderados" value={totalMembers} caption={`${leaders.length} líderes`} accent="blue" />
        <Kpi
          label="1:1s no prazo"
          value={`${onTime}/${totalMembers}`}
          caption="Em toda a organização"
          accent="purple"
        />
        <Kpi label="PDIs no trimestre" value={activePdis} caption="Toda a organização" accent="deep" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-sora text-lg font-semibold text-deep">Times</h2>
          <p className="mb-2 text-xs text-muted">
            Índice de virtude por líder — {orgIndex.toFixed(1)} é a média da organização.
          </p>
          {teams.length === 0 ? (
            <p className="text-sm text-muted">Nenhum time cadastrado ainda.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {teams.map((t) => (
                <li key={t.leaderId} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-deep">{t.leaderName}</p>
                    <p className="text-xs text-muted">{t.memberCount} liderados</p>
                  </div>
                  <span className="font-sora text-sm font-bold text-blue">
                    {t.virtueIndex > 0 ? t.virtueIndex.toFixed(1) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-sora text-lg font-semibold text-deep">
            Benchmark das 9 virtudes
          </h2>
          <p className="mb-2 text-xs text-muted">
            Meta de referência: {gaps[0]?.target ?? 7}/10.
          </p>
          <ul className="flex flex-col divide-y divide-border">
            {gaps.map((g) => (
              <li key={g.virtue} className="flex items-center justify-between py-2">
                <span className="text-sm text-deep">{g.label}</span>
                <span
                  className={`text-sm font-semibold ${g.gap >= 0 ? "text-green-600" : "text-purple"}`}
                >
                  {g.average.toFixed(1)} ({g.gap >= 0 ? "+" : ""}
                  {g.gap.toFixed(1)})
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
