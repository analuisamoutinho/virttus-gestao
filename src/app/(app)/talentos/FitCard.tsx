import { Badge, ProgressBar } from "@/components/ui";
import { TIER_LABEL, type FitResult } from "@/server/services/talent-score";

const TIER_TONE = { HOT: "success", WARM: "warn", COLD: "neutral" } as const;

export function FitBadge({ fit }: { fit: FitResult }) {
  return (
    <Badge tone={TIER_TONE[fit.tier]} dot>
      {TIER_LABEL[fit.tier]}
    </Badge>
  );
}

export function FitScore({ fit }: { fit: FitResult }) {
  const color =
    fit.tier === "HOT" ? "text-success" : fit.tier === "WARM" ? "text-warn" : "text-muted";
  return (
    <div className="flex flex-col items-center">
      <span className={`font-sora text-3xl font-bold tabular-nums ${color}`}>{fit.score}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">fit / 100</span>
    </div>
  );
}

export function FitBreakdown({ fit }: { fit: FitResult }) {
  return (
    <div className="flex flex-col gap-3">
      {fit.components.map((c) => (
        <div key={c.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="text-xs font-semibold text-deep">
              {c.label} <span className="font-normal text-muted">· peso {c.weight}</span>
            </span>
            <span className="text-xs font-bold tabular-nums text-blue">
              {c.earned === null ? "n/d" : `${Math.round(c.earned * 100)}%`}
            </span>
          </div>
          {c.earned === null ? (
            <div className="h-2 w-full rounded-full border border-dashed border-border" />
          ) : (
            <ProgressBar
              value={c.earned * 100}
              tone={c.earned >= 0.8 ? "success" : c.earned >= 0.5 ? "blue" : "warn"}
            />
          )}
          <p className="mt-1 text-[11px] text-muted">{c.detail}</p>
        </div>
      ))}
      <p className="text-[11px] text-muted">
        Avaliado com base em {Math.round(fit.completeness * 100)}% dos critérios. Critérios sem dado ficam fora da
        conta — complete a entrevista para um fit mais confiável.
      </p>
    </div>
  );
}
