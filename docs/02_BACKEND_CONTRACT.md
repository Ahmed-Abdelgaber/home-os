# HomeOS Backend Contract — Supabase

The Supabase backend already exists and is the current system of record.

Frontend code should integrate with it rather than recreate it.

---

## 1. Core tables

### `people`

Important fields:

```text
id uuid PK
name text unique
kind person_kind       // person | household
is_active boolean
created_at timestamptz
```

Current known records include:
- Ahmed
- Esraa
- Household

Deletion is blocked.

---

### `categories`

```text
id uuid PK
name text unique
is_active boolean
created_at timestamptz
```

Deletion is blocked.

---

### `accounts`

```text
id uuid PK
name text unique
type text
owner_id uuid → people.id
is_active boolean
created_at timestamptz
```

Deletion is blocked.

---

### `products`

```text
id uuid PK
name text unique
category_id uuid → categories.id
consumer_id uuid → people.id
consumption_mode consumption_mode
notes text nullable
is_active boolean
created_at timestamptz
legacy_id text unique nullable
```

`consumption_mode` enum:

```text
pause_when_consumer_away
pause_only_when_household_away
never_pause
```

Deletion is blocked.

---

### `expenses`

```text
id uuid PK
expense_date date
amount numeric(12,2)
description text
merchant text nullable
category_id uuid → categories.id
scope expense_scope
person_id uuid → people.id
account_id uuid → accounts.id
notes text nullable
created_at timestamptz
legacy_id text unique nullable
```

`expense_scope` enum:

```text
household
personal
```

Direct Expenses have no Item relation.

A linked Expense is referenced by `items.expense_id`.

---

### `items`

```text
id uuid PK
product_id uuid → products.id
expense_id uuid unique → expenses.id ON DELETE RESTRICT
status item_status
started_date date nullable
finished_date date nullable
quantity numeric > 0
notes text nullable
created_at timestamptz
legacy_id text unique nullable
```

`item_status` enum:

```text
stocked
active
finished
```

Lifecycle constraint:

```text
stocked:
  started_date null
  finished_date null

active:
  started_date not null
  finished_date null

finished:
  started_date not null
  finished_date not null
  finished_date >= started_date
```

---

### `trips`

```text
id uuid PK
name text
departure_date date
return_date date
person_id uuid → people.id
notes text nullable
created_at timestamptz
```

Current database constraint requires:

```text
return_date >= departure_date
```

Domain calculation uses `[departure_date, return_date)`.

---

### `app_users`

Maps Supabase Auth users to HomeOS People.

```text
user_id uuid PK → auth.users.id
person_id uuid unique → people.id
created_at timestamptz
```

Ahmed and Esraa have been created in Supabase Auth and mapped here.

---

## 2. View

### `item_usage_metrics`

Read-only view.

Important output:

```text
item_id
status
started_date
finished_date
effective_end_date
calendar_days
away_days
active_usage_days
```

Rules:

- Active end date = current date in `Africa/Cairo`.
- Finished end date = `finished_date`.
- Stocked metrics = zero/not started.
- Calendar period is inclusive.
- Trip return date is excluded.
- Applicable overlapping trips are deduplicated.
- Consumption mode is read from Product.

Use this view for display rather than reimplementing usage-day logic in React.

---

## 3. RPC functions

### `purchase_product`

Signature concept:

```text
purchase_product(
  p_product_id uuid,
  p_purchase_date date,
  p_amount numeric,
  p_merchant text,
  p_account_id uuid,
  p_quantity numeric default 1,
  p_notes text default null,
  p_start_now boolean default true
)
```

Returns:

```text
item_id
expense_id
```

Behavior:

1. validate amount > 0,
2. validate quantity > 0,
3. load active Product,
4. derive Expense scope from Product consumer kind,
5. create Expense,
6. create Item,
7. link Item to Expense,
8. commit atomically.

Use this RPC for Product purchase.
Do not create Expense and Item as separate client requests.

---

### `start_item`

Signature concept:

```text
start_item(
  p_item_id uuid,
  p_started_date date default null
)
```

Behavior:

- only Stocked → Active,
- default date = current Cairo date,
- start cannot precede purchase date,
- sets `started_date`.

---

### `finish_item`

Signature concept:

```text
finish_item(
  p_item_id uuid,
  p_finished_date date default null
)
```

Behavior:

- only Active → Finished,
- default date = current Cairo date,
- finish cannot precede start,
- sets `finished_date`.

---

## 4. Delete/integrity triggers

### Master-data delete protection

Deletion is blocked for:

- people
- categories
- accounts
- products

### Item → Expense relationship

`items.expense_id` cannot be changed after creation.

### Delete Item

Deleting Item triggers deletion of its linked Expense.

### Delete linked Expense directly

Blocked by the Item foreign key while the Item exists.

Direct Expenses remain deletable.

---

## 5. RLS

RLS is enabled on core tables.

Helper:

```text
is_homeos_user()
```

returns true when:

```text
auth.uid()
```

exists in `app_users`.

Authenticated HomeOS users have access policies on:

- people
- categories
- accounts
- products
- expenses
- items
- trips

`app_users` users can read only their own mapping.

Treat RLS as authoritative authorization.

Never use a service-role key in the browser.

---

## 6. Auth

V1 auth method:

```text
Email + password
```

Do not use OAuth or magic-link flows for V1 PWA.

Frontend must:
- create a Supabase client with public/publishable client credentials,
- maintain auth session,
- listen to auth state,
- route unauthenticated users to Login,
- route authenticated users into the app shell.

Environment variables must not contain any service-role secret.

Suggested Vite env names:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

If the project currently exposes an anon key instead, use the public browser-safe key available for the Supabase project.
Do not commit actual credentials.

---

## 7. Frontend query guidance

Prefer relational reads from Supabase.

Examples:

### Item display

Read:
- Item,
- related Product,
- linked Expense,
- related usage metrics.

Do not store duplicate Product labels in frontend state.

### Home long-running

Query Active Items ordered by `started_date` ascending.
V1 can display the oldest few.

### Home long-stocked

Query Stocked Items where purchase date from linked Expense is older than 30 days.

### Monthly spend

Aggregate Expenses for current calendar month.

### Previous-month comparison

Aggregate previous calendar month and calculate percentage difference.

Handle previous-month zero safely.

### Travel snapshot

Prioritize:
1. current trip status,
2. otherwise next upcoming trip,
3. otherwise "Everyone is home".

---

## 8. Backend changes

Do not modify database schema or functions from frontend tasks without explicit approval.

If a backend gap is discovered:

1. document the exact missing behavior,
2. explain why frontend code cannot safely solve it,
3. propose the smallest SQL migration,
4. wait for approval before applying.
