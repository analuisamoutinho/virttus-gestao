import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { listMembers } from "@/server/members";
import { Card, EmptyState, PageHeader, SectionTitle, ButtonLink } from "@/components/ui";
import { FeedbackCard } from "@/components/FeedbackCard";
import { FeedbackForm } from "./FeedbackForm";

export default async function FeedbackPage() {
  const { org } = await getContext();

  const [members, feedbacks] = await Promise.all([
    listMembers(org.id),
    db.feedback.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { teamMember: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        icon="feedback"
        eyebrow="Reconhecimento & desenvolvimento"
        title="Feedback"
        subtitle="Registre no modelo SBI: Situação, Comportamento e Impacto."
      />

      {members.length === 0 ? (
        <EmptyState
          icon="✎"
          title="Cadastre a equipe primeiro"
          description="Você precisa de pelo menos um liderado para registrar feedbacks."
          action={<ButtonLink href="/equipe" icon="team">Ir para Equipe</ButtonLink>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-3">
            {feedbacks.length === 0 ? (
              <EmptyState
                icon="✎"
                title="Nenhum feedback ainda"
                description="Registre feedback no modelo SBI: descreva a Situação, o Comportamento observável e o Impacto — ancorado numa virtude."
              />
            ) : (
              feedbacks.map((fb) => (
                <FeedbackCard
                  key={fb.id}
                  fb={{ ...fb, memberName: fb.teamMember.name }}
                />
              ))
            )}
          </div>

          <Card className="h-fit lg:sticky lg:top-24">
            <SectionTitle hint="Situação · Comportamento · Impacto">
              Novo feedback (SBI)
            </SectionTitle>
            <FeedbackForm members={members} />
          </Card>
        </div>
      )}
    </div>
  );
}
