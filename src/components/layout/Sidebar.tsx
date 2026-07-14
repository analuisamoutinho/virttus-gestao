"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui";

// Espelha a sidebar do mockup da hero da LP.
const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/equipe", label: "Equipe", icon: "◎" },
  { href: "/um-a-um", label: "1:1s", icon: "◍" },
  { href: "/feedback", label: "Feedback", icon: "✎" },
  { href: "/metas", label: "Metas OKR", icon: "◉" },
  { href: "/pdi", label: "PDI", icon: "◆" },
  { href: "/treinamentos", label: "Treinamentos", icon: "▦" },
  { href: "/biblioteca", label: "Biblioteca", icon: "▤" },
  { href: "/conversa", label: "Conversa", icon: "◌" },
  { href: "/rh", label: "Painel de RH", icon: "◫" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-white px-4 py-6 md:flex">
      <div className="px-2">
        <Logo />
      </div>
      <nav className="mt-8 flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition ${
                active
                  ? "bg-grad-soft font-semibold text-deep"
                  : "text-muted hover:bg-bg hover:text-deep"
              }`}
            >
              <span className={active ? "text-purple" : ""}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
