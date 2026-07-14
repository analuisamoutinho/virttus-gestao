import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { hasFeature } from "@/server/plan/gate";
import { PLAN_LIMITS } from "@/server/plan/limits";
import { Card, Kpi, EmptyState, PageHeader, SectionTitle, ButtonLink } from "@/components/ui";
import { currentQuarter, quarterRange, goalProgress } from "@/server/services/okr";
import { teamRadar, virtueIndex } from "@/server/services/virtue-score";
import { isStale } from "@/server/services/alerts";

export default async function RelatorioPage() {
  const { org } = await getContext();

  if (!hasFeature(org, "quarterly_report")) {
    return (
      <div>
        <PageHeader
          icon="hr"
          eyebrow="Consolidado do trimestre"
          title="Relatório trimestral"
        />
        <EmptyState
          icon="◫"
          title="Recurso do plano Time"
          description={`Relatório consolidado do trimestre para toda a organização. Disponível no plano Time (${PLAN_LIMITS.TIME.priceLabel}).`}
        />
      </div>
    );
  }

  const quarter = currentQuarter();
  const { start, end } = quarterRange(quarter);

  const [members, scores, goals, pdis, feedbacks, oneOnOnes] = await Promise.all([
    db.teamMember.findMany({
      where: { organizationId: org.id, active: true },
      select: { id: true },
    }),
    db.virtueScore.findMany({
      where: { organizationId: org.id },
      select: { teamMemberId: true, virtue: true, score: true, recordedAt: true },
    }),
    db.goal.findMany({
      where: { organizationId: org.id, quarter },
      include: { keyResults: true },
    }),
    db.pDI.findMany({
      where: { organizationId: org.id, quarter },
      include: { actions: true },
    }),
    db.feedback.findMany({
      where: { organizationId: org.id, createdAt: { gte: start, lt: end } },
      select: { type: true },
    }),
    db.oneOnOne.findMany({
      where: { organizationId: org.id, status: "DONE", scheduledAt: { gte: start, lt: end } },
      select: { teamMemberId: true, scheduledAt: true },
      orderBy: { scheduledAt: "desc" },
    }),
  ]);

  const radar = teamRadar(scores);
  const index = virtueIndex(radar);

  const avgGoalProgress =
    goals.length > 0
      ? Math.round((goals.reduce((acc, g) => acc + goalProgress(g.keyResults), 0) / goals.length) * 10) / 10
      : 0;

  const pdiActions = pdis.flatMap((p) => p.actions);
  const pdiDoneRate =
    pdiActions.length > 0
      ? Math.round((pdiActions.filter((a) => a.done).length / pdiActions.length) * 1000) / 10
      : 0;

  const recognitionCount = feedbacks.filter((f) => f.type === "RECOGNITION").length;
  const constructiveCount = feedbacks.filter((f) => f.type === "CONSTRUCTIVE").length;

  const lastByMember = new Map<string, Date>();
  for (const o of oneOnOnes) {
    if (!lastByMember.has(o.teamMemberId)) lastByMember.set(o.teamMemberId, o.scheduledAt);
  }
  const onTime = members.filter((m) => !isStale(lastByMember.get(m.id) ?? null)).length;

  return (
    <div>
      <PageHeader
        icon="hr"
        eyebrow="Consolidado do trimestre"
        title="Relatório trimestral"
        subtitle={`${quarter} · ${members.length} liderados ativos`}
        actions={
          <ButtonLink href="/rh" variant="outline" size="sm" icon="chevronLeft">
            Painel de RH
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Índice de virtude" value={index.toFixed(1)} caption="Média atual (0–10)" accent="blue" icon="goals" />
        <Kpi
          label="1:1s no prazo"
          value={`${onTime}/${members.length}`}
          caption="Últimos 21 dias"
          accent="purple"
          icon="oneOnOne"
        />
        <Kpi label="PDI concluído" value={`${pdiDoneRate}%`} caption="Ações marcadas como feitas" accent="deep" icon="pdi" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle hint="Progresso médio dos objetivos.">Metas & OKR</SectionTitle>
          <p className="font-sora text-4xl font-bold text-blue">{avgGoalProgress}%</p>
          <p className="mt-1 text-sm text-muted">{goals.length} objetivos no trimestre.</p>
        </Card>

        <Card>
          <SectionTitle hint={`${feedbacks.length} feedbacks no trimestre.`}>
            Feedback
          </SectionTitle>
          <div className="mt-1 grid grid-cols-2 gap-4">
            <div className="rounded-sm bg-success-soft/50 p-4">
              <p className="font-sora text-3xl font-bold text-success">{recognitionCount}</p>
              <p className="text-xs font-medium text-muted">Reconhecimento</p>
            </div>
            <div className="rounded-sm bg-grad-soft p-4">
              <p className="font-sora text-3xl font-bold text-purple">{constructiveCount}</p>
              <p className="text-xs font-medium text-muted">Construtivo</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
