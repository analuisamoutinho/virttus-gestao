import { describe, it, expect } from "vitest";
import {
  candidateHasSkill,
  scoreCandidate,
  rankByFit,
  tierFor,
  type OpeningCriteria,
  type CandidateProfile,
} from "@/server/services/talent-score";
import { parseList } from "@/lib/text";

const opening: OpeningCriteria = {
  requiredSkills: ["Meta Ads", "Google Ads", "GA4"],
  desiredSkills: ["SQL", "Looker Studio"],
  minYears: 3,
  salaryMin: 5000,
  salaryMax: 8000,
  targetVirtues: ["PRUDENCIA", "CORAGEM"],
};

const strong: CandidateProfile = {
  skills: ["meta ads", "google ads", "GA4", "SQL", "Looker Studio"],
  yearsExperience: 5,
  salaryExpectation: 7000,
  interviewRating: 5,
  virtueRatings: { PRUDENCIA: 5, CORAGEM: 5 },
};

describe("candidateHasSkill", () => {
  it("ignora caixa e acentos", () => {
    expect(candidateHasSkill("Análise de dados", ["analise de dados"])).toBe(true);
  });
  it("encontra a habilidade no texto do currículo por palavra inteira", () => {
    expect(candidateHasSkill("SQL", [], "Experiência com SQL e Excel")).toBe(true);
    expect(candidateHasSkill("SQL", [], "Trabalhei com MySQL")).toBe(false);
  });
  it("não quebra com caracteres especiais de regex", () => {
    expect(candidateHasSkill("C++", [], "Dev C++ sênior")).toBe(true);
    expect(candidateHasSkill("(", [], "texto")).toBe(false);
  });
});

describe("scoreCandidate", () => {
  it("dá 100 e alto fit a quem atende tudo", () => {
    const r = scoreCandidate(strong, opening);
    expect(r.score).toBe(100);
    expect(r.tier).toBe("HOT");
    expect(r.completeness).toBe(1);
    expect(r.missingRequired).toEqual([]);
  });

  it("lista os requisitos obrigatórios que faltam e derruba a nota", () => {
    const r = scoreCandidate({ ...strong, skills: ["Meta Ads"] }, opening);
    expect(r.missingRequired).toEqual(["Google Ads", "GA4"]);
    expect(r.matchedRequired).toEqual(["Meta Ads"]);
    expect(r.score).toBeLessThan(80);
  });

  it("usa o currículo para casar habilidades não declaradas", () => {
    const r = scoreCandidate(
      { ...strong, skills: [], resumeText: "Gestão de Meta Ads, Google Ads e GA4 por 5 anos" },
      opening,
    );
    expect(r.missingRequired).toEqual([]);
  });

  it("proporcional na experiência: 1 de 3 anos = 33%", () => {
    const r = scoreCandidate({ ...strong, yearsExperience: 1 }, opening);
    const exp = r.components.find((c) => c.key === "experience");
    expect(exp?.earned).toBeCloseTo(1 / 3, 5);
  });

  it("critérios sem dado ficam fora da conta e reduzem a completeness", () => {
    const r = scoreCandidate(
      { skills: ["Meta Ads", "Google Ads", "GA4", "SQL", "Looker Studio"], yearsExperience: 5 },
      opening,
    );
    const virtues = r.components.find((c) => c.key === "virtues");
    const interview = r.components.find((c) => c.key === "interview");
    expect(virtues?.earned).toBeNull();
    expect(interview?.earned).toBeNull();
    expect(r.completeness).toBeLessThan(1);
    // Tudo o que foi medido está perfeito → 100, não é punido pela falta de dado.
    expect(r.score).toBe(100);
  });

  it("pretensão até 20% acima do teto vale metade; acima disso, zero", () => {
    const half = scoreCandidate({ ...strong, salaryExpectation: 9000 }, opening);
    const zero = scoreCandidate({ ...strong, salaryExpectation: 12000 }, opening);
    expect(half.components.find((c) => c.key === "salary")?.earned).toBe(0.5);
    expect(zero.components.find((c) => c.key === "salary")?.earned).toBe(0);
  });

  it("virtudes: avaliar só parte das virtudes-alvo penaliza", () => {
    const full = scoreCandidate(strong, opening).components.find((c) => c.key === "virtues")!;
    const partial = scoreCandidate({ ...strong, virtueRatings: { PRUDENCIA: 5 } }, opening).components.find(
      (c) => c.key === "virtues",
    )!;
    expect(full.earned).toBe(1);
    expect(partial.earned).toBeCloseTo(0.75, 5);
  });

  it("vaga sem critérios não explode", () => {
    const r = scoreCandidate(
      { skills: [], yearsExperience: 0 },
      { requiredSkills: [], desiredSkills: [], minYears: 0, targetVirtues: [] },
    );
    expect(r.score).toBe(100);
    expect(Number.isNaN(r.score)).toBe(false);
  });
});

describe("tierFor / rankByFit", () => {
  it("classifica nas faixas 80 / 60", () => {
    expect(tierFor(80)).toBe("HOT");
    expect(tierFor(79)).toBe("WARM");
    expect(tierFor(60)).toBe("WARM");
    expect(tierFor(59)).toBe("COLD");
  });

  it("ordena do maior para o menor fit", () => {
    const a = { name: "A", fit: scoreCandidate({ ...strong, skills: [] }, opening) };
    const b = { name: "B", fit: scoreCandidate(strong, opening) };
    expect(rankByFit([a, b]).map((x) => x.name)).toEqual(["B", "A"]);
  });
});

describe("parseList", () => {
  it("separa por vírgula, ponto e vírgula e quebra de linha, sem repetidos", () => {
    expect(parseList("Meta Ads, google ads; GA4\nmeta ads")).toEqual(["Meta Ads", "google ads", "GA4"]);
    expect(parseList(undefined)).toEqual([]);
  });
});
