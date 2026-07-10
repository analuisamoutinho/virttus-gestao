import { describe, it, expect } from "vitest";
import { createOneOnOneSchema } from "@/lib/validations/one-on-one";
import { createFeedbackSchema } from "@/lib/validations/feedback";

describe("createOneOnOneSchema", () => {
  it("exige liderado e data válida", () => {
    const r = createOneOnOneSchema.safeParse({
      teamMemberId: "",
      scheduledAt: "not-a-date",
    });
    expect(r.success).toBe(false);
  });

  it("aceita 1:1 válido com virtude em foco", () => {
    const r = createOneOnOneSchema.safeParse({
      teamMemberId: "m1",
      scheduledAt: "2026-07-20T10:00",
      focusVirtue: "CORAGEM",
    });
    expect(r.success).toBe(true);
  });

  it("rejeita virtude inexistente", () => {
    const r = createOneOnOneSchema.safeParse({
      teamMemberId: "m1",
      scheduledAt: "2026-07-20T10:00",
      focusVirtue: "PACIENCIA",
    });
    expect(r.success).toBe(false);
  });
});

describe("createFeedbackSchema (SBI)", () => {
  it("exige os três campos S/B/I", () => {
    const r = createFeedbackSchema.safeParse({
      teamMemberId: "m1",
      type: "RECOGNITION",
      situation: "ok agora",
      behavior: "",
      impact: "impacto claro",
    });
    expect(r.success).toBe(false);
  });

  it("aceita feedback SBI completo", () => {
    const r = createFeedbackSchema.safeParse({
      teamMemberId: "m1",
      type: "CONSTRUCTIVE",
      situation: "Na reunião de sexta",
      behavior: "Interrompeu o colega algumas vezes",
      impact: "A pessoa não concluiu o raciocínio",
      virtue: "HUMILDADE",
    });
    expect(r.success).toBe(true);
  });

  it("rejeita tipo inválido", () => {
    const r = createFeedbackSchema.safeParse({
      teamMemberId: "m1",
      type: "NEUTRO",
      situation: "aaa",
      behavior: "bbb",
      impact: "ccc",
    });
    expect(r.success).toBe(false);
  });
});
