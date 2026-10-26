// Utilitários do calendário mensal. Datas são tratadas no fuso do servidor,
// o mesmo usado por `format.ts` — assim o dia exibido no grid bate com o
// horário mostrado no card.

export const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTH_FMT = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

export type MonthRef = { year: number; month: number }; // month: 0–11

export function parseMonthParam(param: string | undefined, today = new Date()): MonthRef {
  const m = /^(\d{4})-(\d{2})$/.exec(param ?? "");
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    if (month >= 0 && month <= 11 && year >= 2000 && year <= 2100) return { year, month };
  }
  return { year: today.getFullYear(), month: today.getMonth() };
}

export function monthParam({ year, month }: MonthRef): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function shiftMonth({ year, month }: MonthRef, delta: number): MonthRef {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function monthLabel(ref: MonthRef): string {
  const label = MONTH_FMT.format(new Date(ref.year, ref.month, 1));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Chave estável do dia (YYYY-MM-DD) no fuso local.
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Intervalo [start, end) que cobre todas as semanas exibidas do mês — usado
// para buscar no banco só os eventos visíveis.
export function monthRange(ref: MonthRef): { start: Date; end: Date } {
  const first = new Date(ref.year, ref.month, 1);
  const start = new Date(ref.year, ref.month, 1 - first.getDay());
  const lastDay = new Date(ref.year, ref.month + 1, 0);
  const end = new Date(ref.year, ref.month, lastDay.getDate() + (6 - lastDay.getDay()) + 1);
  return { start, end };
}

export type GridDay = { date: Date; key: string; inMonth: boolean };

// Semanas completas (domingo → sábado) que cobrem o mês.
export function buildMonthGrid(ref: MonthRef): GridDay[][] {
  const { start, end } = monthRange(ref);
  const weeks: GridDay[][] = [];
  const cursor = new Date(start);
  while (cursor < end) {
    const week: GridDay[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        date: new Date(cursor),
        key: dayKey(cursor),
        inMonth: cursor.getMonth() === ref.month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function groupByDay<T>(items: T[], getDate: (item: T) => Date): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = dayKey(getDate(item));
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  return map;
}
