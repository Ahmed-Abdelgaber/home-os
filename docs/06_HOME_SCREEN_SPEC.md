# Home Screen Specification — V1

> **Home palette approved — 6 September 2026.**
> Home uses a single household cover photograph, a compact contextual trip strip,
> sentence-case headings, compact item/activity rows, and the approved Deep violet period
> treatment. Other screens retain their existing visual system pending separate review.
>
> Runtime palette ownership: `src/pages/HomePage/HomePage.css`, scoped to Home.
> Brand violet `#6c5ce7`; ink `#232238`; paper `#f8f9fc`; surface `#ffffff`;
> muted text `#66677a`; dividers `#e4e3ed`; deep period surface `#332857` with white
> primary text, secondary text `#e0daf6`, and a translucent white End period control.
> Success `#147a52` / soft `#e9f6ef`; warning `#edb23b` / soft `#fff3d8`
> with readable warning text `#7e550c`; information `#3476df` / soft `#ebf2fe`;
> danger `#c23553` / soft `#fcecf0`. The period's error text uses `#ffb8c6` for
> contrast on its dark background. Shared type, spacing, and controls remain in
> `src/theme/tokens.css`; Home adapts the existing semantic aliases to this palette.
>
> Amber marks pending review; green marks active items/success; blue marks stock/trips;
> red marks errors/deletion. Activity tones come from the existing event formatter.
> The normal End period control follows the approved translucent white treatment;
> its confirmation retains the existing destructive intent. Amounts/comparisons stay
> neutral, without treating higher spending as a failure. Scrollbars remain hidden
> while scrolling stays enabled.
> The cover uses object-fit: cover and a single responsive focal position; no duplicated
> portraits or face-specific crops. Wider covers have more height to retain the subjects.
>
> The existing snapshot query calculates tracking-period spending. Home now labels it
> “This period” and shows its existing start date; this supersedes the monthly display copy
> below without changing calculation/query semantics. The existing previous-period comparison
> is visible again, with a neutral unavailable state when prior spending is zero or absent.
> Trips appear as a compact, pale strip within the photo header: current trip first, then
> next upcoming trip, with person, destination, dates and a link to Trips. The strip is hidden
> when neither exists; there is no standalone Trips section on Home. End period uses the existing
> mutation and shared ConfirmationSheet. Never execute it on live data for UI verification.
>
> Item eligibility remains unchanged (oldest three active, stocked for at least 30 days).
> Home previews two eligible stocked items and three activities, with existing destinations
> and activity expansion retained. QueryState/Skeleton own load/error presentation,
> React Router links own navigation, and Ionic owns confirmation and scroll behavior.
>
> **Known actor-name limitation:** read-only inspection confirmed that recent events map to
> Esraa, while the `app_users` SELECT policy exposes only the current user's own mapping.
> The existing frontend join/fallback cannot resolve the other household member under that
> policy. No names were hardcoded and no database permissions were changed in this UI task.

The Home screen is the highest-level operational summary of the household.

It is **not**:
- a full Items list,
- a full Expenses dashboard,
- a finance dashboard,
- a collection of database counts.

## Order

1. Branded header
2. Home Snapshot
3. Long-running Items
4. Long-stocked Items
5. Recent Activity
6. Persistent bottom navigation

---

## 1. Header

Visual:
- dark `#14171D`,
- warm/premium,
- generous but not wasteful space,
- safe-area aware.

Content:

```text
HomeOS                         Avatar

Good evening 👋
Ahmed
```

Greeting varies by time later if desired.

Avoid centering the greeting block.
Use left alignment.

---

## 2. Home Snapshot — first content section

The snapshot answers:

1. What did household operations cost this month?
2. What is the household travel status?

### Monthly spend

Example:

```text
This month's spend

EGP 4,820

+12% vs last month
```

Required:
- current calendar month total,
- percentage comparison against previous calendar month.

