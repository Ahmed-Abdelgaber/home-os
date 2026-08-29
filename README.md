# HomeOS — Codex Project Pack

This pack is the source-of-truth documentation for implementing HomeOS.

## Read order

1. `AGENTS.md`
2. `docs/00_PRODUCT_BRIEF.md`
3. `docs/01_DOMAIN_AND_BUSINESS_RULES.md`
4. `docs/02_BACKEND_CONTRACT.md`
5. `docs/03_FRONTEND_ARCHITECTURE.md`
6. `docs/04_INFORMATION_ARCHITECTURE.md`
7. `docs/05_UI_UX_DESIGN_SYSTEM.md`
8. `docs/06_HOME_SCREEN_SPEC.md`
9. `docs/07_IMPLEMENTATION_ROADMAP.md`
10. `docs/08_TEST_AND_ACCEPTANCE.md`
11. `docs/09_DECISION_LOG.md`
12. `docs/10_MIGRATION_REFERENCE.md`

The initial instruction for Codex is in `INITIAL_CODEX_PROMPT.md`.

## Current target stack

- Vite
- React
- TypeScript
- Ionic React
- Capacitor installed as the native escape hatch
- Supabase (existing project; backend already created)
- TanStack Query
- React Hook Form + Zod
- `vite-plugin-pwa` / Workbox
- Cloudflare Pages
- Email + password authentication

## Important

The Supabase backend already exists. Do **not** casually redesign or recreate it from frontend code.
Business rules in the database are intentional and must be treated as part of the application contract.
