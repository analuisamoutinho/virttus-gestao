import { z } from "zod";

export const keyResultInputSchema = z.object({
  title: z.string().min(2, "Descreva o KR").max(200),
  target: z.coerce.number().positive("Meta deve ser > 0"),
  unit: z.string().max(20).optional(),
});

export const createGoalSchema = z.object({
  teamMemberId: z.string().min(1, "Selecione o liderado"),
  objective: z.string().min(3, "Descreva o objetivo").max(300),
  quarter: z.string().regex(/^\d{4}-Q[1-4]$/, "Trimestre inválido"),
  keyResults: z.array(keyResultInputSchema).min(1, "Adicione ao menos 1 KR").max(6),
});

export const updateKrSchema = z.object({
  keyResultId: z.string().min(1),
  current: z.coerce.number().min(0),
});
