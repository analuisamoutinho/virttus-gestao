import Link from "next/link";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { listMembers } from "@/server/members";
import { Card, EmptyState } from "@/components/ui";
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
      <h1 className="mb-6 font-sora text-2xl font-bold text-deep">Feedback</h1>

      {members.length === 0 ? (
        <EmptyState
          icon="✎"
          title="Cadastre a equipe primeiro"
          description="Você precisa de pelo menos um liderado para registrar feedbacks."
          action={
            <Link href="/equipe" className="text-sm font-semibold text-purple">
              Ir para Equipe →
            </Link>
          }
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

          <Card className="h-fit">
            <h2 className="mb-1 font-sora text-lg font-semibold text-deep">
              Novo feedback (SBI)
            </h2>
            <p className="mb-3 text-xs text-muted">
              Situação · Comportamento · Impacto
            </p>
            <FeedbackForm members={members} />
          </Card>
        </div>
      )}
    </div>
  );
}
