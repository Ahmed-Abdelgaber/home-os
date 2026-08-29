# Initial Codex Prompt

You are working on **HomeOS**, a household operations application.

The repository contains an `AGENTS.md` and a `docs/` directory that define the product, domain rules, existing Supabase backend, frontend architecture, navigation, UI/UX, Home screen, roadmap, and acceptance criteria.

## First: read before touching code

Read in this order:

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

Do not make product or architecture decisions that contradict these files.

The Supabase backend already exists. Do not recreate or modify its schema in this task.

## Your task for this first iteration

Bootstrap the frontend foundation only.

Create a production-quality project using:

- Vite
- React
- TypeScript
- Ionic React
- Ionic routing
- Capacitor installed/configured as a future native escape hatch
- Supabase JS client
- TanStack Query
- React Hook Form
- Zod
- vite-plugin-pwa / Workbox

Prepare it for Cloudflare Pages, but do not deploy.

### Required foundation

1. Create the project structure described in `docs/03_FRONTEND_ARCHITECTURE.md` where practical.
2. Configure TypeScript cleanly.
3. Configure Ionic React and routing.
4. Create the authenticated app-shell routing structure with placeholder routes for:
   - Login
   - Home
   - Items
   - Expenses
   - More
5. Add the centered Global Add action placeholder in the shell structure, but do not implement its business actions yet.
6. Create Supabase client infrastructure using environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
7. Add `.env.example`. Never put a service-role key in the frontend.
8. Configure TanStack Query provider.
9. Create the initial HomeOS theme tokens from `docs/05_UI_UX_DESIGN_SYSTEM.md`.
10. Add a minimal Ionic override layer so the app is ready to look like HomeOS rather than default Ionic.
11. Configure PWA basics:
    - manifest,
    - standalone display,
    - theme/background colors,
    - service worker through vite-plugin-pwa,
    - placeholder app icons if real assets do not exist yet.
12. Ensure the app handles mobile safe areas at the shell level.
13. Add basic lint/build scripts if the scaffold does not already provide suitable ones.
14. Run the build and any relevant checks.

## Important scope limits

For this first iteration, DO NOT:

- implement the full Home screen,
- connect real Home queries,
- modify Supabase tables/functions/RLS,
- build Product/Item/Expense business flows,
- add Redux,
- implement IndexedDB persistence,
- implement offline mutation queues,
- redesign navigation,
- introduce salary/budget/savings concepts,
- replace the chosen stack.

Static placeholder pages are enough.

The goal is a clean, stable foundation that the next task can build the Home screen on.

## Working style

Before writing code, briefly state:
- what you understood,
- the file/folder plan,
- any genuine blocker.

Then implement.

Do not ask questions whose answers are already in the docs.

If you discover a real contradiction, stop and explain it rather than guessing.

## Completion report

When finished, report:

1. files created/changed,
2. dependencies added,
3. commands run,
4. build/test result,
5. how to create the local `.env`,
6. any remaining blocker,
7. the recommended next task.

Do not begin the next feature automatically.
