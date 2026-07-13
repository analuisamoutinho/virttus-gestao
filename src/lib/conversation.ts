// Fonte única dos tipos de conversa difícil: rótulos e ajuda no formulário.
import type { ConversationContextType } from "@prisma/client";

export type ConversationTypeMeta = {
  key: ConversationContextType;
  label: string;
  helper: string;
};

export const CONVERSATION_TYPES: ConversationTypeMeta[] = [
  {
    key: "FEEDBACK_CONSTRUTIVO",
    label: "Feedback construtivo difícil",
    helper: "Comportamento específico que precisa mudar.",
  },
  {
    key: "RECONHECIMENTO",
    label: "Reconhecimento",
    helper: "Celebrar um resultado ou comportamento exemplar.",
  },
  {
    key: "CONFLITO",
    label: "Conflito entre pessoas",
    helper: "Tensão com colega ou outra área.",
  },
  {
    key: "DESENVOLVIMENTO",
    label: "Desenvolvimento de carreira",
    helper: "Próximos passos, aspirações, PDI.",
  },
  {
    key: "BAIXA_PERFORMANCE",
    label: "Baixa performance",
    helper: "Resultados abaixo do esperado.",
  },
];

export const conversationTypeLabel = (t: ConversationContextType): string =>
  CONVERSATION_TYPES.find((c) => c.key === t)?.label ?? t;
