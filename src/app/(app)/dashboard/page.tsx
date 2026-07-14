import { getContext } from "@/server/context";
import { db } from "@/server/db";
import {
  Card,
  Kpi,
  EmptyState,
  ButtonLink,
  PageHeader,
  SectionTitle,
  Avatar,
  Badge,
  ProgressBar,
  Icon,
} from "@/components/ui";
import { VirtueRadar } from "@/components/charts/VirtueRadar";
import { teamRadar, virtueIndex, latestPerVirtue } from "@/server/services/virtue-score";
import { isStale, daysSince, ONE_ON_ONE_ALERT_DAYS } from "@/server/services/alerts";

export default async function DashboardPage() {
  const { org } = await getContext();

  const [members, scores, doneOneOnOnes, activePdis] = await Promise.all([
    db.teamMember.findMany({
      where: { organizationId: org.id, active: true },
      select: { id: true, name: true, role: true },
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
    db.pDI.count({
      where: { organizationId: org.id },
    }),
  ]);

  if (members.length === 0) {
    return (
      <div>
        <PageHeader
          icon="dashboard"
          eyebrow="Visão geral"
          title="Dashboard"
          subtitle="Acompanhe a evolução do seu time em um só lugar."
        />
        <EmptyState
          icon="◎"
          title="Sua equipe ainda está vazia"
          description="Cadastre seus liderados para começar a acompanhar a evolução em virtudes, 1:1s e PDIs."
          action={<ButtonLink href="/equipe" icon="plus">Cadastrar equipe</ButtonLink>}
        />
      </div>
    );
  }

  // Último 1:1 por membro
  const lastByMember = new Map<string, Date>();
  for (const o of doneOneOnOnes) {
    if (!lastByMember.has(o.teamMemberId)) lastByMember.set(o.teamMemberId, o.scheduledAt);
  }

  const radar = teamRadar(scores);
  const index = virtueIndex(radar);
  const perMember = latestPerVirtue(scores);

  const onTime = members.filter((m) => !isStale(lastByMember.get(m.id) ?? null)).length;
  const staleMembers = members.filter((m) => isStale(lastByMember.get(m.id) ?? null));
  const onTimePct = Math.round((onTime / members.length) * 100);

  return (
    <div>
      <PageHeader
        icon="dashboard"
        eyebrow="Visão geral"
        title="Dashboard"
        subtitle={`Time de ${members.length} ${members.length === 1 ? "liderado" : "liderados"} · ${org.name}`}
        actions={
          <ButtonLink href="/um-a-um" icon="oneOnOne" size="sm">
            Registrar 1:1
          </ButtonLink>
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi
          label="Índice de virtude"
          value={index.toFixed(1)}
          caption="Média do time (0–10)"
          accent="blue"
          icon="goals"
        />
        <Kpi
          label="1:1s no prazo"
          value={`${onTime}/${members.length}`}
          caption={`Últimos ${ONE_ON_ONE_ALERT_DAYS} dias`}
          accent={onTimePct >= 70 ? "success" : "purple"}
          icon="oneOnOne"
        />
        <Kpi
          label="PDIs ativos"
          value={activePdis}
          caption="No trimestre"
          accent="deep"
          icon="pdi"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Radar */}
        <Card>
          <SectionTitle hint="Média do time por virtude.">
            Radar das 9 virtudes
          </SectionTitle>
          <VirtueRadar scores={radar} />
        </Card>

        {/* Evolução individual */}
        <Card>
          <SectionTitle hint="Média das últimas avaliações por pessoa.">
            Evolução individual
          </SectionTitle>
          <ul className="mt-1 flex flex-col divide-y divide-border">
            {members.map((m) => {
              const vm = perMember.get(m.id);
              const vals = vm ? [...vm.values()] : [];
              const avgNum =
                vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
              const avg = avgNum !== null ? avgNum.toFixed(1) : "—";
              return (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <Avatar name={m.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-deep">{m.name}</p>
                    <p className="truncate text-xs text-muted">{m.role ?? "—"}</p>
                  </div>
                  <div className="hidden w-28 sm:block">
                    <ProgressBar
                      value={avgNum !== null ? (avgNum / 10) * 100 : 0}
                      tone="grad"
                    />
                  </div>
                  <span className="w-8 text-right font-sora text-sm font-bold text-blue tabular-nums">
                    {avg}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Alertas */}
      <div className="mt-6">
        <SectionTitle
          action={
            staleMembers.length > 0 ? (
              <Badge tone="warn" dot>
                {staleMembers.length} pendente{staleMembers.length > 1 ? "s" : ""}
              </Badge>
            ) : null
          }
        >
          Alertas
        </SectionTitle>
        {staleMembers.length === 0 ? (
          <Card className="flex items-center gap-3 text-sm text-muted">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-soft text-success">
              <Icon.check width={18} height={18} />
            </span>
            Todos os liderados tiveram 1:1 nos últimos {ONE_ON_ONE_ALERT_DAYS} dias.
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {staleMembers.map((m) => {
              const d = daysSince(lastByMember.get(m.id) ?? null);
              return (
                <Card
                  key={m.id}
                  className="flex items-center gap-3 border-l-4 border-l-warn py-3.5"
                  hover
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-warn-soft text-warn">
                    <Icon.alert width={18} height={18} />
                  </span>
                  <span className="flex-1 text-sm text-deep">
                    <strong className="font-semibold">{m.name}</strong>{" "}
                    {d === null
                      ? "ainda não teve nenhum 1:1"
                      : `está sem 1:1 há ${d} dias`}
                    .
                  </span>
                  <ButtonLink href="/um-a-um" variant="outline" size="sm" icon="calendar">
                    Agendar
                  </ButtonLink>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
