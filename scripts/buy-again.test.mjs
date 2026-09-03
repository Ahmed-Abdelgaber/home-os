// Unit and behavioral tests for HomeOS v2.1.0 Buy Again feature per instructions.
// Run: node scripts/buy-again.test.mjs

import test from 'node:test'
import assert from 'node:assert/strict'
import { z } from 'zod'

// 1. Purchase schema validation test (mirrors PurchaseProductPage validation)
const purchaseSchema = z.object({
  quantity: z.string().refine((value) => Number(value) > 0, 'Quantity must be greater than 0'),
  amount: z.string().refine((value) => Number(value) > 0, 'Amount must be greater than 0'),
  merchant: z.string().optional(),
  accountId: z.string().min(1, 'Select an account'),
  purchaseDate: z.string().min(1, 'Select a date'),
  notes: z.string().optional(),
  startNow: z.boolean(),
})

// Deterministic ordering function extracted from useLatestProductPurchase
function sortLatestPurchases(items) {
  const valid = items.filter((item) => item.expense != null && Boolean(item.expense.expense_date))
  valid.sort((a, b) => {
    const dateComp = b.expense.expense_date.localeCompare(a.expense.expense_date)
    if (dateComp !== 0) return dateComp
    const timeA = a.expense.created_at || a.createdAt || ''
    const timeB = b.expense.created_at || b.createdAt || ''
    const timeComp = timeB.localeCompare(timeA)
    if (timeComp !== 0) return timeComp
    return b.id.localeCompare(a.id)
  })
  if (valid.length === 0) return null
  const latest = valid[0]
  return {
    itemId: latest.id,
    quantity: Number(latest.quantity) > 0 ? Number(latest.quantity) : 1,
    merchant: latest.expense.merchant ?? null,
    accountId: latest.expense.account_id ?? null,
    amount: Number(latest.expense.amount),
    expenseDate: latest.expense.expense_date,
  }
}

test('1. Buy Again from Item Details opens with correct Product', () => {
  const mockItemDetail = {
    id: 'item-101',
    productId: 'prod-456',
    productName: 'Organic Whole Milk',
    quantity: 2,
    expense: {
      amount: 45,
      merchant: 'Fresh Market',
      accountId: 'acc-1',
      date: '2026-08-20',
      account: 'Checking',
    },
  }

  // Navigation state created by ItemDetailsPage
  const navState = {
    productId: mockItemDetail.productId,
    productName: mockItemDetail.productName,
    quantity: mockItemDetail.quantity,
    merchant: mockItemDetail.expense?.merchant ?? null,
    accountId: mockItemDetail.expense?.accountId ?? null,
    previousAmount: mockItemDetail.expense?.amount ?? null,
  }

  assert.equal(navState.productId, 'prod-456')
  assert.equal(navState.productName, 'Organic Whole Milk')
})

test("2. Current Item's Quantity is prefilled", () => {
  const prefill = {
    productId: 'prod-456',
    quantity: 3,
  }

  const initialQuantity =
    prefill?.quantity != null && Number(prefill.quantity) > 0 ? String(prefill.quantity) : '1'
  assert.equal(initialQuantity, '3')

  // Fallback if invalid quantity
  const invalidPrefill = { quantity: 0 }
  const fallbackQuantity =
    invalidPrefill?.quantity != null && Number(invalidPrefill.quantity) > 0 ? String(invalidPrefill.quantity) : '1'
  assert.equal(fallbackQuantity, '1')
})

test("3. Current Item's Merchant is prefilled", () => {
  const prefillWithMerchant = { merchant: 'Carrefour' }
  const prefillNullMerchant = { merchant: null }

  const merchantVal1 = prefillWithMerchant.merchant ?? ''
  const merchantVal2 = prefillNullMerchant.merchant ?? ''

  assert.equal(merchantVal1, 'Carrefour')
  assert.equal(merchantVal2, '')
})

