// Motor de geração de roteiro por regras ("rules"). Combina o tipo de
// conversa, o contexto descrito pelo líder e o perfil pessoal do liderado
// para montar abertura, perguntas socráticas e fechamento.
import type { ConversationContextType, Virtue } from "@prisma/client";
import { virtueLabel } from "@/lib/virtues";

export type ProfileInput = {
  motivators?: string | null;
  feedbackPrefs?: string | null;
  communicationStyle?: string | null;
  strengths?: string | null;
  watchouts?: string | null;
  aspirations?: string | null;
} | null;

export type GenerateScriptInput = {
  memberName: string;
  type: ConversationContextType;
  situation: string;
  focusVirtue?: Virtue | null;
  profile?: ProfileInput;
};

export type GeneratedScript = {
  opening: string;
  questions: string[];
  closing: string;
};

export function generateConversationScript(input: GenerateScriptInput): GeneratedScript {
  const { memberName, type, situation, focusVirtue, profile } = input;
  const virtue = focusVirtue ? virtueLabel(focusVirtue) : null;

  return {
    opening: buildOpening(memberName, type, profile ?? null),
    questions: buildQuestions(situation, type, virtue, profile ?? null),
    closing: buildClosing(memberName, type, virtue, profile ?? null),
  };
}

function buildOpening(
  memberName: string,
  type: ConversationContextType,
  profile: ProfileInput,
): string {
  const base: Record<ConversationContextType, string> = {
    FEEDBACK_CONSTRUTIVO: `Obrigado por reservar esse tempo, ${memberName}. Quero conversar sobre algo específico que observei recentemente — a intenção é ajudar seu desenvolvimento, não fazer um julgamento.`,
    RECONHECIMENTO: `${memberName}, chamei essa conversa para reconhecer algo que você fez muito bem recentemente.`,
    CONFLITO: `${memberName}, percebi uma tensão numa situação recente e quero entender os dois lados com calma, sem buscar culpados.`,
    DESENVOLVIMENTO: `${memberName}, quero conversar sobre para onde você quer crescer daqui pra frente e como posso apoiar isso.`,
    BAIXA_PERFORMANCE: `${memberName}, preciso falar com você sobre alguns resultados recentes. Quero entender o que está acontecendo antes de qualquer conclusão.`,
  };
  const styleHint = profile?.communicationStyle
    ? ` Lembrete do perfil: ${profile.communicationStyle}`
    : "";
  return base[type] + styleHint;
}

function buildQuestions(
  situation: string,
  type: ConversationContextType,
  virtue: string | null,
  profile: ProfileInput,
): string[] {
  const virtuePhrase = virtue ? ` (foco na virtude ${virtue})` : "";
  const questions: Record<ConversationContextType, string[]> = {
    FEEDBACK_CONSTRUTIVO: [
      `Como você descreveria, com suas palavras, o que aconteceu em "${situation}"?`,
      `O que você acha que levou a esse comportamento${virtuePhrase}?`,
      "Como isso pode ter impactado o time ou o resultado?",
      "O que você faria diferente numa situação parecida no futuro?",
      "Que apoio você precisa de mim para isso não se repetir?",
    ],
    RECONHECIMENTO: [
      `O que você acha que fez a diferença em "${situation}"?`,
      "Como podemos replicar isso em outras frentes?",
      "Quer que eu compartilhe isso com o time ou prefere que fique entre nós?",
    ],
    CONFLITO: [
      `Como você descreveria, com suas palavras, "${situation}"?`,
      "Na sua visão, qual é o ponto de vista da outra pessoa envolvida?",
      "O que vocês dois precisam para trabalhar bem juntos daqui pra frente?",
      "Que passo você está disposto(a) a dar primeiro?",
    ],
    DESENVOLVIMENTO: [
      "Onde você se imagina daqui a um ano?",
      `Que competência${virtuePhrase} você sente que precisa desenvolver para chegar lá?`,
      "Que tipo de projeto te ajudaria a testar isso na prática?",
    ],
    BAIXA_PERFORMANCE: [
      `O que está dificultando entregar no nível esperado em "${situation}"?`,
      "Há algo fora do trabalho ou de recursos que esteja pesando nisso?",
      "O que mudaria o resultado nas próximas semanas?",
      "Que apoio concreto você precisa de mim?",
    ],
  };
  const prefsHint = profile?.feedbackPrefs
    ? [`Lembrete do perfil: ${profile.feedbackPrefs}`]
    : [];
  return [...questions[type], ...prefsHint];
}

function buildClosing(
  memberName: string,
  type: ConversationContextType,
  virtue: string | null,
  profile: ProfileInput,
): string {
  const virtuePhrase = virtue ? ` com foco em ${virtue}` : "";
  const base: Record<ConversationContextType, string> = {
    FEEDBACK_CONSTRUTIVO: `Combine com ${memberName} 1-2 ações concretas${virtuePhrase} e marque um follow-up em 2 semanas para revisar juntos.`,
    RECONHECIMENTO: "Reforce que esse comportamento é o padrão que você quer ver mais — pergunte se pode usar como exemplo para o time.",
    CONFLITO: "Feche com um combinado claro entre as partes e um prazo curto para reavaliar se a relação melhorou.",
    DESENVOLVIMENTO: `Registre isso no PDI do próximo trimestre${virtuePhrase} com 1-2 ações concretas e datas.`,
    BAIXA_PERFORMANCE: "Documente o combinado, defina um prazo claro de melhoria e agende um check-in próximo para acompanhar.",
  };
  const watch = profile?.watchouts ? ` Fique atento: ${profile.watchouts}` : "";
  return base[type] + watch;
}
