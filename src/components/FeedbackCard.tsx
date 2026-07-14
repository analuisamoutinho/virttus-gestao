import type { Virtue, FeedbackType } from "@prisma/client";
import { Card, Badge } from "@/components/ui";
import { VirtueBadge } from "@/components/VirtueBadge";
import { formatDate } from "@/lib/format";

export type FeedbackView = {
  id: string;
  type: FeedbackType;
  situation: string;
  behavior: string;
  impact: string;
  virtue: Virtue | null;
  createdAt: Date;
  memberName?: string;
};

export function FeedbackCard({ fb }: { fb: FeedbackView }) {
  const recognition = fb.type === "RECOGNITION";
  return (
    <Card
      className="border-l-4"
      hover
      style={{ borderLeftColor: recognition ? "#16A34A" : "#7C3AED" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={recognition ? "success" : "purple"} dot>
            {recognition ? "Reconhecimento" : "Construtivo"}
          </Badge>
          {fb.memberName ? (
            <span className="text-sm font-semibold text-deep">{fb.memberName}</span>
          ) : null}
          {fb.virtue ? <VirtueBadge virtue={fb.virtue} /> : null}
        </div>
        <span className="shrink-0 text-xs text-muted">{formatDate(fb.createdAt)}</span>
      </div>
      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <SbiRow label="Situação" value={fb.situation} />
        <SbiRow label="Comportamento" value={fb.behavior} />
        <SbiRow label="Impacto" value={fb.impact} />
      </dl>
    </Card>
  );
}

function SbiRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="whitespace-pre-wrap text-deep">{value}</dd>
    </div>
  );
}
