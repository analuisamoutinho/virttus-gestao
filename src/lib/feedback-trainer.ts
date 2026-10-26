// Motor do treino de feedback difícil — parte determinística (sem IA).
//
// O líder escreve; cada mensagem é analisada por sinais (SBI, empatia,
// perguntas abertas, encaminhamento × generalização, rótulo, ameaça) que
// movem a "confiança" da persona. A faixa de confiança escolhe a fala da
// persona (ou orienta o LLM, quando configurado) e, ao encerrar, os mesmos
// sinais viram a avaliação final.
import {
  DIFFICULTY_LABEL,
  type Band,
  type Difficulty,
  type Scenario,
} from "@/lib/feedback-scenarios";

export type PracticeMessage = {
  role: "leader" | "persona";
  content: string;
  at: string; // ISO
};

export type Signals = {
  situation: boolean;
  behavior: boolean;
  impact: boolean;
  empathy: boolean;
  openQuestion: boolean;
  nextStep: boolean;
  generalization: boolean;
  label: boolean;
  threat: boolean;
  comparison: boolean;
  blameQuestion: boolean;
  tooShort: boolean;
};

const has = (text: string, ...patterns: RegExp[]) => patterns.some((p) => p.test(text));

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function analyzeMessage(raw: string): Signals {
  const t = norm(raw);
  const words = t.split(/\s+/).filter(Boolean).length;
  return {
    situation: has(
      t,
      /\b(na|no|nas|nos|durante a|durante o|em) (reuniao|reunioes|call|semana|projeto|entrega|relatorio|cliente|conta|terca|quarta|quinta|sexta|segunda|ultimo|ultima|mes|trimestre)\b/,
      /\b(ontem|semana passada|mes passado|dia \d{1,2}|dias \d{1,2}|nas ultimas|nos ultimos|recentemente)\b/,
    ),
    behavior: has(
      t,
      /\b(percebi|notei|observei|reparei|vi que|quando voce|voce (deixou|atrasou|interrompeu|nao registrou|nao entregou|entregou|respondeu|falou))\b/,
    ),
    impact: has(
      t,
      /\b(impacto|impactou|afetou|consequencia|isso gerou|isso causou|resultou|atrasou o|o time|o cliente|o cs|os colegas|a equipe|prejudic)/,
    ),
    empathy: has(
      t,
      /\b(entendo|imagino|compreendo|faz sentido|como voce (esta|se sente)|obrigado por|obrigada por|agradeco|sei que|reconheco|valorizo)\b/,
    ),
    openQuestion:
      raw.includes("?") &&
      has(t, /\b(como|o que|qual|quais|me ajuda a entender|me conta|me explica|na sua visao|o que voce acha)\b/),
    nextStep: has(
      t,
      /\b(combinar|combinado|proximo passo|proximos passos|prazo|podemos|proponho|vamos (fazer|combinar|definir)|plano|como posso (te )?ajudar|te apoiar|o que voce precisa)\b/,
    ),
    generalization: has(t, /\b(sempre|nunca|toda vez|de novo|todo mundo|ninguem|todos os dias)\b/),
    label: has(
      t,
      /(preguic|irresponsavel|incompetente|desleixad|problematic|imatur|arrogante|falta de comprometimento|falta de profissionalismo)/,
      /\bvoce e (um|uma|muito|tao|bem|meio)\b/,
    ),
    threat: has(
      t,
      /\b(demitir|demissao|ultima chance|mandar (voce )?embora|ou voce muda|se nao melhorar|vou te tirar)\b/,
    ),
    comparison: has(
      t,
      /\b(o|a) [a-z]+ (consegue|faz|entrega)\b/,
      /\b(ao contrario d|diferente d[oae]|seus colegas|os outros)\b/,
    ),
    blameQuestion: has(t, /\bpor que voce (nao|sempre|nunca)\b/),
    tooShort: words < 4,
  };
}

