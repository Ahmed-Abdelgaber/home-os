# HomeOS Information Architecture

## Primary navigation

Authenticated bottom navigation:

1. Home
2. Items
3. Expenses
4. More

A centered global `+` action sits visually between Items and Expenses.

## Global Add actions

```text
Buy Product
Add Expense
Add Trip
Add Product
```

Use a mobile sheet/modal.

## Current pages

1. Login
2. Home
3. Items
4. Item Details
5. Expenses
6. Add Expense
7. Expense Details
8. Purchase Product
9. Product Catalog
10. Product Details
11. Add / Edit Product
12. Trips
13. Add / Edit Trip
14. More
15. Accounts
16. Categories
17. People
18. Settings

## Navigation philosophy

HomeOS is an operations application, not a CRUD database browser.

Therefore:
- Items are front-line.
- Products are catalog/master data.
- Trips and master data live behind More/contextual flows.
- History is contextual, not necessarily a primary tab.
- Expense management is important but not the application's conceptual center.

## Items

Primary operational workspace.

Initial conceptual views:

```text
Active
Stocked
```

Finished history is reached through Product/Item context and later search/history features.

## Product Catalog

Used when:
- buying a Product,
- adding a Product,
- editing Product data,
- opening Product history/details.

It does not need a primary bottom-tab slot.

## More

Initial destinations:

```text
Trips
Product Catalog
Accounts
Categories
People
Settings
Logout
```

## Contextual history

When viewing an Item or Product, previous Items for the same Product can be shown.

Example:

```text
Current Item
Lavazza — Active

Previous Cycles
02 Aug → 15 Aug
17 Jul → 31 Jul
...
```

This avoids a generic top-level History screen unless future usage proves it necessary.
