import type { Plan } from "@prisma/client";

export type Feature =
  | "conversation_builder"
  | "pdi_advanced"
  | "okr_history"
  | "export"
  | "hr_panel"
  | "benchmarks"
  | "quarterly_report";

export type PlanLimits = {
  label: string;
  priceLabel: string;
  maxMembers: number; // liderados ativos (por org)
  maxLeaders: number; // usuários com role LEADER/ADMIN
  features: Record<Feature, boolean>;
};

const NONE: Record<Feature, boolean> = {
  conversation_builder: false,
  pdi_advanced: false,
  okr_history: false,
  export: false,
  hr_panel: false,
  benchmarks: false,
  quarterly_report: false,
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  STARTER: {
    label: "Starter",
    priceLabel: "Grátis",
    maxMembers: 3,
    maxLeaders: 1,
    features: { ...NONE },
  },
  PRO: {
    label: "Pro",
    priceLabel: "R$89/mês",
    maxMembers: 10,
    maxLeaders: 1,
    features: {
      ...NONE,
      conversation_builder: true,
      pdi_advanced: true,
      okr_history: true,
      export: true,
    },
  },
  TIME: {
    label: "Time",
    priceLabel: "R$249/mês",
    maxMembers: Number.POSITIVE_INFINITY, // equipes ilimitadas
    maxLeaders: 5,
    features: {
      conversation_builder: true,
      pdi_advanced: true,
      okr_history: true,
      export: true,
      hr_panel: true,
      benchmarks: true,
      quarterly_report: true,
    },
  },
};
