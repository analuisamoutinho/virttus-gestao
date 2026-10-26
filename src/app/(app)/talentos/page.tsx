import Link from "next/link";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, EmptyState, Kpi, PageHeader, SectionTitle, Badge, Avatar, Icon } from "@/components/ui";
import {
  criteriaFromOpening,
  profileFromCandidate,
  rankByFit,
  scoreCandidate,
  type FitResult,
} from "@/server/services/talent-score";
import { JOB_STATUS_LABEL } from "@/lib/talent-meta";
import { formatBRL } from "@/lib/format";
import { virtueLabel } from "@/lib/virtues";
import { CandidateForm, CandidateStatusSelect, OpeningForm } from "./TalentForms";
import { FitBadge, FitBreakdown, FitScore } from "./FitCard";

type SearchParams = { vaga?: string; todos?: string };

function Disclosure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-sm border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-deep shadow-sm transition hover:border-border-strong">
        <Icon.plus width={16} height={16} />
        {label}
      </summary>
      <Card className="mt-3 animate-scale-in">{children}</Card>
    </details>
  );
}

export default async function TalentosPage({ searchParams }: { searchParams: SearchParams }) {
  const { org } = await getContext();
  const showAll = searchParams.todos === "1";

  const [openings, candidates] = await Promise.all([
    db.jobOpening.findMany({
      where: { organizationId: org.id },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    db.candidate.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const selected =
    openings.find((o) => o.id === searchParams.vaga) ??
    (searchParams.vaga === "banco" ? undefined : openings.find((o) => o.status === "OPEN"));

  const pool = showAll
    ? candidates
    : candidates.filter((c) => c.status !== "DESCARTADO" && c.status !== "CONTRATADO");

  const ranked = selected
    ? rankByFit(
        pool.map((c) => ({
          c,
          fit: scoreCandidate(profileFromCandidate(c), criteriaFromOpening(selected)),
        })),
      )
    : pool.map((c) => ({ c, fit: null as FitResult | null }));

  const hot = ranked.filter((r) => r.fit?.tier === "HOT").length;
  const openCount = openings.filter((o) => o.status === "OPEN").length;
  const countByOpening = new Map<string, number>();
  for (const c of candidates) {
    if (c.openingId) countByOpening.set(c.openingId, (countByOpening.get(c.openingId) ?? 0) + 1);
  }
  const link = (vaga: string, todos = showAll) => `/talentos?vaga=${vaga}${todos ? "&todos=1" : ""}`;

  return (
    <div>
      <PageHeader
        icon="talent"
        eyebrow="Recrutamento"
        title="Banco de talentos"
        subtitle="Cada candidato recebe um fit (0–100) por vaga: requisitos, experiência, virtudes, entrevista e pretensão."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Vagas abertas" value={openCount} caption={`${openings.length} no total`} accent="blue" icon="goals" />
        <Kpi label="Candidatos no banco" value={candidates.length} caption="Todas as etapas" accent="purple" icon="team" />
        <Kpi
          label="Alto fit"
          value={selected ? hot : "—"}
          caption={selected ? `Para “${selected.title}”` : "Selecione uma vaga"}
          accent="success"
          icon="sparkle"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-start gap-3">
        <Disclosure label="Nova vaga">
          <OpeningForm />
        </Disclosure>
        <Disclosure label="Novo candidato">
          <CandidateForm
            openings={openings.map((o) => ({ id: o.id, title: o.title }))}
            defaultOpeningId={selected?.id}
          />
        </Disclosure>
      </div>

      {/* Seletor de vaga */}
      <div className="mt-6">
        <SectionTitle hint="O ranking abaixo é calculado em relação à vaga escolhida.">Vagas</SectionTitle>
        {openings.length === 0 ? (
          <p className="text-sm text-muted">
            Nenhuma vaga criada. Crie a primeira para ver o fit dos candidatos — ou cadastre candidatos só no banco.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {openings.map((o) => {
              const active = selected?.id === o.id;
              return (
                <Link
                  key={o.id}
                  href={link(o.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-blue/30 bg-grad-soft text-blue shadow-sm"
                      : "border-border bg-surface text-muted hover:border-border-strong hover:text-deep"
                  }`}
                >
                  {o.title}
                  <span className="rounded-full bg-bg px-1.5 text-[11px] font-bold tabular-nums text-muted-light">
                    {countByOpening.get(o.id) ?? 0}
                  </span>
                  {o.status !== "OPEN" ? <span className="text-[10px] uppercase">{JOB_STATUS_LABEL[o.status]}</span> : null}
                </Link>
              );
            })}
            <Link
              href={link("banco")}
              className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                !selected
                  ? "border-blue/30 bg-grad-soft text-blue shadow-sm"
                  : "border-border bg-surface text-muted hover:border-border-strong hover:text-deep"
              }`}
            >
              Todo o banco (sem fit)
            </Link>
          </div>
        )}
      </div>

      {selected ? (
        <Card className="mt-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-sora text-lg font-bold text-deep">{selected.title}</h3>
              <p className="text-xs text-muted">
                {[selected.area, selected.location].filter(Boolean).map((t) => `${t} · `)}
                <Badge tone={selected.status === "OPEN" ? "success" : "neutral"}>{JOB_STATUS_LABEL[selected.status]}</Badge>
              </p>
            </div>
            <Link href={`/talentos/vagas/${selected.id}`} className="text-sm font-semibold text-purple hover:underline">
              Editar critérios
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
            <span>
              <strong className="text-deep">Obrigatórios:</strong> {selected.requiredSkills.join(", ") || "—"}
            </span>
            <span>
              <strong className="text-deep">Diferenciais:</strong> {selected.desiredSkills.join(", ") || "—"}
            </span>
            <span>
              <strong className="text-deep">Experiência mín.:</strong> {selected.minYears} anos
            </span>
            {selected.salaryMax ? (
              <span>
                <strong className="text-deep">Faixa:</strong>{" "}
                {selected.salaryMin ? `${formatBRL(selected.salaryMin)} – ` : "até "}
                {formatBRL(selected.salaryMax)}
              </span>
            ) : null}
            {selected.targetVirtues.length > 0 ? (
              <span>
                <strong className="text-deep">Virtudes:</strong> {selected.targetVirtues.map(virtueLabel).join(", ")}
              </span>
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="mt-6">
        <SectionTitle
          hint={selected ? "Do maior para o menor fit." : "Mais recentes primeiro."}
          action={
            <Link href={link(selected?.id ?? "banco", !showAll)} className="text-xs font-semibold text-muted hover:text-deep">
              {showAll ? "Ocultar descartados e contratados" : "Mostrar descartados e contratados"}
            </Link>
          }
        >
          Candidatos
        </SectionTitle>

        {ranked.length === 0 ? (
          <EmptyState
            icon="◇"
            title="Nenhum candidato ainda"
            description="Adicione candidatos ao banco de talentos. Quanto mais dados (habilidades, currículo, entrevista), mais confiável o fit."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {ranked.map(({ c, fit }) => (
              <Card key={c.id} className="p-5">
                <div className="flex flex-wrap items-center gap-4">
                  {fit ? <FitScore fit={fit} /> : <Avatar name={c.name} size="lg" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/talentos/candidatos/${c.id}`} className="font-sora text-base font-bold text-deep hover:text-blue">
                        {c.name}
                      </Link>
                      {fit ? <FitBadge fit={fit} /> : null}
                      {fit && fit.completeness < 0.8 ? (
                        <Badge tone="neutral">Avaliação parcial · {Math.round(fit.completeness * 100)}%</Badge>
                      ) : null}
                      {selected && c.openingId === selected.id ? <Badge tone="blue">Candidatou-se</Badge> : null}
                    </div>
                    <p className="text-xs text-muted">
                      {[c.currentRole, c.location, `${c.yearsExperience} ${c.yearsExperience === 1 ? "ano" : "anos"} exp.`, c.salaryExpectation ? formatBRL(c.salaryExpectation) : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {fit ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {fit.matchedRequired.map((s) => (
                          <span key={s} className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
                            ✓ {s}
                          </span>
                        ))}
                        {fit.missingRequired.map((s) => (
                          <span key={s} className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-semibold text-danger">
                            ✗ {s}
                          </span>
                        ))}
                        {fit.matchedDesired.map((s) => (
                          <span key={s} className="rounded-full bg-blue/10 px-2 py-0.5 text-[11px] font-semibold text-blue">
                            + {s}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <CandidateStatusSelect id={c.id} status={c.status} />
                  </div>
                </div>
                {fit ? (
                  <details className="group mt-3 border-t border-border pt-3">
                    <summary className="cursor-pointer list-none text-xs font-semibold text-purple hover:underline">
                      Ver por que este fit
                    </summary>
                    <div className="mt-3 max-w-xl">
                      <FitBreakdown fit={fit} />
                    </div>
                  </details>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
