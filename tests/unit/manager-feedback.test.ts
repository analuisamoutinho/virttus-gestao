import { describe, it, expect } from "vitest";
import { summarizeManagerFeedback, weekStart, newAnonToken } from "@/server/services/manager-feedback";
import { submitManagerFeedbackSchema } from "@/lib/validations/manager-feedback";
import { DIMENSION_KEYS, MIN_RESPONSES_TO_REVEAL } from "@/lib/manager-feedback";

const ratings = (n: number) => Object.fromEntries(DIMENSION_KEYS.map((k) => [k, n]));
const row = (n: number, keepText: string | null = null) => ({
  ratings: ratings(n),
  keepText,
  startText: null,
  stopText: null,
});

describe("summarizeManagerFeedback (anonimato)", () => {
  it("não revela nada abaixo do mínimo de respostas", () => {
    const s = summarizeManagerFeedback([row(5, "Ótimo"), row(1, "Ruim")]);
    expect(s.total).toBe(2);
    expect(s.revealed).toBe(false);
    expect(s.remaining).toBe(MIN_RESPONSES_TO_REVEAL - 2);
    expect(s.overall).toBeNull();
    expect(s.averages).toBeNull();
    expect(s.keep).toEqual([]);
  });

  it("revela médias e comentários a partir do mínimo", () => {
    const s = summarizeManagerFeedback([row(5, "A"), row(4, "B"), row(3, "C")]);
    expect(s.revealed).toBe(true);
    expect(s.overall).toBeCloseTo(4, 5);
    expect(s.averages?.clareza).toBeCloseTo(4, 5);
    expect([...s.keep].sort()).toEqual(["A", "B", "C"]);
  });

  it("a ordem dos comentários não depende da ordem de envio", () => {
    const a = summarizeManagerFeedback([row(5, "um"), row(4, "dois"), row(3, "três")]);
    const b = summarizeManagerFeedback([row(3, "três"), row(5, "um"), row(4, "dois")]);
    expect(a.keep).toEqual(b.keep);
  });

  it("ignora notas inválidas em vez de quebrar", () => {
    const s = summarizeManagerFeedback([
      { ratings: { clareza: 99 }, keepText: null, startText: null, stopText: null },
      row(4),
      row(4),
    ]);
    expect(s.averages?.clareza).toBeCloseTo(4, 5);
  });
});

describe("weekStart", () => {
  it("reduz qualquer horário à segunda-feira 00:00 UTC da semana", () => {
    // 2026-10-28 é quarta-feira
    expect(weekStart(new Date("2026-10-28T15:42:11Z")).toISOString()).toBe("2026-10-26T00:00:00.000Z");
    // domingo pertence à semana que começou na segunda anterior
    expect(weekStart(new Date("2026-11-01T23:59:59Z")).toISOString()).toBe("2026-10-26T00:00:00.000Z");
    expect(weekStart(new Date("2026-10-26T00:00:00Z")).toISOString()).toBe("2026-10-26T00:00:00.000Z");
  });
});

describe("newAnonToken", () => {
  it("gera tokens longos, distintos e seguros para URL", () => {
    const a = newAnonToken();
    const b = newAnonToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{20,}$/);
  });
});

describe("submitManagerFeedbackSchema", () => {
  const valid = { token: "x".repeat(24), ratings: ratings(4), keepText: "ok" };

  it("aceita um envio completo", () => {
    expect(submitManagerFeedbackSchema.safeParse(valid).success).toBe(true);
  });
  it("exige nota em todas as dimensões", () => {
    const { clareza: _omit, ...partial } = ratings(4);
    expect(submitManagerFeedbackSchema.safeParse({ ...valid, ratings: partial }).success).toBe(false);
  });
  it("rejeita nota fora de 1–5", () => {
    expect(submitManagerFeedbackSchema.safeParse({ ...valid, ratings: ratings(6) }).success).toBe(false);
    expect(submitManagerFeedbackSchema.safeParse({ ...valid, ratings: ratings(0) }).success).toBe(false);
  });
  it("rejeita campos extras (nada identificável passa pelo schema)", () => {
    expect(submitManagerFeedbackSchema.safeParse({ ...valid, email: "a@b.com" }).success).toBe(false);
  });
});
