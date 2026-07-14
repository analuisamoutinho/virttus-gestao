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
    <li
      className={`flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition hover:bg-bg ${
        pending ? "opacity-60" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={done}
        disabled={pending}
        onChange={(e) => start(() => toggleActionItem(id, e.target.checked))}
        className="h-4 w-4 cursor-pointer rounded accent-purple"
      />
      <span className={done ? "text-muted line-through" : "text-deep"}>{text}</span>
      {dueDate ? (
        <span className="ml-auto shrink-0 rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-muted">
          {dueDate}
        </span>
      ) : null}
    </li>
  );
}
