"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import { TrainingStatusControls } from "./TrainingForms";

type Status = "PLANNED" | "DONE" | "CANCELED";

export type TrainingCard = {
  id: string;
  title: string;
  description: string | null;
  module: string | null;
  status: Status;
  focusVirtueLabel: string | null;
  dateLabel: string;
};

const STATUS_META: Record<
  Status,
  { label: string; badge: string; progress: number }
> = {
  DONE: {
    label: "Concluído",
    badge: "bg-[#22C55E] text-white",
    progress: 100,
  },
  PLANNED: {
    label: "Planejado",
    badge: "bg-white/15 text-white ring-1 ring-inset ring-white/25",
    progress: 0,
  },
  CANCELED: {
    label: "Cancelado",
    badge: "bg-white/10 text-white/60 ring-1 ring-inset ring-white/15",
    progress: 0,
  },
};

const FILTERS: { key: "ALL" | Status; label: string }[] = [
  { key: "ALL", label: "Todas" },
  { key: "PLANNED", label: "Planejado" },
  { key: "DONE", label: "Concluído" },
  { key: "CANCELED", label: "Cancelado" },
];

export function TrainingBoard({ trainings }: { trainings: TrainingCard[] }) {
  const [filter, setFilter] = useState<"ALL" | Status>("ALL");

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: trainings.length };
    for (const t of trainings) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [trainings]);

  const visible = filter === "ALL" ? trainings : trainings.filter((t) => t.status === filter);

  return (
    <div>
      {/* Chips de filtro */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = counts[f.key] ?? 0;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border-blue/30 bg-grad-soft text-blue shadow-sm"
                  : "border-border bg-surface text-muted hover:border-border-strong hover:text-deep"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                  active ? "bg-blue/15 text-blue" : "bg-bg text-muted-light"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grade de cards */}
      {visible.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-muted">
          Nenhum treinamento neste filtro.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((t) => (
            <TrainingGradientCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TrainingGradientCard({ t }: { t: TrainingCard }) {
  const meta = STATUS_META[t.status];
  const category = t.module ?? t.focusVirtueLabel ?? "Treinamento";
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-card bg-[linear-gradient(150deg,#1B2C55_0%,#22407E_52%,#2B57B0_100%)] p-5 text-white shadow-md ring-1 ring-inset ring-white/10 transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* brilho decorativo */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple/30 opacity-40 blur-2xl"
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${meta.badge}`}>
          {meta.label}
        </span>
        <span className="max-w-[45%] truncate rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80 ring-1 ring-inset ring-white/15">
          {category}
        </span>
      </div>

      <h3 className="relative mt-4 font-sora text-lg font-bold leading-snug">{t.title}</h3>
      {t.description ? (
        <p className="relative mt-1.5 line-clamp-2 text-sm text-white/70">{t.description}</p>
      ) : null}

      <div className="relative mt-4 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-white/80">
          <Icon.calendar width={15} height={15} />
          {t.dateLabel}
        </span>
        <span className="font-sora text-lg font-bold tabular-nums">{meta.progress}%</span>
      </div>

      {/* barra de progresso */}
      <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#7DD3FC,#A5B4FC)] transition-[width] duration-500"
          style={{ width: `${meta.progress}%` }}
        />
      </div>

      <div className="relative mt-4 border-t border-white/10 pt-3">
        <TrainingStatusControls id={t.id} status={t.status} tone="dark" />
      </div>
    </div>
  );
}
