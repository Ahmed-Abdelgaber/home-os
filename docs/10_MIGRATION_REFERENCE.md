# HomeOS Migration Reference

## Previous system

HomeOS began as:
- Google Sheets,
- AppSheet,
- Google Form experiments.

`Form Responses 1` is legacy and not part of the domain.

## Current source-of-truth transition

The core data has been migrated to Supabase.

Existing migrated domains include:

- People
- Categories
- Accounts
- Products
- Trips
- Expenses
- Items

Legacy IDs were retained in migration-support columns where useful.

## Supabase work already completed

- core tables,
- enums,
- relations,
- integrity constraints,
- master-data delete protection,
- Item/Expense delete behavior,
- Item/Expense relationship protection,
- migrated master data,
- migrated current Trips,
- migrated current Expenses and Items,
- `item_usage_metrics` view,
- `purchase_product()` RPC,
- `start_item()` RPC,
- `finish_item()` RPC,
- `app_users`,
- RLS policies,
- Ahmed Auth mapping,
- Esraa Auth mapping.

## Important migration correction

The old implementation counted a Trip return day as Away in at least one observed calculation.

Business rule was clarified:

```text
Return Date = back home
```

Therefore new calculation intentionally uses:

```text
[Departure Date, Return Date)
```

This is a corrected business behavior, not a parity bug.

## Previous frontend plan

An earlier migration document targeted:

```text
FlutterFlow + Supabase
```

That frontend direction is superseded.

Current direction:

```text
React + Ionic + Supabase
```

The architectural principle remains unchanged:

> The implementation platform must not dictate the domain design.

Supabase keeps the important business rules portable from the frontend.

## Migration objective

The application should preserve the current operational behavior before adding advanced intelligence.

New V1-approved domain addition:

```text
Stocked → Active → Finished
```

with:

```text
Bought Date
Started Date
Finished Date
```

The old system did not distinguish Bought Date from Started Date for existing Active Items, so migrated Active Items use:

```text
Started Date = Bought Date
```

for their existing history.
