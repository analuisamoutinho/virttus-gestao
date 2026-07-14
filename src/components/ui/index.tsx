import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { LogoMark } from "./logo-mark";

export { Icon, LogoMark };
export type { IconName };

// ─── Card ───
export function Card({
  className = "",
  style,
  children,
  hover = false,
  padded = true,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
  hover?: boolean;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-card border border-border bg-surface shadow-sm ${
        padded ? "p-6" : ""
      } ${hover ? "transition duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md" : ""} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

// ─── PageHeader ───
export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: ReactNode;
  icon?: IconName;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  const IconCmp = icon ? Icon[icon] : null;
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {IconCmp ? (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-grad text-white shadow-glow-blue">
            <IconCmp width={24} height={24} />
          </span>
        ) : null}
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-widest text-purple">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-sora text-2xl font-bold text-deep">{title}</h1>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}

// ─── SectionTitle ───
export function SectionTitle({
  children,
  hint,
  action,
}: {
  children: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-sora text-lg font-semibold text-deep">{children}</h2>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

// ─── KPI (espelha o .kpi da LP) ───
export function Kpi({
  label,
  value,
  caption,
  accent = "blue",
  icon,
  trend,
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  accent?: "blue" | "purple" | "deep" | "success";
  icon?: IconName;
  trend?: { dir: "up" | "down"; label: string };
}) {
  const color =
    accent === "purple"
      ? "text-purple"
      : accent === "deep"
        ? "text-deep"
        : accent === "success"
          ? "text-success"
          : "text-blue";
  const bar =
    accent === "purple"
      ? "bg-purple"
      : accent === "deep"
        ? "bg-deep"
        : accent === "success"
          ? "bg-success"
          : "bg-blue";
  const IconCmp = icon ? Icon[icon] : null;
  return (
    <Card className="relative flex flex-col gap-1 overflow-hidden" hover>
      <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} aria-hidden />
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
        </span>
        {IconCmp ? (
          <span className={`opacity-70 ${color}`}>
            <IconCmp width={18} height={18} />
          </span>
        ) : null}
      </div>
      <span className={`font-sora text-3xl font-bold ${color}`}>{value}</span>
      <div className="flex items-center gap-2">
        {trend ? (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
              trend.dir === "up"
                ? "bg-success-soft text-success"
                : "bg-danger-soft text-danger"
            }`}
          >
            {trend.dir === "up" ? (
              <Icon.arrowUp width={11} height={11} />
            ) : (
              <Icon.arrowDown width={11} height={11} />
            )}
            {trend.label}
          </span>
        ) : null}
        {caption ? <span className="text-xs text-muted">{caption}</span> : null}
      </div>
    </Card>
  );
}

// ─── Badge ───
type Tone = "blue" | "purple" | "deep" | "success" | "warn" | "danger" | "neutral";
const toneClass: Record<Tone, string> = {
  blue: "bg-blue/10 text-blue",
  purple: "bg-purple/10 text-purple",
  deep: "bg-deep/10 text-deep",
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-bg text-muted",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass[tone]} ${className}`}
    >
      {dot ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      ) : null}
      {children}
    </span>
  );
}

// ─── Avatar (iniciais com gradiente) ───
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "lg" ? "h-12 w-12 text-base" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-grad font-sora font-bold text-white shadow-sm ${dim}`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

// ─── Button ───
type ButtonProps = {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md";
  icon?: IconName;
} & ComponentProps<"button">;

const buttonClasses = (
  variant: NonNullable<ButtonProps["variant"]> = "primary",
  size: NonNullable<ButtonProps["size"]> = "md",
) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  const sizing = size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm";
  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: "bg-grad text-white shadow-sm hover:shadow-glow-blue",
    outline: "border border-border bg-surface text-deep hover:border-border-strong hover:bg-bg",
    ghost: "text-muted hover:bg-bg hover:text-deep",
    danger: "border border-danger/30 bg-danger-soft text-danger hover:bg-danger hover:text-white",
  };
  return `${base} ${sizing} ${variants[variant]}`;
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const IconCmp = icon ? Icon[icon] : null;
  return (
    <button className={`${buttonClasses(variant, size)} ${className}`} {...props}>
      {IconCmp ? <IconCmp width={16} height={16} /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  icon,
  className = "",
  children,
  ...props
}: {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  icon?: IconName;
} & ComponentProps<typeof Link>) {
  const IconCmp = icon ? Icon[icon] : null;
  return (
    <Link
      className={`${buttonClasses(variant ?? "primary", size ?? "md")} ${className}`}
      {...props}
    >
      {IconCmp ? <IconCmp width={16} height={16} /> : null}
      {children}
    </Link>
  );
}

// ─── EmptyState ───
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-card bg-grad-soft text-3xl text-purple ring-1 ring-inset ring-purple/10">
        {icon ?? <Icon.sparkle width={28} height={28} />}
      </div>
      <h3 className="font-sora text-lg font-semibold text-deep">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </Card>
  );
}

// ─── ProgressBar ───
export function ProgressBar({
  value,
  tone = "grad",
  showLabel = false,
}: {
  value: number;
  tone?: "grad" | "blue" | "purple" | "success" | "warn";
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const fill =
    tone === "blue"
      ? "bg-blue"
      : tone === "purple"
        ? "bg-purple"
        : tone === "success"
          ? "bg-success"
          : tone === "warn"
            ? "bg-warn"
            : "bg-grad";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${fill} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? (
        <span className="w-9 shrink-0 text-right text-xs font-semibold text-muted tabular-nums">
          {Math.round(pct)}%
        </span>
      ) : null}
    </div>
  );
}

// ─── Logo (símbolo + wordmark) ───
export function Logo({
  className = "",
  markSize = 36,
}: {
  className?: string;
  markSize?: number;
}) {
  return (
    <span
      className={`flex items-center gap-2.5 font-sora text-xl font-bold tracking-tight text-deep ${className}`}
    >
      <LogoMark size={markSize} />
      <span>
        Virt<span className="text-gradient">tus</span>
      </span>
    </span>
  );
}
