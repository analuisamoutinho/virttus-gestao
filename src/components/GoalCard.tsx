import { Card, ProgressBar } from "@/components/ui";
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
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-sora text-sm font-semibold text-deep">{goal.objective}</h3>
          <p className="text-xs text-muted">
            {goal.quarter}
            {goal.memberName ? ` · ${goal.memberName}` : ""}
          </p>
        </div>
        <span className="font-sora text-lg font-bold text-blue">
          {Math.round(goal.progress)}%
        </span>
      </div>
      <div className="mt-2">
        <ProgressBar value={goal.progress} />
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {goal.keyResults.map((kr) => (
          <li key={kr.id} className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-deep">{kr.title}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="w-28">
                  <ProgressBar value={krProgress(kr)} />
                </div>
                <span className="text-xs text-muted">
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
