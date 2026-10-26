import { notFound } from "next/navigation";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, PageHeader, SectionTitle, ButtonLink } from "@/components/ui";
import { DeleteOpeningButton, OpeningForm } from "../../TalentForms";

export default async function OpeningPage({ params }: { params: { openingId: string } }) {
  const { org } = await getContext();

  const opening = await db.jobOpening.findFirst({
    where: { id: params.openingId, organizationId: org.id },
  });
  if (!opening) notFound();

  return (
    <div>
      <PageHeader
        icon="talent"
        eyebrow="Critérios da vaga"
        title={opening.title}
        subtitle="Estes critérios alimentam o fit de cada candidato."
        actions={
          <>
            <ButtonLink href={`/talentos?vaga=${opening.id}`} variant="outline" size="sm" icon="chevronLeft">
              Ranking
            </ButtonLink>
            <DeleteOpeningButton openingId={opening.id} />
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <OpeningForm opening={opening} />
        </Card>
        <Card className="h-fit">
          <SectionTitle>Como o fit é calculado</SectionTitle>
          <ul className="flex flex-col gap-2 text-sm leading-relaxed text-muted">
            <li>
              <strong className="text-deep">Requisitos obrigatórios (35):</strong> fatia atendida, nas habilidades
              declaradas ou no texto do currículo.
            </li>
            <li>
              <strong className="text-deep">Diferenciais (10):</strong> idem, para os itens desejáveis.
            </li>
            <li>
              <strong className="text-deep">Experiência (15):</strong> anos do candidato ÷ mínimo da vaga.
            </li>
            <li>
              <strong className="text-deep">Virtudes (20):</strong> notas 1–5 da entrevista nas virtudes buscadas.
            </li>
            <li>
              <strong className="text-deep">Entrevista (15):</strong> nota geral 1–5.
            </li>
            <li>
              <strong className="text-deep">Pretensão (5):</strong> dentro do teto da vaga; até 20% acima vale metade.
            </li>
          </ul>
          <p className="mt-3 text-xs text-muted">
            Critérios sem dado ficam fora da conta e os pesos são redistribuídos. Alto fit ≥ 80 · Bom fit ≥ 60.
          </p>
        </Card>
      </div>
    </div>
  );
}
