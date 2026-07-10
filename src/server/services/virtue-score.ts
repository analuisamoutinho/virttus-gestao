import type { Virtue, VirtueScore } from "@prisma/client";
import { VIRTUES } from "@/lib/virtues";

// Dado o histórico de scores, pega o mais recente por (membro, virtude).
export function latestPerVirtue(
  scores: Pick<VirtueScore, "teamMemberId" | "virtue" | "score" | "recordedAt">[],
): Map<string, Map<Virtue, number>> {
  const byMember = new Map<string, Map<Virtue, { score: number; at: number }>>();
  for (const s of scores) {
    const m = byMember.get(s.teamMemberId) ?? new Map();
    const prev = m.get(s.virtue);
    const at = s.recordedAt.getTime();
    if (!prev || at >= prev.at) m.set(s.virtue, { score: s.score, at });
    byMember.set(s.teamMemberId, m);
  }
  // achata para score puro
  const out = new Map<string, Map<Virtue, number>>();
  for (const [member, vm] of byMember) {
    const flat = new Map<Virtue, number>();
    for (const [v, { score }] of vm) flat.set(v, score);
    out.set(member, flat);
  }
  return out;
}

// Média do time por virtude (para o radar agregado).
export function teamRadar(
  scores: Pick<VirtueScore, "teamMemberId" | "virtue" | "score" | "recordedAt">[],
): Record<Virtue, number> {
  const latest = latestPerVirtue(scores);
  const sums = new Map<Virtue, { total: number; count: number }>();
  for (const vm of latest.values()) {
    for (const [v, score] of vm) {
      const acc = sums.get(v) ?? { total: 0, count: 0 };
      acc.total += score;
      acc.count += 1;
      sums.set(v, acc);
    }
  }
  const result = {} as Record<Virtue, number>;
  for (const { key } of VIRTUES) {
    const acc = sums.get(key);
    result[key] = acc && acc.count > 0 ? round1(acc.total / acc.count) : 0;
  }
  return result;
}

// Índice geral de virtude do time: média das médias por virtude (0–10).
export function virtueIndex(radar: Record<Virtue, number>): number {
  const vals = VIRTUES.map((v) => radar[v.key]).filter((n) => n > 0);
  if (vals.length === 0) return 0;
  return round1(vals.reduce((a, b) => a + b, 0) / vals.length);
}

const round1 = (n: number) => Math.round(n * 10) / 10;
