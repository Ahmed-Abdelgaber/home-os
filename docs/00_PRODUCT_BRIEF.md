# HomeOS Product Brief

## Product definition

HomeOS is a **household operations application**.

It records and understands how a household operates so that users can make better decisions about consumption and spending.

It is deliberately **not** a personal-finance application.

## Core idea

HomeOS should answer operational questions such as:

- What items are currently in use?
- What has been in use unusually long?
- What has been bought but not started for a long time?
- How long does a product usually last?
- How do trips affect real consumption time?
- What did household operations cost this month?
- Which products are becoming more expensive?
- What may need replacement soon?
- What changed recently in the household?

The long-term value is intelligence derived from real operational history.

## Product hierarchy

### Item — front-line operational object

An Item is one concrete purchase/use cycle of a Product.

The application should foreground Items, especially Active Items.

### Product — catalog/master identity

A Product is a reusable catalog identity that can be purchased repeatedly.

Products support Items; they are not the primary daily workspace.

### Expense — operational cost record

An Expense records money spent.

Some Expenses are automatically created when a Product is purchased.
Other Expenses are direct standalone transactions such as Uber, bills, dining, or services.

### Trip — operational context

Trips affect consumption calculations.

Trips are not primarily a travel-management feature.

## Product principle

> Operational state first. Financial insight second.

HomeOS should observe household operations well enough that the user can use its information to plan a budget externally or later.

It does not need to know salary, savings, or net worth.

## Initial users

The first users are Ahmed and Esraa.

The UX must be approachable to a non-technical household user.

## Delivery model

Initial delivery is a zero-cost iPhone-friendly PWA.

Primary install path:
- open the site,
- Add to Home Screen,
- use in standalone mode.

A future native iOS build may be produced through Capacitor without rewriting the React application.

## V1 success

V1 is successful when it can reliably support:

- authentication,
- operational Home screen,
- Items lifecycle,
- Product purchase,
- direct Expenses,
- Products catalog,
- Trips,
- master data management,
- usage calculations,
- consistent mobile UX,
- existing Supabase rules and security.
