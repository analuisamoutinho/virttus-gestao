"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/server/actions/admin";
import { ROLE_LABEL } from "@/lib/role-meta";
import type { Role } from "@prisma/client";

export function RoleSelect({ userId, role, disabled }: { userId: string; role: Role; disabled?: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1">
      <select
        value={role}
        disabled={disabled || pending}
        aria-label="Papel do usuário"
        onChange={(e) => {
          const next = e.target.value;
          if (next === "ADMIN" && !confirm("Dar acesso de administrador a este usuário?")) return;
          setError(null);
          start(async () => {
            const res = await updateUserRole(userId, next);
            if (!res.ok) setError(res.error);
          });
        }}
        className="rounded-sm border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-deep hover:border-border-strong focus:border-blue focus:outline-none disabled:opacity-60"
      >
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      {error ? <span className="text-[11px] text-danger">{error}</span> : null}
    </div>
  );
}
