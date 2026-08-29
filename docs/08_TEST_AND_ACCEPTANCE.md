# HomeOS Test & Acceptance Checklist

## 1. Authentication / RLS

### Anonymous

- [ ] Anonymous client cannot read `people`.
- [ ] Anonymous client cannot read `products`.
- [ ] Anonymous client cannot read `items`.
- [ ] Anonymous client cannot read `expenses`.
- [ ] Anonymous client cannot read `trips`.

### Ahmed / Esraa

- [ ] Ahmed can log in with email/password.
- [ ] Esraa can log in with email/password.
- [ ] Session survives normal browser reload.
- [ ] Authenticated HomeOS user can read required tables.
- [ ] No service-role key exists in frontend bundle.

---

## 2. Purchase Product

Given an active Product:

- [ ] Purchase with Start Now creates exactly one Expense.
- [ ] Purchase creates exactly one Item.
- [ ] Item links to the created Expense.
- [ ] Product category maps to Expense category.
- [ ] Household consumer maps to Household scope/person.
- [ ] Named consumer maps to Personal scope/same person.
- [ ] Quantity is stored on Item.
- [ ] Start Now = yes creates Active Item with start date = purchase date.
- [ ] Start Now = no creates Stocked Item with null start date.
- [ ] Invalid amount is rejected.
- [ ] Invalid quantity is rejected.
- [ ] Failure does not leave a half-created Item/Expense pair.

---

## 3. Item lifecycle

- [ ] Stocked can Start.
- [ ] Active cannot Start again.
- [ ] Start date cannot predate purchase date.
- [ ] Active can Finish.
- [ ] Stocked cannot Finish directly.
- [ ] Finished cannot Finish again.
- [ ] Finish date cannot predate start date.
- [ ] Same-day start/finish yields 1 calendar usage day.

---

## 4. Trip/usage rules

For an Item active from 16 Aug onward and Household Trip:

```text
Departure 18 Aug
Return 25 Aug
```

- [ ] 18–24 count as Away.
- [ ] 25 does not count as Away.
- [ ] Overlapping applicable trips do not double count days.
- [ ] `never_pause` yields zero Away Days.
- [ ] `pause_only_when_household_away` reacts only to explicit Household Trips.
- [ ] `pause_when_consumer_away` reacts to the Product consumer's Trips.
- [ ] Active Usage Days = Calendar Days - Away Days.
- [ ] Active metrics advance with current Cairo date.
- [ ] Finished metrics stop at Finished Date.
- [ ] Historical Trip edits recalculate metrics.

---

## 5. Delete rules

- [ ] Product delete is blocked.
- [ ] Category delete is blocked.
- [ ] Account delete is blocked.
- [ ] Person delete is blocked.
- [ ] Direct Expense can be deleted.
- [ ] Item-linked Expense cannot be deleted directly.
- [ ] Item can be deleted.
- [ ] Deleting Item deletes linked Expense.
- [ ] Item's `expense_id` cannot be changed after creation.

---

## 6. Home screen

### Snapshot

- [ ] Current month spend is correct.
- [ ] Previous month comparison is correct.
- [ ] Zero previous-month case is handled cleanly.
- [ ] Current Trip takes priority over upcoming Trip.
- [ ] Upcoming Trip shows when everyone is home.
- [ ] "Everyone is home" shows when no relevant Trip exists.

### Long-running

- [ ] Only Active Items are included.
- [ ] Oldest Active Items appear first.
- [ ] Section does not pretend to show all Active Items.
- [ ] Tap opens correct Item.

### Long-stocked

- [ ] Only Stocked Items >= 30 days are included.
- [ ] Purchase age uses linked Expense date.
- [ ] Start Using calls `start_item`.
- [ ] Successful Start removes Item from long-stocked after refresh/invalidation.

### Recent Activity

- [ ] Supports mixed operation types.
- [ ] Not limited to Expenses.

---

## 7. Mobile/PWA

- [ ] 390px viewport has no horizontal overflow.
- [ ] 430px viewport remains visually balanced.
- [ ] Safe-area top/bottom padding works.
- [ ] Bottom navigation does not cover scroll content.
- [ ] Tap targets are >= 44px.
- [ ] Installed PWA launches standalone.
- [ ] Session survives cold/reopen behavior expected for the browser context.
- [ ] Direct route refresh does not produce a hosting 404.
- [ ] App shell loads without obvious blank/white flash where preventable.

---

## 8. Visual acceptance

- [ ] Uses HomeOS violet tokens.
- [ ] Uses consistent radius/spacing.
- [ ] Does not look like default Ionic.
- [ ] Does not look like a finance dashboard.
- [ ] Does not show salary/income/savings.
- [ ] Home is operational and exception-focused.
- [ ] Items remain the front-line object.
