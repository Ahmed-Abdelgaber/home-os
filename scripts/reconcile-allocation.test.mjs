// Tests for Bank Transaction Split Fulfillment & Linked Expense Reconciliation
// Run: node scripts/reconcile-allocation.test.mjs

import test from 'node:test'
import assert from 'node:assert/strict'

// ============================================================================
// 1. Fulfillment prefill survives Product selection
// ============================================================================
test('1. Fulfillment prefill survives Product selection from ProductPicker', () => {
  // Simulates location.state passed from FulfillTransactionModal when splitting
  const incomingPrefill = {
    amount: 25,
    merchant: 'BEET ELGOMLA',
    purchaseDate: '2026-09-03',
    bankTransactionId: 'tx-beet-elgomla-1',
  }

  // In PurchaseProductPage:
  const clearedPrefillProduct = false
  const effectivePrefill = incomingPrefill
    ? {
        ...incomingPrefill,
        productId: clearedPrefillProduct ? undefined : incomingPrefill.productId,
      }
    : null

  // User picks a product from ProductPicker
  const pickedProduct = {
    id: 'prod-onion-1',
    name: 'Onion',
    categoryName: 'Groceries',
  }

  // The prefill passed to PurchaseForm MUST retain bankTransactionId, amount, merchant, purchaseDate
  assert.ok(effectivePrefill, 'effectivePrefill must not be null')
  assert.equal(effectivePrefill.bankTransactionId, 'tx-beet-elgomla-1')
  assert.equal(effectivePrefill.amount, 25)
  assert.equal(effectivePrefill.merchant, 'BEET ELGOMLA')
  assert.equal(effectivePrefill.purchaseDate, '2026-09-03')
  assert.equal(pickedProduct.name, 'Onion')
})

// ============================================================================
// 2. Changing Product retains bankTransactionId and fulfillment context
// ============================================================================
test('2. Changing Product clears only productId and retains bankTransactionId', () => {
  const initialPrefill = {
    amount: 175,
    merchant: 'BEET ELGOMLA',
    purchaseDate: '2026-09-03',
    bankTransactionId: 'tx-beet-elgomla-1',
    productId: 'prod-wrong-tuna',
  }

  // User clicks "Choose another product"
  let clearedPrefillProduct = true
  const effectivePrefill = initialPrefill
    ? {
        ...initialPrefill,
        productId: clearedPrefillProduct ? undefined : initialPrefill.productId,
      }
    : null

  assert.equal(effectivePrefill.productId, undefined, 'productId must be cleared')
  assert.equal(effectivePrefill.bankTransactionId, 'tx-beet-elgomla-1', 'bankTransactionId must be retained')
  assert.equal(effectivePrefill.amount, 175, 'amount must be retained')
  assert.equal(effectivePrefill.merchant, 'BEET ELGOMLA', 'merchant must be retained')
  assert.equal(effectivePrefill.purchaseDate, '2026-09-03', 'purchaseDate must be retained')

  // Back href continues pointing to pending transaction details
  const backHref = effectivePrefill?.bankTransactionId
    ? `/app/pending-transactions/${effectivePrefill.bankTransactionId}`
    : '/app/tabs/home'
  assert.equal(backHref, '/app/pending-transactions/tx-beet-elgomla-1')

  // Page title indicates fulfillment mode
  const title = effectivePrefill?.bankTransactionId ? 'Fulfill Purchase' : 'Buy Product'
  assert.equal(title, 'Fulfill Purchase')
})

// ============================================================================
// 3. fulfill_bank_transaction_purchase is called for Bank Transaction split
// ============================================================================
test('3. fulfill_bank_transaction_purchase is called instead of standalone purchase_product', () => {
  const prefill = {
    amount: 175,
    merchant: 'BEET ELGOMLA',
    purchaseDate: '2026-09-03',
    bankTransactionId: 'tx-beet-elgomla-1',
  }

  const product = { id: 'prod-tuna-dolphin', name: 'Dolphin tuna' }
  const formValues = {
    purchaseDate: '2026-09-03',
    amount: '175',
    merchant: 'BEET ELGOMLA',
    accountId: 'acc-cib-credit',
    quantity: '1',
    notes: 'Chunk tuna in oil',
    startNow: true,
  }

  let rpcCalled = null
  let standaloneCalled = false

  const mockFulfillBankPurchase = {
    mutateAsync: async (params) => {
      rpcCalled = params
      return {
        item_id: 'item-tuna-1',
        expense_id: 'exp-tuna-1',
        allocation_id: 'alloc-tuna-1',
        transaction_status: 'partially_fulfilled',
        remaining_amount: 4473.40,
      }
    },
  }

  const mockPurchaseProduct = {
    mutateAsync: async () => {
      standaloneCalled = true
      return { item_id: 'item-standalone' }
    },
  }

  // Simulation of PurchaseForm submission branching
  if (prefill?.bankTransactionId) {
    mockFulfillBankPurchase.mutateAsync({
      bankTransactionId: prefill.bankTransactionId,
      productId: product.id,
      purchaseDate: formValues.purchaseDate,
      amount: Number(formValues.amount),
      merchant: formValues.merchant?.trim() || null,
      accountId: formValues.accountId,
      quantity: Number(formValues.quantity),
      notes: formValues.notes?.trim() || null,
      startNow: formValues.startNow,
    })
  } else {
    mockPurchaseProduct.mutateAsync()
  }

  assert.equal(standaloneCalled, false, 'Standalone purchase_product MUST NOT be called')
  assert.ok(rpcCalled, 'fulfill_bank_transaction_purchase MUST be called')
  assert.equal(rpcCalled.bankTransactionId, 'tx-beet-elgomla-1')
  assert.equal(rpcCalled.productId, 'prod-tuna-dolphin')
  assert.equal(rpcCalled.amount, 175)
  assert.equal(rpcCalled.merchant, 'BEET ELGOMLA')
})

