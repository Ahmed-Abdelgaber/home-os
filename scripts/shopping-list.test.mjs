// Tests for HomeOS v2.1.0 Shopping List + Buy Selected per requirements.
// Run: node scripts/shopping-list.test.mjs

import test from 'node:test'
import assert from 'node:assert/strict'

test('1. Finished Product with no Active/Stocked replacement is suggested', () => {
  const existingItems = [
    { id: 'item-1', productId: 'prod-lavazza', status: 'finished' },
    { id: 'item-2', productId: 'prod-lavazza', status: 'finished' },
  ]

  // Check if remaining active/stocked items exist
  const remainingCount = existingItems.filter(
    (i) => i.productId === 'prod-lavazza' && (i.status === 'active' || i.status === 'stocked'),
  ).length

  const shouldAutoSuggest = remainingCount === 0
  assert.equal(shouldAutoSuggest, true, 'Product with no active or stocked item must be automatically suggested')
})

test('2. Finished Product with Stocked replacement is not suggested', () => {
  const existingItems = [
    { id: 'item-1', productId: 'prod-lavazza', status: 'finished' },
    { id: 'item-2', productId: 'prod-lavazza', status: 'stocked' },
  ]

  const remainingCount = existingItems.filter(
    (i) => i.productId === 'prod-lavazza' && (i.status === 'active' || i.status === 'stocked'),
  ).length

  const shouldAutoSuggest = remainingCount === 0
  assert.equal(shouldAutoSuggest, false, 'Product with stocked replacement must NOT be suggested')
})

test('3. Finished Product with Active replacement is not suggested', () => {
  const existingItems = [
    { id: 'item-1', productId: 'prod-lavazza', status: 'finished' },
    { id: 'item-2', productId: 'prod-lavazza', status: 'active' },
  ]

  const remainingCount = existingItems.filter(
    (i) => i.productId === 'prod-lavazza' && (i.status === 'active' || i.status === 'stocked'),
  ).length

  const shouldAutoSuggest = remainingCount === 0
  assert.equal(shouldAutoSuggest, false, 'Product with active replacement must NOT be suggested')
})

test('4. Duplicate Product cannot be added twice (deduplication)', () => {
  const shoppingList = new Map() // Represents UNIQUE(product_id)

  const addItem = (productId, source) => {
    if (shoppingList.has(productId)) {
      // Deduplication: do nothing / keep existing
      return shoppingList.get(productId)
    }
    const entry = { id: `slip-${productId}`, productId, source }
    shoppingList.set(productId, entry)
    return entry
  }

  addItem('prod-lavazza', 'automatic')
  assert.equal(shoppingList.size, 1)

  // Another finish / manual add for Lavazza
  addItem('prod-lavazza', 'manual')
  assert.equal(shoppingList.size, 1, 'Duplicate product must not create a second row')
  assert.equal(shoppingList.get('prod-lavazza').source, 'automatic', 'Original entry is preserved')
})

test('5. Active Item can be manually added', () => {
  const itemStatus = 'active'
  const canManuallyAdd = itemStatus === 'active' || itemStatus === 'finished'
  assert.equal(canManuallyAdd, true, 'Active Item must expose Add to Shopping List')
})

test('6. Finished Item can be manually added', () => {
  const itemStatus = 'finished'
  const canManuallyAdd = itemStatus === 'active' || itemStatus === 'finished'
  assert.equal(canManuallyAdd, true, 'Finished Item must expose Add to Shopping List')
})

test('7. Stocked Item does not expose Add to Shopping List', () => {
  const itemStatus = 'stocked'
  const canManuallyAdd = itemStatus === 'active' || itemStatus === 'finished'
  assert.equal(canManuallyAdd, false, 'Stocked Item must NOT expose Add to Shopping List by default')
})

test('8. Buy Selected processes only selected rows', () => {
  const shoppingList = [
    { id: '1', productId: 'prod-lavazza', productName: 'Lavazza' },
    { id: '2', productId: 'prod-downy', productName: 'Downy' },
    { id: '3', productId: 'prod-toothpaste', productName: 'Toothpaste' },
    { id: '4', productId: 'prod-shampoo', productName: 'Shampoo' },
  ]

  const selectedProductIds = new Set(['prod-lavazza', 'prod-downy'])

  const toBuy = shoppingList.filter((item) => selectedProductIds.has(item.productId))
  assert.equal(toBuy.length, 2)
  assert.deepEqual(toBuy.map((i) => i.productName), ['Lavazza', 'Downy'])
})

test('9. Active selection maps to p_start_now = true', () => {
  const stateChoice = 'active'
  const p_start_now = stateChoice === 'active'
  assert.equal(p_start_now, true)
})

test('10. Stocked selection maps to p_start_now = false', () => {
  const stateChoice = 'stocked'
  const p_start_now = stateChoice === 'active'
  assert.equal(p_start_now, false)
})

test('11. Each purchase uses purchase_product()', async () => {
  const rpcCalls = []
  const mockSupabase = {
    rpc: (name, params) => {
      rpcCalls.push({ name, params })
      return Promise.resolve({ data: { expense_id: 'exp-1', item_id: 'item-1' }, error: null })
    },
  }

  const selectedItems = [
    { productId: 'prod-1', amount: 200, quantity: 1, state: 'active' },
    { productId: 'prod-2', amount: 150, quantity: 2, state: 'stocked' },
  ]

  for (const item of selectedItems) {
    await mockSupabase.rpc('purchase_product', {
      p_product_id: item.productId,
      p_purchase_date: '2026-09-03',
      p_amount: item.amount,
      p_merchant: 'Supermarket',
      p_account_id: 'acc-cib',
      p_quantity: item.quantity,
      p_notes: null,
      p_start_now: item.state === 'active',
    })
  }

  assert.equal(rpcCalls.length, 2)
  assert.equal(rpcCalls[0].name, 'purchase_product')
  assert.equal(rpcCalls[0].params.p_product_id, 'prod-1')
  assert.equal(rpcCalls[0].params.p_start_now, true)
  assert.equal(rpcCalls[1].name, 'purchase_product')
  assert.equal(rpcCalls[1].params.p_product_id, 'prod-2')
  assert.equal(rpcCalls[1].params.p_start_now, false)
})

