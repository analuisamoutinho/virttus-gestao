import Link from "next/link";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { Card, EmptyState, PageHeader, SectionTitle, Badge, Icon } from "@/components/ui";
import { SCENARIOS, getScenario, DIFFICULTY_LABEL, type Difficulty } from "@/lib/feedback-scenarios";
import { scoreLabel } from "@/lib/feedback-trainer";
import { formatDateTime } from "@/lib/format";
import { llmEnabled } from "@/server/services/feedback-trainer-llm";
import { StartPracticeForm } from "./PracticeForms";

export default async function TreinoFeedbackPage() {
  const { org, userId } = await getContext();

  const practices = await db.feedbackPractice.findMany({
    where: { organizationId: org.id, userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, scenarioKey: true, difficulty: true, status: true, score: true, createdAt: true },
  });

  const completed = practices.filter((p) => p.status === "COMPLETED" && p.score !== null);
  const best = completed.reduce((acc, p) => Math.max(acc, p.score ?? 0), 0);

  return (
    <div>
      <PageHeader
        icon="mic"
        eyebrow="Pratique antes de conversar de verdade"
        title="Treino de feedback difícil"
        subtitle="Converse com uma pessoa fictícia, receba a reação dela em tempo real e veja uma avaliação da sua condução."
        actions={
          <Badge tone={llmEnabled() ? "success" : "neutral"} dot>
            {llmEnabled() ? "IA conectada" : "Modo simulado (regras)"}
          </Badge>
        }
      />

      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted">
        Escolha um cenário e uma dificuldade. Use o modelo SBI (Situação, Comportamento, Impacto), escute com
        perguntas abertas e termine com um combinado. Seus treinos são privados e nenhum dado de liderados reais é
        usado.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SCENARIOS.map((s) => (
          <div
            key={s.key}
            className="relative flex flex-col overflow-hidden rounded-card bg-[linear-gradient(150deg,#1B2C55_0%,#22407E_52%,#2B57B0_100%)] p-5 text-white shadow-md ring-1 ring-inset ring-white/10"
          >
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple/30 opacity-40 blur-2xl"
              aria-hidden
            />
            <span className="relative w-fit rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80 ring-1 ring-inset ring-white/15">
              {s.personaName} · {s.personaRole}
            </span>
            <h3 className="relative mt-3 font-sora text-lg font-bold leading-snug">{s.title}</h3>
            <p className="relative mt-1 flex-1 text-sm text-white/70">{s.tagline}</p>
            <div className="relative">
              <StartPracticeForm scenarioKey={s.key} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <SectionTitle
          hint="Só você vê o seu histórico."
          action={
            completed.length > 0 ? (
              <Badge tone="purple">Melhor nota: {best}</Badge>
            ) : null
          }
        >
          Seus treinos
        </SectionTitle>
        {practices.length === 0 ? (
          <EmptyState
            icon="◎"
            title="Nenhum treino ainda"
            description="Comece por um cenário acima. Em 5 minutos você já tem a primeira avaliação."
          />
        ) : (
          <Card padded={false}>
            <ul className="divide-y divide-border">
              {practices.map((p) => {
                const sc = getScenario(p.scenarioKey);
                return (
                  <li key={p.id}>
                    <Link
                      href={`/treino-feedback/${p.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-bg"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-grad-soft font-sora text-sm font-bold text-blue tabular-nums">
                        {p.score ?? "—"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-deep">{sc?.title ?? p.scenarioKey}</p>
                        <p className="text-xs text-muted">
                          {DIFFICULTY_LABEL[p.difficulty as Difficulty]?.label} · {formatDateTime(p.createdAt)}
                        </p>
                      </div>
                      {p.status === "COMPLETED" && p.score !== null ? (
                        <Badge tone={p.score >= 65 ? "success" : p.score >= 40 ? "warn" : "danger"}>
                          {scoreLabel(p.score)}
                        </Badge>
                      ) : (
                        <Badge tone="blue" dot>
                          Em andamento
                        </Badge>
                      )}
                      <Icon.chevronRight width={16} height={16} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
