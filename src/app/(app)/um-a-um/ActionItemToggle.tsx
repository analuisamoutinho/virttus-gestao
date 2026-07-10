"use client";

import { useTransition } from "react";
import { toggleActionItem } from "@/server/actions/one-on-one";

export function ActionItemToggle({
  id,
  done,
  text,
  dueDate,
}: {
  id: string;
  done: boolean;
  text: string;
  dueDate: string | null;
}) {
  const [pending, start] = useTransition();
  return (
    <li className="flex items-center gap-2 py-1 text-sm">
      <input
        type="checkbox"
        checked={done}
        disabled={pending}
        onChange={(e) => start(() => toggleActionItem(id, e.target.checked))}
        className="h-4 w-4 accent-purple"
      />
      <span className={done ? "text-muted line-through" : "text-deep"}>{text}</span>
      {dueDate ? <span className="ml-auto text-xs text-muted">{dueDate}</span> : null}
    </li>
  );
}
