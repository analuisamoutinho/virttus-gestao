import { describe, it, expect } from "vitest";
import { teamRadar } from "@/server/services/virtue-score";
import { virtueGaps, rankTeams, VIRTUE_BENCHMARK_TARGET } from "@/server/services/benchmark";

describe("virtueGaps", () => {
  it("calcula o gap contra a meta de referência", () => {
    const radar = teamRadar([
      { teamMemberId: "m1", virtue: "CORAGEM", score: 8, recordedAt: new Date("2026-03-01") },
    ]);
    const gaps = virtueGaps(radar);
    const coragem = gaps.find((g) => g.virtue === "CORAGEM");
    expect(coragem?.average).toBe(8);
    expect(coragem?.gap).toBe(8 - VIRTUE_BENCHMARK_TARGET);
  });

  it("usa uma meta customizada", () => {
    const radar = teamRadar([]);
    const gaps = virtueGaps(radar, 5);
    expect(gaps[0].target).toBe(5);
  });
});

describe("rankTeams", () => {
  it("ordena por índice de virtude, maior primeiro", () => {
    const ranked = rankTeams([
      { leaderId: "a", leaderName: "A", memberCount: 2, virtueIndex: 6 },
      { leaderId: "b", leaderName: "B", memberCount: 3, virtueIndex: 8 },
    ]);
    expect(ranked.map((t) => t.leaderId)).toEqual(["b", "a"]);
  });
});
