// Utilitários de texto compartilhados (listas separadas por vírgula, busca sem acento).

export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// "Google Ads, SQL; Excel" → ["Google Ads", "SQL", "Excel"] (sem repetidos).
export function parseList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,;\n]/)) {
    const v = part.trim();
    const k = normalizeText(v);
    if (v && !seen.has(k)) {
      seen.add(k);
      out.push(v);
    }
  }
  return out;
}
