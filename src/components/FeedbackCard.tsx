import type { Virtue, FeedbackType } from "@prisma/client";
import { Card } from "@/components/ui";
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
      style={{ borderLeftColor: recognition ? "#16a34a" : "#7C3AED" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              recognition ? "bg-green-50 text-green-700" : "bg-grad-soft text-purple"
            }`}
          >
            {recognition ? "Reconhecimento" : "Construtivo"}
          </span>
          {fb.memberName ? (
            <span className="text-sm font-semibold text-deep">{fb.memberName}</span>
          ) : null}
          {fb.virtue ? <VirtueBadge virtue={fb.virtue} /> : null}
        </div>
        <span className="text-xs text-muted">{formatDate(fb.createdAt)}</span>
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
