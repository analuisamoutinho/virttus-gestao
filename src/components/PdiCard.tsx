import type { Virtue } from "@prisma/client";
import { Card } from "@/components/ui";
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
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-sora text-sm font-semibold text-deep">{pdi.competency}</h3>
            <VirtueBadge virtue={pdi.focusVirtue} />
          </div>
          <p className="text-xs text-muted">
            {pdi.quarter}
            {pdi.memberName ? ` · ${pdi.memberName}` : ""}
          </p>
        </div>
        <span className="text-xs text-muted">
          {doneCount}/{pdi.actions.length} ações
        </span>
      </div>

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
