import type { CallKind } from "@prisma/client";

export const CALL_KIND_META: Record<
  CallKind,
  { label: string; chip: string; dot: string }
> = {
  ALINHAMENTO: { label: "Alinhamento", chip: "bg-blue/10 text-blue", dot: "bg-blue" },
  ONE_ON_ONE: { label: "1:1", chip: "bg-purple/10 text-purple", dot: "bg-purple" },
  TREINAMENTO: { label: "Treinamento", chip: "bg-success-soft text-success", dot: "bg-success" },
  CLIENTE: { label: "Cliente", chip: "bg-warn-soft text-warn", dot: "bg-warn" },
  OUTRO: { label: "Outro", chip: "bg-bg text-muted", dot: "bg-muted-light" },
};

export const CALL_KIND_OPTIONS = (Object.keys(CALL_KIND_META) as CallKind[]).map((k) => ({
  value: k,
  label: CALL_KIND_META[k].label,
}));
