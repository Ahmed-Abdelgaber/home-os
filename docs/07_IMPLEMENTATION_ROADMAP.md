# HomeOS Implementation Roadmap

This roadmap starts from the current state: Supabase backend already exists.

## Phase 0 — repository foundation

Create:
- Vite React TypeScript project,
- Ionic React,
- Ionic router,
- Capacitor config,
- PWA plugin,
- lint/format/build baseline,
- `.env.example`,
- Supabase client,
- TanStack Query provider,
- theme tokens.

Result:
- project builds,
- mobile shell launches,
- no feature logic yet.

## Phase 1 — backend smoke validation

Before building many screens, verify from browser client:

1. unauthenticated user cannot read protected HomeOS data,
2. Ahmed can log in,
3. Esraa can log in,
4. session survives reload,
5. authenticated reads work,
6. `purchase_product` succeeds,
7. `start_item` succeeds,
8. `finish_item` succeeds,
9. usage metrics read correctly.

Do not use production data destructively for tests if avoidable.

## Phase 2 — visual app shell

Implement:
- Login shell,
- authenticated tab shell,
- Home/Items/Expenses/More tabs,
- global Add button,
- Quick Add sheet,
- HomeOS theme.

Use static content initially.

## Phase 3 — Home visual implementation

Implement `docs/06_HOME_SCREEN_SPEC.md` visually with placeholder data.

Get mobile design correct before data binding.

## Phase 4 — Home data binding

Connect:
- current-month spend,
- previous-month comparison,
- current/upcoming Trip,
- long-running Items,
- long-stocked Items,
- initial recent activity.

Add loading/error/empty states.

## Phase 5 — Items

Implement:
- Active Items,
- Stocked Items,
- Item Details,
- Start Using,
- Finish Item,
- delete Item with confirmation,
- Product history from Item context.

## Phase 6 — Purchase Product

Implement:
- Product picker,
- purchase form,
- quantity,
- amount,
- merchant,
- account,
- notes,
- Start Now,
- `purchase_product` RPC,
- success/error handling,
- relevant query invalidation.

## Phase 7 — Expenses

Implement:
- Expense list/timeline,
- filters/search as needed,
- Add Direct Expense,
- Expense Details/Edit,
- Direct Expense delete,
- hide/prevent linked Expense direct delete.

## Phase 8 — Product Catalog

Implement:
- Product Catalog,
- Product Details,
- Add/Edit Product,
- inactive Product behavior,
- Product history.

## Phase 9 — Trips

Implement:
- Trips list,
- current/upcoming distinction,
- Add/Edit Trip,
- trip date semantics,
- Person/Household selection.

## Phase 10 — Master data / More

Implement:
- Accounts,
- Categories,
- People,
- Settings,
- Logout.

No delete for master data.

## Phase 11 — PWA polish

Implement/test:
- manifest,
- icons,
- standalone launch,
- safe areas,
- service worker,
- cold launch,
- installed iPhone behavior,
- install onboarding,
- route refresh behavior,
- touch targets.

## Phase 12 — parity verification

Run acceptance scenarios against the existing behavior and documented rules.

Only after this stage should roadmap intelligence features begin.

## Deferred intentionally

Not V1:
- salary/income,
- budget management,
- savings/net worth,
- complex local-first sync,
- offline mutation queues,
- AI insights,
- advanced forecasting,
- push-notification strategy,
- native App Store distribution.
