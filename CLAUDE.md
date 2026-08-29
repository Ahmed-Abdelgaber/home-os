# AGENTS.md — HomeOS Engineering Instructions

These instructions apply to every agent working in this repository.

## 1. Read before coding

Before making architectural or behavioral changes, read:

- `docs/00_PRODUCT_BRIEF.md`
- `docs/01_DOMAIN_AND_BUSINESS_RULES.md`
- `docs/02_BACKEND_CONTRACT.md`
- `docs/03_FRONTEND_ARCHITECTURE.md`
- `docs/04_INFORMATION_ARCHITECTURE.md`
- `docs/05_UI_UX_DESIGN_SYSTEM.md`
- the relevant screen specification

Do not infer business rules from UI code when a documented rule exists.

## 2. Do not make autonomous product decisions

HomeOS already has deliberate domain and UX decisions.

Do not:
- rename domain concepts,
- add new statuses,
- change lifecycle semantics,
- change navigation,
- change database relationships,
- change deletion rules,
- add finance/budget concepts,
- introduce new frameworks,
- replace libraries,
- redesign screens,
- modify the Supabase schema,
without explicit approval.

If a missing decision materially affects correctness, stop and ask.

Prefer a focused question over inventing a rule.

## 3. Preserve working code

The owner is a solo engineer and will review changes directly.

Before editing:
- inspect the relevant files,
- understand existing behavior,
- make the smallest coherent change,
- avoid broad refactors unrelated to the task.

Never rewrite a working area merely because another pattern is cleaner.

Do not silently delete code, data migrations, tests, or configuration.

## 4. Backend is a contract

Supabase is the current system of record.

The existing backend includes:
- PostgreSQL schema,
- RLS,
- Auth mappings,
- database constraints,
- triggers,
- RPC functions,
- usage metrics view.

Use those contracts from the frontend.

Do not duplicate important database business rules in client code as the only source of truth.

Client validation is welcome for UX, but backend rules remain authoritative.

## 5. HomeOS is not a finance app

HomeOS is a **household operations system**.

Money is an operational signal.

Do not introduce:
- salary tracking,
- income,
- savings,
- net worth,
- budget remaining,
- finance-first dashboards.

The front-line object is the **Item**, especially Active Items.

## 6. UI consistency is mandatory

`docs/05_UI_UX_DESIGN_SYSTEM.md` is the visual source of truth.

Always use /frontend-design plugin.

All screens must share:
- color tokens,
- typography,
- spacing,
- radii,
- app shell,
- navigation behavior,
- component language,
- interaction patterns.

Do not accept default Ionic styling when it conflicts with HomeOS identity.

Use Ionic primarily for strong mobile primitives and navigation behavior.
Build HomeOS visual components with custom React/CSS styling.

## 7. Implementation style

Preferred:
- TypeScript strictness
- small typed components
- CSS variables for global design tokens
- CSS Modules or tightly scoped component styles
- TanStack Query for server state
- React Hook Form + Zod for forms
- Supabase client in a dedicated infrastructure module
- feature-oriented folder structure
- reusable components only where there is real repetition

Avoid:
- Redux unless a proven need appears
- global mutable state
- premature abstraction
- giant generic component frameworks
- excessive custom hooks that hide simple behavior
- local-first synchronization complexity in v1

## 8. PWA/mobile constraints

Primary runtime is an installed iPhone PWA.

Design for:
- roughly 390–430px width first,
- safe-area insets,
- standalone mode,
- touch targets >= 44px,
- no hover-dependent interactions,
- proper back affordances,
- fast perceived response.

Local storage/IndexedDB is a cache only, never source of truth.

Do not implement complex offline mutation queues unless explicitly requested.

## 9. Change reporting

At the end of every meaningful task, report:

1. what changed,
2. files changed,
3. commands run,
4. tests/build checks performed,
5. known limitations or unresolved questions.

If a requested change conflicts with the docs, call out the conflict before implementing it.

## 10. Definition of done

A task is not done just because the code compiles.

It should:
- preserve domain rules,
- match the specified UX,
- work on the target mobile viewport,
- handle loading/error/empty states,
- respect auth/RLS,
- avoid regressions,
- pass relevant checks.
