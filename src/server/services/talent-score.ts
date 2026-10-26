// "Lead scoring" da vaga: quanto cada candidato está de acordo com o que a
// vaga busca, de 0 a 100. Determinístico e explicável — cada componente
// devolve o quanto pesou e por quê. Componentes sem dado (ex.: candidato ainda
// sem entrevista) saem da conta e os pesos são redistribuídos; a
// `completeness` diz o quanto da avaliação foi de fato medido.
import type { Virtue } from "@prisma/client";
import { normalizeText } from "@/lib/text";

export type OpeningCriteria = {
  requiredSkills: string[];
  desiredSkills: string[];
  minYears: number;
  salaryMin?: number | null;
  salaryMax?: number | null;
  targetVirtues: Virtue[];
};

export type CandidateProfile = {
  skills: string[];
  resumeText?: string | null;
  yearsExperience: number;
  salaryExpectation?: number | null;
  interviewRating?: number | null; // 1–5
  virtueRatings?: Partial<Record<Virtue, number>> | null; // 1–5 por virtude
};

export type ScoreTier = "HOT" | "WARM" | "COLD";

export type ScoreComponent = {
  key: "required" | "desired" | "experience" | "virtues" | "interview" | "salary";
  label: string;
  weight: number;
  // 0–1; null = sem dado (fora da conta)
  earned: number | null;
  detail: string;
};

export type FitResult = {
  score: number;
  tier: ScoreTier;
  completeness: number; // 0–1: fatia do peso total que pôde ser medida
  components: ScoreComponent[];
  matchedRequired: string[];
  missingRequired: string[];
  matchedDesired: string[];
};

export const WEIGHTS = {
  required: 35,
  desired: 10,
  experience: 15,
  virtues: 20,
  interview: 15,
  salary: 5,
} as const;

export const TIER_THRESHOLDS = { hot: 80, warm: 60 } as const;

export function tierFor(score: number): ScoreTier {
  if (score >= TIER_THRESHOLDS.hot) return "HOT";
  if (score >= TIER_THRESHOLDS.warm) return "WARM";
  return "COLD";
}