Do not show:
- salary,
- income,
- remaining budget,
- savings.

Handle previous-month zero safely rather than displaying invalid infinity percentages.

### Travel status

Priority:

#### A. Current trip exists

Show who is currently away, destination, and return date.

Examples:

```text
Household is away
Menia
Back 25 Aug
```

```text
Ahmed is away
Dubai
Back 4 Sep
```

#### B. Nobody currently away, but upcoming trip exists

Show next upcoming trip.

Example:

```text
Everyone is home

Upcoming trip
Esraa • Alexandria • 3 Sep – 6 Sep
```

#### C. No current/upcoming trip

Show:

```text
Everyone is home
```

Optionally:

```text
All systems normal
```

### Visual treatment

One hero card.

Do not split cost, home status, and upcoming trip into unrelated dashboard cards.

Desired style:
- very light violet/white,
- 22–26px radius,
- warm household/lifestyle visual treatment,
- subtle gradient/imagery,
- strong readable typography.

The financial value is part of the snapshot, not the whole purpose.

---

## 3. Long-running Items

This is an attention section.

Do not show all Active Items.

### V1 rule

Query:

```text
status = active
order by started_date ascending
limit ~3
```

Display oldest Active Items.

Example:

```text
Vanish 900ml
Active for 47 days

Toothpaste
Active for 41 days

Lavazza
Active for 18 days
```

This rule is intentionally simple for V1.

Known future improvement:

A Product such as toothpaste may naturally run for a long time and therefore remain in this list.

Later intelligence should compare the current Item against that Product's own historical duration instead of using absolute age only.

Do **not** build that future intelligence now unless explicitly requested.

### UI

Section header:

```text
Long-running items                     View all
```

Use one grouped card with dividers.

Rows:
- optional Product thumbnail,
- Product name,
- `Active for N days`,
- chevron/details.

Tapping opens Item Details.

---

## 4. Long-stocked Items

Attention section for purchased Items that have not started.

### V1 rule

```text
status = stocked
purchase date <= today - 30 days
```

Purchase date comes from the linked Expense.

Display oldest first.

Example:

```text
Downy 1L
Stocked for 38 days                  Start using

Shampoo
Stocked for 34 days                 Start using
```

Primary quick action:

```text
Start using
```

Calls the database `start_item` RPC.

If none exist:
- hide the section, or
- show a compact friendly empty state.

---

## 5. Recent Activity

This is a mixed operational timeline.

It must not be Expense-only.

Examples:

```text
Finished Tomatoes
Today • 7:45 PM

Bought Lavazza
Today • 4:20 PM

Expense • Uber • EGP 301
Today • 1:15 PM

Trip added • Alexandria
Yesterday • 9:30 PM
```

V1 may initially compose activity from available current entities/actions.
If a durable event log is later required, propose it as a backend enhancement rather than inventing a hidden local-only source of truth.

Use:
- semantic circular icon,
- primary label,
- secondary timestamp,
- consistent spacing.

---

## 6. Bottom navigation

Tabs:

```text
Home
Items
Expenses
More
```

Home selected.

Global violet `+` between Items and Expenses.

The navigation is persistent in the authenticated shell.

---

## 7. Responsive target

Design first for:

```text
393px × typical modern iPhone height
```

Support roughly 390–430px widths without clipping.

The full Home page is vertically scrollable while the bottom navigation remains stable.

---

## 8. Initial implementation strategy

Build Home in two passes.

### Pass A — visual skeleton

Use static sample data to achieve:
- exact layout,
- component structure,
- typography,
- spacing,
- colors,
- mobile feel.

### Pass B — data binding

Connect:
- monthly Expense aggregates,
- Trip status,
- `item_usage_metrics`,
- Active Items,
- Stocked Items,
- Recent Activity composition.

Do not compromise the visual structure merely because a query shape is inconvenient.
Adapt the data layer cleanly.
