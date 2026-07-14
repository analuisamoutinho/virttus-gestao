import type { SVGProps } from "react";

// Ícones stroke (24×24, currentColor) — leves, sem dependências externas.
type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={20}
      height={20}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const Icon = {
  dashboard: (p: IconProps) => (
    <Base {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Base>
  ),
  team: (p: IconProps) => (
    <Base {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 3.5a3 3 0 0 1 0 5.8" />
      <path d="M17 14a6 6 0 0 1 4 6" />
    </Base>
  ),
  oneOnOne: (p: IconProps) => (
    <Base {...p}>
      <path d="M7 15a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4" />
      <path d="M13 21a4 4 0 0 0 4-4" />
      <path d="M21 13a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v0a4 4 0 0 0 4 4h4l4 3z" />
    </Base>
  ),
  feedback: (p: IconProps) => (
    <Base {...p}>
      <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
      <path d="M8 9h8M8 13h5" />
    </Base>
  ),
  goals: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </Base>
  ),
  pdi: (p: IconProps) => (
    <Base {...p}>
      <path d="M3 17l5-5 3 3 5-6 5 5" />
      <path d="M3 21h18" />
      <circle cx="8" cy="12" r="0.5" />
    </Base>
  ),
  training: (p: IconProps) => (
    <Base {...p}>
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" />
      <path d="M22 10v5" />
    </Base>
  ),
  library: (p: IconProps) => (
    <Base {...p}>
      <path d="M4 5a2 2 0 0 1 2-2h12a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2z" />
      <path d="M4 17.5A2 2 0 0 1 6 16h13" />
      <path d="M9 3v13" />
    </Base>
  ),
  chat: (p: IconProps) => (
    <Base {...p}>
      <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a8.4 8.4 0 0 1-.9-4A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z" />
    </Base>
  ),
  hr: (p: IconProps) => (
    <Base {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 14h3M8 17h5" />
      <circle cx="16" cy="15.5" r="1.5" />
    </Base>
  ),
  logout: (p: IconProps) => (
    <Base {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </Base>
  ),
  plus: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  ),
  check: (p: IconProps) => (
    <Base {...p}>
      <path d="M20 6 9 17l-5-5" />
    </Base>
  ),
  chevronRight: (p: IconProps) => (
    <Base {...p}>
      <path d="m9 18 6-6-6-6" />
    </Base>
  ),
  chevronLeft: (p: IconProps) => (
    <Base {...p}>
      <path d="m15 18-6-6 6-6" />
    </Base>
  ),
  arrowUp: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 19V5M5 12l7-7 7 7" />
    </Base>
  ),
  arrowDown: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </Base>
  ),
  alert: (p: IconProps) => (
    <Base {...p}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </Base>
  ),
  download: (p: IconProps) => (
    <Base {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </Base>
  ),
  calendar: (p: IconProps) => (
    <Base {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18M8 2v4M16 2v4" />
    </Base>
  ),
  sparkle: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M19 15l.7 1.8L21.5 17.5 19.7 18.2 19 20l-.7-1.8L16.5 17.5l1.8-.7z" />
    </Base>
  ),
  clock: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Base>
  ),
  user: (p: IconProps) => (
    <Base {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Base>
  ),
  trash: (p: IconProps) => (
    <Base {...p}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </Base>
  ),
  edit: (p: IconProps) => (
    <Base {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Base>
  ),
} as const;

export type IconName = keyof typeof Icon;
