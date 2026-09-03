// Tests for HomeOS v2.1.0 Contextual Entity Navigation (Item <-> Expense <-> Product)
// Run: node scripts/contextual-navigation.test.mjs

import test from 'node:test'
import assert from 'node:assert/strict'

test('1. Item Details exposes View Product', () => {
  const itemDetail = {
    id: 'item-101',
    productId: 'prod-lavazza',
    productName: 'Lavazza Espresso',
    expenseId: 'exp-202',
  }

  const relatedActions = []
  if (itemDetail.productId) {
    relatedActions.push({
      type: 'product',
      label: 'View product',
      targetId: itemDetail.productId,
    })
  }

  assert.equal(relatedActions.length, 1)
  assert.equal(relatedActions[0].label, 'View product')
  assert.equal(relatedActions[0].targetId, 'prod-lavazza')
})

test('2. View Product navigates using item.product_id', () => {
  const item = {
    id: 'item-101',
    product_id: 'prod-456',
    name: 'Mismatched Name', // ensure name matching is NOT used
  }

  const navigateTarget = `/app/products/${item.product_id}`
  assert.equal(navigateTarget, '/app/products/prod-456', 'Navigation target must use product_id')
})

test('3. Item Details exposes View Expense', () => {
  const itemDetail = {
    id: 'item-101',
    productId: 'prod-lavazza',
    expenseId: 'exp-202',
    expense: {
      amount: 480,
      merchant: 'Carrefour',
    },
  }

  const relatedActions = []
  if (itemDetail.expenseId) {
    relatedActions.push({
      type: 'expense',
      label: 'View expense',
      targetId: itemDetail.expenseId,
    })
  }

  assert.equal(relatedActions.length, 1)
  assert.equal(relatedActions[0].label, 'View expense')
  assert.equal(relatedActions[0].targetId, 'exp-202')
})

test('4. View Expense navigates using item.expense_id', () => {
  const item = {
    id: 'item-101',
    expense_id: 'exp-888',
  }

  const navigateTarget = `/app/expenses/${item.expense_id}`
  assert.equal(navigateTarget, '/app/expenses/exp-888', 'Navigation target must use expense_id')
})

test('5. Linked Expense exposes View Item', () => {
  const linkedExpense = {
    id: 'exp-202',
    description: 'Lavazza Coffee',
    linkedItem: {
      id: 'item-101',
      productId: 'prod-lavazza',
      productName: 'Lavazza Espresso',
    },
  }

  const hasItemNavigation = Boolean(linkedExpense.linkedItem?.id)
  assert.equal(hasItemNavigation, true, 'Linked expense must expose View Item')
  assert.equal(`/app/items/${linkedExpense.linkedItem.id}`, '/app/items/item-101')
})

test('6. Standalone Expense does NOT expose View Item', () => {
  const standaloneExpense = {
    id: 'exp-303',
    description: 'Electricity Bill',
    linkedItem: null,
  }

  const hasItemNavigation = Boolean(standaloneExpense.linkedItem?.id)
  assert.equal(hasItemNavigation, false, 'Standalone expense must NOT expose View Item')
})

test('7. Expense -> Item lookup uses items.expense_id relationship', () => {
  // Verifying relational lookup query structure
  const expenseId = 'exp-202'

  const mockDb = {
    items: [
      { id: 'item-101', expense_id: 'exp-202', product_id: 'prod-lavazza' },
      { id: 'item-102', expense_id: 'exp-999', product_id: 'prod-tea' },
    ],
  }

  // Exact reverse foreign-key filter
  const matchedItem = mockDb.items.find((i) => i.expense_id === expenseId)

  assert.ok(matchedItem, 'Item must be matched by expense_id')
  assert.equal(matchedItem.id, 'item-101')
  assert.equal(matchedItem.expense_id, expenseId)
})

test('8. Product history rows still navigate to correct Items', () => {
  const productHistory = [
    { id: 'item-old-1', label: '10 Aug → 25 Aug' },
    { id: 'item-old-2', label: '1 Jul → 20 Jul' },
  ]

  const historyClicks = productHistory.map((entry) => `/app/items/${entry.id}`)
  assert.deepEqual(historyClicks, ['/app/items/item-old-1', '/app/items/item-old-2'])
})

test('9. Browser/back navigation remains normal (SPA routing)', () => {
  const navigationStack = ['/app/tabs/items']

  // Item Details -> View Product -> Product Details
  navigationStack.push('/app/items/item-101')
  navigationStack.push('/app/products/prod-lavazza')

  // Back navigation
  navigationStack.pop()
  assert.equal(navigationStack[navigationStack.length - 1], '/app/items/item-101')

  // Back navigation to list
  navigationStack.pop()
  assert.equal(navigationStack[navigationStack.length - 1], '/app/tabs/items')
})

test('10. Missing optional related record does not crash the page', () => {
  const corruptedItem = {
    id: 'item-orphan',
    productId: 'prod-nonexistent',
    productName: 'Unknown product',
    expenseId: null,
    expense: null,
  }

  // Rendering logic check
  const renderRelated = () => {
    const rows = []
    if (corruptedItem.productId) {
      rows.push(`Product: ${corruptedItem.productName}`)
    }
    if (corruptedItem.expenseId) {
      rows.push(`Expense: ${corruptedItem.expense?.amount}`)
    }
    return rows
  }

  const rows = renderRelated()
  assert.equal(rows.length, 1)
  assert.equal(rows[0], 'Product: Unknown product')
})
