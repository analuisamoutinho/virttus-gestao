import { z } from "zod";
import { virtueEnum } from "./one-on-one";

const CONVERSATION_TYPE_VALUES = [
  "FEEDBACK_CONSTRUTIVO",
  "RECONHECIMENTO",
  "CONFLITO",
  "DESENVOLVIMENTO",
  "BAIXA_PERFORMANCE",
] as const;

export const conversationTypeEnum = z.enum(CONVERSATION_TYPE_VALUES);

export const createConversationScriptSchema = z.object({
  teamMemberId: z.string().min(1, "Selecione o liderado"),
  type: conversationTypeEnum,
  situation: z.string().min(3, "Descreva o contexto da conversa").max(2000),
  focusVirtue: virtueEnum.optional().or(z.literal("")),
});