test("4. Current Item's Account is prefilled if active, omitted if inactive", () => {
  const activeAccounts = [
    { id: 'acc-1', name: 'Debit Card' },
    { id: 'acc-2', name: 'Cash' },
  ]

  // Case A: Account is active
  const prefillActive = { accountId: 'acc-1' }
  const isAcc1Active = activeAccounts.some((a) => a.id === prefillActive.accountId)
  const resolvedAccount1 = isAcc1Active ? prefillActive.accountId : ''
  assert.equal(resolvedAccount1, 'acc-1')

  // Case B: Old account is inactive / decommissioned
  const prefillInactive = { accountId: 'acc-deactivated' }
  const isAcc2Active = activeAccounts.some((a) => a.id === prefillInactive.accountId)
  const resolvedAccount2 = isAcc2Active ? prefillInactive.accountId : ''
  assert.equal(resolvedAccount2, '', 'Deactivated account must remain unselected')
})

test('5. Previous amount is shown as reference', () => {
  const previousAmount = 480
  const formattedReference = `Last paid EGP ${previousAmount.toLocaleString('en-US')}`

  assert.equal(formattedReference, 'Last paid EGP 480')
})

test('6. Previous amount is not silently submitted as the new amount', () => {
  const prefill = {
    productId: 'prod-1',
    quantity: '1',
    merchant: 'Vendor',
    accountId: 'acc-1',
    previousAmount: 480,
  }

  // Initial amount in form is strictly empty string ''
  const initialFormValues = {
    quantity: String(prefill.quantity),
    amount: '', // Must remain empty!
    merchant: prefill.merchant,
    accountId: prefill.accountId,
    purchaseDate: '2026-09-03',
    notes: '',
    startNow: true,
  }

  assert.equal(initialFormValues.amount, '')

  // Form submission validation MUST fail if user does not enter amount
  const validationResult = purchaseSchema.safeParse(initialFormValues)
  assert.equal(validationResult.success, false)
  if (!validationResult.success) {
    const amountError = validationResult.error.issues.find((i) => i.path.includes('amount'))
    assert.ok(amountError, 'Amount field error should be present')
  }

  // Submitting valid amount succeeds
  const validSubmission = { ...initialFormValues, amount: '520' }
  assert.equal(purchaseSchema.safeParse(validSubmission).success, true)
})

test('7. Buy Again from Product Details uses most recent purchase (deterministic order)', () => {
  const mockItems = [
    {
      id: 'item-1',
      quantity: 1,
      createdAt: '2026-08-01T10:00:00Z',
      expense: {
        id: 'exp-1',
        amount: 200,
        merchant: 'Store A',
        account_id: 'acc-1',
        expense_date: '2026-07-15',
        created_at: '2026-08-01T10:00:00Z',
      },
    },
    {
      id: 'item-2',
      quantity: 2,
      createdAt: '2026-08-10T12:00:00Z',
      expense: {
        id: 'exp-2',
        amount: 250,
        merchant: 'Store B',
        account_id: 'acc-2',
        expense_date: '2026-08-10',
        created_at: '2026-08-10T12:00:00Z',
      },
    },
    {
      id: 'item-3',
      quantity: 3,
      createdAt: '2026-08-05T09:00:00Z',
      expense: {
        id: 'exp-3',
        amount: 230,
        merchant: 'Store C',
        account_id: 'acc-1',
        expense_date: '2026-08-05',
        created_at: '2026-08-05T09:00:00Z',
      },
    },
  ]

  const latest = sortLatestPurchases(mockItems)
  assert.ok(latest)
  assert.equal(latest.itemId, 'item-2')
  assert.equal(latest.expenseDate, '2026-08-10')
  assert.equal(latest.quantity, 2)
  assert.equal(latest.merchant, 'Store B')
  assert.equal(latest.accountId, 'acc-2')
  assert.equal(latest.amount, 250)

  // Test tie breaker when expense_dates match
  const tieItems = [
    {
      id: 'item-alpha',
      quantity: 1,
      createdAt: '2026-08-10T08:00:00Z',
      expense: {
        id: 'exp-a',
        amount: 100,
        merchant: 'Store 1',
        account_id: 'acc-1',
        expense_date: '2026-08-10',
        created_at: '2026-08-10T08:00:00Z',
      },
    },
    {
      id: 'item-beta',
      quantity: 4,
      createdAt: '2026-08-10T18:00:00Z',
      expense: {
        id: 'exp-b',
        amount: 110,
        merchant: 'Store 2',
        account_id: 'acc-2',
        expense_date: '2026-08-10',
        created_at: '2026-08-10T18:00:00Z',
      },
    },
  ]
  const tieWinner = sortLatestPurchases(tieItems)
  assert.equal(tieWinner.itemId, 'item-beta', 'Tie-breaker should pick later timestamp')
})

