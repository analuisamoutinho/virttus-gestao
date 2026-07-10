import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, EmptyState } from "@/components/ui";
import { VirtueRadar } from "@/components/charts/VirtueRadar";
import { VirtueBadge } from "@/components/VirtueBadge";
import { FeedbackCard } from "@/components/FeedbackCard";
import { teamRadar } from "@/server/services/virtue-score";
import { isStale, daysSince } from "@/server/services/alerts";
import { formatDateTime } from "@/lib/format";
import { NewOneOnOneForm } from "../../um-a-um/OneOnOneForms";
import { FeedbackForm } from "../../feedback/FeedbackForm";
import { ProfileForm } from "./ProfileForm";

export default async function MemberPage({
  params,
}: {
  params: { memberId: string };
}) {
  const { org } = await getContext();

  const member = await db.teamMember.findFirst({
    where: { id: params.memberId, organizationId: org.id },
    include: {
      profile: true,
      leader: { select: { name: true } },
      oneOnOnes: {
        orderBy: { scheduledAt: "desc" },
        take: 10,
        include: { actionItems: true },
      },
      feedbacks: { orderBy: { createdAt: "desc" }, take: 10 },
      virtueScores: {
        select: { teamMemberId: true, virtue: true, score: true, recordedAt: true },
      },
    },
  });
  if (!member) notFound();

  const radar = teamRadar(member.virtueScores);
  const lastDone = member.oneOnOnes.find((o) => o.status === "DONE");
  const stale = isStale(lastDone?.scheduledAt ?? null);

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 text-sm text-muted">
        <Link href="/equipe" className="hover:text-blue">
          Equipe
        </Link>
        <span>/</span>
        <span className="text-deep">{member.name}</span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-sora text-2xl font-bold text-deep">{member.name}</h1>
          <p className="text-sm text-muted">
            {member.role ?? "—"} · líder: {member.leader.name ?? "—"}
          </p>
        </div>
        {stale ? (
          <span className="rounded-full bg-grad-soft px-3 py-1 text-xs font-medium text-purple">
            {lastDone
              ? `Sem 1:1 há ${daysSince(lastDone.scheduledAt)} dias`
              : "Nunca teve 1:1"}
          </span>
        ) : null}
      </div>

      {/* Visão geral */}
      <Section title="Visão geral">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <h3 className="font-sora text-base font-semibold text-deep">
              Radar das virtudes
            </h3>
            <VirtueRadar scores={radar} />
          </Card>
          <Card>
            <h3 className="mb-2 font-sora text-base font-semibold text-deep">
              Últimos 1:1s
            </h3>
            {member.oneOnOnes.length === 0 ? (
              <p className="text-sm text-muted">Nenhum 1:1 registrado ainda.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {member.oneOnOnes.slice(0, 5).map((o) => (
                  <li key={o.id} className="flex items-center justify-between py-2">
                    <span className="text-sm text-deep">
                      {formatDateTime(o.scheduledAt)}
                    </span>
                    <span className="flex items-center gap-2">
                      {o.focusVirtue ? <VirtueBadge virtue={o.focusVirtue} /> : null}
                      {o.mood ? (
                        <span className="text-xs text-muted">mood {o.mood}/5</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </Section>

      {/* Perfil pessoal */}
      <Section title="Perfil pessoal">
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
      </Section>

      {/* 1:1s */}
      <Section title="1:1s">
        <Card>
          <NewOneOnOneForm members={[]} defaultMemberId={member.id} />
        </Card>
      </Section>

      {/* Feedbacks */}
      <Section title="Feedbacks">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-3">
            {member.feedbacks.length === 0 ? (
              <EmptyState
                icon="✎"
                title="Nenhum feedback ainda"
                description="Registre o primeiro feedback SBI para esta pessoa ao lado."
              />
            ) : (
              member.feedbacks.map((fb) => <FeedbackCard key={fb.id} fb={fb} />)
            )}
          </div>
          <Card className="h-fit">
            <h3 className="mb-3 font-sora text-base font-semibold text-deep">
              Novo feedback
            </h3>
            <FeedbackForm members={[]} defaultMemberId={member.id} />
          </Card>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-sora text-lg font-semibold text-deep">{title}</h2>
      {children}
    </section>
  );
}
