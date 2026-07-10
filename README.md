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

## Roadmap
- **Fase 1 ✅** Auth, multi-tenancy, cadastro de equipe, dashboard básico.
- **Fase 2** 1:1s, Feedback SBI, Perfil pessoal.
- **Fase 3** Metas/OKRs, PDI, Equipe completa (abas).
- **Fase 4** Construtor de conversa, billing Stripe + gating de planos.
- **Fase 5** Painel de RH, benchmarks, relatórios, exportações.
