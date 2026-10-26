import Link from "next/link";
import { requireAdmin } from "@/server/context";
import { db } from "@/server/db";
import { Card, Kpi, PageHeader, SectionTitle, Avatar, Badge, ButtonLink } from "@/components/ui";
import { buildLeaderRows } from "@/server/services/admin-overview";
import { summarizeManagerFeedback } from "@/server/services/manager-feedback";
import { daysSince, isStale, ONE_ON_ONE_ALERT_DAYS } from "@/server/services/alerts";
import { latestPerVirtue } from "@/server/services/virtue-score";
import { formatDateTime } from "@/lib/format";
import { getBaseUrl } from "@/server/base-url";
import { CopyLink, RegenerateLinkButton } from "../feedback-gestor/FeedbackLinkControls";
import { ManagerResults } from "../feedback-gestor/ManagerResults";
import { RoleSelect } from "./RoleSelect";
import { ROLE_LABEL } from "@/lib/role-meta";

const DAY = 24 * 3600 * 1000;

export default async function AdminPage() {
  const { org, userId } = await requireAdmin();
  const baseUrl = getBaseUrl();
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY);
  const since90 = new Date(now.getTime() - 90 * DAY);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    users,
    members,
    doneOneOnOnes,
    feedbackGroups,
    goals,
    scores,
    pdiCount,
    managerRows,
    audit,
    callsMonth,
    transcripts,
    practices,
    openings,
    candidates,
    resources,
  ] = await Promise.all([
    db.user.findMany({
      where: { organizationId: org.id },
      select: { id: true, name: true, email: true, role: true, anonFeedbackToken: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
    db.teamMember.findMany({
      where: { organizationId: org.id, active: true },
      select: { id: true, name: true, role: true, leaderId: true },
      orderBy: { name: "asc" },
    }),
    db.oneOnOne.findMany({
      where: { organizationId: org.id, status: "DONE" },
      select: { teamMemberId: true, scheduledAt: true },
      orderBy: { scheduledAt: "desc" },
    }),
    db.feedback.groupBy({
      by: ["authorId"],
      where: { organizationId: org.id, createdAt: { gte: since90 } },
      _count: { _all: true },
    }),
    db.goal.findMany({ where: { organizationId: org.id }, select: { teamMemberId: true, progress: true } }),
    db.virtueScore.findMany({
      where: { organizationId: org.id },
      select: { teamMemberId: true, virtue: true, score: true, recordedAt: true },
    }),
    db.pDI.count({ where: { organizationId: org.id } }),
    db.managerFeedback.findMany({
      where: { organizationId: org.id },
      select: { managerId: true, ratings: true, keepText: true, startText: true, stopText: true },
    }),
    db.auditLog.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { actor: { select: { name: true, email: true } } },
    }),
    db.call.count({ where: { organizationId: org.id, scheduledAt: { gte: monthStart } } }),
    db.callTranscript.count({ where: { organizationId: org.id } }),
    db.feedbackPractice.count({ where: { organizationId: org.id, status: "COMPLETED" } }),
    db.jobOpening.count({ where: { organizationId: org.id, status: "OPEN" } }),
    db.candidate.count({ where: { organizationId: org.id } }),
    db.devResource.count({ where: { organizationId: org.id } }),
  ]);

  const lastByMember = new Map<string, Date>();
  const oneOnOnes30 = doneOneOnOnes.filter((o) => o.scheduledAt >= since30).length;
  for (const o of doneOneOnOnes) {
    if (!lastByMember.has(o.teamMemberId)) lastByMember.set(o.teamMemberId, o.scheduledAt);
  }

  const rows = buildLeaderRows({
    users,
    members,
    lastOneOnOneByMember: lastByMember,
    feedbacksByAuthor: new Map(feedbackGroups.map((g) => [g.authorId, g._count._all])),
    goals,
    scores,
    now,
  });

  const feedbackTotal90 = feedbackGroups.reduce((a, g) => a + g._count._all, 0);
  const okrValues = goals.map((g) => g.progress);
  const okrAvg = okrValues.length ? okrValues.reduce((a, b) => a + b, 0) / okrValues.length : null;
  const leaderName = (id: string) => users.find((u) => u.id === id)?.name ?? "—";
  const latestScores = latestPerVirtue(scores);
  const memberAvg = (id: string) => {
    const vm = latestScores.get(id);
    const vals = vm ? [...vm.values()] : [];
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const staleCount = members.filter((m) => isStale(lastByMember.get(m.id) ?? null, now)).length;

  return (
    <div>
      <PageHeader
        icon="shield"
        eyebrow="Acesso de administrador"
        title="Visão de toda a gestão"
        subtitle={`${org.name} — gestores, times, calls, recrutamento e feedback ao gestor num só lugar.`}
        actions={
          <ButtonLink href="/rh/relatorio" variant="outline" size="sm" icon="download">
            Relatório trimestral
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Gestores" value={rows.length} caption="Admin, líderes e RH" accent="blue" icon="user" />
        <Kpi label="Liderados ativos" value={members.length} caption={`${staleCount} sem 1:1 há +${ONE_ON_ONE_ALERT_DAYS} dias`} accent={staleCount ? "purple" : "success"} icon="team" />
        <Kpi label="1:1s (30 dias)" value={oneOnOnes30} caption="Realizados" accent="purple" icon="oneOnOne" />
        <Kpi label="Feedbacks (90 dias)" value={feedbackTotal90} caption="SBI registrados" accent="deep" icon="feedback" />
        <Kpi label="Progresso médio dos OKRs" value={okrAvg !== null ? `${Math.round(okrAvg)}%` : "—"} caption={`${goals.length} objetivos`} accent="blue" icon="goals" />
        <Kpi label="PDIs" value={pdiCount} caption="Em toda a organização" accent="deep" icon="pdi" />
        <Kpi label="Calls no mês" value={callsMonth} caption={`${transcripts} ${transcripts === 1 ? "transcrição" : "transcrições"} no total`} accent="purple" icon="calendar" />
        <Kpi label="Vagas abertas" value={openings} caption={`${candidates} ${candidates === 1 ? "candidato" : "candidatos"} no banco`} accent="success" icon="talent" />
      </div>

      {/* Gestores */}
      <div className="mt-8">
        <SectionTitle hint="Indicadores do time de cada gestor e o feedback anônimo que ele recebe.">Gestores</SectionTitle>
        <div className="flex flex-col gap-3">
          {rows.map((r) => {
            const mine = managerRows.filter((m) => m.managerId === r.id);
            const summary = summarizeManagerFeedback(mine);
            const token = users.find((u) => u.id === r.id)?.anonFeedbackToken ?? null;
            return (
              <Card key={r.id} className="p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar name={r.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sora text-base font-bold text-deep">{r.name}</p>
                    <p className="text-xs text-muted">
                      {ROLE_LABEL[r.role]} · {r.email}
                    </p>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-center sm:grid-cols-5">
                    <Stat label="Liderados" value={r.memberCount} />
                    <Stat label="1:1 no prazo" value={r.memberCount ? `${r.oneOnOnesOnTime}/${r.memberCount}` : "—"} />
                    <Stat label="Feedbacks 90d" value={r.feedbacks90d} />
                    <Stat label="OKRs" value={r.okrAverage !== null ? `${Math.round(r.okrAverage)}%` : "—"} />
                    <Stat label="Virtude" value={r.virtueIndex !== null ? r.virtueIndex.toFixed(1) : "—"} />
                  </dl>
                </div>
                <details className="group mt-4 border-t border-border pt-3">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-sm font-semibold text-purple hover:underline">
                    Feedback anônimo recebido
                    <Badge tone={summary.revealed ? "success" : "neutral"}>
                      {summary.total} {summary.total === 1 ? "resposta" : "respostas"}
                      {summary.revealed && summary.overall !== null ? ` · nota ${summary.overall.toFixed(1)}` : ""}
                    </Badge>
                  </summary>
                  <div className="mt-4 flex flex-col gap-4">
                    <ManagerResults summary={summary} />
                    <div className="rounded-sm bg-bg p-4">
                      <p className="mb-2 text-xs font-semibold text-deep">Link do formulário deste gestor</p>
                      {token ? (
                        <div className="flex flex-col gap-3">
                          <CopyLink url={`${baseUrl}/anonimo/${token}`} />
                          <RegenerateLinkButton userId={r.id} hasLink size="sm" />
                        </div>
                      ) : (
                        <RegenerateLinkButton userId={r.id} hasLink={false} size="sm" />
                      )}
                    </div>
                  </div>
                </details>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Liderados */}
      <div className="mt-8">
        <SectionTitle hint="Todos os liderados ativos, de todos os gestores.">Liderados</SectionTitle>
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-semibold">Liderado</th>
                <th className="px-3 py-3 font-semibold">Gestor</th>
                <th className="px-3 py-3 font-semibold">Último 1:1</th>
                <th className="px-3 py-3 text-right font-semibold">Virtude</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => {
                const last = lastByMember.get(m.id) ?? null;
                const d = daysSince(last, now);
                const avg = memberAvg(m.id);
                return (
                  <tr key={m.id} className="hover:bg-bg/60">
                    <td className="px-5 py-3">
                      <Link href={`/equipe/${m.id}`} className="font-semibold text-deep hover:text-blue">
                        {m.name}
                      </Link>
                      <p className="text-xs text-muted">{m.role ?? "—"}</p>
                    </td>
                    <td className="px-3 py-3 text-muted">{leaderName(m.leaderId)}</td>
                    <td className="px-3 py-3">
                      {d === null ? (
                        <Badge tone="warn">nunca</Badge>
                      ) : (
                        <Badge tone={isStale(last, now) ? "warn" : "success"}>há {d} dias</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-sora font-bold tabular-nums text-blue">
                      {avg !== null ? avg.toFixed(1) : "—"}
                    </td>
                  </tr>
                );
              })}
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">
                    Nenhum liderado cadastrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Outros módulos */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <SectionTitle hint="Só contagem — o conteúdo dos treinos é privado de cada pessoa.">
            Treino de feedback
          </SectionTitle>
          <p className="font-sora text-3xl font-bold text-blue">{practices}</p>
          <p className="text-xs text-muted">treinos concluídos na organização</p>
        </Card>
        <Card>
          <SectionTitle>Central de desenvolvimento</SectionTitle>
          <p className="font-sora text-3xl font-bold text-purple">{resources}</p>
          <Link href="/central" className="text-xs font-semibold text-purple hover:underline">
            indicações no mural →
          </Link>
        </Card>
        <Card>
          <SectionTitle>Banco de talentos</SectionTitle>
          <p className="font-sora text-3xl font-bold text-success">{candidates}</p>
          <Link href="/talentos" className="text-xs font-semibold text-purple hover:underline">
            {openings} {openings === 1 ? "vaga aberta" : "vagas abertas"} →
          </Link>
        </Card>
      </div>

      {/* Usuários e papéis */}
      <div className="mt-8">
        <SectionTitle hint="Quem acessa o quê. Você não pode alterar o próprio papel.">Usuários e papéis</SectionTitle>
        <Card padded={false}>
          <ul className="divide-y divide-border">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <Avatar name={u.name ?? u.email} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-deep">{u.name ?? u.email}</p>
                  <p className="truncate text-xs text-muted">{u.email}</p>
                </div>
                <RoleSelect userId={u.id} role={u.role} disabled={u.id === userId} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Auditoria */}
      <div className="mt-8">
        <SectionTitle hint="Últimas 30 ações registradas (LGPD).">Auditoria</SectionTitle>
        <Card padded={false}>
          <ul className="divide-y divide-border">
            {audit.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2.5 text-xs">
                <span className="w-36 shrink-0 text-muted">{formatDateTime(a.createdAt)}</span>
                <span className="font-semibold text-deep">{a.actor?.name ?? a.actor?.email ?? "sistema"}</span>
                <code className="rounded bg-bg px-1.5 py-0.5 text-[11px] text-purple">{a.action}</code>
                <span className="text-muted">{a.entity}</span>
              </li>
            ))}
            {audit.length === 0 ? (
              <li className="px-5 py-6 text-center text-sm text-muted">Nenhum registro ainda.</li>
            ) : null}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dd className="font-sora text-base font-bold tabular-nums text-blue">{value}</dd>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</dt>
    </div>
  );
}
