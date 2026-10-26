import { describe, it, expect } from "vitest";
import {
  buildMonthGrid,
  dayKey,
  groupByDay,
  monthParam,
  monthRange,
  parseMonthParam,
  shiftMonth,
} from "@/lib/calendar";
import { cleanTranscript, extractHighlights, snippetAround } from "@/lib/transcript";

describe("calendar", () => {
  it("parseMonthParam aceita YYYY-MM e cai no mês atual quando inválido", () => {
    const today = new Date(2026, 9, 26);
    expect(parseMonthParam("2026-03", today)).toEqual({ year: 2026, month: 2 });
    expect(parseMonthParam("2026-13", today)).toEqual({ year: 2026, month: 9 });
    expect(parseMonthParam("lixo", today)).toEqual({ year: 2026, month: 9 });
    expect(parseMonthParam(undefined, today)).toEqual({ year: 2026, month: 9 });
  });

  it("shiftMonth atravessa o ano", () => {
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
    expect(monthParam({ year: 2026, month: 0 })).toBe("2026-01");
  });

  it("o grid tem semanas completas (dom–sáb) que cobrem o mês", () => {
    // Outubro/2026 começa numa quinta e termina numa sábado → 5 semanas
    const weeks = buildMonthGrid({ year: 2026, month: 9 });
    expect(weeks).toHaveLength(5);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks[0][0].date.getDay()).toBe(0);
    const inMonth = weeks.flat().filter((d) => d.inMonth);
    expect(inMonth).toHaveLength(31);
    expect(weeks.flat().some((d) => d.key === "2026-10-01")).toBe(true);
    expect(weeks.flat().some((d) => d.key === "2026-10-31")).toBe(true);
  });

  it("o grid termina no sábado da última semana em qualquer mês (inclui dezembro e fevereiro)", () => {
    for (const ref of [
      { year: 2026, month: 11 },
      { year: 2026, month: 1 },
      { year: 2027, month: 0 },
    ]) {
      const flat = buildMonthGrid(ref).flat();
      expect(flat.length % 7).toBe(0);
      expect(flat[flat.length - 1].date.getDay()).toBe(6);
      expect(flat.filter((d) => d.inMonth).length).toBe(new Date(ref.year, ref.month + 1, 0).getDate());
    }
  });

  it("monthRange cobre exatamente o primeiro e o último dia exibidos", () => {
    const ref = { year: 2026, month: 9 };
    const { start, end } = monthRange(ref);
    const weeks = buildMonthGrid(ref).flat();
    expect(dayKey(start)).toBe(weeks[0].key);
    expect(dayKey(new Date(end.getTime() - 1))).toBe(weeks[weeks.length - 1].key);
  });

  it("groupByDay agrupa pelo dia local", () => {
    const m = groupByDay(
      [
        { d: new Date(2026, 9, 5, 9, 0) },
        { d: new Date(2026, 9, 5, 18, 30) },
        { d: new Date(2026, 9, 6, 9, 0) },
      ],
      (x) => x.d,
    );
    expect(m.get("2026-10-05")).toHaveLength(2);
    expect(m.get("2026-10-06")).toHaveLength(1);
  });
});

describe("cleanTranscript", () => {
  it("remove cabeçalho, índices e tempos de VTT/SRT preservando a fala", () => {
    const vtt = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
Ana: Bom dia, pessoal.

2
00:00:04.500 --> 00:00:07.000
<v Bruno>Bom dia! Vamos começar.</v>
`;
    expect(cleanTranscript(vtt)).toBe("Ana: Bom dia, pessoal.\n\nBruno: Bom dia! Vamos começar.");
  });

  it("não altera texto puro", () => {
    expect(cleanTranscript("Linha um.\nLinha dois.")).toBe("Linha um.\nLinha dois.");
  });

  it("mantém falas que só contêm números dentro de texto", () => {
    expect(cleanTranscript("Subimos a verba para 1500 reais.")).toContain("1500 reais");
  });
});

describe("extractHighlights", () => {
  const text = `Ana: Bom dia. Hoje vamos revisar as contas.
Bruno: Ficou decidido que a verba do cliente X sobe 20% na próxima semana.
Carla: Próximo passo é enviar o relatório até sexta.
Bruno: Combinamos de fazer a call de resultados na quarta.
Ana: Certo, obrigada a todos.`;

  it("separa decisões de próximos passos", () => {
    const h = extractHighlights(text);
    expect(h.decisions.some((d) => d.includes("verba do cliente X"))).toBe(true);
    expect(h.decisions.some((d) => d.includes("Combinamos"))).toBe(true);
    expect(h.actionItems.some((d) => d.includes("relatório até sexta"))).toBe(true);
  });

  it("respeita o limite e não repete", () => {
    const many = Array(20).fill("Ficou decidido que vamos revisar tudo hoje.").join("\n");
    expect(extractHighlights(many, 3).decisions).toHaveLength(1);
  });
});

describe("snippetAround", () => {
  it("devolve o trecho com reticências e ignora caixa", () => {
    const t = "a".repeat(200) + " VERBA do cliente " + "b".repeat(200);
    const s = snippetAround(t, "verba", 20)!;
    expect(s.startsWith("…")).toBe(true);
    expect(s.endsWith("…")).toBe(true);
    expect(s.toLowerCase()).toContain("verba");
  });
  it("devolve null quando não encontra ou o termo é vazio", () => {
    expect(snippetAround("texto", "xyz")).toBeNull();
    expect(snippetAround("texto", "  ")).toBeNull();
  });
});
