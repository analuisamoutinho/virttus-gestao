import { z } from "zod";
import { virtueEnum } from "./one-on-one";

export const createTrainingSchema = z.object({
  title: z.string().min(3, "Descreva o treinamento").max(200),
  description: z.string().max(2000).optional(),
  module: z.string().max(120).optional(),
  scheduledAt: z.coerce.date({ errorMap: () => ({ message: "Data inválida" }) }),
  focusVirtue: virtueEnum.optional().or(z.literal("")),
});

export const updateTrainingStatusSchema = z.object({
  trainingId: z.string().min(1),
  status: z.enum(["PLANNED", "DONE", "CANCELED"]),
});
