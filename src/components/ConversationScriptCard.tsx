import type { Virtue, ConversationContextType } from "@prisma/client";
import { Card, Badge } from "@/components/ui";
import { VirtueBadge } from "@/components/VirtueBadge";
import { conversationTypeLabel } from "@/lib/conversation";
import { formatDateTime } from "@/lib/format";

export type ConversationScriptView = {
  id: string;
  type: ConversationContextType;
  situation: string;
  focusVirtue: Virtue | null;
  opening: string | null;
  questions: unknown;
  closing: string | null;
  createdAt: Date;
  memberName?: string;
};

export function ConversationScriptCard({ script }: { script: ConversationScriptView }) {
  const questions = Array.isArray(script.questions) ? (script.questions as string[]) : [];
  return (
    <Card className="border-l-4 border-l-purple" hover>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="purple">{conversationTypeLabel(script.type)}</Badge>
          {script.memberName ? (
            <span className="text-sm font-semibold text-deep">{script.memberName}</span>
          ) : null}
          {script.focusVirtue ? <VirtueBadge virtue={script.focusVirtue} /> : null}
        </div>
        <span className="shrink-0 text-xs text-muted">{formatDateTime(script.createdAt)}</span>
      </div>

      <p className="mt-3 text-sm italic text-muted">“{script.situation}”</p>

      <div className="mt-4 flex flex-col gap-3 text-sm">
        <Section label="Abertura" text={script.opening} />
        {questions.length > 0 ? (
          <div className="rounded-sm border border-border bg-bg p-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-purple">
              Perguntas socráticas
            </span>
            <ul className="mt-2 flex flex-col gap-1.5 text-deep">
              {questions.map((q, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-sora text-xs font-bold text-purple">{i + 1}.</span>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <Section label="Fechamento" text={script.closing} />
      </div>
    </Card>
  );
}

function Section({ label, text }: { label: string; text: string | null }) {
  if (!text) return null;
  return (
    <div>
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
      <p className="mt-0.5 whitespace-pre-wrap text-deep">{text}</p>
    </div>
  );
}
