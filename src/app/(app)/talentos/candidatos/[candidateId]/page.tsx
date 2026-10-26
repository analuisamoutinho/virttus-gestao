import { notFound } from "next/navigation";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { writeAuditLog } from "@/server/audit";
import { Card, PageHeader, SectionTitle, ButtonLink, Badge } from "@/components/ui";
import {
  criteriaFromOpening,
  profileFromCandidate,
  rankByFit,
  scoreCandidate,
} from "@/server/services/talent-score";
import { JOB_STATUS_LABEL } from "@/lib/talent-meta";
import { CandidateForm, DeleteCandidateButton } from "../../TalentForms";
import { FitBadge, FitBreakdown, FitScore } from "../../FitCard";

export default async function CandidatePage({ params }: { params: { candidateId: string } }) {
  const { org, userId } = await getContext();

  const [candidate, openings] = await Promise.all([
    db.candidate.findFirst({ where: { id: params.candidateId, organizationId: org.id } }),
    db.jobOpening.findMany({ where: { organizationId: org.id }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!candidate) notFound();

  // Dado pessoal de candidato: o acesso à ficha fica registrado (LGPD).
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "candidate.view",
    entity: "Candidate",
    entityId: candidate.id,
  });

  const profile = profileFromCandidate(candidate);
  const fits = rankByFit(
    openings.map((o) => ({ o, fit: scoreCandidate(profile, criteriaFromOpening(o)) })),
  );

  return (
    <div>
      <PageHeader
        icon="talent"
        eyebrow="Candidato"
        title={candidate.name}
        subtitle={[candidate.currentRole, candidate.location].filter(Boolean).join(" · ") || undefined}
        actions={
          <>
            <ButtonLink href="/talentos" variant="outline" size="sm" icon="chevronLeft">
              Banco de talentos
            </ButtonLink>
            <DeleteCandidateButton candidateId={candidate.id} />
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CandidateForm
            candidate={{ ...candidate, virtueRatings: profile.virtueRatings ?? {} }}
            openings={openings.map((o) => ({ id: o.id, title: o.title }))}
          />
        </Card>

        <div className="flex flex-col gap-4">
          <SectionTitle hint="Fit do candidato em cada vaga, do maior para o menor.">Fit por vaga</SectionTitle>
          {fits.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">Crie uma vaga para ver o fit deste candidato.</p>
            </Card>
          ) : (
            fits.map(({ o, fit }) => (
              <Card key={o.id} className="p-5">
                <div className="flex items-center gap-4">
                  <FitScore fit={fit} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sora text-sm font-bold text-deep">{o.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <FitBadge fit={fit} />
                      <Badge tone="neutral">{JOB_STATUS_LABEL[o.status]}</Badge>
                    </div>
                  </div>
                </div>
                <details className="mt-3 border-t border-border pt-3">
                  <summary className="cursor-pointer list-none text-xs font-semibold text-purple hover:underline">
                    Ver por que este fit
                  </summary>
                  <div className="mt-3">
                    <FitBreakdown fit={fit} />
                  </div>
                </details>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
