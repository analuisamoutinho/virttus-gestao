import { describe, it, expect } from "vitest";
import {
  teamRadar,
  virtueIndex,
  latestPerVirtue,
} from "@/server/services/virtue-score";
import type { Virtue } from "@prisma/client";

type Row = {
  teamMemberId: string;
  virtue: Virtue;
  score: number;
  recordedAt: Date;
};

const row = (m: string, v: Virtue, score: number, iso: string): Row => ({
  teamMemberId: m,
  virtue: v,
  score,
  recordedAt: new Date(iso),
});

describe("latestPerVirtue", () => {
  it("mantém apenas o score mais recente por membro/virtude", () => {
    const rows = [
      row("m1", "CORAGEM", 5, "2026-01-01"),
      row("m1", "CORAGEM", 8, "2026-03-01"), // mais recente vence
      row("m1", "HUMILDADE", 7, "2026-02-01"),
    ];
    const latest = latestPerVirtue(rows);
    expect(latest.get("m1")?.get("CORAGEM")).toBe(8);
    expect(latest.get("m1")?.get("HUMILDADE")).toBe(7);
  });
});

describe("teamRadar", () => {
  it("faz a média entre membros por virtude", () => {
    const rows = [
      row("m1", "CORAGEM", 8, "2026-03-01"),
      row("m2", "CORAGEM", 6, "2026-03-01"),
    ];
    const radar = teamRadar(rows);
    expect(radar.CORAGEM).toBe(7); // (8+6)/2
    expect(radar.FE).toBe(0); // sem dados
  });
});

describe("virtueIndex", () => {
  it("ignora virtudes sem dados (zeradas)", () => {
    const rows = [
      row("m1", "CORAGEM", 8, "2026-03-01"),
      row("m1", "HUMILDADE", 6, "2026-03-01"),
    ];
    const idx = virtueIndex(teamRadar(rows));
    expect(idx).toBe(7); // média de 8 e 6, virtudes zeradas ignoradas
  });

  it("retorna 0 sem nenhum dado", () => {
    expect(virtueIndex(teamRadar([]))).toBe(0);
  });
});
