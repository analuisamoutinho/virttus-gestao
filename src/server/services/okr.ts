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

// Intervalo [start, end) de um trimestre "2026-Q3" para filtros de data.
export function quarterRange(quarter: string): { start: Date; end: Date } {
  const [yearStr, qStr] = quarter.split("-Q");
  const year = Number(yearStr);
  const q = Number(qStr);
  const startMonth = (q - 1) * 3;
  return {
    start: new Date(Date.UTC(year, startMonth, 1)),
    end: new Date(Date.UTC(year, startMonth + 3, 1)),
  };
}
