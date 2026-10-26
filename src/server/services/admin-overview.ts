// Consolidação da visão do administrador: uma linha por gestor com os
// indicadores do time dele. Função pura — as consultas ficam na página.
import type { Role, Virtue } from "@prisma/client";
import { isStale } from "@/server/services/alerts";
import { teamRadar, virtueIndex } from "@/server/services/virtue-score";

export type OverviewUser = { id: string; name: string | null; email: string; role: Role };
export type OverviewMember = { id: string; name: string; role: string | null; leaderId: string };

export type LeaderRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  memberCount: number;
  oneOnOnesOnTime: number;
  feedbacks90d: number;
  okrAverage: number | null; // 0–100
  virtueIndex: number | null; // 0–10
};

export function buildLeaderRows(input: {
  users: OverviewUser[];
  members: OverviewMember[];
  lastOneOnOneByMember: Map<string, Date>;
  feedbacksByAuthor: Map<string, number>;
  goals: { teamMemberId: string; progress: number }[];
  scores: { teamMemberId: string; virtue: Virtue; score: number; recordedAt: Date }[];
  now?: Date;
}): LeaderRow[] {
  const now = input.now ?? new Date();
  const leaders = input.users.filter((u) => u.role !== "MEMBER");

  return leaders.map((u) => {
    const mine = input.members.filter((m) => m.leaderId === u.id);
    const ids = new Set(mine.map((m) => m.id));

    const goals = input.goals.filter((g) => ids.has(g.teamMemberId));
    const okrAverage = goals.length
      ? goals.reduce((acc, g) => acc + g.progress, 0) / goals.length
      : null;

    const scores = input.scores.filter((s) => ids.has(s.teamMemberId));
    const index = scores.length ? virtueIndex(teamRadar(scores)) : 0;

    return {
      id: u.id,
      name: u.name ?? u.email,
      email: u.email,
      role: u.role,
      memberCount: mine.length,
      oneOnOnesOnTime: mine.filter((m) => !isStale(input.lastOneOnOneByMember.get(m.id) ?? null, now)).length,
      feedbacks90d: input.feedbacksByAuthor.get(u.id) ?? 0,
      okrAverage,
      virtueIndex: index > 0 ? index : null,
    };
  });
}
