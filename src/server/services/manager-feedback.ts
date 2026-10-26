// Agregação dos feedbacks anônimos ao gestor. Regras de anonimato:
//  • abaixo de MIN_RESPONSES_TO_REVEAL respostas nada é revelado (nem médias);
//  • comentários saem sem data e em ordem embaralhada de forma estável, para
//    que a ordem de envio não identifique ninguém.
import { createHash, randomBytes } from "crypto";
import {
  DIMENSION_KEYS,
  MIN_RESPONSES_TO_REVEAL,
  type DimensionKey,
} from "@/lib/manager-feedback";

export type StoredManagerFeedback = {
  ratings: unknown;
  keepText: string | null;
  startText: string | null;
  stopText: string | null;
};

export type ManagerFeedbackSummary = {
  total: number;
  revealed: boolean;
  remaining: number; // respostas que faltam para revelar
  overall: number | null;
  averages: Record<DimensionKey, number> | null;
  keep: string[];
  start: string[];
  stop: string[];
};

export function newAnonToken(): string {
  return randomBytes(18).toString("base64url");
}

// Segunda-feira 00:00 UTC da semana de `d` — única "data" guardada.
export function weekStart(d: Date): Date {
  const day = d.getUTCDay(); // 0 = domingo
  const diff = (day + 6) % 7;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
}

function readRatings(raw: unknown): Partial<Record<DimensionKey, number>> {
  const out: Partial<Record<DimensionKey, number>> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const k of DIMENSION_KEYS) {
    const v = (raw as Record<string, unknown>)[k];
    if (typeof v === "number" && v >= 1 && v <= 5) out[k] = v;
  }
  return out;
}

const stableOrder = (text: string) => createHash("sha256").update(text).digest("hex");

function shuffleStable(list: string[]): string[] {
  return [...list].sort((a, b) => stableOrder(a).localeCompare(stableOrder(b)));
}

export function summarizeManagerFeedback(rows: StoredManagerFeedback[]): ManagerFeedbackSummary {
  const total = rows.length;
  const revealed = total >= MIN_RESPONSES_TO_REVEAL;
  const empty: ManagerFeedbackSummary = {
    total,
    revealed,
    remaining: Math.max(0, MIN_RESPONSES_TO_REVEAL - total),
    overall: null,
    averages: null,
    keep: [],
    start: [],
    stop: [],
  };
  if (!revealed) return empty;

  const sums: Record<string, { sum: number; n: number }> = {};
  for (const r of rows) {
    const ratings = readRatings(r.ratings);
    for (const k of DIMENSION_KEYS) {
      const v = ratings[k];
      if (v === undefined) continue;
      const cur = (sums[k] ??= { sum: 0, n: 0 });
      cur.sum += v;
      cur.n += 1;
    }
  }
  const averages = {} as Record<DimensionKey, number>;
  const present: number[] = [];
  for (const k of DIMENSION_KEYS) {
    const s = sums[k];
    averages[k] = s && s.n > 0 ? s.sum / s.n : 0;
    if (s && s.n > 0) present.push(averages[k]);
  }
  const overall = present.length ? present.reduce((a, b) => a + b, 0) / present.length : null;

  const texts = (pick: (r: StoredManagerFeedback) => string | null) =>
    shuffleStable(rows.map(pick).filter((t): t is string => !!t && t.trim().length > 0));

  return {
    ...empty,
    overall,
    averages,
    keep: texts((r) => r.keepText),
    start: texts((r) => r.startText),
    stop: texts((r) => r.stopText),
  };
}
