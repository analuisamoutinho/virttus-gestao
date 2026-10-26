import Link from "next/link";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, PageHeader, SectionTitle, ButtonLink, EmptyState } from "@/components/ui";
import { summarizeManagerFeedback } from "@/server/services/manager-feedback";
import { getBaseUrl } from "@/server/base-url";
import { CopyLink, RegenerateLinkButton } from "./FeedbackLinkControls";
import { ManagerResults } from "./ManagerResults";

export default async function FeedbackGestorPage() {
  const { org, userId, role } = await getContext();
  const baseUrl = getBaseUrl();

  const me = await db.user.findUnique({
    where: { id: userId },
    select: { anonFeedbackToken: true },
  });

  // Liderado com login: acesso direto ao formulário do próprio gestor.
  if (role === "MEMBER") {
    const membership = await db.teamMember.findFirst({
      where: { userId, organizationId: org.id },
      select: { leader: { select: { name: true, anonFeedbackToken: true } } },
    });
    const leader = membership?.leader;
    return (
      <div>
        <PageHeader
          icon="inbox"
          eyebrow="Anônimo e sempre disponível"
          title="Feedback ao gestor"
          subtitle="Você pode avaliar seu gestor a qualquer momento — sem identificação."
        />
        {leader?.anonFeedbackToken ? (
          <Card className="mx-auto max-w-xl text-center">
            <p className="text-sm text-muted">
              Suas respostas não ficam ligadas ao seu nome, e os resultados só aparecem para o gestor quando há
              respostas suficientes.
            </p>
            <div className="mt-4">
              <ButtonLink href={`/anonimo/${leader.anonFeedbackToken}`} icon="inbox">
                Enviar feedback anônimo{leader.name ? ` para ${leader.name}` : ""}
              </ButtonLink>
            </div>
          </Card>
        ) : (
          <EmptyState
            icon="✉"
            title="Seu gestor ainda não ativou o formulário"
            description="Peça a ele(a) para gerar o link do feedback anônimo na página Feedback ao gestor."
          />
        )}
      </div>
    );
  }

  const rows = await db.managerFeedback.findMany({
    where: { organizationId: org.id, managerId: userId },
    select: { ratings: true, keepText: true, startText: true, stopText: true },
  });
  const summary = summarizeManagerFeedback(rows);
  const link = me?.anonFeedbackToken ? `${baseUrl}/anonimo/${me.anonFeedbackToken}` : null;

  return (
    <div>
      <PageHeader
        icon="inbox"
        eyebrow="Anônimo e sempre disponível"
        title="Feedback ao gestor"
        subtitle="Seu time avalia a sua liderança por um formulário sem identificação. Use o que aprender no seu PDI."
        actions={
          role === "ADMIN" ? (
            <ButtonLink href="/admin" variant="outline" size="sm" icon="shield">
              Ver todos os gestores
            </ButtonLink>
          ) : null
        }
      />

      <Card className="mb-6">
        <SectionTitle hint="Compartilhe com o seu time. O formulário não pede login e fica sempre aberto.">
          Seu link para o time
        </SectionTitle>
        {link ? (
          <div className="flex flex-col gap-3">
            <CopyLink url={link} />
            <div className="flex flex-wrap items-center gap-4">
              <RegenerateLinkButton hasLink size="sm" />
              <Link href={`/anonimo/${me?.anonFeedbackToken}`} className="text-xs font-semibold text-purple hover:underline">
                Pré-visualizar o formulário
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted">Gere o link e envie ao seu time (Slack, e-mail, WhatsApp).</p>
            <RegenerateLinkButton hasLink={false} />
          </div>
        )}
        <ul className="mt-4 flex flex-col gap-1 text-xs text-muted">
          <li>• Não há login, IP, nome ou horário exato guardados — apenas a semana do envio.</li>
          <li>• Resultados só aparecem a partir de 3 respostas, e os comentários são embaralhados.</li>
          <li>• Gerar um novo link desativa o anterior (útil se ele vazar para fora do time).</li>
        </ul>
      </Card>

      <ManagerResults summary={summary} />
    </div>
  );
}
