import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, Kpi, EmptyState, ButtonLink } from "@/components/ui";
import { VirtueRadar } from "@/components/charts/VirtueRadar";
import { teamRadar, virtueIndex, latestPerVirtue } from "@/server/services/virtue-score";
import { isStale, daysSince, ONE_ON_ONE_ALERT_DAYS } from "@/server/services/alerts";
import { virtueLabel } from "@/lib/virtues";

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
      <Page>
        <EmptyState
          icon="◎"
          title="Sua equipe ainda está vazia"
          description="Cadastre seus liderados para começar a acompanhar a evolução em virtudes, 1:1s e PDIs."
          action={<ButtonLink href="/equipe">Cadastrar equipe</ButtonLink>}
        />
      </Page>
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

  return (
    <Page>
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi
          label="Índice de virtude"
          value={index.toFixed(1)}
          caption="Média do time (0–10)"
          accent="blue"
        />
        <Kpi
          label="1:1s no prazo"
          value={`${onTime}/${members.length}`}
          caption={`Últimos ${ONE_ON_ONE_ALERT_DAYS} dias`}
          accent="purple"
        />
        <Kpi
          label="PDIs ativos"
          value={activePdis}
          caption="No trimestre"
          accent="deep"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Radar */}
        <Card>
          <h2 className="font-sora text-lg font-semibold text-deep">
            Radar das 9 virtudes
          </h2>
          <p className="mb-2 text-xs text-muted">Média do time por virtude.</p>
          <VirtueRadar scores={radar} />
        </Card>

        {/* Evolução individual */}
        <Card>
          <h2 className="font-sora text-lg font-semibold text-deep">
            Evolução individual
          </h2>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {members.map((m) => {
              const vm = perMember.get(m.id);
              const vals = vm ? [...vm.values()] : [];
              const avg =
                vals.length > 0
                  ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                  : "—";
              return (
                <li key={m.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-deep">{m.name}</p>
                    <p className="text-xs text-muted">{m.role ?? "—"}</p>
                  </div>
                  <span className="font-sora text-sm font-bold text-blue">{avg}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Alertas */}
      <div className="mt-6">
        <h2 className="mb-2 font-sora text-lg font-semibold text-deep">Alertas</h2>
        {staleMembers.length === 0 ? (
          <Card className="text-sm text-muted">
            ✓ Todos os liderados tiveram 1:1 nos últimos {ONE_ON_ONE_ALERT_DAYS} dias.
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {staleMembers.map((m) => {
              const d = daysSince(lastByMember.get(m.id) ?? null);
              return (
                <Card
                  key={m.id}
                  className="flex items-center justify-between border-l-4 border-l-purple py-3"
                >
                  <span className="text-sm text-deep">
                    <strong>{m.name}</strong>{" "}
                    {d === null
                      ? "ainda não teve nenhum 1:1"
                      : `sem 1:1 há ${d} dias`}
                    .
                  </span>
                  <ButtonLink href="/um-a-um" variant="outline" className="text-xs">
                    Agendar 1:1
                  </ButtonLink>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="mb-6 font-sora text-2xl font-bold text-deep">Dashboard</h1>
      {children}
    </div>
  );
}
