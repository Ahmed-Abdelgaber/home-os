# HomeOS Frontend Architecture

## 1. Chosen stack

```text
Vite
React
TypeScript
Ionic React
Capacitor
Supabase JS
TanStack Query
React Hook Form
Zod
vite-plugin-pwa / Workbox
Cloudflare Pages
```

### Why Ionic

The primary delivery target is an installed iPhone PWA.

Ionic is used for:
- mobile navigation primitives,
- page stack behavior,
- tab navigation,
- safe-area-aware layout,
- modals/sheets,
- mobile interaction semantics.

Ionic's default visual identity is **not** the HomeOS visual identity.

Custom HomeOS components should be styled from the HomeOS design system.

### Why Capacitor

Install/configure Capacitor early as a future native escape hatch.

Do not build native-only behavior into V1 unless requested.

---

## 2. Suggested project structure

```text
src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers.tsx
│
├── core/
│   ├── auth/
│   │   ├── AuthProvider.tsx
│   │   └── useAuth.ts
│   ├── supabase/
│   │   └── client.ts
│   ├── query/
│   │   └── queryClient.ts
│   └── utils/
│
├── theme/
│   ├── tokens.css
│   ├── ionic-overrides.css
│   └── global.css
│
├── shared/
│   ├── components/
│   ├── icons/
│   └── types/
│
├── features/
│   ├── auth/
│   ├── home/
│   ├── items/
│   ├── expenses/
│   ├── products/
│   ├── trips/
│   └── master-data/
│
├── pages/
│   ├── LoginPage/
│   ├── HomePage/
│   ├── ItemsPage/
│   ├── ItemDetailsPage/
│   ├── ExpensesPage/
│   ├── ExpenseDetailsPage/
│   ├── AddExpensePage/
│   ├── PurchaseProductPage/
│   ├── ProductCatalogPage/
│   ├── ProductDetailsPage/
│   ├── ProductEditPage/
│   ├── TripsPage/
│   ├── TripEditPage/
│   ├── MorePage/
│   ├── AccountsPage/
│   ├── CategoriesPage/
│   ├── PeoplePage/
│   └── SettingsPage/
│
└── main.tsx
```

The exact folders may evolve only if there is a clear implementation need.

---

## 3. State management

### Server state

Use TanStack Query for:
- Supabase reads,
- query caching,
- invalidation after mutations,
- loading/error state.

### Auth state

Use a small Auth Provider driven by Supabase Auth session events.

### Local UI state

Use component state.

Do not add Redux in V1.

### Offline

Do not implement a complex offline mutation queue in V1.

The app may later add IndexedDB persistence if real usage demonstrates the need.

Supabase remains source of truth.

---

## 4. Forms

Use:

```text
React Hook Form + Zod
```

Goals:
- typed inputs,
- clear validation,
- field-level messages,
- mobile-friendly forms.

Business-critical validation must still be enforced by Supabase.

---

## 5. Routing/navigation

Use Ionic routing/page-stack behavior.

Primary authenticated tabs:

```text
Home
Items
Expenses
More
```

Global Add button is centered between Items and Expenses visually.

Contextual pages push above the tab shell.

Examples:

```text
Home → Item Details
Items → Item Details
Expenses → Expense Details
More → Trips
Trips → Add/Edit Trip
```

The Login page is outside the authenticated shell.

Do not use hash routing.

---

## 6. Styling strategy

### Global tokens

Put design tokens in CSS variables.

Example concepts:

```css
--homeos-primary: #6C5CE7;
--homeos-primary-dark: #5B4BE0;
--homeos-bg: #F7F8FC;
--homeos-ink: #12131A;
--homeos-radius-card: 20px;
--homeos-radius-hero: 24px;
```

### Ionic overrides

Use a dedicated file for Ionic variables/behavior.

### Component styling

Use CSS Modules or similarly scoped styles.

Do not scatter raw hex colors and arbitrary spacing across JSX.

Prefer token reuse.

---

## 7. Component strategy

Build reusable components for real repeated UI.

Initial shared candidates:

```text
AppShell
HomeOSHeader
BottomTabBar
GlobalAddButton
SectionHeader
GroupedCard
ItemRow
ExpenseRow
ActivityRow
StatusChip
PrimaryButton
SecondaryButton
EmptyState
ConfirmationSheet
QuickAddSheet
```

Do not create an abstract design-system framework before repeated usage exists.

---

## 8. Data-access strategy

Keep raw Supabase calls out of visual components.

Feature-level query modules may expose functions/hooks such as:

```text
useHomeSnapshot()
useLongRunningItems()
useLongStockedItems()
useRecentActivity()
useItems()
useItemDetails()
useExpenses()
```

Mutation hooks may wrap:

```text
purchase_product
start_item
finish_item
direct expense CRUD
trip CRUD
```

Do not reimplement SQL business logic in these hooks.

---

## 9. PWA requirements

Use `vite-plugin-pwa`.

V1 must include:

- web app manifest,
- `display: standalone`,
- correct start URL/scope,
- app icons,
- Apple touch icon,
- service-worker app-shell caching,
- safe-area support,
- responsive mobile viewport,
- install guidance.

CSS/layout should account for:

```text
env(safe-area-inset-top)
env(safe-area-inset-bottom)
```

Prefer dynamic viewport units where appropriate.

Touch targets should be at least 44px.

Avoid hover-only affordances.

---

## 10. Hosting

Target:

```text
Cloudflare Pages
```

Reasons:
- free,
- private GitHub repository integration,
- preview deployments,
- HTTPS,
- SPA hosting.

Deployment is not required during initial UI scaffolding.

---

## 11. Performance priorities

The app should feel immediate.

Prioritize:
- fast first render,
- stable layout,
- skeletons instead of blocking spinners where appropriate,
- query caching,
- optimistic UI only where safe,
- minimal unnecessary re-fetching.

Do not prematurely introduce complicated synchronization infrastructure.
