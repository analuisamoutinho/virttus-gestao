import { describe, it, expect } from "vitest";
import { PLAN_LIMITS } from "@/server/plan/limits";

describe("gating de plano", () => {
  it("Starter: 3 liderados, 1 líder, sem construtor de conversa", () => {
    expect(PLAN_LIMITS.STARTER.maxMembers).toBe(3);
    expect(PLAN_LIMITS.STARTER.maxLeaders).toBe(1);
    expect(PLAN_LIMITS.STARTER.features.conversation_builder).toBe(false);
    expect(PLAN_LIMITS.STARTER.features.export).toBe(false);
  });

  it("Pro: 10 liderados + construtor de conversa + export, sem painel de RH", () => {
    expect(PLAN_LIMITS.PRO.maxMembers).toBe(10);
    expect(PLAN_LIMITS.PRO.features.conversation_builder).toBe(true);
    expect(PLAN_LIMITS.PRO.features.export).toBe(true);
    expect(PLAN_LIMITS.PRO.features.hr_panel).toBe(false);
  });

  it("Time: liderados ilimitados, 5 líderes, painel de RH + benchmarks", () => {
    expect(PLAN_LIMITS.TIME.maxMembers).toBe(Number.POSITIVE_INFINITY);
    expect(PLAN_LIMITS.TIME.maxLeaders).toBe(5);
    expect(PLAN_LIMITS.TIME.features.hr_panel).toBe(true);
    expect(PLAN_LIMITS.TIME.features.benchmarks).toBe(true);
    expect(PLAN_LIMITS.TIME.features.quarterly_report).toBe(true);
  });
});
