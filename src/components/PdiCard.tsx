import type { Virtue } from "@prisma/client";
import { Card, Badge, ProgressBar } from "@/components/ui";
import { VirtueBadge } from "@/components/VirtueBadge";
import { AddPdiActionForm, PdiActionRow } from "@/app/(app)/pdi/PdiForms";

export type PdiView = {
  id: string;
  quarter: string;
  focusVirtue: Virtue;
  competency: string;
  memberName?: string;
  actions: { id: string; text: string; done: boolean; evidence: string | null }[];
};

export function PdiCard({ pdi }: { pdi: PdiView }) {
  const doneCount = pdi.actions.filter((a) => a.done).length;
  const total = pdi.actions.length;
  const pct = total > 0 ? (doneCount / total) * 100 : 0;
  return (
    <Card hover>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-sora text-sm font-semibold text-deep">{pdi.competency}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <VirtueBadge virtue={pdi.focusVirtue} />
            <Badge tone="neutral">{pdi.quarter}</Badge>
            {pdi.memberName ? <Badge tone="blue">{pdi.memberName}</Badge> : null}
          </div>
        </div>
        <Badge tone={total > 0 && doneCount === total ? "success" : "neutral"}>
          {doneCount}/{total} ações
        </Badge>
      </div>

      {total > 0 ? (
        <div className="mt-3">
          <ProgressBar value={pct} tone={doneCount === total ? "success" : "grad"} />
        </div>
      ) : null}

      {pdi.actions.length > 0 ? (
        <ul className="mt-3">
          {pdi.actions.map((a) => (
            <PdiActionRow
              key={a.id}
              id={a.id}
              text={a.text}
              done={a.done}
              evidence={a.evidence}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">Nenhuma ação ainda.</p>
      )}
      <AddPdiActionForm pdiId={pdi.id} />
    </Card>
  );
}
