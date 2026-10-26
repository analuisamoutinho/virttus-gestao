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

import { createCallSchema, saveTranscriptSchema } from "@/lib/validations/call";
import { jobOpeningSchema, candidateSchema } from "@/lib/validations/talent";
import { createResourceSchema } from "@/lib/validations/resource";
import { startPracticeSchema, practiceMessageSchema } from "@/lib/validations/practice";
import { updateUserRoleSchema } from "@/lib/validations/admin";

describe("createCallSchema", () => {
  it("aceita call válida com defaults", () => {
    const r = createCallSchema.safeParse({ title: "Alinhamento", scheduledAt: "2026-10-27T09:00" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.kind).toBe("ALINHAMENTO");
      expect(r.data.durationMin).toBe(30);
    }
  });
  it("rejeita link que não seja http(s)", () => {
    const r = createCallSchema.safeParse({
      title: "Alinhamento",
      scheduledAt: "2026-10-27T09:00",
      meetingUrl: "javascript:alert(1)",
    });
    expect(r.success).toBe(false);
  });
  it("exige transcrição minimamente preenchida", () => {
    expect(saveTranscriptSchema.safeParse({ callId: "c1", content: "oi" }).success).toBe(false);
    expect(saveTranscriptSchema.safeParse({ callId: "c1", content: "Ana: bom dia a todos" }).success).toBe(true);
  });
});

describe("jobOpeningSchema", () => {
  it("transforma listas separadas por vírgula e valida a faixa salarial", () => {
    const r = jobOpeningSchema.safeParse({
      title: "Gestor de tráfego",
      requiredSkills: "Meta Ads, Google Ads",
      targetVirtues: ["CORAGEM"],
      salaryMin: "5000",
      salaryMax: "8000",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.requiredSkills).toEqual(["Meta Ads", "Google Ads"]);
      expect(r.data.salaryMax).toBe(8000);
    }
    expect(
      jobOpeningSchema.safeParse({ title: "Gestor", salaryMin: "9000", salaryMax: "8000" }).success,
    ).toBe(false);
  });
  it("rejeita virtude inexistente", () => {
    expect(jobOpeningSchema.safeParse({ title: "Gestor", targetVirtues: ["PACIENCIA"] }).success).toBe(false);
  });
});

describe("candidateSchema", () => {
  it("campos vazios de formulário viram undefined", () => {
    const r = candidateSchema.safeParse({ name: "Maria", email: "", linkedinUrl: "", salaryExpectation: "", interviewRating: "" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBeUndefined();
      expect(r.data.salaryExpectation).toBeUndefined();
      expect(r.data.interviewRating).toBeUndefined();
    }
  });
  it("valida e-mail, nota e LinkedIn", () => {
    expect(candidateSchema.safeParse({ name: "Maria", email: "invalido" }).success).toBe(false);
    expect(candidateSchema.safeParse({ name: "Maria", interviewRating: "6" }).success).toBe(false);
    expect(candidateSchema.safeParse({ name: "Maria", linkedinUrl: "javascript:alert(1)" }).success).toBe(false);
  });
});

describe("createResourceSchema", () => {
  it("normaliza tags em minúsculas e limita a 8", () => {
    const r = createResourceSchema.safeParse({
      title: "Virtuous Leadership",
      tags: "Liderança, FEEDBACK, a, b, c, d, e, f, g, h",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.tags[0]).toBe("liderança");
      expect(r.data.tags).toHaveLength(8);
    }
  });
  it("só aceita links http(s)", () => {
    expect(createResourceSchema.safeParse({ title: "Curso", url: "https://exemplo.com/curso" }).success).toBe(true);
    expect(createResourceSchema.safeParse({ title: "Curso", url: "data:text/html,<script>" }).success).toBe(false);
  });
});

describe("treino de feedback e admin", () => {
  it("valida início de treino e fala", () => {
    expect(startPracticeSchema.safeParse({ scenarioKey: "prazos", difficulty: "3" }).success).toBe(true);
    expect(startPracticeSchema.safeParse({ scenarioKey: "prazos", difficulty: "4" }).success).toBe(false);
    expect(practiceMessageSchema.safeParse({ practiceId: "p", content: "x" }).success).toBe(false);
    expect(practiceMessageSchema.safeParse({ practiceId: "p", content: "x".repeat(2001) }).success).toBe(false);
  });
  it("só aceita papéis conhecidos", () => {
    expect(updateUserRoleSchema.safeParse({ userId: "u", role: "ADMIN" }).success).toBe(true);
    expect(updateUserRoleSchema.safeParse({ userId: "u", role: "ROOT" }).success).toBe(false);
  });
});
