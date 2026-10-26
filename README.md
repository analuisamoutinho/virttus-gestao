# Virttus

SaaS B2B de desenvolvimento de liderados baseado nas 9 virtudes cardeais do framework de Alexandre Havard.

## Stack
Next.js 14 (App Router) · TypeScript · TailwindCSS · Prisma · PostgreSQL · Auth.js (Google OAuth) · Stripe (Fase 4) · Vitest + Playwright.

## Setup

```bash
cd virttus
npm install
cp .env.example .env        # preencha DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_*
npx prisma generate
npx prisma db push          # cria o schema no Postgres
npm run db:seed             # dados de demonstração (org Acme + 3 liderados)
npm run dev
```

## Scripts
- `npm run dev` — servidor de desenvolvimento
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — testes unitários (Vitest)
- `npm run test:e2e` — Playwright (fluxos críticos)
- `npm run db:studio` — Prisma Studio

## Deploy
- Vercel, com deploy automático a cada push no `main` (integração Git).
- `npm run build` roda `prisma generate && prisma db push --skip-generate && next build`:
  todo deploy aplica sozinho mudanças aditivas do schema (novas tabelas/campos) no banco
  de produção. Mudanças que causariam perda de dados **derrubam o build** (sem
  `--accept-data-loss`) em vez de aplicar silenciosamente — nesse caso, rode
  `npx prisma migrate dev` localmente para gerar uma migração revisável antes de fazer merge.

## Arquitetura (Fase 1)
- **Multi-tenant:** toda tabela de negócio carrega `organizationId`; `getContext()` (`src/server/context.ts`) resolve sessão + org por request e é o guard central do grupo `(app)`.
- **Gating de plano central:** `src/server/plan/gate.ts` + `limits.ts`. As telas nunca replicam limites — apenas reagem ao `PlanLimitError`.
- **9 virtudes:** catálogo único em `src/lib/virtues.ts`, consumido pelo radar SVG (`VirtueRadar`).
- **LGPD:** log de auditoria em `src/server/audit.ts` para ações de admin/RH.

## Estrutura
```
src/
  app/(marketing)      # home / LP
  app/(auth)           # login, onboarding
  app/(app)            # área logada (sidebar): dashboard, equipe, 1:1s...
  app/api/auth         # Auth.js
  server/              # db, auth, context, plan (gating), services, actions
  components/          # ui, layout (Sidebar), charts (VirtueRadar)
  lib/                 # virtues, slug, validations (Zod)
prisma/                # schema.prisma, seed.ts
tests/unit             # Vitest — score de virtude, alertas, gating
```

## Módulos adicionais
| Rota | O que faz |
|---|---|
| `/calls` | Calendário mensal de calls (mostra também treinamentos e 1:1s). Cada call recebe a **transcrição** (colar ou importar `.txt/.vtt/.srt`), com busca em todas as transcrições e destaques de decisões/próximos passos. |
| `/treino-feedback` | Simulador de **feedback difícil**: 5 cenários fictícios × 3 dificuldades, chat com a persona, "clima" da conversa em tempo real e avaliação final (SBI, escuta, respeito, encaminhamento). Funciona sem IA (regras); com `ANTHROPIC_API_KEY` a persona e o coach usam o Claude. |
| `/talentos` | **Banco de talentos** com *lead scoring* da vaga: fit 0–100 por candidato (requisitos 35, diferenciais 10, experiência 15, virtudes 20, entrevista 15, pretensão 5), com explicação por critério. |
| `/feedback-gestor` · `/anonimo/[token]` | **Feedback anônimo ao gestor**: link público por gestor (sem login), 6 notas + continue/comece/pare. Sem autor, IP ou horário (só a semana); resultados só a partir de 3 respostas. |
| `/central` | **Central de desenvolvimento**: mural de livros, podcasts, vídeos, cursos e artigos, com filtro, busca e fixação. |
| `/admin` | **Acesso de administrador** (role `ADMIN`): visão consolidada de todos os gestores/times, feedback anônimo de cada gestor, papéis dos usuários e auditoria. |

Variáveis opcionais: `ANTHROPIC_API_KEY` e `ANTHROPIC_MODEL` (padrão `claude-sonnet-5-5`) para o treino de feedback.

## Roadmap
- **Fase 1 ✅** Auth, multi-tenancy, cadastro de equipe, dashboard básico.
- **Fase 2** 1:1s, Feedback SBI, Perfil pessoal.
- **Fase 3** Metas/OKRs, PDI, Equipe completa (abas).
- **Fase 4** Construtor de conversa, billing Stripe + gating de planos.
- **Fase 5** Painel de RH, benchmarks, relatórios, exportações.
