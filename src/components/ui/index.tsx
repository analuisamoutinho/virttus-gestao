import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// ─── Card ───
export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-card border border-border bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

// ─── KPI (espelha o .kpi da LP) ───
export function Kpi({
  label,
  value,
  caption,
  accent = "blue",
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  accent?: "blue" | "purple" | "deep";
}) {
  const color =
    accent === "purple" ? "text-purple" : accent === "deep" ? "text-deep" : "text-blue";
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <span className={`font-sora text-3xl font-bold ${color}`}>{value}</span>
      {caption ? <span className="text-xs text-muted">{caption}</span> : null}
    </Card>
  );
}

// ─── Button ───
type ButtonProps = {
  variant?: "primary" | "ghost" | "outline";
} & ComponentProps<"button">;

const buttonClasses = (variant: ButtonProps["variant"] = "primary") => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none";
  if (variant === "primary")
    return `${base} bg-grad text-white shadow-sm hover:shadow-md`;
  if (variant === "outline")
    return `${base} border border-border bg-white text-deep hover:bg-bg`;
  return `${base} text-muted hover:text-deep`;
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`${buttonClasses(variant)} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: { variant?: ButtonProps["variant"] } & ComponentProps<typeof Link>) {
  return <Link className={`${buttonClasses(variant)} ${className}`} {...props} />;
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
    <Card className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-card bg-grad-soft text-2xl">
        {icon ?? "✦"}
      </div>
      <h3 className="font-sora text-lg font-semibold text-deep">{title}</h3>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </Card>
  );
}

// ─── Logo ───
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-sora text-xl font-bold text-deep ${className}`}>
      Virt<span className="text-gradient">tus</span>
    </span>
  );
}
