// Camada opcional de IA do treino de feedback. Sem ANTHROPIC_API_KEY (ou se a
// chamada falhar) devolve null e o chamador cai no motor de regras — o treino
// nunca fica indisponível. Só texto de cenários fictícios é enviado ao modelo.
import {
  BAND_LABEL,
  type Debrief,
  type PracticeMessage,
} from "@/lib/feedback-trainer";
import { DIFFICULTY_LABEL, type Band, type Difficulty, type Scenario } from "@/lib/feedback-scenarios";

const API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-5-5";
const TIMEOUT_MS = 20_000;

export const llmEnabled = () => !!process.env.ANTHROPIC_API_KEY;

async function callClaude(params: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens: number;
}): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: params.maxTokens,
        system: params.system,
        messages: params.messages,
      }),
    });
    if (!res.ok) {
      console.error("[trainer] Anthropic API", res.status);
      return null;
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    return text || null;
  } catch (err) {
    console.error("[trainer] falha na chamada ao modelo", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// A conversa para o modelo começa sempre com o líder (role user).
function toApiMessages(history: PracticeMessage[]) {
  return history.map((m) => ({
    role: m.role === "leader" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));
}

export async function llmPersonaReply(params: {
  scenario: Scenario;
  difficulty: Difficulty;
  history: PracticeMessage[]; // inclui a última fala do líder
  trust: number;
  band: Band;
}): Promise<string | null> {
  const { scenario, difficulty, history, trust, band } = params;
  const system = [
    `Você interpreta ${scenario.personaName}, ${scenario.personaRole}, em um treino de conversa difícil de feedback. Quem escreve é o gestor (líder) de ${scenario.personaName}.`,
    `Perfil: ${scenario.personaPrompt}`,
    `Fatos do caso: ${scenario.facts.join(" ")}`,
    `Dificuldade: ${DIFFICULTY_LABEL[difficulty].label}. Estado emocional atual (calculado pelo sistema): ${BAND_LABEL[band]}, abertura ${trust}/100.`,
    "Regras: responda SEMPRE como a pessoa, em português do Brasil, em 1 a 3 frases curtas, de forma natural e realista. Não quebre o personagem, não dê dicas nem avalie o gestor.",
    "Reaja ao tom do gestor: acolhimento, fatos específicos e perguntas abertas aumentam a abertura; generalizações, rótulos, comparações e ameaças fazem você se defender ou se fechar. Respeite o estado emocional indicado; só aceite um combinado se o gestor propuser um encaminhamento concreto.",
  ].join("\n");

  return callClaude({ system, messages: toApiMessages(history), maxTokens: 300 });
}

export async function llmCoach(params: {
  scenario: Scenario;
  history: PracticeMessage[];
  debrief: Debrief;
}): Promise<string | null> {
  const { scenario, history, debrief } = params;
  const transcript = history
    .map((m) => `${m.role === "leader" ? "GESTOR" : scenario.personaName.toUpperCase()}: ${m.content}`)
    .join("\n");

  const system =
    "Você é um coach de liderança experiente, baseado nas virtudes de Alexandre Havard (magnanimidade, humildade, prudência, justiça, coragem, autocontrole). Avalie a condução de uma conversa difícil de feedback e seja direto, respeitoso e prático.";
  const prompt = [
    `Cenário: ${scenario.title} — ${scenario.tagline}`,
    `Objetivo do gestor: ${scenario.goal}`,
    `Nota automática: ${debrief.score}/100.`,
    "",
    "Conversa:",
    transcript,
    "",
    "Escreva em português, até 120 palavras: (1) o que o gestor fez melhor; (2) o ponto que mais mudaria o resultado; (3) uma frase de exemplo reescrevendo a fala menos eficaz. Sem títulos.",
  ].join("\n");

  return callClaude({ system, messages: [{ role: "user", content: prompt }], maxTokens: 400 });
}
