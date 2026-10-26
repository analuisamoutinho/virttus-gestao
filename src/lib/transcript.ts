// Tratamento de transcrições de calls: limpeza de legendas (.vtt/.srt) e
// extração de destaques (decisões e próximos passos) por palavras-chave.

// Remove cabeçalho WEBVTT, índices, linhas de tempo ("00:01:02,000 --> ...")
// e tags de formatação, preservando só a fala. Texto puro passa intacto.
export function cleanTranscript(raw: string): string {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      continue;
    }
    if (/^WEBVTT/i.test(t)) continue;
    if (/^(NOTE|STYLE|REGION)\b/.test(t)) continue;
    if (/^\d+$/.test(t)) continue; // índice de cue do SRT
    if (/^\d{1,2}:\d{2}(:\d{2})?[.,]\d{1,3}\s*-->/.test(t)) continue;
    // <v Ana>fala</v> (voz do WebVTT) vira "Ana: fala"; demais tags são descartadas.
    out.push(
      t
        .replace(/<v\s+([^>]+)>/gi, "$1: ")
        .replace(/<\/?[a-z][^>]*>/gi, "")
        .trim(),
    );
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export type Highlights = {
  decisions: string[];
  actionItems: string[];
};

const DECISION_RE = /\b(decidimos|ficou decidido|decis[ãa]o|definimos|ficou definido|aprovado|combinamos|ficou combinado|acordamos)\b/i;
const ACTION_RE =
  /\b(pr[óo]ximo passo|pr[óo]ximos passos|a[çc][ãa]o|vai (fazer|enviar|subir|ajustar|revisar|montar)|fica (respons[áa]vel|com)|respons[áa]vel|at[ée] (segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo|amanh[ãa]|o dia|dia \d)|prazo|pendente|pend[êe]ncia|todo)\b/i;

const MIN_LEN = 12;
const MAX_LEN = 280;

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((s) => {
    const k = s.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Heurística simples e determinística (sem IA): sinaliza falas que contêm
// marcadores de decisão ou de encaminhamento. Serve como atalho de leitura,
// não substitui a transcrição.
export function extractHighlights(transcript: string, limit = 8): Highlights {
  const decisions: string[] = [];
  const actionItems: string[] = [];
  const sentences = transcript
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= MIN_LEN && s.length <= MAX_LEN);

  for (const s of sentences) {
    if (DECISION_RE.test(s)) decisions.push(s);
    else if (ACTION_RE.test(s)) actionItems.push(s);
  }
  return {
    decisions: dedupe(decisions).slice(0, limit),
    actionItems: dedupe(actionItems).slice(0, limit),
  };
}

// Trecho ao redor da primeira ocorrência do termo — resultado da busca.
export function snippetAround(text: string, term: string, radius = 90): string | null {
  const needle = term.trim().toLowerCase();
  if (!needle) return null;
  const idx = text.toLowerCase().indexOf(needle);
  if (idx === -1) return null;
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + needle.length + radius);
  const flat = text.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${flat}${end < text.length ? "…" : ""}`;
}
