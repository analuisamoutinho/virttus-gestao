import type { Virtue } from "@prisma/client";
import { VIRTUES, VIRTUE_GROUP_COLOR, virtueLabel } from "@/lib/virtues";

export function VirtueBadge({ virtue }: { virtue: Virtue }) {
  const meta = VIRTUES.find((v) => v.key === virtue);
  const color = meta ? VIRTUE_GROUP_COLOR[meta.group] : "#64748B";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}14`, color }}
    >
      {virtueLabel(virtue)}
    </span>
  );
}

// <option>s reutilizáveis para selects de virtude.
export function VirtueOptions() {
  return (
    <>
      <option value="">— Nenhuma —</option>
      {VIRTUES.map((v) => (
        <option key={v.key} value={v.key}>
          {v.label}
        </option>
      ))}
    </>
  );
}
