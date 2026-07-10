import { z } from "zod";
import { virtueEnum } from "./one-on-one";

export const createFeedbackSchema = z.object({
  teamMemberId: z.string().min(1, "Selecione o liderado"),
  type: z.enum(["RECOGNITION", "CONSTRUCTIVE"], {
    errorMap: () => ({ message: "Escolha o tipo" }),
  }),
  situation: z.string().min(3, "Descreva a situação").max(2000),
  behavior: z.string().min(3, "Descreva o comportamento").max(2000),
  impact: z.string().min(3, "Descreva o impacto").max(2000),
  virtue: virtueEnum.optional().or(z.literal("")),
});
