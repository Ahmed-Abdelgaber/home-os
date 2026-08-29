# HomeOS Domain & Business Rules

This document is authoritative for domain behavior.

---

## 1. Product

A Product is the stable catalog identity of something that can be purchased repeatedly.

Current conceptual fields:

- `id`
- `name`
- `category_id`
- `consumer_id`
- `consumption_mode`
- `notes`
- `is_active`

Product data is read through the Product relation.
Do not duplicate Product name/category/consumer/consumption mode on Item unless a later approved requirement changes this.

If Product data changes, Items that join to that Product naturally display the updated Product data.

Products cannot be deleted.
Use inactive/archived behavior instead.

---

## 2. Item

An Item represents one concrete purchase/use cycle of a Product.

One Product may have many Items over time.

Current stored Item concerns:

- `id`
- `product_id`
- `expense_id`
- `status`
- `started_date`
- `finished_date`
- `quantity`
- `notes`

Purchase financial data is obtained from the linked Expense.

Product identity/configuration is obtained from the linked Product.

### Quantity

Quantity belongs to the Item.

Example:

A purchase with quantity `3` is still one Item representing that purchase/use cycle.

Do not create three Items.

---

## 3. Item lifecycle

Allowed lifecycle:

```text
Stocked → Active → Finished
```

### Stocked

Purchased, but use has not started.

Rules:

```text
status = stocked
started_date = NULL
finished_date = NULL
```

### Active

Use has started.

Rules:

```text
status = active
started_date != NULL
finished_date = NULL
```

Usage calculations are real-time.

### Finished

Use has ended.

Rules:

```text
status = finished
started_date != NULL
finished_date != NULL
finished_date >= started_date
```

### Purchase behavior

At purchase time:

If `Start Now = Yes`:

```text
status = Active
started_date = purchase_date
```

If `Start Now = No`:

```text
status = Stocked
started_date = NULL
```

### Start Using

Only a Stocked Item may be started.

The start date:
- defaults to current Cairo date,
- cannot precede purchase date.

### Finish Item

Only an Active Item may be finished.

The finish date:
- defaults to current Cairo date,
- cannot precede started date.

---

## 4. Item usage period

The Item usage period is inclusive.

If:

```text
started_date = 16 Aug
finished_date = 20 Aug
```

Calendar Usage Days:

```text
16, 17, 18, 19, 20 = 5
```

For Active Items:

```text
effective_end_date = current Cairo date
```

For Finished Items:

```text
effective_end_date = finished_date
```

For Stocked Items:

usage metrics are zero / not started.

---

## 5. Trip semantics

A Trip has:

- destination/name
- departure date
- return date
- person
- notes

### Date boundaries

Departure Date **counts** as away.

Return Date is the day the person is back home and **does not count** as away.

Trip interval:

```text
[departure_date, return_date)
```

Example:

```text
Departure = 18 Aug
Return = 25 Aug
```

Away days:

```text
18, 19, 20, 21, 22, 23, 24
```

Not 25 Aug.

### Household travel

Household-wide travel is explicit.

If Ahmed and Esraa are traveling together and the household should be considered away, create a Trip with:

```text
Person = Household
```

Do not infer Household-away by intersecting individual trips.

### Overlapping trips

Applicable overlapping trips must never double-count the same day.

---

## 6. Consumption modes

Exactly three modes exist.

### `pause_when_consumer_away`

Consumption pauses when the Product's configured Consumer is away.

Examples:

- Consumer Ahmed → Ahmed's trips pause usage.
- Consumer Esraa → Esraa's trips pause usage.
- Consumer Household → Household trips pause usage.

### `pause_only_when_household_away`

Consumption pauses only on explicit Trips where Person = Household.

The specific Product consumer does not change this rule.

### `never_pause`

Trips never affect usage.

---

## 7. Usage metrics

Usage metrics are derived, not stored as source-of-truth Item columns.

### Calendar Days

For an Active or Finished Item:

```text
effective_end_date - started_date + 1
```

### Away Days

Count distinct applicable away dates within the Item usage period.

Respect:
- trip return-exclusive semantics,
- consumption mode,
- Product consumer,
- explicit Household trips,
- no overlap double-counting.

### Active Usage Days

```text
calendar_days - away_days
```

Historical Trip edits should naturally affect recalculated metrics.

---

## 8. Expense

An Expense is a money-spending transaction.

Two forms exist.

### Item-linked Expense

Created as part of Product purchase.

Every purchased Item has exactly one linked Expense.

### Direct Expense

Standalone transaction with no Item.

Examples:
- Uber
- electricity bill
- dry cleaning
- restaurant
- service
- subscription

Not every Expense has an Item.

### Direct Expense data

Conceptual fields:

- Date
- Amount
- Description
- Merchant
- Category
- Scope
- Person
- Account
- Notes

---

## 9. Scope and Person

Keep both.

Current values:

Scope:

```text
Household
Personal
```

Person may be:

```text
Ahmed
Esraa
Household
...
```

For Product purchase:

- Consumer Household → Expense Scope Household, Person Household.
- Consumer named person → Expense Scope Personal, Person same person.

The explicit Scope field is intentionally retained for simpler queries.

---

## 10. Purchase Product workflow

Product purchase must be atomic.

One operation creates:

```text
Expense + Item + relationship
```

Either all succeed or none succeed.

Current mapping:

- Purchase Date → Expense Date
- Product name → Expense Description
- Product category → Expense Category
- Product consumer → Expense Scope/Person
- Merchant → Expense Merchant
- Amount → Expense Amount
- Account → Expense Account
- Notes → Expense and Item notes where currently supported
- Quantity → Item Quantity

The database RPC `purchase_product()` owns this workflow.

---

## 11. Delete/edit rules

### Never delete master data

No deletion for:

- Products
- Categories
- Accounts
- People

Use `is_active` where applicable.

### Item

Item may be deleted.

Deleting an Item deletes its linked Expense.

### Item-linked Expense

May be edited.

May **not** be deleted directly.

The Item/Expense relationship may not be changed after creation.

### Direct Expense

May be edited.

May be deleted.

---

## 12. Item-linked Expense editing

Editing the linked Expense is allowed.

Fields such as:

- date,
- amount,
- description,
- merchant,
- category,
- scope,
- person,
- account,
- notes

may be changed through Expense editing.

Do not delete it directly.

---

## 13. Product history

History is reached naturally from Item/Product relationships.

The UX does not require a top-level History tab.

From a current Item or Product context, the app can query previous Items for the same Product.

Future intelligence may derive:

- average active usage days,
- expected replacement date,
- cost trend,
- quantity-to-duration patterns.

These are future derived features, not new V1 domain fields.
