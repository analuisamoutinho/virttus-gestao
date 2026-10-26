import { Card, Kpi, ProgressBar, SectionTitle } from "@/components/ui";
import { MANAGER_DIMENSIONS, MIN_RESPONSES_TO_REVEAL } from "@/lib/manager-feedback";
import type { ManagerFeedbackSummary } from "@/server/services/manager-feedback";

// Resultados agregados do feedback anônimo de um gestor. Reutilizado no
// painel do próprio gestor e na visão do administrador.
export function ManagerResults({ summary }: { summary: ManagerFeedbackSummary }) {
  if (!summary.revealed) {
    return (
      <Card className="text-center">
        <p className="font-sora text-base font-semibold text-deep">
          {summary.total} {summary.total === 1 ? "resposta recebida" : "respostas recebidas"}
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          Os resultados aparecem a partir de {MIN_RESPONSES_TO_REVEAL} respostas
          {summary.remaining > 0 ? ` (faltam ${summary.remaining})` : ""}. Esse mínimo protege o anonimato: com
          poucas respostas seria fácil deduzir quem escreveu.
        </p>
      </Card>
    );
  }

  const sections = [
    { title: "Continue fazendo", items: summary.keep, tone: "text-success" },
    { title: "Comece a fazer", items: summary.start, tone: "text-blue" },
    { title: "Pare de fazer", items: summary.stop, tone: "text-danger" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Kpi
          label="Nota geral"
          value={summary.overall !== null ? summary.overall.toFixed(1) : "—"}
          caption="Média das 6 dimensões (1–5)"
          accent="blue"
          icon="goals"
        />
        <Kpi label="Respostas" value={summary.total} caption="Anônimas" accent="purple" icon="inbox" />
      </div>

      <Card>
        <SectionTitle hint="Nota média de 1 a 5 em cada dimensão.">Dimensões</SectionTitle>
        <ul className="flex flex-col gap-4">
          {MANAGER_DIMENSIONS.map((d) => {
            const avg = summary.averages?.[d.key] ?? 0;
            return (
              <li key={d.key}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold text-deep">{d.label}</span>
                  <span className="text-sm font-bold tabular-nums text-blue">{avg.toFixed(1)}</span>
                </div>
                <ProgressBar value={(avg / 5) * 100} tone={avg >= 4 ? "success" : avg >= 3 ? "blue" : "warn"} />
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {sections.map((s) => (
          <Card key={s.title}>
            <h3 className={`mb-3 font-sora text-sm font-bold ${s.tone}`}>{s.title}</h3>
            {s.items.length === 0 ? (
              <p className="text-xs text-muted">Sem comentários.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {s.items.map((t, i) => (
                  <li key={i} className="whitespace-pre-wrap rounded-sm bg-bg p-3 text-sm leading-relaxed text-deep">
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
      <p className="text-[11px] text-muted">
        Comentários aparecem sem data e em ordem embaralhada, para não identificar quem escreveu.
      </p>
    </div>
  );
}
