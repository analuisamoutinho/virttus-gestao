// Dimensões avaliadas pelos liderados no formulário anônimo (nota 1–5).
export const MANAGER_DIMENSIONS = [
  { key: "clareza", label: "Clareza", prompt: "Deixa claro o que espera de mim e quais são as prioridades." },
  { key: "apoio", label: "Apoio", prompt: "Me apoia quando preciso e está acessível." },
  { key: "reconhecimento", label: "Reconhecimento", prompt: "Reconhece o que eu entrego de bom." },
  { key: "feedback", label: "Qualidade do feedback", prompt: "Dá feedbacks úteis, específicos e respeitosos." },
  { key: "seguranca", label: "Segurança para falar", prompt: "Me sinto seguro(a) para discordar e dizer a verdade." },
  { key: "desenvolvimento", label: "Desenvolvimento", prompt: "Contribui de verdade para o meu crescimento." },
] as const;

export type DimensionKey = (typeof MANAGER_DIMENSIONS)[number]["key"];

export const DIMENSION_KEYS = MANAGER_DIMENSIONS.map((d) => d.key) as DimensionKey[];

// Abaixo desse número de respostas nada é exibido: com 1–2 respostas é fácil
// deduzir quem escreveu.
export const MIN_RESPONSES_TO_REVEAL = 3;
