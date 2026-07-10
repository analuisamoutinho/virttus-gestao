import { describe, it, expect } from "vitest";
import { isStale, daysSince, ONE_ON_ONE_ALERT_DAYS } from "@/server/services/alerts";

const NOW = new Date("2026-07-10T12:00:00Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 24 * 3600 * 1000);

describe("alerts de 1:1", () => {
  it("21 dias é o limite configurado", () => {
    expect(ONE_ON_ONE_ALERT_DAYS).toBe(21);
  });

  it("considera stale quem nunca teve 1:1", () => {
    expect(isStale(null, NOW)).toBe(true);
  });

  it("não é stale dentro da janela", () => {
    expect(isStale(daysAgo(10), NOW)).toBe(false);
  });

  it("é stale após ultrapassar 21 dias", () => {
    expect(isStale(daysAgo(22), NOW)).toBe(true);
    expect(daysSince(daysAgo(22), NOW)).toBe(22);
  });
});
