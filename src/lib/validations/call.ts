import { z } from "zod";
import { optionalText, optionalUrl } from "./common";

export const CALL_KINDS = ["ALINHAMENTO", "ONE_ON_ONE", "TREINAMENTO", "CLIENTE", "OUTRO"] as const;
export const callKindEnum = z.enum(CALL_KINDS);

export const createCallSchema = z.object({
  title: z.string().trim().min(3, "Dê um título à call").max(200),
  kind: callKindEnum.default("ALINHAMENTO"),
  scheduledAt: z.coerce.date({ errorMap: () => ({ message: "Data inválida" }) }),
  durationMin: z.coerce.number().int().min(5, "Duração mínima de 5 min").max(480).default(30),
  meetingUrl: optionalUrl,
  participants: optionalText(500),
  notes: optionalText(4000),
});

export const saveTranscriptSchema = z.object({
  callId: z.string().min(1),
  content: z
    .string()
    .trim()
    .min(10, "Cole a transcrição da call")
    .max(400_000, "Transcrição grande demais (máx. ~400 mil caracteres)"),
  source: z.enum(["manual", "upload"]).default("manual"),
});
