import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, EmptyState, Avatar, Badge, Icon } from "@/components/ui";
import { VirtueRadar } from "@/components/charts/VirtueRadar";
import { VirtueBadge } from "@/components/VirtueBadge";
import { FeedbackCard } from "@/components/FeedbackCard";
import { GoalCard } from "@/components/GoalCard";
import { PdiCard } from "@/components/PdiCard";
import { teamRadar } from "@/server/services/virtue-score";
import { currentQuarter } from "@/server/services/okr";
import { isStale, daysSince } from "@/server/services/alerts";
import { formatDateTime } from "@/lib/format";
import { NewOneOnOneForm } from "../../um-a-um/OneOnOneForms";
import { FeedbackForm } from "../../feedback/FeedbackForm";
import { NewGoalForm } from "../../metas/GoalForms";
import { NewPdiForm } from "../../pdi/PdiForms";
import { ProfileForm } from "./ProfileForm";
import { EditMemberForm } from "./EditMemberForm";
import { MemberTabs, MEMBER_TABS, type MemberTabKey } from "./MemberTabs";

export default async function MemberPage({
  params,
  searchParams,
}: {
  params: { memberId: string };
  searchParams: { tab?: string };
}) {
  const { org } = await getContext();

  const member = await db.teamMember.findFirst({
    where: { id: params.memberId, organizationId: org.id },
    include: {
      profile: true,
      leader: { select: { name: true } },
      virtueScores: {
        select: { teamMemberId: true, virtue: true, score: true, recordedAt: true },
      },
    },
  });
  if (!member) notFound();

  const tab: MemberTabKey = MEMBER_TABS.some((t) => t.key === searchParams.tab)
    ? (searchParams.tab as MemberTabKey)
    : "visao";

  const radar = teamRadar(member.virtueScores);

  return (
    <div>
      <div className="mb-5 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/equipe" className="font-medium hover:text-blue">
          Equipe
        </Link>
        <Icon.chevronRight width={14} height={14} />
        <span className="font-medium text-deep">{member.name}</span>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <Avatar name={member.name} size="lg" />
        <div>
          <h1 className="font-sora text-2xl font-bold text-deep">{member.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{member.role ?? "Sem cargo"}</span>
            {member.leader.name ? (
              <Badge tone="neutral">Líder: {member.leader.name}</Badge>
            ) : null}
          </div>
        </div>
      </div>

      <MemberTabs memberId={member.id} active={tab} />

      {tab === "visao" ? <VisaoTab memberId={member.id} radar={radar} /> : null}
      {tab === "perfil" ? (
        <div className="flex flex-col gap-6">
          <Card>
            <h3 className="mb-3 font-sora text-base font-semibold text-deep">Dados básicos</h3>
            <EditMemberForm
              teamMemberId={member.id}
              values={{ name: member.name, role: member.role, email: member.email }}
            />
          </Card>
          <Card>
            <p className="mb-4 text-sm text-muted">
              O “manual de instruções” do liderado — use como lembrete em 1:1s e conversas.
            </p>
            <ProfileForm
              teamMemberId={member.id}
              values={{
                motivators: member.profile?.motivators ?? null,
                feedbackPrefs: member.profile?.feedbackPrefs ?? null,
                communicationStyle: member.profile?.communicationStyle ?? null,
                strengths: member.profile?.strengths ?? null,
                watchouts: member.profile?.watchouts ?? null,
                aspirations: member.profile?.aspirations ?? null,
              }}
            />
          </Card>
        </div>
      ) : null}
      {tab === "um-a-um" ? <OneOnOneTab memberId={member.id} /> : null}
      {tab === "feedback" ? <FeedbackTab memberId={member.id} /> : null}
      {tab === "metas" ? <MetasTab memberId={member.id} /> : null}
      {tab === "pdi" ? <PdiTab memberId={member.id} /> : null}
    </div>
  );
}

async function VisaoTab({
  memberId,
  radar,
}: {
  memberId: string;
  radar: Parameters<typeof VirtueRadar>[0]["scores"];
}) {
  const { org } = await getContext();
  const oneOnOnes = await db.oneOnOne.findMany({
    where: { organizationId: org.id, teamMemberId: memberId },
    orderBy: { scheduledAt: "desc" },
    take: 5,
  });
  const lastDone = oneOnOnes.find((o) => o.status === "DONE");
  const stale = isStale(lastDone?.scheduledAt ?? null);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <h3 className="font-sora text-base font-semibold text-deep">Radar das virtudes</h3>
        <VirtueRadar scores={radar} />
      </Card>
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-sora text-base font-semibold text-deep">Últimos 1:1s</h3>
          {stale ? (
            <Badge tone="warn" dot>
              {lastDone ? `Sem 1:1 há ${daysSince(lastDone.scheduledAt)} dias` : "Nunca teve 1:1"}
            </Badge>
          ) : null}
        </div>
        {oneOnOnes.length === 0 ? (
          <p className="text-sm text-muted">Nenhum 1:1 registrado ainda.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {oneOnOnes.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-deep">{formatDateTime(o.scheduledAt)}</span>
                <span className="flex items-center gap-2">
                  {o.focusVirtue ? <VirtueBadge virtue={o.focusVirtue} /> : null}
                  {o.mood ? <span className="text-xs text-muted">mood {o.mood}/5</span> : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

async function OneOnOneTab({ memberId }: { memberId: string }) {
  return (
    <Card className="max-w-lg">
      <h3 className="mb-3 font-sora text-base font-semibold text-deep">Agendar 1:1</h3>
      <NewOneOnOneForm members={[]} defaultMemberId={memberId} />
    </Card>
  );
}

async function FeedbackTab({ memberId }: { memberId: string }) {
  const { org } = await getContext();
  const feedbacks = await db.feedback.findMany({
    where: { organizationId: org.id, teamMemberId: memberId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="flex flex-col gap-3">
        {feedbacks.length === 0 ? (
          <EmptyState
            icon="✎"
            title="Nenhum feedback ainda"
            description="Registre o primeiro feedback SBI para esta pessoa ao lado."
          />
        ) : (
          feedbacks.map((fb) => <FeedbackCard key={fb.id} fb={fb} />)
        )}
      </div>
      <Card className="h-fit">
        <h3 className="mb-3 font-sora text-base font-semibold text-deep">Novo feedback</h3>
        <FeedbackForm members={[]} defaultMemberId={memberId} />
      </Card>
    </div>
  );
}

async function MetasTab({ memberId }: { memberId: string }) {
  const { org } = await getContext();
  const goals = await db.goal.findMany({
    where: { organizationId: org.id, teamMemberId: memberId },
    orderBy: [{ quarter: "desc" }, { createdAt: "desc" }],
    include: { keyResults: true },
  });
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="flex flex-col gap-3">
        {goals.length === 0 ? (
          <EmptyState
            icon="◉"
            title="Nenhum objetivo ainda"
            description="Crie um objetivo com key results. O progresso é calculado automaticamente."
          />
        ) : (
          goals.map((g) => <GoalCard key={g.id} goal={g} />)
        )}
      </div>
      <Card className="h-fit">
        <h3 className="mb-3 font-sora text-base font-semibold text-deep">Novo objetivo</h3>
        <NewGoalForm members={[]} defaultMemberId={memberId} quarter={currentQuarter()} />
      </Card>
    </div>
  );
}

async function PdiTab({ memberId }: { memberId: string }) {
  const { org } = await getContext();
  const pdis = await db.pDI.findMany({
    where: { organizationId: org.id, teamMemberId: memberId },
    orderBy: [{ quarter: "desc" }, { createdAt: "desc" }],
    include: { actions: { orderBy: { done: "asc" } } },
  });
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="flex flex-col gap-3">
        {pdis.length === 0 ? (
          <EmptyState
            icon="◆"
            title="Nenhum PDI ainda"
            description="Monte 1 competência foco por trimestre, com ações e evidências de evolução."
          />
        ) : (
          pdis.map((p) => <PdiCard key={p.id} pdi={p} />)
        )}
      </div>
      <Card className="h-fit">
        <h3 className="mb-3 font-sora text-base font-semibold text-deep">Novo PDI</h3>
        <NewPdiForm members={[]} defaultMemberId={memberId} quarter={currentQuarter()} />
      </Card>
    </div>
  );
}
