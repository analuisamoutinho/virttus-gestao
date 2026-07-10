// Progresso de OKR auto-calculado a partir dos key results.
// Cada KR contribui com current/target (limitado a 0–100%); o progresso do
// objetivo é a média simples dos KRs.

export type KRInput = { current: number; target: number };

export function krProgress(kr: KRInput): number {
  if (kr.target <= 0) return 0;
  const pct = (kr.current / kr.target) * 100;
  return clamp(pct);
}

export function goalProgress(krs: KRInput[]): number {
  if (krs.length === 0) return 0;
  const sum = krs.reduce((acc, kr) => acc + krProgress(kr), 0);
  return round1(sum / krs.length);
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

// Trimestre atual no formato "2026-Q3".
export function currentQuarter(now = new Date()): string {
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${q}`;
}
