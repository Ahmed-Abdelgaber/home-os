# HomeOS Decision Log

This file captures decisions that should not be reopened accidentally.

## D-001 — HomeOS is household operations, not finance

**Decision:** Financial data supports household operations. HomeOS does not center salary, income, savings, net worth, or budget remaining.

## D-002 — Item is front-line

**Decision:** Active/Stocked Items are more important to daily UX than Product Catalog.

## D-003 — Product remains master/catalog

**Decision:** Product identity/configuration is read through Product relations rather than duplicated on Item.

## D-004 — Quantity belongs to Item

**Decision:** Quantity may vary per purchase. One purchase with quantity N remains one Item.

## D-005 — Item lifecycle

```text
Stocked → Active → Finished
```

## D-006 — Usage starts at Started Date

Bought Date is not necessarily usage start.

Stocked Items do not accumulate usage.

## D-007 — Item dates inclusive

Started and Finished dates both count toward Calendar Usage Days.

## D-008 — Trip return date excluded

Trip interval:

```text
[Departure Date, Return Date)
```

Return date means back home.

## D-009 — Household away is explicit

Use Trip Person = Household.

Do not infer from overlapping individual travel.

## D-010 — Three consumption modes only

```text
pause_when_consumer_away
pause_only_when_household_away
never_pause
```

## D-011 — Keep Scope and Person

Both remain explicit Expense fields.

## D-012 — Item always owns one Expense relationship

Every Item has one linked Expense.

Direct Expenses have no Item.

Current DB relation is:

```text
items.expense_id → expenses.id
```

## D-013 — Delete rules

Master data:
- no delete.

Item:
- may delete,
- linked Expense deletes with it.

Linked Expense:
- edit yes,
- direct delete no.

Direct Expense:
- edit/delete yes.

## D-014 — Supabase owns important rules

Important integrity/lifecycle behavior belongs in PostgreSQL/RPC/RLS, not only frontend action chains.

## D-015 — Initial frontend changed

Previous explored frontend:
- AppSheet,
- FlutterFlow,
- Flutter.

Current chosen frontend:

```text
Vite + React + TypeScript + Ionic React
```

Reason:
- PWA-first iPhone delivery,
- strong mobile navigation primitives,
- zero-cost web delivery,
- future Capacitor native path.

## D-016 — PWA first

Initial distribution is an installed iPhone PWA.

Native App Store distribution is deferred.

## D-017 — Cloudflare Pages target

Chosen over GitHub Pages for V1 hosting.

## D-018 — No complex offline-first architecture in V1

TanStack Query is allowed.

IndexedDB persistence/offline mutation queues are deferred until real usage demonstrates need.

## D-019 — Home Snapshot comes first

Home begins with:
- current-month operational spend + previous-month comparison,
- current/upcoming travel status.

## D-020 — Home shows operational exceptions

Home does not list all Items.

V1:
- Long-running = oldest Active Items.
- Long-stocked = Stocked for ~30+ days.

Future expected-duration intelligence is intentionally deferred.

## D-021 — History is contextual

Finished/history data can be reached from Item/Product context.
A top-level History tab is not required for V1.
