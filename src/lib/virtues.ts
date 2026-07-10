// Fonte única das 9 virtudes: rótulos, grupos, ordem no radar e cor.
// Qualquer tela (radar SVG, selects, PDI, feedback) consome daqui.
import type { Virtue, VirtueGroup } from "@prisma/client";

export type VirtueMeta = {
  key: Virtue;
  label: string;
  group: VirtueGroup;
  order: number;
};

export const VIRTUES: VirtueMeta[] = [
  { key: "MAGNANIMIDADE", label: "Magnanimidade", group: "LIDERANCA", order: 0 },
  { key: "HUMILDADE", label: "Humildade", group: "LIDERANCA", order: 1 },
  { key: "PRUDENCIA", label: "Prudência", group: "CARDEAL", order: 2 },
  { key: "JUSTICA", label: "Justiça", group: "CARDEAL", order: 3 },
  { key: "CORAGEM", label: "Coragem", group: "CARDEAL", order: 4 },
  { key: "AUTOCONTROLE", label: "Autocontrole", group: "CARDEAL", order: 5 },
  { key: "FE", label: "Fé", group: "TEOLOGAL", order: 6 },
  { key: "ESPERANCA", label: "Esperança", group: "TEOLOGAL", order: 7 },
  { key: "CARIDADE", label: "Caridade", group: "TEOLOGAL", order: 8 },
];

export const VIRTUE_GROUP_COLOR: Record<VirtueGroup, string> = {
  LIDERANCA: "#2563EB", // blue
  CARDEAL: "#7C3AED", // purple
  TEOLOGAL: "#0B1B3A", // deep
};

export const VIRTUE_GROUP_LABEL: Record<VirtueGroup, string> = {
  LIDERANCA: "Liderança",
  CARDEAL: "Cardeais",
  TEOLOGAL: "Teologais",
};

export const virtueLabel = (v: Virtue): string =>
  VIRTUES.find((x) => x.key === v)?.label ?? v;
