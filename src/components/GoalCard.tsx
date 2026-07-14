import { Card, ProgressBar, Badge } from "@/components/ui";
import { krProgress } from "@/server/services/okr";
import { UpdateKrForm } from "@/app/(app)/metas/GoalForms";

export type GoalView = {
  id: string;
  objective: string;
  quarter: string;
  progress: number;
  memberName?: string;
  keyResults: {
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string | null;
  }[];
};

export function GoalCard({ goal }: { goal: GoalView }) {
  const pct = Math.round(goal.progress);
  const tone = pct >= 70 ? "success" : pct >= 40 ? "blue" : "purple";
  return (
    <Card hover>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-sora text-sm font-semibold text-deep">{goal.objective}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">{goal.quarter}</Badge>
            {goal.memberName ? <Badge tone="blue">{goal.memberName}</Badge> : null}
          </div>
        </div>
        <div className="text-right">
          <span
            className={`font-sora text-2xl font-bold ${
              tone === "success" ? "text-success" : tone === "blue" ? "text-blue" : "text-purple"
            }`}
          >
            {pct}%
          </span>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar value={goal.progress} tone={tone} />
      </div>

      <ul className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
        {goal.keyResults.map((kr) => (
          <li key={kr.id} className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-deep">{kr.title}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="w-28">
                  <ProgressBar value={krProgress(kr)} tone="blue" />
                </div>
                <span className="text-xs font-medium text-muted tabular-nums">
                  {kr.current}/{kr.target} {kr.unit ?? ""}
                </span>
              </div>
            </div>
            <UpdateKrForm keyResultId={kr.id} current={kr.current} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
