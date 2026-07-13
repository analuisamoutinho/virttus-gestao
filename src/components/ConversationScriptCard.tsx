import type { Virtue, ConversationContextType } from "@prisma/client";
import { Card } from "@/components/ui";
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
    <Card className="border-l-4 border-l-purple">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-grad-soft px-2 py-0.5 text-xs font-medium text-purple">
            {conversationTypeLabel(script.type)}
          </span>
          {script.memberName ? (
            <span className="text-sm font-semibold text-deep">{script.memberName}</span>
          ) : null}
          {script.focusVirtue ? <VirtueBadge virtue={script.focusVirtue} /> : null}
        </div>
        <span className="text-xs text-muted">{formatDateTime(script.createdAt)}</span>
      </div>

      <p className="mt-2 text-sm text-muted">{script.situation}</p>

      <div className="mt-3 flex flex-col gap-3 text-sm">
        <Section label="Abertura" text={script.opening} />
        {questions.length > 0 ? (
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Perguntas socráticas
            </span>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-deep">
              {questions.map((q, i) => (
                <li key={i}>{q}</li>
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
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      <p className="whitespace-pre-wrap text-deep">{text}</p>
    </div>
  );
}
