import Link from "next/link";

export const MEMBER_TABS = [
  { key: "visao", label: "Visão geral" },
  { key: "perfil", label: "Perfil" },
  { key: "um-a-um", label: "1:1s" },
  { key: "feedback", label: "Feedbacks" },
  { key: "metas", label: "Metas" },
  { key: "pdi", label: "PDI" },
] as const;

export type MemberTabKey = (typeof MEMBER_TABS)[number]["key"];

export function MemberTabs({
  memberId,
  active,
}: {
  memberId: string;
  active: MemberTabKey;
}) {
  return (
    <nav className="mb-6 flex flex-wrap gap-1 overflow-x-auto border-b border-border">
      {MEMBER_TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={`/equipe/${memberId}?tab=${t.key}`}
            className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm transition ${
              isActive
                ? "border-purple font-semibold text-deep"
                : "border-transparent font-medium text-muted hover:border-border-strong hover:text-deep"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
