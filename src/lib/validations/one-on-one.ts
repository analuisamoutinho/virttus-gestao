import { z } from "zod";

const VIRTUE_VALUES = [
  "MAGNANIMIDADE",
  "HUMILDADE",
  "PRUDENCIA",
  "JUSTICA",
  "CORAGEM",
  "AUTOCONTROLE",
  "FE",
  "ESPERANCA",
  "CARIDADE",
] as const;

export const virtueEnum = z.enum(VIRTUE_VALUES);

export const createOneOnOneSchema = z.object({
  teamMemberId: z.string().min(1, "Selecione o liderado"),
  scheduledAt: z.coerce.date({ errorMap: () => ({ message: "Data inválida" }) }),
  agenda: z.string().max(4000).optional(),
  focusVirtue: virtueEnum.optional().or(z.literal("")),
});

export const completeOneOnOneSchema = z.object({
  oneOnOneId: z.string().min(1),
  notes: z.string().max(8000).optional(),
  mood: z.coerce.number().int().min(1).max(5).optional(),
  focusVirtue: virtueEnum.optional().or(z.literal("")),
});

export const addActionItemSchema = z.object({
  oneOnOneId: z.string().min(1),
  text: z.string().min(2, "Descreva a ação").max(500),
  dueDate: z.coerce.date().optional(),
});
