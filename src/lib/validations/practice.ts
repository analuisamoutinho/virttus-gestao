import { z } from "zod";

export const startPracticeSchema = z.object({
  scenarioKey: z.string().min(1, "Escolha um cenário"),
  difficulty: z.coerce.number().int().min(1).max(3).default(2),
});

export const practiceMessageSchema = z.object({
  practiceId: z.string().min(1),
  content: z.string().trim().min(2, "Escreva sua fala").max(2000, "Fala longa demais (máx. 2000 caracteres)"),
});