// Variação de confiança causada por uma única mensagem do líder.
export function trustDelta(s: Signals): number {
  let d = 0;
  if (s.situation) d += 6;
  if (s.behavior) d += 6;
  if (s.impact) d += 6;
  if (s.empathy) d += 8;
  if (s.openQuestion) d += 8;
  if (s.nextStep) d += 6;
  if (s.generalization) d -= 10;
  if (s.label) d -= 12;
  if (s.threat) d -= 15;
  if (s.comparison) d -= 8;
  if (s.blameQuestion) d -= 6;
  if (s.tooShort) d -= 3;
  return Math.max(-25, Math.min(25, d));
}

export const START_TRUST: Record<Difficulty, number> = { 1: 55, 2: 40, 3: 25 };

const clamp = (n: number) => Math.max(0, Math.min(100, n));

// Confiança atual = ponto de partida + soma dos deltas, mensagem a mensagem.
// Derivada do histórico, então nada precisa ser guardado além das mensagens.
export function computeTrust(difficulty: Difficulty, leaderMessages: string[]): number {
  let trust = START_TRUST[difficulty];
  for (const m of leaderMessages) trust = clamp(trust + trustDelta(analyzeMessage(m)));
  return trust;
}

export function bandFor(trust: number): Band {
  if (trust < 22) return "HOSTILE";
  if (trust < 42) return "DEFENSIVE";
  if (trust < 62) return "GUARDED";
  if (trust < 82) return "OPEN";
  return "COMMITTED";
}

export const BAND_LABEL: Record<Band, string> = {
  HOSTILE: "Hostil",
  DEFENSIVE: "Defensivo(a)",
  GUARDED: "Reservado(a)",
  OPEN: "Aberto(a)",
  COMMITTED: "Comprometido(a)",
};

// Reação imediata a deslizes do líder — vem antes da fala da faixa.
function reactionPrefix(s: Signals, difficulty: Difficulty): string {
  if (difficulty === 1) return "";
  if (s.threat) return "Isso soou como uma ameaça. ";
  if (s.label) return "Nossa, isso foi pessoal. ";
  if (s.generalization) return "Sempre? Isso não é justo. ";
  if (s.comparison) return "Comparar comigo com os outros não ajuda. ";
  return "";
}

// Resposta do motor de regras. `leaderMessages` já inclui a mensagem atual.
export function ruleBasedReply(
  scenario: Scenario,
  difficulty: Difficulty,
  leaderMessages: string[],
): { content: string; trust: number; band: Band } {
  const trust = computeTrust(difficulty, leaderMessages);
  const latest = analyzeMessage(leaderMessages[leaderMessages.length - 1] ?? "");
  let band = bandFor(trust);

  // Só "fecha o acordo" se o líder propôs encaminhamento nesta rodada.
  if (band === "COMMITTED" && !latest.nextStep) band = "OPEN";

  const options = scenario.lines[band];
  const line = options[(leaderMessages.length - 1) % options.length];
  const prefix = band === "OPEN" || band === "COMMITTED" ? "" : reactionPrefix(latest, difficulty);
  return { content: `${prefix}${line}`, trust, band };
}

// ───────────────────────── Avaliação final ─────────────────────────

export type DebriefDimension = {
  key: "especificidade" | "impacto" | "escuta" | "respeito" | "encaminhamento";
  label: string;
  virtue: string;
  score: number;
  max: number;
  tip: string;
};

export type Debrief = {
  score: number;
  dimensions: DebriefDimension[];
  strengths: string[];
  improvements: string[];
  finalTrust: number;
  finalBand: Band;
  turns: number;
  difficultyLabel: string;
  coach?: string;
};

