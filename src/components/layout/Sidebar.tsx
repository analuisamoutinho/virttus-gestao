"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo, Icon, type IconName } from "@/components/ui";

type NavItem = { href: string; label: string; icon: IconName };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/equipe", label: "Equipe", icon: "team" },
    ],
  },
  {
    title: "Desenvolvimento",
    items: [
      { href: "/um-a-um", label: "1:1s", icon: "oneOnOne" },
      { href: "/feedback", label: "Feedback", icon: "feedback" },
      { href: "/metas", label: "Metas OKR", icon: "goals" },
      { href: "/pdi", label: "PDI", icon: "pdi" },
    ],
  },
  {
    title: "Conhecimento",
    items: [
      { href: "/treinamentos", label: "Treinamentos", icon: "training" },
      { href: "/biblioteca", label: "Biblioteca", icon: "library" },
      { href: "/conversa", label: "Conversa", icon: "chat" },
    ],
  },
  {
    title: "Gestão",
    items: [{ href: "/rh", label: "Painel de RH", icon: "hr" }],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-6">
      {NAV.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-light">
            {group.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const IconCmp = Icon[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`group relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition duration-200 ${
                    active
                      ? "bg-grad-soft font-semibold text-deep"
                      : "font-medium text-muted hover:bg-bg hover:text-deep"
                  }`}
                >
                  {active ? (
                    <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-grad" />
                  ) : null}
                  <span
                    className={
                      active
                        ? "text-purple"
                        : "text-muted-light transition group-hover:text-deep"
                    }
                  >
                    <IconCmp width={19} height={19} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function PlanFooter({ planLabel }: { planLabel: string }) {
  return (
    <div className="mt-6 rounded-xl bg-grad-deep p-4 text-white shadow-md">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
        Plano atual
      </p>
      <p className="mt-0.5 font-sora text-sm font-bold">{planLabel}</p>
      <p className="mt-2 text-xs leading-relaxed text-white/70">
        Desbloqueie mais liderados e relatórios avançados.
      </p>
    </div>
  );
}

export function Sidebar({ planLabel = "" }: { planLabel?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Barra superior mobile */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
        <button
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-sm border border-border text-deep"
          aria-label="Abrir menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Drawer mobile */}
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-deep/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto bg-surface px-4 py-6 shadow-lg animate-scale-in">
            <div className="mb-6 flex items-center justify-between px-2">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-sm text-muted hover:bg-bg"
                aria-label="Fechar menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            {planLabel ? <PlanFooter planLabel={planLabel} /> : null}
          </aside>
        </div>
      ) : null}

      {/* Rail desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface px-4 py-6 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <div className="mt-8 flex flex-1 flex-col">
          <NavLinks />
          {planLabel ? <PlanFooter planLabel={planLabel} /> : null}
        </div>
      </aside>
    </>
  );
}