export const TIER_LABEL: Record<ScoreTier, string> = {
  HOT: "Alto fit",
  WARM: "Bom fit",
  COLD: "Baixo fit",
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Aceita "Google Ads", "google-ads avançado" etc. Procura a habilidade nas
// habilidades declaradas (igualdade ou contida) e no texto do currículo
// (palavra inteira, para "sql" não casar com "mysql").
export function candidateHasSkill(
  skill: string,
  declared: string[],
  resumeText?: string | null,
): boolean {
  const target = normalizeText(skill);
  if (!target) return false;
  const hay = declared.map(normalizeText);
  if (hay.some((d) => d === target || (target.length >= 3 && d.includes(target)))) return true;
  if (resumeText) {
    const re = new RegExp(`(^|[^a-z0-9+#])${escapeRegex(target)}([^a-z0-9+#]|$)`);
    if (re.test(normalizeText(resumeText))) return true;
  }
  return false;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function scoreCandidate(candidate: CandidateProfile, opening: OpeningCriteria): FitResult {
  const split = (list: string[]) => {
    const matched: string[] = [];
    const missing: string[] = [];
    for (const s of list) {
      (candidateHasSkill(s, candidate.skills, candidate.resumeText) ? matched : missing).push(s);
    }
    return { matched, missing };
  };

  const req = split(opening.requiredSkills);
  const des = split(opening.desiredSkills);

  const components: ScoreComponent[] = [];

  // 1) Requisitos obrigatórios
  components.push({
    key: "required",
    label: "Requisitos obrigatórios",
    weight: WEIGHTS.required,
    earned: opening.requiredSkills.length === 0 ? null : req.matched.length / opening.requiredSkills.length,
    detail:
      opening.requiredSkills.length === 0
        ? "A vaga não define requisitos obrigatórios."
        : `${req.matched.length} de ${opening.requiredSkills.length} atendidos` +
          (req.missing.length ? ` · faltam: ${req.missing.join(", ")}` : ""),
  });

  // 2) Diferenciais
  components.push({
    key: "desired",
    label: "Diferenciais",
    weight: WEIGHTS.desired,
    earned: opening.desiredSkills.length === 0 ? null : des.matched.length / opening.desiredSkills.length,
    detail:
      opening.desiredSkills.length === 0
        ? "A vaga não define diferenciais."
        : `${des.matched.length} de ${opening.desiredSkills.length} atendidos`,
  });

  // 3) Experiência
  const minYears = Math.max(0, opening.minYears);
  const years = Math.max(0, candidate.yearsExperience);
  components.push({
    key: "experience",
    label: "Experiência",
    weight: WEIGHTS.experience,
    earned: minYears === 0 ? 1 : Math.min(1, years / minYears),
    detail:
      minYears === 0
        ? "Sem mínimo exigido."
        : `${years} ${years === 1 ? "ano" : "anos"} (mínimo ${minYears})`,
  });

  // 4) Aderência às virtudes buscadas (nota 1–5 da entrevista)
  const rated = opening.targetVirtues.filter((v) => typeof candidate.virtueRatings?.[v] === "number");
  if (opening.targetVirtues.length === 0 || rated.length === 0) {
    components.push({
      key: "virtues",
      label: "Aderência às virtudes",
      weight: WEIGHTS.virtues,
      earned: null,
      detail:
        opening.targetVirtues.length === 0
          ? "A vaga não define virtudes-alvo."
          : "Ainda sem avaliação das virtudes na entrevista.",
    });
  } else {
    const avg = rated.reduce((acc, v) => acc + (candidate.virtueRatings?.[v] ?? 0), 0) / rated.length;
    // coverage penaliza avaliar só parte das virtudes-alvo
    const coverage = rated.length / opening.targetVirtues.length;
    const earned = clamp01(((avg - 1) / 4) * (0.5 + 0.5 * coverage));
    components.push({
      key: "virtues",
      label: "Aderência às virtudes",
      weight: WEIGHTS.virtues,
      earned,
      detail: `Média ${avg.toFixed(1)}/5 em ${rated.length} de ${opening.targetVirtues.length} virtudes-alvo`,
    });
  }

  // 5) Nota geral da entrevista
  components.push({
    key: "interview",
    label: "Entrevista",
    weight: WEIGHTS.interview,
    earned: candidate.interviewRating ? clamp01((candidate.interviewRating - 1) / 4) : null,
    detail: candidate.interviewRating
      ? `Nota ${candidate.interviewRating}/5`
      : "Entrevista ainda não avaliada.",
  });

  // 6) Pretensão salarial vs. faixa da vaga
  const max = opening.salaryMax ?? null;
  const exp = candidate.salaryExpectation ?? null;
  if (max === null || exp === null) {
    components.push({
      key: "salary",
      label: "Pretensão salarial",
      weight: WEIGHTS.salary,
      earned: null,
      detail: max === null ? "A vaga não define faixa salarial." : "Candidato não informou pretensão.",
    });
  } else {
    const over = (exp - max) / max;
    const earned = over <= 0 ? 1 : over <= 0.2 ? 0.5 : 0;
    components.push({
      key: "salary",
      label: "Pretensão salarial",
      weight: WEIGHTS.salary,
      earned,
      detail:
        over <= 0
          ? "Dentro da faixa da vaga."
          : `${pct(over)} acima do teto da vaga.`,
    });
  }

  const measured = components.filter((c) => c.earned !== null);
  const totalWeight = components.reduce((acc, c) => acc + c.weight, 0);
  const measuredWeight = measured.reduce((acc, c) => acc + c.weight, 0);
  const raw =
    measuredWeight === 0
      ? 0
      : measured.reduce((acc, c) => acc + (c.earned ?? 0) * c.weight, 0) / measuredWeight;

  const score = Math.round(raw * 100);
  return {
    score,
    tier: tierFor(score),
    completeness: totalWeight === 0 ? 0 : measuredWeight / totalWeight,
    components,
    matchedRequired: req.matched,
    missingRequired: req.missing,
    matchedDesired: des.matched,
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// Ordena do maior para o menor fit; empate → quem tem mais dados avaliados.
export function rankByFit<T extends { fit: FitResult }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => b.fit.score - a.fit.score || b.fit.completeness - a.fit.completeness,
  );
}

// ─── Adaptadores a partir de linhas do banco ───

export function criteriaFromOpening(o: {
  requiredSkills: string[];
  desiredSkills: string[];
  minYears: number;
  salaryMin: number | null;
  salaryMax: number | null;
  targetVirtues: Virtue[];
}): OpeningCriteria {
  return {
    requiredSkills: o.requiredSkills,
    desiredSkills: o.desiredSkills,
    minYears: o.minYears,
    salaryMin: o.salaryMin,
    salaryMax: o.salaryMax,
    targetVirtues: o.targetVirtues,
  };
}

export function profileFromCandidate(c: {
  skills: string[];
  resumeText: string | null;
  yearsExperience: number;
  salaryExpectation: number | null;
  interviewRating: number | null;
  virtueRatings: unknown;
}): CandidateProfile {
  const ratings: Partial<Record<Virtue, number>> = {};
  if (c.virtueRatings && typeof c.virtueRatings === "object") {
    for (const [k, v] of Object.entries(c.virtueRatings as Record<string, unknown>)) {
      if (typeof v === "number" && v >= 1 && v <= 5) ratings[k as Virtue] = v;
    }
  }
  return {
    skills: c.skills,
    resumeText: c.resumeText,
    yearsExperience: c.yearsExperience,
    salaryExpectation: c.salaryExpectation,
    interviewRating: c.interviewRating,
    virtueRatings: ratings,
  };
}
