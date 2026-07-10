import { z } from "zod";
import { virtueEnum } from "./one-on-one";

export const createPdiSchema = z.object({
  teamMemberId: z.string().min(1, "Selecione o liderado"),
  quarter: z.string().regex(/^\d{4}-Q[1-4]$/, "Trimestre inválido"),
  focusVirtue: virtueEnum,
  competency: z.string().min(3, "Descreva a competência foco").max(200),
});

export const addPdiActionSchema = z.object({
  pdiId: z.string().min(1),
  text: z.string().min(2, "Descreva a ação").max(500),
  dueDate: z.coerce.date().optional(),
});

export const updatePdiActionSchema = z.object({
  actionId: z.string().min(1),
  done: z.coerce.boolean().optional(),
  evidence: z.string().max(2000).optional(),
});
