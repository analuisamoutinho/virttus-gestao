import type { ComponentProps, ReactNode } from "react";

const controlClass =
  "rounded-sm border border-border bg-white px-3 py-2 text-sm text-deep outline-none focus:border-blue";

export function FieldWrap({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-left">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export function TextField({
  label,
  ...props
}: { label: string } & ComponentProps<"input">) {
  return (
    <FieldWrap label={label}>
      <input className={controlClass} {...props} />
    </FieldWrap>
  );
}

export function TextArea({
  label,
  ...props
}: { label: string } & ComponentProps<"textarea">) {
  return (
    <FieldWrap label={label}>
      <textarea className={`${controlClass} min-h-[80px] resize-y`} {...props} />
    </FieldWrap>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: { label: string } & ComponentProps<"select">) {
  return (
    <FieldWrap label={label}>
      <select className={controlClass} {...props}>
        {children}
      </select>
    </FieldWrap>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return <p className="text-sm text-red-600">{children}</p>;
}
