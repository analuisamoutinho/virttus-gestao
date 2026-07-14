import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { hasFeature } from "@/server/plan/gate";
import { PLAN_LIMITS } from "@/server/plan/limits";
import {
  Card,
  Kpi,
  EmptyState,
  PageHeader,
  SectionTitle,
  ButtonLink,
  Avatar,
  Badge,
} from "@/components/ui";
import { teamRadar, virtueIndex } from "@/server/services/virtue-score";
import { virtueGaps } from "@/server/services/benchmark";
import { isStale } from "@/server/services/alerts";

export default async function RHPage() {
  const { org } = await getContext();

  if (!hasFeature(org, "hr_panel")) {
    return (
      <div>
        <PageHeader
          icon="hr"
          eyebrow="Visão agregada"
          title="Painel de RH"
          subtitle="Todos os times, benchmarks e relatórios em um só lugar."
        />
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
      <PageHeader
        icon="hr"
        eyebrow="Visão agregada"
        title="Painel de RH"
        subtitle={`Índice de virtude da organização: ${orgIndex.toFixed(1)}/10`}
        actions={
          <ButtonLink href="/rh/relatorio" variant="outline" size="sm" icon="download">
            Relatório trimestral
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Liderados" value={totalMembers} caption={`${leaders.length} líderes`} accent="blue" icon="team" />
        <Kpi
          label="1:1s no prazo"
          value={`${onTime}/${totalMembers}`}
          caption="Em toda a organização"
          accent="purple"
          icon="oneOnOne"
        />
        <Kpi label="PDIs no trimestre" value={activePdis} caption="Toda a organização" accent="deep" icon="pdi" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle hint={`${orgIndex.toFixed(1)} é a média da organização.`}>
            Times
          </SectionTitle>
          {teams.length === 0 ? (
            <p className="text-sm text-muted">Nenhum time cadastrado ainda.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {teams.map((t) => (
                <li key={t.leaderId} className="flex items-center gap-3 py-2.5">
                  <Avatar name={t.leaderName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-deep">{t.leaderName}</p>
                    <p className="text-xs text-muted">{t.memberCount} liderados</p>
                  </div>
                  <span className="font-sora text-base font-bold text-blue tabular-nums">
                    {t.virtueIndex > 0 ? t.virtueIndex.toFixed(1) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle hint={`Meta de referência: ${gaps[0]?.target ?? 7}/10.`}>
            Benchmark das 9 virtudes
          </SectionTitle>
          <ul className="flex flex-col divide-y divide-border">
            {gaps.map((g) => (
              <li key={g.virtue} className="flex items-center justify-between py-2">
                <span className="text-sm text-deep">{g.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-deep tabular-nums">
                    {g.average.toFixed(1)}
                  </span>
                  <Badge tone={g.gap >= 0 ? "success" : "warn"}>
                    {g.gap >= 0 ? "+" : ""}
                    {g.gap.toFixed(1)}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
