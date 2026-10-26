"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { Button } from "@/components/ui";
import { FormError } from "@/components/ui/form";
import { startPractice, sendPracticeMessage, finishPractice, deletePractice } from "@/server/actions/practice";
import { BAND_LABEL, type PracticeMessage } from "@/lib/feedback-trainer";
import { DIFFICULTY_LABEL, type Band } from "@/lib/feedback-scenarios";
import type { ActionResult } from "@/server/actions/team";

const initial: ActionResult | null = null;

export function StartPracticeForm({ scenarioKey }: { scenarioKey: string }) {
  const [state, action, pending] = useFormState(startPractice, initial);
  return (
    <form action={action} className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
      <input type="hidden" name="scenarioKey" value={scenarioKey} />
      <div className="flex items-center gap-2">
        <select
          name="difficulty"
          defaultValue="2"
          aria-label="Dificuldade"
          className="min-w-0 flex-1 rounded-sm border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          {([1, 2, 3] as const).map((d) => (
            <option key={d} value={d} className="text-deep">
              {DIFFICULTY_LABEL[d].label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-sm bg-white px-4 py-2 text-xs font-bold text-deep transition hover:bg-white/90 disabled:opacity-60"
        >
          {pending ? "Abrindo…" : "Começar"}
        </button>
      </div>
      {state && !state.ok ? <FormError>{state.error}</FormError> : null}
    </form>
  );
}

const BAND_STYLE: Record<Band, { bar: string; text: string }> = {
  HOSTILE: { bar: "bg-danger", text: "text-danger" },
  DEFENSIVE: { bar: "bg-warn", text: "text-warn" },
  GUARDED: { bar: "bg-muted-light", text: "text-muted" },
  OPEN: { bar: "bg-blue", text: "text-blue" },
  COMMITTED: { bar: "bg-success", text: "text-success" },
};

export function PracticeChat({
  practiceId,
  personaName,
  personaRole,
  difficulty,
  initialMessages,
  initialTrust,
  initialBand,
  engineLabel,
}: {
  practiceId: string;
  personaName: string;
  personaRole: string;
  difficulty: 1 | 2 | 3;
  initialMessages: PracticeMessage[];
  initialTrust: number;
  initialBand: Band;
  engineLabel: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [trust, setTrust] = useState(initialTrust);
  const [band, setBand] = useState<Band>(initialBand);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSend] = useTransition();
  const [finishing, startFinish] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const leaderTurns = messages.filter((m) => m.role === "leader").length;

  function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setError(null);
    const optimistic: PracticeMessage = { role: "leader", content: text, at: new Date().toISOString() };
    const before = messages;
    setMessages([...before, optimistic]);
    setDraft("");
    startSend(async () => {
      const res = await sendPracticeMessage(practiceId, text);
      if (res.ok) {
        setMessages(res.messages);
        setTrust(res.trust);
        setBand(res.band);
      } else {
        setMessages(before);
        setDraft(text);
        setError(res.error);
      }
    });
  }

  function finish() {
    setError(null);
    startFinish(async () => {
      const res = await finishPractice(practiceId);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  const style = BAND_STYLE[band];

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="font-sora text-base font-bold text-deep">{personaName}</p>
          <p className="text-xs text-muted">
            {personaRole} · {DIFFICULTY_LABEL[difficulty].label} · {engineLabel}
          </p>
        </div>
        <div className="w-full sm:w-56">
          <div className="mb-1 flex items-center justify-between text-[11px] font-semibold">
            <span className="uppercase tracking-wide text-muted">Clima da conversa</span>
            <span className={style.text}>{BAND_LABEL[band]}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${style.bar}`}
              style={{ width: `${trust}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex max-h-[460px] min-h-[320px] flex-col gap-3 overflow-y-auto bg-bg/50 px-4 py-5 sm:px-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "leader" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs ${
                m.role === "leader"
                  ? "rounded-br-md bg-grad text-white"
                  : "rounded-bl-md border border-border bg-surface text-deep"
              }`}
            >
              {m.role === "persona" ? (
                <span className="mb-0.5 block text-[11px] font-bold text-purple">{personaName}</span>
              ) : null}
              {m.content}
            </div>
          </div>
        ))}
        {sending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-2.5 text-sm text-muted">
              {personaName} está respondendo…
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-4">
        {error ? (
          <div className="mb-3">
            <FormError>{error}</FormError>
          </div>
        ) : null}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Escreva o que você diria a esta pessoa… (Ctrl+Enter envia)"
          maxLength={2000}
          disabled={finishing}
          className="min-h-[88px] w-full resize-y rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-deep placeholder:text-muted-light hover:border-border-strong focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/30"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon="check"
            disabled={finishing || sending || leaderTurns === 0}
            onClick={finish}
          >
            {finishing ? "Avaliando…" : "Encerrar e ver avaliação"}
          </Button>
          <Button type="button" onClick={send} disabled={sending || finishing || draft.trim().length < 2}>
            {sending ? "Enviando…" : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DeletePracticeButton({ practiceId }: { practiceId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Excluir este treino?")) start(() => deletePractice(practiceId));
      }}
      className="text-xs font-medium text-danger hover:underline"
    >
      Excluir
    </button>
  );
}
