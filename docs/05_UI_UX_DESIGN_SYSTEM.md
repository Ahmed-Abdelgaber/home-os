# HomeOS UI/UX Design System — V2

> Single visual and UX reference for all HomeOS screens.

---

## 1. Product UX philosophy

HomeOS is a **household operations application**, not a personal finance app.

The UI should help the household understand:
- what is happening now,
- what needs attention,
- what has been running too long,
- what has been stocked too long,
- what changed recently,
- what operations cost.

**Operational state first, financial insight second.**

The front-line object is the **Item**, especially the Active Item.

---

## 2. Visual personality

HomeOS should feel:

- modern,
- friendly,
- warm,
- premium but approachable,
- calm,
- mobile-first,
- native-mobile inspired,
- clean,
- slightly playful.

Avoid:
- enterprise dashboards,
- dense tables,
- spreadsheet layouts,
- harsh finance-app visuals,
- AppSheet/Google Form aesthetics,
- unnecessary charts,
- technical database terminology.

---

## 3. Color system

### Brand

```text
Primary 500  #6C5CE7
Primary 600  #5B4BE0
Primary 100  #ECE9FF
Primary 50   #F6F4FF
```

### Neutral

```text
Ink 950      #12131A
Ink 800      #242631
Ink 600      #5F6475
Ink 500      #787E91

Surface      #FFFFFF
Background   #F7F8FC
Soft Surface #F1F3F8
Border       #E7E9F0
Header       #14171D
```

### Semantic

```text
Success       #34B653
Success Soft  #EAF8EE

Warning       #E4A11B
Warning Soft  #FFF6DC

Danger        #EC4964
Danger Soft   #FDECEF

Info          #4285F4
Info Soft     #EAF2FF
```

Use semantic colors only for meaning.

A positive percentage sign does not automatically mean green.
For example, spending `+12%` may use brand violet, not Success.

---

## 4. Typography

Use a system-native friendly stack.

Recommended CSS:

```text
-apple-system, BlinkMacSystemFont, "Inter", "SF Pro Text", "Segoe UI", sans-serif
```

Scale:

```text
Hero number       32–42px / 700
Page title        28–32px / 700
Section title     18–20px / 700
Card title        16–18px / 600
Body              14–16px / 400–500
Metadata          12–14px / 400–500
```

Important numbers should be easy to scan.

---

## 5. Spacing

Use an 8-point system:

```text
4
8
12
16
20
24
32
40+
```

Default mobile page horizontal padding:

```text
20px
```

Prefer logical parent grouping with consistent `gap` rather than arbitrary per-child margins.

---

## 6. Radius

```text
Small controls     10–12px
Buttons            12–14px
Standard cards     16–20px
Hero cards         22–26px
Sheets             24–30px top corners
Circular controls  999px
```

Rounded geometry is a strong part of HomeOS identity.

---

## 7. Shadows/borders

Cards:
- subtle 1px neutral border where useful,
- low-opacity shadow,
- blur around 12–20px,
- Y offset around 3–6px.

Avoid heavy elevation.

Grouped lists should normally be:
- one outer card,
- dividers between rows,
not one floating card per row.

---

## 8. App shell

Authenticated screens share:

- safe-area-aware shell,
- page/header area,
- light main content,
- bottom tab navigation,
- global Add action.

### Bottom tabs

```text
Home
Items
Expenses
More
```

Selected:
- violet.

Inactive:
- neutral gray.

Labels remain visible.

### Global Add button

Centered between Items and Expenses visually.

Style:
- circular,
- violet,
- white plus,
- soft shadow.

Opens:

```text
Buy Product
Add Expense
Add Trip
Add Product
```

---

## 9. Header language

Home may use a stronger dark branded header.

Other pages should preserve the same family:
- strong readable page title,
- consistent safe-area spacing,
- contextual back/action controls,
- no generic mismatched navigation bars.

Header background reference:

```text
#14171D
```

---

## 10. Component language

Initial reusable visual components:

```text
HomeOSHeader
BottomTabBar
GlobalAddButton
SectionHeader
HeroSnapshotCard
GroupedCard
ItemRow
ExpenseRow
ActivityRow
TripSummaryRow
StatusChip
PrimaryButton
SecondaryButton
EmptyState
QuickAddSheet
ConfirmationSheet
```

Do not make every component generic enough for hypothetical future apps.
HomeOS-specific components are acceptable.

---

## 11. Buttons

### Primary

```text
Background  #6C5CE7
Text        white
Radius      12–14px
Height      ~48px
```

### Secondary/outline

```text
Background  white
Border      Primary 500
Text        Primary 500
```

### Destructive

Danger styling only where deletion is actually allowed.

---

## 12. Forms

Forms must feel mobile-first.

Rules:
- avoid long dense pages,
- group related fields,
- use Product/Person/Category/Account selectors instead of uncontrolled free text when master data exists,
- use sensible defaults,
- primary action is obvious,
- use sheet/modal selection where it improves speed,
- error messages are direct and local to the field.

Do not make forms resemble AppSheet or Google Forms.

---

## 13. Empty states

Friendly and operational.

Examples:

```text
Everything looks normal.
```

```text
Nothing has been stocked for too long.
```

```text
Everyone is home.
```

Do not leave blank sections.

Sections that are purely exception-driven may be hidden when empty.

---

## 14. Product imagery

Optional but useful for recognition.

Rules:
- small thumbnails in rows,
- rounded light container,
- secondary to text,
- placeholder icon if missing.

Do not make image handling a blocker for V1.

---

## 15. Icons

Use one consistent rounded icon family.

Avoid mixing unrelated icon sets.

Icons should be:
- simple,
- readable,
- mostly outlined/rounded,
- semantically colored only when meaningful.

---

## 16. Motion

Use subtle motion:

```text
150–250ms
```

Appropriate:
- page transitions,
- sheet transitions,
- button press feedback,
- small list changes.

Avoid decorative animation that slows daily operations.

---

## 17. Mobile/PWA behavior

Primary viewport:

```text
390–430px
```

Requirements:
- safe areas,
- 44px minimum interactive targets,
- no hover-dependent controls,
- no layout relying on desktop widths,
- bottom navigation reachable by thumb,
- scroll remains smooth,
- standalone PWA should not look like a web document.

---

## 18. Screen consistency rule

Every screen must reuse:

- same tokens,
- same typography,
- same spacing rhythm,
- same radii,
- same icon family,
- same navigation behavior,
- same button language,
- same section-heading pattern,
- same empty-state tone.

A new screen must not introduce a random new visual identity.

---

## 19. Design review checklist

Before accepting a screen:

```text
[ ] Does it feel operational rather than financial?
[ ] Is the primary action obvious?
[ ] Can the user scan it in seconds?
[ ] Does it use the HomeOS tokens?
[ ] Does it reuse established interaction patterns?
[ ] Are spacing/radii consistent?
[ ] Are database terms hidden?
[ ] Is it comfortable at iPhone width?
[ ] Does it look like the same app as Home?
[ ] Is unnecessary information absent?
```
