import { describe, it, expect } from "vitest";
import { buildLeaderRows } from "@/server/services/admin-overview";

const now = new Date("2026-10-26T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 3600 * 1000);

describe("buildLeaderRows", () => {
  const users = [
    { id: "u1", name: "Ana", email: "ana@x.com", role: "ADMIN" as const },
    { id: "u2", name: null, email: "bia@x.com", role: "LEADER" as const },
    { id: "u3", name: "Caio", email: "caio@x.com", role: "MEMBER" as const },
  ];
  const members = [
    { id: "m1", name: "M1", role: null, leaderId: "u1" },
    { id: "m2", name: "M2", role: null, leaderId: "u1" },
    { id: "m3", name: "M3", role: null, leaderId: "u2" },
  ];

  const rows = buildLeaderRows({
    users,
    members,
    lastOneOnOneByMember: new Map([
      ["m1", daysAgo(5)],
      ["m2", daysAgo(40)],
    ]),
    feedbacksByAuthor: new Map([["u1", 4]]),
    goals: [
      { teamMemberId: "m1", progress: 80 },
      { teamMemberId: "m2", progress: 40 },
    ],
    scores: [{ teamMemberId: "m1", virtue: "CORAGEM", score: 8, recordedAt: daysAgo(2) }],
    now,
  });

  it("uma linha por gestor, sem liderados com login", () => {
    expect(rows.map((r) => r.id)).toEqual(["u1", "u2"]);
  });

  it("agrega os indicadores do time de cada gestor", () => {
    const ana = rows[0];
    expect(ana.memberCount).toBe(2);
    expect(ana.oneOnOnesOnTime).toBe(1); // m2 está há 40 dias
    expect(ana.feedbacks90d).toBe(4);
    expect(ana.okrAverage).toBe(60);
    expect(ana.virtueIndex).toBe(8);
  });

  it("gestor sem dados fica com nulos em vez de zeros enganosos", () => {
    const bia = rows[1];
    expect(bia.name).toBe("bia@x.com");
    expect(bia.memberCount).toBe(1);
    expect(bia.oneOnOnesOnTime).toBe(0); // m3 nunca teve 1:1
    expect(bia.okrAverage).toBeNull();
    expect(bia.virtueIndex).toBeNull();
  });
});