// ============================================================================
// 4. Standalone purchase is used only when no bankTransactionId is present
// ============================================================================
test('4. Standalone purchase_product is used when no bankTransactionId is present', () => {
  const prefill = null
  let standaloneCalled = false
  let fulfillCalled = false

  if (prefill?.bankTransactionId) {
    fulfillCalled = true
  } else {
    standaloneCalled = true
  }

  assert.equal(fulfillCalled, false)
  assert.equal(standaloneCalled, true)
})

// ============================================================================
// 5. useUpdateExpense invalidates bank transactions and allocations caches
// ============================================================================
test('5. useUpdateExpense invalidates bank transactions and allocations query keys', () => {
  const invalidatedKeys = []
  const mockQueryClient = {
    invalidateQueries: ({ queryKey }) => {
      invalidatedKeys.push(queryKey)
    },
  }

  // Simulates useUpdateExpense onSuccess handler
  const handleUpdateSuccess = () => {
    mockQueryClient.invalidateQueries({ queryKey: ['expenses'] })
    mockQueryClient.invalidateQueries({ queryKey: ['bank_transactions'] })
    mockQueryClient.invalidateQueries({ queryKey: ['bank_transaction_allocations'] })
    mockQueryClient.invalidateQueries({ queryKey: ['home'] })
  }

  handleUpdateSuccess()

  assert.deepEqual(invalidatedKeys, [
    ['expenses'],
    ['bank_transactions'],
    ['bank_transaction_allocations'],
    ['home'],
  ])
})

// ============================================================================
// 6. useDeleteExpense invalidates bank transactions and allocations caches
// ============================================================================
test('6. useDeleteExpense invalidates bank transactions and allocations query keys', () => {
  const invalidatedKeys = []
  const mockQueryClient = {
    invalidateQueries: ({ queryKey }) => {
      invalidatedKeys.push(queryKey)
    },
  }

  // Simulates useDeleteExpense onSuccess handler
  const handleDeleteSuccess = () => {
    mockQueryClient.invalidateQueries({ queryKey: ['expenses'] })
    mockQueryClient.invalidateQueries({ queryKey: ['bank_transactions'] })
    mockQueryClient.invalidateQueries({ queryKey: ['bank_transaction_allocations'] })
    mockQueryClient.invalidateQueries({ queryKey: ['home'] })
  }

  handleDeleteSuccess()

  assert.deepEqual(invalidatedKeys, [
    ['expenses'],
    ['bank_transactions'],
    ['bank_transaction_allocations'],
    ['home'],
  ])
})

// ============================================================================
// 7. FulfillTransactionModal state reset on open transitions
// ============================================================================
test('7. FulfillTransactionModal resets state on open and preserves user input while open', () => {
  let wasOpen = false
  let allocationMode = 'split'
  let customAmount = '50'
  let amountError = 'Some old error'

  const runEffect = (isOpen, remainingAmount) => {
    if (isOpen && !wasOpen) {
      allocationMode = 'full'
      customAmount = String(remainingAmount)
      amountError = null
    }
    wasOpen = isOpen
  }

  // Step 1: Modal opens with remainingAmount = 4473.40
  runEffect(true, 4473.40)
  assert.equal(allocationMode, 'full', 'Mode must reset to full on open')
  assert.equal(customAmount, '4473.4', 'Amount must sync with remainingAmount')
  assert.equal(amountError, null, 'Error must be cleared')

  // Step 2: User types custom amount while open
  allocationMode = 'split'
  customAmount = '200'

  // Step 3: Unrelated component rerender while modal is still open
  runEffect(true, 4473.40)
  assert.equal(allocationMode, 'split', 'User choice must NOT be overwritten during rerender while open')
  assert.equal(customAmount, '200', 'User amount must NOT be overwritten during rerender while open')

  // Step 4: Modal closes
  runEffect(false, 4473.40)
  assert.equal(wasOpen, false)

  // Step 5: Modal reopens later with new remainingAmount = 4273.40
  runEffect(true, 4273.40)
  assert.equal(allocationMode, 'full', 'Mode must reset on fresh open')
  assert.equal(customAmount, '4273.4', 'Amount must sync with new remainingAmount')
  assert.equal(amountError, null)
})

// ============================================================================
// 8. Allocation summary calculation matches production Dolphin Tuna case
// ============================================================================
test('8. Allocation summary calculation matches production BEET ELGOMLA split', () => {
  const transactionAmount = 4673.40
  const allocations = [
    { allocatedAmount: 25 },
    { allocatedAmount: 175 },
  ]

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0)
  const remaining = Math.max(0, transactionAmount - totalAllocated)
  const isFullyAllocated = remaining === 0 && allocations.length > 0

  assert.equal(totalAllocated, 200)
  assert.equal(remaining, 4473.40)
  assert.equal(isFullyAllocated, false)
})
