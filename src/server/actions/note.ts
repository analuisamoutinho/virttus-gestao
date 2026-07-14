"use server";

import { revalidatePath } from "next/cache";
import { getContext } from "@/server/context";
import { db } from "@/server/db";
import { writeAuditLog } from "@/server/audit";
import { createNoteSchema, updateNoteSchema } from "@/lib/validations/note";
import type { ActionResult } from "@/server/actions/team";

export async function createNote(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const parsed = createNoteSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const note = await db.note.create({
    data: {
      organizationId: org.id,
      authorId: userId,
      category: parsed.data.category,
      title: parsed.data.title,
      content: parsed.data.content,
    },
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "note.create",
    entity: "Note",
    entityId: note.id,
  });

  revalidatePath("/biblioteca");
  return { ok: true };
}

export async function updateNote(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { org } = await getContext();

  const parsed = updateNoteSchema.safeParse({
    noteId: formData.get("noteId"),
    title: formData.get("title"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const note = await db.note.findFirst({
    where: { id: parsed.data.noteId, organizationId: org.id },
    select: { id: true },
  });
  if (!note) return { ok: false, error: "Nota não encontrada." };

  await db.note.update({
    where: { id: note.id },
    data: { title: parsed.data.title, content: parsed.data.content },
  });

  revalidatePath("/biblioteca");
  return { ok: true };
}

export async function deleteNote(noteId: string): Promise<void> {
  const { org } = await getContext();

  const note = await db.note.findFirst({
    where: { id: noteId, organizationId: org.id },
    select: { id: true },
  });
  if (!note) return;

  await db.note.delete({ where: { id: note.id } });
  revalidatePath("/biblioteca");
}

// Conteúdo de referência (manual de liderança, PDI do setor, contexto e
// formulário de virtudes) — carregado sob demanda, uma vez, na Biblioteca.
const BASE_CONHECIMENTO_CONTENT = `# Base de Conhecimento — Liderança e Gestão de Time

> Consolidação dos materiais de referência da Ana Luisa para liderança do time:
> **Manual de Liderança (Plano de Cargos e Salários)** + **PDI para Analistas de Mídia/Tráfego**.
> Este documento serve tanto como guia prático de gestão quanto como referência de domínio
> para evolução do produto Virttus.

---

## 1. Fundamentos: a Agenda de Liderança e o Ganha-Ganha-Ganha

- **Liderança não é cargo** — é a defesa ativa do crescimento do time e a guarda do valor da empresa. "Líder é quem atinge resultados através do time, fazendo o que é certo" (metodologia Falconi).
- A ausência de plano de cargos/carreira funciona como **freio de mão** no crescimento da empresa. Estagnação é uma escolha ativa, não um estado passivo.
- **Filosofia Ganha-Ganha-Ganha** — o plano de carreira conecta três partes:
  - **Dono:** empresa profissionalizada e autogerenciável, resultados que não dependem da presença constante do dono.
  - **Colaborador:** caminho claro de prosperidade financeira e uma "mochila" de habilidades portáteis.
  - **Cliente:** serviço superior entregue por um time engajado que entende seu papel na cadeia de valor.

## 2. RCF — Responsabilidade Chave da Função (o "contrato vivo")

Ferramenta de alinhamento dinâmica (não arquivo estático de RH). Elimina ambiguidade e define o padrão de excelência desde o dia um. Toda RCF deve conter:

1. **Missão** — o "coração" do cargo: como a função gera valor na jornada do cliente.
2. **Responsabilidades-chave** — as atividades e "cadeiras" táticas.
3. **Indicadores (KPIs)** — métricas quantitativas de sucesso.
4. **Competências** — comportamentos e conhecimentos técnicos exigidos.

Distinguir **Organograma** (a "casa": áreas construídas ao longo da jornada do cliente — Marketing → Vendas → Operações/CS → Financeiro/RH) do **Mapa de Cargos** (as "cadeiras" dentro das salas). O líder estratégico mapeia os cargos da **próxima fase** de crescimento, mesmo que as cadeiras ainda estejam vazias.

## 3. Reuniões 1:1 — o pulso da liderança

- **Protocolo:** 30 minutos, semanal ou quinzenal, **inegociável e protegida** na agenda. Não é "cafezinho" nem status de tarefas.
- Objetivo: defesa diária do crescimento do liderado e **zero surpresas** na avaliação formal.
- **Framework de feedback em 3 pilares:**
  - **O que manter** — reconhecer comportamentos/resultados de alto valor alinhados à missão da RCF.
  - **O que mudar** — correção de desvios em tempo real.
  - **O que começar** — novas oportunidades de crescimento para a "mochila".

| 1:1 ineficaz | 1:1 estratégica |
| --- | --- |
| Só status de tarefas | Desenvolvimento, alinhamento, remoção de barreiras |
| Mão única (gestor ditando) | Parceria e diálogo de coaching |
| Irregular, cancelada, "espremida" | Ritual consistente e protegido |
| Feedback vago, por sentimento | Feedback objetivo baseado em indicadores da RCF |

A documentação das 1:1s é a base empírica da avaliação de desempenho formal.

## 4. Avaliação de Desempenho — competências × resultados

Dois eixos:
- **Desempenho técnico (o "quê"):** entrega real vs. indicadores da RCF.
- **Alinhamento cultural (o "como"):** comportamentos, agilidade de aprendizado, fit com valores.

**Matriz de talentos 4-Box:**

| Perfil | Desempenho / Alinhamento | Ação |
| --- | --- | --- |
| **Estrelas** | Alto / Alto | Maior ativo e maior risco de mercado — priorizar retenção e progressão clara |
| **Especialistas técnicos** | Alto / Baixo | Coaching comportamental firme, ou intoxicam o time |
| **Fit cultural** | Baixo / Alto | Treinamento urgente ou troca de "cadeira" |
| **Drenos** | Baixo / Baixo | Desligar rápido para proteger o resto do time |

**Mandato da meritocracia:** tempo de casa é métrica de sobrevivência, não de contribuição. Promoção só por resultados + desenvolvimento de competências. Aumentos atrelados a desempenho individual **e** viabilidade financeira do negócio.

## 5. Manutenção do plano — evolução orientada a dados

- Plano não comunicado ou não atualizado **"morre"** e vira freio organizacional.
- **Benchmark salarial pelo porte financeiro (faturamento)**, não por número de funcionários — margens e capacidade de pagamento variam por setor.
- **Regras do jogo para reajustes:** disponibilidade de orçamento (empresa crescendo e lucrativa), fluxo de aprovação definido, janelas de revisão a cada 6–12 meses.
- **Protagonismo do colaborador (WIIFM):** o colaborador é protagonista da própria carreira. Os **resultados** pertencem à empresa; o **crescimento** (habilidades, livros, processos) fica na "mochila" do colaborador para sempre — é sua riqueza portátil. Transparência nos **critérios** do plano, mesmo com salários individuais confidenciais.

## 6. Estrutura do plano (mapa mental)

Plano de Cargos e Salários →
1. Fundamentos e Objetivos · 2. Agenda de Liderança · 3. Protagonismo do Colaborador · 4. Estrutura e Ferramentas · 5. Definição de Salários · 6. Políticas e Gestão

---

# PDI — Plano de Desenvolvimento Individual (modelo para Analistas)

## Três pilares de competências
- **Hard skills:** Meta Ads, Google Ads (Search/Display/YouTube/PMax), TikTok Ads, GA4, GTM, Looker Studio, planilhas avançadas.
- **Soft skills:** perfil analítico, resiliência, organização, comunicação clara (traduzir métricas para a linguagem do cliente).
- **Business skills:** funil de vendas, CRO, CAC, LTV, margem, estratégias além do clique.

## Estrutura do PDI
1. **Diagnóstico e objetivos** (construído na 1:1): objetivo de curto prazo (3–6 meses), longo prazo (1–2 anos), pontos fortes, pontos de melhoria.
2. **Plano de ação:** 2 a 4 metas claras (mais que isso tira o foco), com **regra 70/20/10** (70% prática, 20% troca/mentoria, 10% cursos). Cada meta: competência → ação específica → prazo → como medir.
3. **Rituais de acompanhamento:** check-ins mensais de 30–45 min exclusivos para o PDI (não misturar com pauta operacional); apoio explícito da empresa (cursos, tempo de estudo, ferramentas); ciclo de renovação a cada 3–6 meses.

> O maior erro é fazer o PDI e engavetá-lo.

## Expectativas por senioridade

| Nível | Foco | KPI | Autonomia |
| --- | --- | --- | --- |
| **Júnior** | Execução e setup | CTR, CPC, CPL | Baixa (revisão constante) |
| **Pleno** | Otimização e estratégia | ROAS, CPA, CAC | Média (alinhamento quinzenal) |
| **Sênior** | Visão de negócio e escala | LTV, margem, retenção | Alta (validação de alto nível) |

- **Júnior:** certificações oficiais, shadowing de setups complexos, diário de bordo de otimizações, análises semanais curtas com hipóteses.
- **Pleno:** assumir apresentações mensais de resultados, dashboards automatizados multicanal, auditorias de CRO/LP, copywriting.
- **Sênior:** mentoria de juniores, planejamento de key accounts, dados avançados (BigQuery/SQL/API), playbooks de processos internos.

## Matriz 9-Box (fotografia do presente; o PDI é o futuro)

- **Eixo X — Desempenho** (últimos 3–6 meses, relativo ao nível): abaixo / esperado / acima.
- **Eixo Y — Potencial** (capacidade de absorver desafios, inteligência emocional, visão de negócio): baixo / médio / alto.

Quadrantes-chave: **Estrela** (promover/reter com urgência), **Forte Desempenho** (PDI de liderança), **Enigma** (alto potencial, resultado ruim — investigar causa), **Mantenedor/Core** (coração da operação), **Alto Impacto** (PDI de comunicação), **Questionável** (PDI de recuperação com metas rígidas), **Risco** (geralmente desligamento), **Eficaz** (contas estáveis), **Especialista Técnico** (aprofundamento técnico, não gestão).

**Processo:** (1) avaliação silenciosa baseada em dados, (2) calibração entre líderes, (3) 1:1 usando a classificação para direcionar o PDI — **sem** mostrar os rótulos da matriz ao colaborador.

## Caso especial: o Especialista Técnico (alto desempenho, baixo potencial de gestão)

- Não promover o melhor técnico a coordenador por default — risco de perder um ótimo executor e ganhar um péssimo gestor.
- Oferecer **carreira em Y**: crescer como especialista sem virar chefe. O feedback deve ser de **validação e alívio**.
- PDI focado em automação, dados avançados e documentação de processos (POPs, playbooks) — não em oratória ou liderança de reuniões.
- Engajamento: desafios intelectuais (as contas "quebra-cabeça"), voz na escolha de ferramentas, cursos técnicos de alto nível.

---

# Checklist de implementação imediata (call to action do manual)

1. **Auditar as RCFs:** todo liderado com missão e indicadores documentados, alinhados à jornada do cliente.
2. **Formalizar a agenda de 1:1s:** 30 min bloqueados por liderado — os compromissos mais importantes da semana.
3. **Revisar as regras de meritocracia:** ser capaz de explicar os critérios de crescimento ao time; lembrar que a "mochila" de habilidades é riqueza portátil do colaborador.

---

# Rotina do setor (POP da Agência Foco) — o que priorizar no PDI

O POP revela que o analista da Foco atua além do gerenciador de anúncios — quase como Growth/CS:

1. **Engenharia de prompt e domínio de IA** — etapa obrigatória do processo: projetos iniciais no GPT, insights mensais do FocoX gerados via Claude. O analista deve **conferir, pontuar e contribuir criticamente** com os textos da IA antes do envio ao cliente (nunca "copia e cola").
2. **Copywriting e noções de web design (Great Pages)** — ajuste de bio do Instagram com copy e CTA; criação de Landing Pages (básico = layout padrão; avançado = LP totalmente personalizada com wireframes e foco em conversão); descrições do Google Meu Negócio.
3. **Agilidade analítica ("aquecimento")** — campanhas de aquecimento imediatamente após validação dos acessos; curadoria rápida de 3–10 conteúdos orgânicos com bom engajamento.
4. **Comunicação H2H via Zappy** — o analista se apresenta como responsável estratégico, solicita fotos trimestrais, aprova LPs, envia QR Code de avaliação; nível avançado participa da call mensal de resultados.
5. **Disciplina científica (NAMTAB e SULTS)** — registro semanal: o que foi testado / o que funcionou / o que foi observado / próximo passo; relatório completo de 90 dias no SULTS a cada trimestre.

## KPIs de execução do POP

- **Prazos/SLAs:** setup e aquecimento imediatos; planejamento em 3 dias úteis; insights FocoX até o dia 5; relatório de 90 dias no SULTS em dia.
- **Documentação/processos:** taxa de preenchimento semanal do NAMTAB (4 pontos obrigatórios); qualidade da revisão humana sobre a IA; adesão à atualização trimestral do GMN.
- **Qualidade técnica:** frequência de verificação de campanhas por nível (básico 2×/semana, intermediário 3×/semana, avançado diária); nível de personalização da LP conforme o plano do cliente; profundidade da análise histórica (30 min no básico até auditoria de 2h no avançado).
- **Aplicação:** auditoria mensal por amostragem (2–3 contas por analista, checklist 0–10) → alimenta as 1:1s e a 9-Box.

## Cronograma de treinamentos — 90 dias (um tema central por mês)

- **Mês 1 — Imersão em Engenharia de Prompts e IA aplicada:** (S1) fundamentos do prompt e setup de projetos no GPT com briefing/identidade/restrições; (S2) domínio do Claude para relatórios FocoX com dados brutos da planilha; (S3) refinamento humano e senso crítico "anti-robô" — laboratório de erros com relatório 100% IA; (S4) IA no planejamento estratégico e copywriting (pesquisa de concorrentes, wireframes, gatilhos). Entregável do mês: **Biblioteca de Prompts da Foco** validada pelo time.
- **Mês 2 — Análise, estratégia e método científico:** método NAMTAB; auditoria e análise histórica; os 8 passos do planejamento estratégico; otimização de campanhas por nível.
- **Mês 3 — Expansão de negócio e retenção:** Google Meu Negócio/SEO local; novos criativos e roteiros; relatório de 90 dias no SULTS; reuniões de resultados e postura avançada.
- **Formato:** hands-on com contas reais; gravar sessões e anexar num módulo de onboarding (FocoX/Drive); sucesso medido pela qualidade do texto final, não só pela velocidade.

---

# Alinhamento com a metodologia Virttus (9 virtudes — Alexandre Havard)

Todo conteúdo de gestão inserido no app deve ser lido pela lente das virtudes:
**Magnanimidade e Humildade** (liderança) · **Prudência, Justiça, Coragem e Autocontrole** (cardeais) · **Fé, Esperança e Caridade** (teologais).

Tradução dos frameworks acima para a linguagem das virtudes:

| Conceito do material | Virtude(s) correspondente(s) |
| --- | --- |
| Resiliência sob pressão (bloqueios, quedas de ROAS) | **Coragem** (fortaleza para persistir) + **Esperança** (confiança no processo) |
| Organização, gestão de verba e prazos | **Prudência** (decidir bem com dados) + **Autocontrole** (disciplina nos rituais) |
| Comunicação clara/honesta com o cliente, inclusive más notícias | **Justiça** (verdade devida ao cliente) + **Coragem** |
| Senso crítico sobre a IA, diário de bordo, hipóteses | **Prudência** (discernir a realidade) + **Humildade** (registrar erros e aprender) |
| Mentoria, playbooks, elevar o time | **Caridade** (servir) + **Magnanimidade** (chamar os outros à grandeza) |
| Protagonismo de carreira / "mochila" (WIIFM) | **Magnanimidade** (objetivos grandes) + **Esperança** |
| Meritocracia, critérios transparentes, calibração | **Justiça** (dar a cada um o que lhe é devido) + **Humildade** do líder |
| Confiança nos combinados, missão da RCF | **Fé** (confiança dada e recebida; sentido do trabalho) |

**Ajustes metodológicos (onde o material diverge da base do app):**

1. **"Potencial baixo" na 9-Box não é destino.** Na metodologia das virtudes, virtude é **hábito treinável** — potencial cresce com prática deliberada. Usar a 9-Box como fotografia, nunca como rótulo fixo; o PDI existe justamente para mover a pessoa de caixa.
2. **Carreira em Y não isenta de caridade/serviço.** "Blindar o especialista da gestão" está correto quanto ao cargo, mas ninguém é blindado do serviço ao time: o especialista serve via documentação, auditoria e mentoria indireta — isso é caridade e magnanimidade em modo técnico.
3. **KPIs medem entregas; virtudes medem o caráter que sustenta as entregas.** Toda meta de PDI no Virttus deve carregar as duas dimensões: a competência (o quê) e a virtude exercitada (o como/por quê).
4. **Meritocracia sem magnanimidade vira frieza.** Resultados são o critério de promoção, mas o líder magnânimo comunica os critérios apontando para o crescimento da pessoa, não só para o filtro.`;

const PDI_SETOR_CONTENT = `# PDI — Agência Foco · Setor de Mídia / Gestão de Tráfego

> Plano de Desenvolvimento Individual do setor, alinhado à metodologia Virttus:
> cada competência desenvolvida exercita virtudes específicas
> (Magnanimidade, Humildade · Prudência, Justiça, Coragem, Autocontrole · Fé, Esperança, Caridade).
> O PDI desenvolve a **pessoa** através do trabalho — a competência é o meio, a virtude é o fim.

---

## 1. RCF do setor (o contrato que ancora o PDI)

**Missão da função:** transformar o investimento do cliente em crescimento real e mensurável,
com transparência sobre resultados e cuidado com cada real de verba — gerando valor na etapa
de atração/conversão da jornada do cliente.

**Pilares de competência:**

| Pilar | Conteúdo | Virtudes exercitadas |
| --- | --- | --- |
| **Hard skills** | Meta Ads, Google Ads (Search/Display/YouTube/PMax), TikTok Ads, GA4, GTM, Looker Studio, Great Pages, engenharia de prompt (GPT/Claude), planilhas | Prudência (decidir com dados), Autocontrole (rigor técnico) |
| **Soft skills** | Perfil analítico, resiliência, organização, comunicação clara com o cliente | Coragem, Esperança, Autocontrole, Justiça |
| **Business skills** | Funil de vendas, CRO, CAC/LTV/margem, estratégia além do clique | Prudência, Magnanimidade (pensar grande pelo cliente) |
| **Rotina POP** | NAMTAB semanal, SLAs (planejamento 3 dias, insights dia 5, relatório 90 dias no SULTS), Zappy H2H, revisão crítica de IA | Autocontrole (disciplina), Justiça (prazos são promessas), Humildade (documentar erros e acertos) |

---

## 2. Estrutura do PDI (construído na 1:1)

### Passo A — Diagnóstico e objetivos
- **Objetivo de curto prazo (3–6 meses)** — ex.: dominar PMax; assumir apresentações de resultado.
- **Objetivo de longo prazo (1–2 anos)** — ex.: Coordenador de Mídia (via Magnanimidade + Caridade) ou Especialista em Dados (via Prudência + Humildade).
- **Pontos fortes (o que manter)** e **pontos de melhoria (o que desenvolver)** — sempre nomear também a virtude por trás: "dificuldade de dar más notícias ao cliente" = Coragem + Justiça a desenvolver.
- **Radar de virtudes (Virttus):** usar o radar atual do liderado como segundo diagnóstico, ao lado do técnico.

### Passo B — Plano de ação
- **2 a 4 metas** (mais que isso tira o foco), regra **70/20/10** (70% prática, 20% mentoria/troca, 10% cursos).
- Toda meta carrega **competência + ação + prazo + medição + virtude exercitada**.

Exemplo de matriz preenchida:

| Competência | Ação específica | Prazo | Como medir | Virtude |
| --- | --- | --- | --- | --- |
| Técnica: GA4 | Certificação oficial do Google Analytics | 30 dias | Certificado apresentado | Autocontrole (constância no estudo) |
| Comportamento: comunicação | Conduzir parte de 3 reuniões de resultados | 60 dias | Feedback do coordenador pós-reunião | Coragem + Justiça (verdade ao cliente) |
| Técnica: tagueamento | Setup de Pixel/API de Conversões em 2 contas | 45 dias | Eventos disparando no GTM | Prudência (dados confiáveis) |
| Negócio: funil | Ler "Receita Previsível" e mapear funil de 1 cliente | 90 dias | Mapa de melhorias entregue | Magnanimidade (visão além do clique) |

### Passo C — Rituais de acompanhamento
- **Check-in mensal de PDI (30–45 min)** — exclusivo, nunca misturado com pauta de campanhas.
- **Apoio da agência declarado** — cursos pagos, tempo de estudo às sextas, ferramentas (Justiça: a empresa também cumpre sua parte do combinado).
- **Renovação a cada 3–6 meses** conforme senioridade.
- **1:1 quinzenal (30 min)** com o framework manter / mudar / começar, registrada no Virttus.

---

## 3. PDI por senioridade

| Nível | Foco | KPI de sucesso | Autonomia | Virtude-eixo do estágio |
| --- | --- | --- | --- | --- |
| **Júnior** | Execução e setup | CTR, CPC, CPL | Baixa (revisão constante) | **Humildade + Autocontrole** — aprender as regras do jogo, aceitar revisão, criar disciplina |
| **Pleno** | Otimização e estratégia | ROAS, CPA, CAC | Média (alinhamento quinzenal) | **Prudência + Coragem** — decidir com dados e assumir a frente com o cliente |
| **Sênior** | Visão de negócio e escala | LTV, margem, retenção | Alta (validação de alto nível) | **Magnanimidade + Caridade** — pensar o negócio do cliente e elevar o time |

### Júnior (operação) — ações de PDI
1. Certificações oficiais (Google Search/Display, Meta Blueprint) — *Autocontrole*.
2. Shadowing de Pleno/Sênior em setup complexo — *Humildade (aprender observando)*.
3. Diário de bordo diário de otimizações no NAMTAB — *Autocontrole + Humildade*.
4. Análises semanais curtas com hipótese do motivo — *Prudência (pensar antes de concluir)*.
5. Rotina POP: verificação 2×/semana, aquecimento imediato, bio do Instagram com copy/CTA.

### Pleno (estratégia e dados) — ações de PDI
1. Assumir apresentação mensal de resultados de 2 contas importantes — *Coragem + Justiça*.
2. Dashboard automatizado integrando 2+ fontes — *Prudência*.
3. Estudo de CRO + 1 auditoria de Landing Page por mês — *Magnanimidade (ir além do pedido)*.
4. Curso de copywriting/persuasão ética — *Justiça (persuadir sem manipular)*.
5. Rotina POP: verificação 3×/semana, LPs intermediárias personalizadas, condução do Zappy.

### Sênior (negócio e liderança) — ações de PDI
1. Mentoria direta de 1 Júnior com revisão semanal — *Caridade (o crescimento do outro é meta minha)*.
2. Planejamento estratégico das key accounts e lançamentos — *Magnanimidade + Prudência*.
3. Estudo de dados avançados (BigQuery/SQL/APIs) ou gestão financeira — *Prudência*.
4. Playbook "O jeito Foco de fazer tráfego" — *Caridade (conhecimento a serviço do time)*.
5. Rotina POP: verificação diária, auditoria histórica completa (2h), call mensal com cliente.

---

## 4. Avaliação do time hoje — 9-Box adaptada

- **Eixo X (Desempenho, 3–6 meses):** abaixo / esperado / acima — com base em dados (metas de CPA/ROAS, SLAs do POP, auditoria por amostragem), não afinidade.
- **Eixo Y (Potencial):** capacidade de absorver desafios, inteligência emocional, visão de negócio.

**Leitura Virttus do eixo Potencial:** potencial alto é, na prática, **virtude em ato** —
magnanimidade (protagonismo), coragem (puxar a crise), prudência (visão de funil).
⚠️ **Ajuste metodológico:** "potencial baixo" é fotografia, não destino. Virtudes são hábitos
treináveis; o PDI existe para mover a pessoa de caixa. Nunca tratar o rótulo como definitivo.

**Processo:** (1) avaliação silenciosa individual dos líderes → (2) calibração em conjunto →
(3) 1:1 de PDI usando a classificação como bússola, **sem expor os rótulos** ao colaborador.

**Caso Especialista Técnico (alto desempenho / baixo apetite por gestão):**
- Oferecer **carreira em Y** com feedback de validação e alívio — Humildade do líder e do liderado (autoconhecimento honesto sobre vocação).
- PDI focado em automação, dados avançados, POPs e auditoria/QA de contas dos mais novos.
- ⚠️ **Ajuste metodológico:** blindar da *burocracia* de gestão, sim; do *serviço ao time*, não. Documentar processos e auditar setups é Caridade e Magnanimidade em modo técnico.

---

## 5. KPIs de acompanhamento do PDI (via POP)

1. **SLAs:** aquecimento imediato · planejamento em 3 dias úteis · insights FocoX até dia 5 · relatório de 90 dias no SULTS — *Justiça: prazo é promessa*.
2. **Documentação:** NAMTAB semanal completo (testado / funcionou / observado / próximo passo) — *Humildade + Prudência*.
3. **Qualidade da revisão de IA:** o texto final tem leitura crítica e visão de negócio, não é colagem do Claude — *Prudência + Justiça com o cliente*.
4. **Qualidade técnica por nível:** frequência de verificação, personalização da LP, profundidade da análise histórica.
5. **Auditoria mensal por amostragem:** 2–3 contas por analista, checklist 0–10 → alimenta 1:1 e 9-Box.

---

## 6. Cronograma de treinamentos — 90 dias

**Mês 1 — Imersão em Engenharia de Prompts e IA aplicada** *(Prudência: a IA acelera, o analista discerne)*
- S1: Fundamentos do prompt + setup de projetos no GPT (briefing, identidade, restrições, tom de voz).
- S2: Claude para relatórios FocoX — alimentar com dados brutos da planilha operacional.
- S3: Refinamento humano e senso crítico "anti-robô" — laboratório de erros com relatório 100% IA.
- S4: IA no planejamento estratégico e copywriting (concorrentes, wireframes, gatilhos éticos).
- Entregável: **Biblioteca de Prompts da Foco** construída e validada pelo time.

**Mês 2 — Análise, estratégia e método científico** *(Autocontrole + Prudência)*
- S1: Método NAMTAB. · S2: Auditoria e análise histórica (30 min → 2h por nível). · S3: Os 8 passos do planejamento estratégico. · S4: Otimização de campanhas por nível.

**Mês 3 — Expansão de negócio e retenção** *(Coragem + Caridade: relação com o cliente)*
- S1: Google Meu Negócio / SEO local. · S2: Novos criativos e roteiros. · S3: Relatório de 90 dias no SULTS. · S4: Reuniões de resultados e postura avançada.

**Formato:** hands-on com contas reais; sessões gravadas viram módulo de onboarding; sucesso medido pela **qualidade** da entrega final, não pela velocidade.

---

## 7. Checklist de implantação (primeiras 2 semanas)

1. Cadastrar cada analista no Virttus com radar de virtudes inicial.
2. Documentar a RCF do setor (seção 1) e revisar com o time.
3. Bloquear as 1:1s quinzenais de 30 min + check-in mensal de PDI.
4. Rodar a 9-Box silenciosa + calibração entre líderes.
5. Construir o PDI individual (2–4 metas com virtude) na 1:1 de cada um.
6. Iniciar o Mês 1 do cronograma de treinamentos.`;

const CONTEXTO_SETOR_CONTENT = `# Contexto do setor — Mídia/Tráfego · Agência Foco

**Fontes:** mensal do setor com a gestão (07/05/2026) · 1:1 Ana × Meireles (08/05/2026)
Snapshot para orientar PDIs, 9-Box e prioridades — revisar a cada mensal.

## Fotografia operacional (mai/2026)

- **27 clientes ativos**, 4 em observação/saída (Mulher Express, Insect, ESV, Orb), **2 analistas** (Mavi e Vinicius).
- **3 squads:** Saúde Odonto (12) · Varejo e Delivery (5) · Educação e Lifestyle (7, foco em recorrência).
- **Metas do ciclo:** padronizar relatórios (acrônimo FOCA) · **reduzir 10% do CPL** do squad Saúde Odonto · **lançar o FOCEX** (automatiza ~100% dos relatórios manuais) · manual de rotinas do FOCEX para os analistas.
- **Gargalos:** qualidade de materiais terceirizados (principal desafio; designer sendo contratado) · comunicação cliente → analista gera retrabalho · otimização "no escuro" por falta de retorno do cliente na planilha · monitoramento diário atrasou otimizações que custaram verba de cliente · dilema do uso de IA em criativos (feedback negativo de alguns clientes).
- **Roadmap:** dash de todas as contas pós-FOCEX (MVP desenhado) · expansão prevista de 20–30 novos clientes com o time atual · projetos EUA/Rilma e parceria Ivan (clientes de alto valor, R$10k–100k/mês) no 2º semestre.

## Direcionamentos da gestão (Meireles) — princípios a aplicar

1. **Liderança é cobrar de adultos o que foi combinado.** Quem cumpre o combinado revela potencial. Primeiro comportamento crítico do time: **cumprir o combinado** (check no SULTS, disponibilidade).
2. **Alta performance = média mensal ≥ 100% do combinado**, não 150% todo dia. O time não é máquina; comunicar isso.
3. **Banco de reserva** sempre ativo (currículos + desenvolvimento interno, ex.: curso de tráfego dado pelo próprio time) para mitigar risco de saída.
4. **Três pilares contra a passividade:** banco de reserva · treinamento constante (incluindo comportamental) · automação.
5. **Alinhamento constante e informal** — formalidade cria blindagem; conversas aleatórias trazem humanidade. Repetir a mensagem de crescimento variando o argumento.
6. **Estender a mão, não empurrar:** perguntar a cada liderado se e para onde quer crescer (feito com Vinicius; fazer com Mavi).
7. **Backoffice forte** é a prioridade estratégica: qualidade e prazo das entregas independem do que acontecer.

## Desenvolvimento da própria liderança (Ana)

- **Sair da operação:** identificado excesso de operação e pouco exercício do papel de líder — em correção (weeklies seg/sex, rituais de alinhamento). Risco apontado: gestores presos na operação → estafa.
- **"Feedback é igual café: serve quente"** — corrigido o hábito de acumular questões para dar feedback depois.
- **Pendentes:** treinamento de liderança (Meireles vai agendar) · conversas transparentes de objetivos com Mavi e Vinicius · levar métricas do SULTS e datas formalizadas de treinamentos/lançamentos para a próxima mensal · fomentar colaboração entre pares (Marquinhos, Taína, Bia) em vez de resolver tudo sozinha.

## Leitura Virttus

- O tema-síntese do setor é **Justiça + Fé**: cumprir combinados e construir confiabilidade (SLAs, presença, registro) — é o critério explícito da gestão para reconhecer potencial.
- A trilha de crescimento da própria liderança é **Magnanimidade** (sair da operação para o estratégico) + **Caridade** (desenvolver o time em vez de fazer por ele).
- Cuidado de justiça com o time: os rótulos e avaliações da gestão sobre pessoas específicas são insumo de calibração privada — nunca comunicar rótulos, sempre comportamentos observáveis.`;

const FORMULARIO_CONTENT = `# Formulário de preparação para 1:1 (baseline de virtudes)

> Objetivo: antes de cada ciclo de 1:1/PDI, colher um retrato sincero de onde o liderado está
> hoje, para definir o ponto de partida do desenvolvimento. **O risco de qualquer formulário
> assim é o viés de desejabilidade social:** se a pergunta deixa óbvio qual é a resposta "certa"
> (ex.: "eu analiso os dados antes de agir por impulso?"), quase todo mundo marca a opção boa,
> mesmo sem perceber que está inflando a própria resposta — não é má-fé, é natural.
>
> Por isso este formulário **não nomeia as virtudes** para quem responde, **não afirma o
> comportamento desejável na pergunta**, e prioriza três formatos mais difíceis de "acertar":
> 1. **Escolha forçada** entre duas reações plausíveis — nenhuma é sinalizada como a certa.
> 2. **Frequência de algo específico e recente** ("nas últimas 2 semanas, quantas vezes...") em vez de traço de caráter geral ("eu sempre...").
> 3. **Relato de um episódio concreto antes de qualquer autoavaliação** — pedir o fato primeiro ancora a resposta na realidade, não na autoimagem.
>
> **Como aplicar:** enviar 2–3 dias antes da 1:1/PDI. Resposta individual, sem nome de virtude
> visível (os títulos de bloco abaixo são só para você organizar — no formulário real, use
> apenas os números dos blocos: "Parte 1", "Parte 2"...). Nunca compartilhar respostas entre
> liderados.

---

## Texto de abertura do formulário

> Esse formulário não tem resposta certa. Não é sobre marcar a opção "boa" — é sobre a situação
> que mais parece com o que você realmente faria ou fez. Pode ser sincero(a) mesmo que a resposta
> não seja bonita: isso não vai ser usado contra você, é só pra eu entender por onde começar a te
> ajudar. Quanto mais real, melhor eu consigo apoiar.

---

## Parte 1

**1.1 (escolha forçada)** Uma campanha que você administra está com resultado ruim há 2 dias e o cliente já perguntou o que está havendo. Qual das duas reações abaixo está mais perto do que você realmente faria?
- (a) Eu já mexo em alguma coisa (pauso, troco criativo, realoco verba) para mostrar movimento rápido ao cliente, e vou ajustando conforme o resultado aparece.
- (b) Eu seguro a resposta ao cliente por mais um pouco enquanto reviso os números com calma, mesmo sabendo que ele está esperando.

**1.2 (frequência)** Nas últimas 2 semanas, quantas vezes você tomou uma decisão numa campanha (pausar, escalar, trocar criativo) **sem antes olhar** os números do dia?
- ( ) Nenhuma vez · ( ) 1–2 vezes · ( ) 3–5 vezes · ( ) Mais de 5 vezes · ( ) Não sei dizer

**1.3 (relato primeiro)** Descreva a última decisão que você tomou numa campanha só com base no seu instinto/experiência, sem checar os dados antes. O que aconteceu depois?

**1.4 (escolha forçada)** Você percebe que uma tarefa vai atrasar. O prazo é hoje à tarde. O que você mais provavelmente faz primeiro?
- (a) Aviso quem está esperando, mesmo sem ter ainda uma solução pronta.
- (b) Tento resolver sozinho(a) até o último momento possível antes de avisar alguém.

---

## Parte 2

**2.1 (relato primeiro)** Conte a última vez que você errou algo numa campanha ou entrega (não precisa ser grave). O que você fez logo depois de perceber o erro?

**2.2 (escolha forçada)** Um cliente, numa reunião, questiona um resultado ruim e você sabe que parte do problema foi uma configuração que você fez errado. O que você tende a fazer?
- (a) Explico o que houve tecnicamente, sem necessariamente apontar de quem foi a falha.
- (b) Assumo diretamente que o erro foi meu, ali na hora, mesmo com o cliente presente.
- (c) Explico o contexto (prazo apertado, mudança de escopo, etc.) que levou ao erro.

**2.3 (frequência)** Nas últimas semanas, quantas vezes você pediu ajuda pra alguém (colega ou liderança) numa tarefa que estava difícil, **antes** de estar realmente travado(a)?
- ( ) Nenhuma vez · ( ) 1 vez · ( ) 2–3 vezes · ( ) Mais de 3 vezes

**2.4 (relato primeiro)** Qual foi o último feedback de melhoria (não elogio) que você recebeu de alguém aqui? O que você respondeu ou pensou na hora?

---

## Parte 3

**3.1 (escolha forçada)** Você precisa de algo da equipe de criação e sabe que, se cobrar diretamente, pode gerar um clima chato. O que você mais provavelmente faz?
- (a) Cobro diretamente a pessoa, aceitando o desconforto momentâneo.
- (b) Peço para outra pessoa (ex.: a liderança) intermediar ou cobrar por mim.
- (c) Deixo pra depois e sigo com o que já tenho, tentando não gerar atrito.

**3.2 (frequência)** Nas últimas 2 semanas, quantas vezes surgiu uma situação em que você **evitou** dizer algo (pra cliente, colega ou liderança) por medo da reação da pessoa?
- ( ) Nenhuma · ( ) 1 vez · ( ) 2–3 vezes · ( ) Mais de 3 vezes

**3.3 (relato primeiro)** Descreva uma situação recente em que você teve vontade de falar algo (discordar, apontar um problema, propor algo diferente) e não falou. O que te segurou?

---

## Parte 4

**4.1 (frequência)** Nas últimas 2 semanas, em quantos dias você deixou de registrar alguma tarefa/otimização no sistema (NAMTAB/SULTS) no mesmo dia em que ela aconteceu?
- ( ) Nenhum dia · ( ) 1–2 dias · ( ) 3–5 dias · ( ) Mais de 5 dias

**4.2 (escolha forçada)** No meio de um dia corrido, seu celular notifica algo pessoal (mensagem, rede social). O que costuma acontecer?
- (a) Eu olho na hora e volto ao trabalho rapidinho.
- (b) Eu seguro a curiosidade e só olho num intervalo/pausa.
- (c) Depende muito do dia — às vezes olho na hora, às vezes esqueço completamente do celular.

**4.3 (relato primeiro)** Qual foi o momento da última semana em que você sentiu que perdeu mais tempo ou constância do que gostaria? O que causou isso?

---

## Parte 5

**5.1 (escolha forçada)** Pensando no seu crescimento aqui na Foco, qual frase está mais perto do que você sente hoje?
- (a) Eu confio que, se eu entregar bem, a agência vai reconhecer e me dar oportunidade — só é questão de tempo.
- (b) Eu não tenho tanta certeza de que meu esforço vai ser reconhecido do jeito que eu espero.
- (c) Eu ainda não parei pra pensar nisso com clareza.

**5.2 (aberta)** O que faria você confiar mais (ou menos) no processo de crescimento aqui?

---

## Parte 6

**6.1 (escolha forçada)** Uma conta que você atende está indo mal há um tempo, apesar dos ajustes que você já tentou. O que mais se parece com o que você pensa?
- (a) Ainda dá pra reverter, só precisa achar o ajuste certo.
- (b) Talvez essa conta só não vá performar bem, independente do que eu faça.
- (c) Varia — em algumas contas eu acredito que dá, em outras eu já meio que desisto por dentro.

**6.2 (aberta)** Onde você se imagina daqui a 1–2 anos na sua carreira? O que te anima mais nisso, e o que te dá mais insegurança?

---

## Parte 7

**7.1 (relato primeiro)** Conte a última vez que você ajudou um colega (inclusive alguém mais júnior) com algo que não era exatamente sua tarefa. Se não lembrar de nenhuma, tudo bem — pode dizer isso também.

**7.2 (escolha forçada)** Você tem uma tarefa própria com prazo apertado e um colega pede ajuda numa coisa dele. O que você mais provavelmente faz?
- (a) Ajudo mesmo assim, e me viro depois com o meu prazo.
- (b) Explico que não posso agora e indico outra pessoa ou horário.
- (c) Ajudo rapidamente algo pequeno, mas não me disponibilizo para mais que isso.

---

## Fechamento (igual para todos, sem forçar escolha)

- (aberta) O que está funcionando bem pra você no seu trabalho hoje?
- (aberta) O que mais tem te incomodado ou pesado ultimamente, mesmo que pareça pequeno?
- (aberta) Tem alguma coisa que você gostaria que eu soubesse antes da nossa conversa?

---

## Chave de leitura para a liderança (não enviar ao liderado)

| Parte | Virtude | O que observar |
| --- | --- | --- |
| 1 | Prudência | 1.1(b), 1.2 baixa frequência e 1.3 com aprendizado explícito = decide com dados. 1.1(a) e 1.4(b) recorrentes = tende a agir por impulso/pressão, mesmo que o discurso da pessoa diga o contrário. |
| 2 | Humildade | 2.2(b) e 2.1 com responsabilização direta = humildade em ato. 2.2(a)/(c) e 2.1 com justificativa/terceirização da culpa = ponto a desenvolver — **não é pecado, é o diagnóstico que você quer** para calibrar o PDI. |
| 3 | Coragem | 3.1(a) e baixa frequência em 3.2 = confronta o desconforto. 3.1(b)/(c) recorrentes = evita o atrito, ainda que a pessoa se ache corajosa. |
| 4 | Autocontrole | Frequências altas em 4.1 e 4.2(a)/(c) = dispersão/baixa disciplina real, independente da autoimagem. |
| 5 | Fé | 5.1(b)/(c) revela insegurança sobre o combinado — vale investigar na 1:1 antes de cobrar mais entrega. |
| 6 | Esperança | 6.1(b)/(c) recorrente indica desânimo específico com contas — cruzar com dados reais da conta antes de concluir. |
| 7 | Caridade | 7.1 sem exemplo e 7.2(b)/(c) recorrente = ajuda condicionada; 7.1 com exemplo espontâneo e 7.2(a) = serviço real. |

**Como usar:**
1. **Ignore a "nota" e olhe o padrão.** Este formulário não gera uma pontuação limpa de 1 a 5 — gera pistas comportamentais. O valor está em cruzar a escolha forçada + a frequência + o relato concreto da mesma parte: quando os três apontam na mesma direção, você tem um baseline confiável.
2. **Divergência com o que você observa é o material da 1:1, não motivo para descartar a resposta.** Se a Mavi escolhe 1.1(b) mas você já viu o oposto na prática, é exatamente isso que vira pauta — com fatos, não com acusação.
3. **Não devolva a chave de leitura para o liderado.** O valor do formulário desaparece se ele souber o que cada escolha "revela" da próxima vez.
4. **Repita a cada ciclo de PDI** com os mesmos itens — a comparação ao longo do tempo é mais valiosa que qualquer resposta isolada.
5. **Nunca puna uma resposta sincera.** Se uma resposta franca gerar cobrança dura na 1:1 seguinte, as próximas respostas do time inteiro passam a ser as "corretas" — e você perde a ferramenta.`;

export async function seedDefaultNotes(): Promise<ActionResult> {
  const { org, userId } = await getContext();

  const existing = await db.note.count({ where: { organizationId: org.id } });
  if (existing > 0) {
    return { ok: false, error: "Já existem notas cadastradas nesta organização." };
  }

  await db.note.createMany({
    data: [
      {
        organizationId: org.id,
        authorId: userId,
        category: "BASE_CONHECIMENTO" as const,
        title: "Base de conhecimento — Liderança e gestão de time",
        content: BASE_CONHECIMENTO_CONTENT,
      },
      {
        organizationId: org.id,
        authorId: userId,
        category: "PDI_SETOR" as const,
        title: "PDI — Agência Foco · Setor de Mídia / Gestão de Tráfego",
        content: PDI_SETOR_CONTENT,
      },
      {
        organizationId: org.id,
        authorId: userId,
        category: "CONTEXTO_SETOR" as const,
        title: "Contexto do setor — Mídia/Tráfego · Agência Foco",
        content: CONTEXTO_SETOR_CONTENT,
      },
      {
        organizationId: org.id,
        authorId: userId,
        category: "FORMULARIO" as const,
        title: "Formulário de preparação para 1:1 (baseline de virtudes)",
        content: FORMULARIO_CONTENT,
      },
    ],
  });
  await writeAuditLog({
    organizationId: org.id,
    actorId: userId,
    action: "note.seedDefault",
    entity: "Note",
    metadata: { count: 4 },
  });

  revalidatePath("/biblioteca");
  return { ok: true };
}
