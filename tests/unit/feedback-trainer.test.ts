import { describe, it, expect } from "vitest";
import {
  analyzeMessage,
  trustDelta,
  computeTrust,
  bandFor,
  ruleBasedReply,
  buildDebrief,
  START_TRUST,
} from "@/lib/feedback-trainer";
import { SCENARIOS, getScenario } from "@/lib/feedback-scenarios";

const GOOD_OPENING =
  "Rafael, obrigado por conversar comigo. Na semana passada, três relatórios foram entregues depois do prazo e o CS precisou remarcar reuniões. Como você enxerga isso?";
const BAD =
  "Você sempre atrasa tudo, é um irresponsável. Se não melhorar eu vou te demitir.";

describe("analyzeMessage", () => {
  it("reconhece situação, comportamento, impacto, empatia e pergunta aberta", () => {
    const s = analyzeMessage(
      "Obrigado por vir. Percebi que na reunião de terça você interrompeu a Ana, e isso afetou o time. Como você viu a situação?",
    );
    expect(s.situation).toBe(true);
    expect(s.behavior).toBe(true);
    expect(s.impact).toBe(true);
    expect(s.empathy).toBe(true);
    expect(s.openQuestion).toBe(true);
  });

  it("detecta generalização, rótulo e ameaça", () => {
    const s = analyzeMessage(BAD);
    expect(s.generalization).toBe(true);
    expect(s.label).toBe(true);
    expect(s.threat).toBe(true);
  });

  it("não confunde 'sempre' dentro de outra palavra e ignora acentos", () => {
    expect(analyzeMessage("Aprecio a sua dedicação").generalization).toBe(false);
    expect(analyzeMessage("Você é IRRESPONSÁVEL").label).toBe(true);
  });
});

describe("trustDelta / computeTrust", () => {
  it("mensagens boas sobem a confiança, ruins descem", () => {
    expect(trustDelta(analyzeMessage(GOOD_OPENING))).toBeGreaterThan(15);
    expect(trustDelta(analyzeMessage(BAD))).toBeLessThan(-25 + 1);
  });

  it("limita o delta de uma mensagem a ±25", () => {
    expect(trustDelta(analyzeMessage(BAD))).toBe(-25);
  });

  it("começa pelo ponto de partida da dificuldade e fica em 0–100", () => {
    expect(computeTrust(1, [])).toBe(START_TRUST[1]);
    expect(computeTrust(3, [BAD, BAD, BAD, BAD])).toBe(0);
    expect(computeTrust(1, Array(10).fill(GOOD_OPENING))).toBe(100);
  });
});

describe("bandFor", () => {
  it("mapeia as faixas", () => {
    expect(bandFor(0)).toBe("HOSTILE");
    expect(bandFor(30)).toBe("DEFENSIVE");
    expect(bandFor(50)).toBe("GUARDED");
    expect(bandFor(70)).toBe("OPEN");
    expect(bandFor(90)).toBe("COMMITTED");
  });
});

describe("ruleBasedReply", () => {
  const scenario = getScenario("prazos")!;

  it("persona reage com hostilidade a ameaça e rótulo", () => {
    const r = ruleBasedReply(scenario, 2, [BAD]);
    expect(["HOSTILE", "DEFENSIVE"]).toContain(r.band);
    expect(r.content).toMatch(/ameaça|pessoal|justo/i);
  });

  it("abre-se quando o líder conduz bem", () => {
    const r = ruleBasedReply(scenario, 2, [GOOD_OPENING, "Entendo, imagino que a carga esteja alta. Como posso te apoiar?"]);
    expect(["OPEN", "GUARDED", "COMMITTED"]).toContain(r.band);
    expect(r.trust).toBeGreaterThan(START_TRUST[2]);
  });

  it("só fecha o acordo se o líder propôs encaminhamento nesta rodada", () => {
    const warm = Array(6).fill(GOOD_OPENING);
    const noNext = ruleBasedReply(scenario, 1, [...warm, "Entendo, obrigado por explicar."]);
    expect(noNext.band).not.toBe("COMMITTED");
    const withNext = ruleBasedReply(scenario, 1, [
      ...warm,
      "Podemos combinar um prazo: o que você precisa de mim?",
    ]);
    expect(withNext.band).toBe("COMMITTED");
  });

  it("é determinística", () => {
    expect(ruleBasedReply(scenario, 2, [GOOD_OPENING])).toEqual(ruleBasedReply(scenario, 2, [GOOD_OPENING]));
  });

  it("todos os cenários têm falas para todas as faixas", () => {
    for (const s of SCENARIOS) {
      for (const band of ["HOSTILE", "DEFENSIVE", "GUARDED", "OPEN", "COMMITTED"] as const) {
        expect(s.lines[band].length, `${s.key}/${band}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("buildDebrief", () => {
  it("nota zero sem nenhuma fala", () => {
    expect(buildDebrief(2, []).score).toBe(0);
  });

  it("uma conversa exemplar pontua alto", () => {
    const d = buildDebrief(2, [
      GOOD_OPENING,
      "Entendo, imagino que a carga esteja pesada. O que está travando mais?",
      "Obrigado por contar. Podemos combinar um prazo e uma revisão: como posso te apoiar?",
    ]);
    expect(d.score).toBeGreaterThanOrEqual(80);
    expect(d.improvements.length).toBeLessThanOrEqual(1);
  });

  it("uma conversa agressiva pontua baixo e zera o respeito", () => {
    const d = buildDebrief(2, [BAD, "Você nunca entrega, o Pedro consegue fazer melhor que você."]);
    const respeito = d.dimensions.find((x) => x.key === "respeito")!;
    expect(respeito.score).toBe(0);
    expect(d.score).toBeLessThan(25);
  });

  it("cada dimensão fica entre 0 e 20 e o total é a soma", () => {
    const d = buildDebrief(3, [GOOD_OPENING, BAD]);
    for (const dim of d.dimensions) {
      expect(dim.score).toBeGreaterThanOrEqual(0);
      expect(dim.score).toBeLessThanOrEqual(dim.max);
    }
    expect(d.score).toBe(d.dimensions.reduce((a, x) => a + x.score, 0));
  });
});
