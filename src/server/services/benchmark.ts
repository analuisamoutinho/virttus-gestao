import type { Virtue } from "@prisma/client";
import { VIRTUES } from "@/lib/virtues";

// Meta de referência por virtude (0–10), usada como baseline de benchmark
// interno enquanto não há dado comparativo entre organizações (LGPD).
export const VIRTUE_BENCHMARK_TARGET = 7;

export type VirtueGap = {
  virtue: Virtue;
  label: string;
  average: number;
  target: number;
  gap: number;
};

export function virtueGaps(
  radar: Record<Virtue, number>,
  target = VIRTUE_BENCHMARK_TARGET,
): VirtueGap[] {
  return VIRTUES.map((v) => ({
    virtue: v.key,
    label: v.label,
    average: radar[v.key],
    target,
    gap: round1(radar[v.key] - target),
  }));
}

export type TeamBenchmark = {
  leaderId: string;
  leaderName: string;
  memberCount: number;
  virtueIndex: number;
};

// Ranking de times por índice de virtude (maior primeiro).
export function rankTeams(teams: TeamBenchmark[]): TeamBenchmark[] {
  return [...teams].sort((a, b) => b.virtueIndex - a.virtueIndex);
}

const round1 = (n: number) => Math.round(n * 10) / 10;
