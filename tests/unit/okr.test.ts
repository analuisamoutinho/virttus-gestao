import { describe, it, expect } from "vitest";
import {
  krProgress,
  goalProgress,
  currentQuarter,
  quarterRange,
} from "@/server/services/okr";

describe("krProgress", () => {
  it("calcula percentual current/target", () => {
    expect(krProgress({ current: 5, target: 10 })).toBe(50);
  });
  it("limita a 100% quando ultrapassa a meta", () => {
    expect(krProgress({ current: 15, target: 10 })).toBe(100);
  });
  it("retorna 0 com target inválido", () => {
    expect(krProgress({ current: 5, target: 0 })).toBe(0);
  });
  it("não fica negativo", () => {
    expect(krProgress({ current: -3, target: 10 })).toBe(0);
  });
});

describe("goalProgress", () => {
  it("média dos KRs", () => {
    expect(
      goalProgress([
        { current: 10, target: 10 }, // 100
        { current: 0, target: 10 }, // 0
      ]),
    ).toBe(50);
  });
  it("0 sem KRs", () => {
    expect(goalProgress([])).toBe(0);
  });
  it("arredonda a 1 casa", () => {
    expect(
      goalProgress([
        { current: 1, target: 3 }, // 33.33
        { current: 2, target: 3 }, // 66.66
        { current: 3, target: 3 }, // 100
      ]),
    ).toBe(66.7);
  });
});

describe("currentQuarter", () => {
  it("formata ano-Qn", () => {
    expect(currentQuarter(new Date("2026-07-10"))).toBe("2026-Q3");
    expect(currentQuarter(new Date("2026-01-05"))).toBe("2026-Q1");
    expect(currentQuarter(new Date("2026-12-31"))).toBe("2026-Q4");
  });
});

describe("quarterRange", () => {
  it("calcula início e fim do trimestre", () => {
    const { start, end } = quarterRange("2026-Q3");
    expect(start.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });
});