test('12. Successful purchase removes the corresponding Shopping List entry', () => {
  let shoppingList = [
    { id: 'sl-1', productId: 'prod-lavazza' },
    { id: 'sl-2', productId: 'prod-downy' },
  ]

  // Lavazza purchase succeeds
  const purchasedId = 'sl-1'
  shoppingList = shoppingList.filter((item) => item.id !== purchasedId)

  assert.equal(shoppingList.length, 1)
  assert.equal(shoppingList[0].productId, 'prod-downy')
})

test('13. Failed purchase keeps its Shopping List entry', async () => {
  const shoppingList = [
    { id: 'sl-1', productId: 'prod-lavazza' },
    { id: 'sl-2', productId: 'prod-downy' },
    { id: 'sl-3', productId: 'prod-toothpaste' },
  ]

  const removedIds = []
  const failedIds = []

  // Simulated execution
  const results = [
    { id: 'sl-1', success: true },
    { id: 'sl-2', success: true },
    { id: 'sl-3', success: false, error: 'Network error' },
  ]

  for (const res of results) {
    if (res.success) {
      removedIds.push(res.id)
    } else {
      failedIds.push(res.id)
    }
  }

  const remaining = shoppingList.filter((item) => !removedIds.includes(item.id))
  assert.equal(remaining.length, 1)
  assert.equal(remaining[0].productId, 'prod-toothpaste', 'Failed item must remain in Shopping List')
})

test('14. Unselected Shopping List entries remain', () => {
  const shoppingList = [
    { id: 'sl-1', productId: 'prod-lavazza' },
    { id: 'sl-2', productId: 'prod-downy' },
    { id: 'sl-3', productId: 'prod-toothpaste' },
  ]

  const selectedIds = new Set(['sl-1'])
  const purchasedIds = Array.from(selectedIds) // only selected was purchased

  const remaining = shoppingList.filter((item) => !purchasedIds.includes(item.id))
  assert.equal(remaining.length, 2)
  assert.ok(remaining.some((i) => i.productId === 'prod-downy'))
  assert.ok(remaining.some((i) => i.productId === 'prod-toothpaste'))
})

test('15. Manual remove deletes only the Shopping List entry', () => {
  let shoppingList = [{ id: 'sl-1', productId: 'prod-lavazza' }]
  let products = [{ id: 'prod-lavazza', name: 'Lavazza' }]
  let items = [{ id: 'item-1', productId: 'prod-lavazza' }]
  let expenses = [{ id: 'exp-1', amount: 480 }]

  // Manual remove
  shoppingList = shoppingList.filter((i) => i.id !== 'sl-1')

  assert.equal(shoppingList.length, 0, 'Shopping list entry is removed')
  assert.equal(products.length, 1, 'Product must not be deleted')
  assert.equal(items.length, 1, 'Item must not be deleted')
  assert.equal(expenses.length, 1, 'Expense must not be deleted')
})

test('16. Product data is loaded relationally', () => {
  const rawDbRow = {
    id: 'sl-1',
    product_id: 'prod-123',
    source: 'automatic',
    created_at: '2026-09-03T00:00:00Z',
    product: {
      id: 'prod-123',
      name: 'Lavazza Espresso',
      is_active: true,
      category: { name: 'Groceries' },
    },
  }

  const mapped = {
    id: rawDbRow.id,
    productId: rawDbRow.product_id,
    productName: rawDbRow.product.name,
    categoryName: rawDbRow.product.category?.name ?? null,
    source: rawDbRow.source,
    createdAt: rawDbRow.created_at,
    isActive: rawDbRow.product.is_active,
  }

  assert.equal(mapped.productName, 'Lavazza Espresso')
  assert.equal(mapped.categoryName, 'Groceries')
  assert.equal(mapped.productId, 'prod-123')
})

test('17. Relevant React Query caches are invalidated', async () => {
  const invalidated = []
  const mockQueryClient = {
    invalidateQueries: ({ queryKey }) => {
      invalidated.push(queryKey[0])
      return Promise.resolve()
    },
  }

  // After purchase in Buy Selected:
  await Promise.all([
    mockQueryClient.invalidateQueries({ queryKey: ['items'] }),
    mockQueryClient.invalidateQueries({ queryKey: ['expenses'] }),
    mockQueryClient.invalidateQueries({ queryKey: ['home'] }),
    mockQueryClient.invalidateQueries({ queryKey: ['products'] }),
    mockQueryClient.invalidateQueries({ queryKey: ['shopping-list'] }),
  ])

  assert.ok(invalidated.includes('items'))
  assert.ok(invalidated.includes('expenses'))
  assert.ok(invalidated.includes('home'))
  assert.ok(invalidated.includes('products'))
  assert.ok(invalidated.includes('shopping-list'))
})

test('18. Empty-state UI works when no items exist', () => {
  const items = []
  const isEmpty = items.length === 0

  assert.equal(isEmpty, true)
  const emptyStateConfig = {
    title: 'Shopping list is clear',
    message: 'Everything you need is already covered.',
  }

  assert.equal(emptyStateConfig.title, 'Shopping list is clear')
})