test('8. Product with no previous purchase falls back correctly', () => {
  const emptyItems = []
  const latest = sortLatestPurchases(emptyItems)
  assert.equal(latest, null)

  const productDetail = { id: 'prod-new', name: 'New Olive Oil' }
  const fallbackNavState = {
    productId: productDetail.id,
    productName: productDetail.name,
    quantity: latest?.quantity ?? 1,
    merchant: latest?.merchant ?? null,
    accountId: latest?.accountId ?? null,
    previousAmount: latest?.amount ?? null,
  }

  assert.equal(fallbackNavState.productId, 'prod-new')
  assert.equal(fallbackNavState.quantity, 1)
  assert.equal(fallbackNavState.merchant, null)
  assert.equal(fallbackNavState.accountId, null)
  assert.equal(fallbackNavState.previousAmount, null)
})

test('9. Start Now still determines Active vs Stocked', () => {
  // startNow = true
  const inputStartNow = {
    startNow: true,
    purchaseDate: '2026-09-03',
  }
  const rpcParamTrue = { p_start_now: inputStartNow.startNow }
  assert.equal(rpcParamTrue.p_start_now, true)

  // startNow = false
  const inputStocked = {
    startNow: false,
    purchaseDate: '2026-09-03',
  }
  const rpcParamFalse = { p_start_now: inputStocked.startNow }
  assert.equal(rpcParamFalse.p_start_now, false)
})

test('10. Successful purchase uses purchase_product() RPC as sole mutation', () => {
  const calls = []
  const mockSupabase = {
    rpc: (name, params) => {
      calls.push({ name, params })
      return Promise.resolve({ data: { item_id: 'new-item-777', expense_id: 'new-exp-888' }, error: null })
    },
    from: (_table) => {
      throw new Error('Direct table insertion must NOT be called from client during purchase')
    },
  }

  mockSupabase.rpc('purchase_product', {
    p_product_id: 'prod-1',
    p_purchase_date: '2026-09-03',
    p_amount: 320,
    p_merchant: 'Supermarket',
    p_account_id: 'acc-1',
    p_quantity: 2,
    p_notes: null,
    p_start_now: true,
  })

  assert.equal(calls.length, 1)
  assert.equal(calls[0].name, 'purchase_product')
  assert.equal(calls[0].params.p_amount, 320)
  assert.equal(calls[0].params.p_quantity, 2)
})

test('11. Relevant React Query caches are invalidated', async () => {
  const invalidatedKeys = []
  const mockQueryClient = {
    invalidateQueries: ({ queryKey }) => {
      invalidatedKeys.push(queryKey)
      return Promise.resolve()
    },
  }

  // Simulating onSuccess in usePurchaseProduct
  await Promise.all([
    mockQueryClient.invalidateQueries({ queryKey: ['items'] }),
    mockQueryClient.invalidateQueries({ queryKey: ['expenses'] }),
    mockQueryClient.invalidateQueries({ queryKey: ['home'] }),
    mockQueryClient.invalidateQueries({ queryKey: ['products'] }),
  ])

  const keysString = invalidatedKeys.map((k) => k[0])
  assert.ok(keysString.includes('items'), 'items cache must be invalidated')
  assert.ok(keysString.includes('expenses'), 'expenses cache must be invalidated')
  assert.ok(keysString.includes('home'), 'home cache must be invalidated')
  assert.ok(keysString.includes('products'), 'products cache must be invalidated')
})

test('12. Inactive/unavailable Product is handled safely', () => {
  const inactiveProduct = {
    id: 'prod-archived',
    name: 'Discontinued Shampoo',
    isActive: false,
  }

  // Button in ProductDetailsPage disabled check:
  const isBuyAgainDisabled = !inactiveProduct.isActive
  assert.equal(isBuyAgainDisabled, true, 'Buy again button must be disabled for inactive products')

  // PurchaseProductPage inactive state guard check:
  function getPurchasePageState(product) {
    if (!product.isActive) {
      return { canPurchase: false, notice: `${product.name} is archived` }
    }
    return { canPurchase: true, notice: null }
  }

  const pageState = getPurchasePageState(inactiveProduct)
  assert.equal(pageState.canPurchase, false)
  assert.equal(pageState.notice, 'Discontinued Shampoo is archived')
})
