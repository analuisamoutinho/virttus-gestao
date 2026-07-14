import type { ComponentProps, ReactNode } from "react";

const controlClass =
  "w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-deep shadow-xs transition placeholder:text-muted-light hover:border-border-strong focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:opacity-60";

export function FieldWrap({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-xs font-semibold text-deep">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
    </label>
  );
}

export function TextField({
  label,
  hint,
  ...props
}: { label: string; hint?: ReactNode } & ComponentProps<"input">) {
  return (
    <FieldWrap label={label} hint={hint}>
      <input className={controlClass} {...props} />
    </FieldWrap>
  );
}

export function TextArea({
  label,
  hint,
  ...props
}: { label: string; hint?: ReactNode } & ComponentProps<"textarea">) {
  return (
    <FieldWrap label={label} hint={hint}>
      <textarea className={`${controlClass} min-h-[92px] resize-y leading-relaxed`} {...props} />
    </FieldWrap>
  );
}

export function SelectField({
  label,
  hint,
  children,
  ...props
}: { label: string; hint?: ReactNode } & ComponentProps<"select">) {
  return (
    <FieldWrap label={label} hint={hint}>
      <div className="relative">
        <select className={`${controlClass} cursor-pointer appearance-none pr-9`} {...props}>
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </FieldWrap>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 rounded-sm bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
      {children}
    </p>
  );
}
