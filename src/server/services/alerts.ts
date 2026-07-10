// Alerta: liderado sem 1:1 há mais de N dias (regra da LP: 21 dias).
export const ONE_ON_ONE_ALERT_DAYS = 21;

export function daysSince(date: Date | null, now = new Date()): number | null {
  if (!date) return null;
  return Math.floor((now.getTime() - date.getTime()) / (24 * 3600 * 1000));
}

export function isStale(lastOneOnOne: Date | null, now = new Date()): boolean {
  const d = daysSince(lastOneOnOne, now);
  return d === null || d > ONE_ON_ONE_ALERT_DAYS;
}
