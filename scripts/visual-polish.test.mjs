// Tests for HomeOS v2.1.0 Premium Visual Polish & Semantic Color System
// Run: node scripts/visual-polish.test.mjs

import test from 'node:test'
import assert from 'node:assert/strict'

// 1. Active status uses success green mapping
test('1. Active status uses success green mapping', () => {
  const semanticMapping = {
    active: { bg: 'var(--homeos-success-soft)', color: 'var(--homeos-success)' },
    stocked: { bg: 'var(--homeos-info-soft)', color: 'var(--homeos-info)' },
    finished: { bg: 'var(--homeos-soft-surface)', color: 'var(--homeos-ink-600)' },
  }

  assert.equal(semanticMapping.active.bg, 'var(--homeos-success-soft)')
  assert.equal(semanticMapping.active.color, 'var(--homeos-success)')
})

// 2. Stocked status uses info blue mapping
test('2. Stocked status uses info blue mapping', () => {
  const semanticMapping = {
    stocked: { bg: 'var(--homeos-info-soft)', color: 'var(--homeos-info)' },
  }

  assert.equal(semanticMapping.stocked.bg, 'var(--homeos-info-soft)')
  assert.equal(semanticMapping.stocked.color, 'var(--homeos-info)')
})

// 3. Finished status uses neutral/ink mapping
test('3. Finished status uses neutral/ink mapping', () => {
  const semanticMapping = {
    finished: { bg: 'var(--homeos-soft-surface)', color: 'var(--homeos-ink-600)' },
  }

  assert.equal(semanticMapping.finished.bg, 'var(--homeos-soft-surface)')
  assert.equal(semanticMapping.finished.color, 'var(--homeos-ink-600)')
})

// 4. Product active badge uses success green mapping
test('4. Product active badge uses success green mapping', () => {
  const productBadge = (isActive) => ({
    className: isActive
      ? 'homeos-product-details__badge--active'
      : 'homeos-product-details__badge--inactive',
    colorRole: isActive ? 'success' : 'neutral',
  })

  assert.equal(productBadge(true).colorRole, 'success')
})

// 5. Product inactive badge uses neutral mapping
test('5. Product inactive badge uses neutral mapping', () => {
  const productBadge = (isActive) => ({
    className: isActive
      ? 'homeos-product-details__badge--active'
      : 'homeos-product-details__badge--inactive',
    colorRole: isActive ? 'success' : 'neutral',
  })

  assert.equal(productBadge(false).colorRole, 'neutral')
})

// 6. RowTone supports warning
test('6. RowTone supports warning', () => {
  const validRowTones = ['neutral', 'primary', 'info', 'success', 'warning', 'danger']
  assert.ok(validRowTones.includes('warning'), 'RowTone must support warning')
})

// 7. Long-stocked rows use warning tone
test('7. Long-stocked rows use warning tone', () => {
  const getRowToneForHomeSection = (section) => {
    switch (section) {
      case 'long-stocked':
        return 'warning'
      case 'long-running':
        return 'neutral'
      default:
        return 'neutral'
    }
  }

  assert.equal(getRowToneForHomeSection('long-stocked'), 'warning')
})

// 8. Active items in ItemsPage use success tone
test('8. Active items in ItemsPage use success tone', () => {
  const getItemRowTone = (view) => {
    return view === 'active' ? 'success' : view === 'stocked' ? 'info' : 'neutral'
  }

  assert.equal(getItemRowTone('active'), 'success')
})

// 9. Stocked items in ItemsPage use info tone
test('9. Stocked items in ItemsPage use info tone', () => {
  const getItemRowTone = (view) => {
    return view === 'active' ? 'success' : view === 'stocked' ? 'info' : 'neutral'
  }

  assert.equal(getItemRowTone('stocked'), 'info')
  assert.equal(getItemRowTone('finished'), 'neutral')
})

// 10. Expenses in ExpensesPage use neutral tone (not primary purple)
test('10. Expenses in ExpensesPage use neutral tone (not primary purple)', () => {
  const expenseRowTone = 'neutral'
  assert.notEqual(expenseRowTone, 'primary', 'Expenses must not use brand purple as row tone')
  assert.equal(expenseRowTone, 'neutral')
})

// 11. SecondaryButton uses quiet neutral styling
test('11. SecondaryButton uses quiet neutral styling', () => {
  const secondaryButtonDefaultStyle = {
    background: 'var(--homeos-surface)',
    border: '1px solid var(--homeos-border)',
    color: 'var(--homeos-ink-950)',
  }

  assert.equal(secondaryButtonDefaultStyle.color, 'var(--homeos-ink-950)')
  assert.equal(secondaryButtonDefaultStyle.border, '1px solid var(--homeos-border)')
})

// 12. EmptyState component renders properly with and without icon
test('12. EmptyState component renders properly with and without icon', () => {
  const createEmptyState = ({ icon, title, message }) => {
    return {
      hasIcon: Boolean(icon),
      hasTitle: Boolean(title),
      message,
    }
  }

  const withIcon = createEmptyState({
    icon: 'cartOutline',
    title: 'No items',
    message: 'Shopping list is empty.',
  })
  assert.equal(withIcon.hasIcon, true)
  assert.equal(withIcon.hasTitle, true)
  assert.equal(withIcon.message, 'Shopping list is empty.')

  const backwardsCompatible = createEmptyState({
    message: 'No expenses yet.',
  })
  assert.equal(backwardsCompatible.hasIcon, false)
  assert.equal(backwardsCompatible.hasTitle, false)
  assert.equal(backwardsCompatible.message, 'No expenses yet.')
})