export function buildDebrief(difficulty: Difficulty, leaderMessages: string[]): Debrief {
  const signals = leaderMessages.map(analyzeMessage);
  const count = (pick: (s: Signals) => boolean) => signals.filter(pick).length;

  const sbiTogether = signals.some((s) => s.behavior && s.impact);
  const empathyHits = count((s) => s.empathy);
  const questionHits = count((s) => s.openQuestion);
  const nextHits = count((s) => s.nextStep);
  const finalTrust = computeTrust(difficulty, leaderMessages);

  const none = leaderMessages.length === 0;

  const especificidade = none
    ? 0
    : Math.min(
        20,
        (count((s) => s.situation) > 0 ? 7 : 0) +
          (count((s) => s.behavior) > 0 ? 8 : 0) +
          (sbiTogether ? 5 : 0),
      );
  const impacto = none
    ? 0
    : Math.min(20, (count((s) => s.impact) > 0 ? 14 : 0) + (sbiTogether ? 6 : 0));
  const escuta = none ? 0 : Math.min(20, 6 * Math.min(empathyHits, 2) + 4 * Math.min(questionHits, 2));
  const respeito = none
    ? 0
    : Math.max(
        0,
        20 -
          8 * count((s) => s.generalization) -
          10 * count((s) => s.label) -
          12 * count((s) => s.threat) -
          5 * count((s) => s.comparison) -
          4 * count((s) => s.blameQuestion),
      );
  const encaminhamento = none
    ? 0
    : Math.min(
        20,
        (nextHits >= 1 ? 12 : 0) + (nextHits >= 2 ? 4 : 0) + (finalTrust >= 65 ? 4 : 0),
      );

  const dimensions: DebriefDimension[] = [
    {
      key: "especificidade",
      label: "Situação e comportamento",
      virtue: "Coragem",
      score: especificidade,
      max: 20,
      tip: "Ancore em um momento e em um comportamento observável: “Na reunião de terça, você interrompeu a Ana duas vezes”. Evite impressões.",
    },
    {
      key: "impacto",
      label: "Impacto",
      virtue: "Justiça",
      score: impacto,
      max: 20,
      tip: "Diga o efeito concreto no time, no cliente ou no resultado — é o que dá peso ao feedback sem precisar de dureza.",
    },
    {
      key: "escuta",
      label: "Escuta e empatia",
      virtue: "Humildade e Caridade",
      score: escuta,
      max: 20,
      tip: "Reconheça o que a pessoa sente e faça perguntas abertas: “Como você enxerga isso?”, “O que está travando?”. Depois, escute.",
    },
    {
      key: "respeito",
      label: "Respeito na linguagem",
      virtue: "Autocontrole",
      score: respeito,
      max: 20,
      tip: "Troque “você sempre/nunca”, rótulos e comparações por fatos. Nenhuma ameaça: ela encerra a conversa.",
    },
    {
      key: "encaminhamento",
      label: "Encaminhamento",
      virtue: "Prudência",
      score: encaminhamento,
      max: 20,
      tip: "Termine com um combinado claro: o quê, até quando e como você vai apoiar. Registre no PDI ou na próxima 1:1.",
    },
  ];

  const score = dimensions.reduce((a, d) => a + d.score, 0);
  const strengths = dimensions.filter((d) => d.score >= 14).map((d) => `${d.label}: ${positiveNote(d.key)}`);
  const improvements = dimensions.filter((d) => d.score < 14).map((d) => `${d.label} — ${d.tip}`);

  return {
    score,
    dimensions,
    strengths,
    improvements,
    finalTrust,
    finalBand: bandFor(finalTrust),
    turns: leaderMessages.length,
    difficultyLabel: DIFFICULTY_LABEL[difficulty].label,
  };
}

function positiveNote(key: DebriefDimension["key"]): string {
  switch (key) {
    case "especificidade":
      return "você trouxe fatos concretos em vez de impressões.";
    case "impacto":
      return "você deixou claro por que isso importa.";
    case "escuta":
      return "você abriu espaço para a pessoa falar e se sentir ouvida.";
    case "respeito":
      return "a linguagem se manteve respeitosa, sem rótulos nem ameaças.";
    case "encaminhamento":
      return "a conversa terminou com um caminho combinado.";
  }
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "Conversa exemplar";
  if (score >= 65) return "Boa condução";
  if (score >= 40) return "Em desenvolvimento";
  return "Precisa de mais treino";
}
