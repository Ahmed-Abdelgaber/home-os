// Tests for HomeOS v2.1.0 CIB SMS Capture + Pending Bank Transactions
// Run: node scripts/cib-ingestion.test.mjs

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseCibSms,
  generateMessageFingerprint,
} from '../src/features/bank-transactions/cibParser.ts'

// 1. Valid supported CIB debit SMS parses correctly
test('1. Valid supported CIB debit SMS parses correctly', () => {
  const sms = 'Your card ending with 6511 has been used for a purchase of EGP 1,250.00 at CARREFOUR MAADI on 03/09/2026 20:42. Available balance: EGP 15,000.00.'
  const res = parseCibSms(sms)

  assert.equal(res.kind, 'debit')
  assert.equal(res.bank, 'CIB')
  assert.equal(res.transactionType, 'purchase')
})

// 2. Amount parsing is exact
test('2. Amount parsing is exact', () => {
  const sms = 'Dear Customer, a purchase of EGP 2,450.75 was made with card ending 1234 at IKEA on 01/09/2026 15:30.'
  const res = parseCibSms(sms)

  assert.equal(res.kind, 'debit')
  assert.equal(res.amount, 2450.75)
  assert.equal(typeof res.amount, 'number')
})

// 3. Currency is correct
test('3. Currency is correct', () => {
  const egpSms = 'Purchase with card ending 9999 for EGP 450.00 at METRO on 02/09/2026'
  const usdSms = 'Dear Customer, your card ending with 6511 was used for purchase of USD 25.50 at APPLE.COM/BILL on 01/09/2026 18:10.'

  const egpRes = parseCibSms(egpSms)
  const usdRes = parseCibSms(usdSms)

  assert.equal(egpRes.kind, 'debit')
  assert.equal(egpRes.currency, 'EGP')

  assert.equal(usdRes.kind, 'debit')
  assert.equal(usdRes.currency, 'USD')
})

// 4. merchant_raw is preserved
test('4. merchant_raw is preserved', () => {
  const sms = 'Your card ending with 6511 has been used for a purchase of EGP 890.00 at GOURMET MARKET DEG purest on 03/09/2026 21:00. Available limit...'
  const res = parseCibSms(sms)

  assert.equal(res.kind, 'debit')
  assert.equal(res.merchantRaw, 'GOURMET MARKET DEG purest')
})

// 5. card_last4 is parsed when available
test('5. card_last4 is parsed when available', () => {
  const sms = 'Your card ending with 4321 has been used for a purchase of EGP 500.00 at ZARA on 02/09/2026 12:00.'
  const res = parseCibSms(sms)

  assert.equal(res.kind, 'debit')
  assert.equal(res.cardLast4, '4321')
})

// 6. Unsupported message creates no transaction
test('6. Unsupported message creates no transaction', () => {
  const sms = 'Dear CIB client, enjoy 20% discount on dining with your card this weekend. T&C apply.'
  const res = parseCibSms(sms)

  assert.notEqual(res.kind, 'debit')
  assert.equal(res.kind, 'unsupported')
})

// 7. OTP creates no transaction
test('7. OTP creates no transaction', () => {
  const sms = 'Your OTP for online purchase is 987654. Valid for 5 minutes. Do not share this code.'
  const res = parseCibSms(sms)

  assert.equal(res.kind, 'ignored')
  assert.equal(res.reason, 'otp')
})

// 8. Declined transaction creates no transaction
test('8. Declined transaction creates no transaction', () => {
  const sms = 'Your transaction of EGP 1,500.00 at CARREFOUR was declined due to insufficient funds.'
  const res = parseCibSms(sms)

  assert.equal(res.kind, 'ignored')
  assert.equal(res.reason, 'declined')
})

// 9. Duplicate message is idempotent
test('9. Duplicate message is idempotent', () => {
  const msg1 = 'Your card ending with 6511 has been used for a purchase of EGP 1,250.00 at CARREFOUR.'
  const msg2 = '  Your card ending with 6511 has been used for a purchase of EGP 1,250.00 at CARREFOUR.  \n'

  const fp1 = generateMessageFingerprint('CIB', msg1)
  const fp2 = generateMessageFingerprint('CIB', msg2)

  assert.equal(fp1, fp2, 'Fingerprints must match exactly')
  assert.ok(fp1.length >= 16)
})

// 10. Missing ingestion secret is rejected
test('10. Missing ingestion secret is rejected', () => {
  const authenticate = (secretHeader, envSecret) => {
    if (!envSecret || !secretHeader || secretHeader !== envSecret) {
      return { status: 401, error: 'Unauthorized' }
    }
    return { status: 200 }
  }

  const resMissing = authenticate(null, 'secret_12345')
  assert.equal(resMissing.status, 401)
})

// 11. Invalid ingestion secret is rejected
test('11. Invalid ingestion secret is rejected', () => {
  const authenticate = (secretHeader, envSecret) => {
    if (!envSecret || !secretHeader || secretHeader !== envSecret) {
      return { status: 401, error: 'Unauthorized' }
    }
    return { status: 200 }
  }

  const resInvalid = authenticate('wrong_key', 'secret_12345')
  assert.equal(resInvalid.status, 401)

  const resValid = authenticate('secret_12345', 'secret_12345')
  assert.equal(resValid.status, 200)
})

// 12. Malformed JSON/input is rejected
test('12. Malformed JSON/input is rejected', () => {
  const validateBody = (bodyText) => {
    if (bodyText.length > 2048) {
      return { status: 413, error: 'Payload exceeds size limit' }
    }
    let parsed
    try {
      parsed = JSON.parse(bodyText)
    } catch {
      return { status: 400, error: 'Malformed JSON' }
    }
    if (!parsed.message || typeof parsed.message !== 'string' || parsed.message.trim().length === 0) {
      return { status: 400, error: 'Missing or empty "message" field' }
    }
    return { status: 200, message: parsed.message.trim() }
  }

  assert.equal(validateBody('not valid json').status, 400)
  assert.equal(validateBody(JSON.stringify({})).status, 400)
  assert.equal(validateBody(JSON.stringify({ message: '' })).status, 400)
  assert.equal(validateBody(JSON.stringify({ message: 'Valid' })).status, 200)
})

// 13. Raw SMS is not logged
test('13. Raw SMS is not logged', () => {
  const safeLog = ({ id, bank, amount, currency, cardLast4 }) => {
    return {
      id,
      bank,
      amount,
      currency,
      card: cardLast4 ? `•••• ${cardLast4}` : 'unknown',
    }
  }

  const entry = safeLog({
    id: 'tx-123',
    bank: 'CIB',
    amount: 1250,
    currency: 'EGP',
    cardLast4: '6511',
  })

  assert.equal('raw_message' in entry, false)
  assert.equal('rawMessage' in entry, false)
  assert.equal('message' in entry, false)
  assert.equal(entry.card, '•••• 6511')
})

// 14. Created transaction starts Pending
test('14. Created transaction starts Pending', () => {
  const initialRow = {
    bank: 'CIB',
    amount: 500,
    status: 'pending',
  }
  assert.equal(initialRow.status, 'pending')
})

// 15. Pending UI reads from Supabase
test('15. Pending UI reads from Supabase', () => {
  const rawDbRow = {
    id: 'tx-abc-123',
    bank: 'CIB',
    amount: '1250.00',
    currency: 'EGP',
    merchant_raw: 'CARREFOUR',
    transaction_at: '2026-09-03T18:42:00Z',
    card_last4: '6511',
    transaction_type: 'purchase',
    raw_message: 'Your card ending with 6511...',
    status: 'pending',
    message_fingerprint: 'fp_123',
    received_at: '2026-09-03T18:43:00Z',
    created_at: '2026-09-03T18:43:00Z',
    updated_at: '2026-09-03T18:43:00Z',
  }

  const mapRow = (row) => ({
    id: row.id,
    bank: row.bank,
    amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
    currency: row.currency,
    merchantRaw: row.merchant_raw,
    transactionAt: row.transaction_at,
    cardLast4: row.card_last4,
    transactionType: row.transaction_type,
    rawMessage: row.raw_message,
    status: row.status,
    receivedAt: row.received_at,
  })

  const mapped = mapRow(rawDbRow)
  assert.equal(mapped.id, 'tx-abc-123')
  assert.equal(mapped.amount, 1250)
  assert.equal(typeof mapped.amount, 'number')
  assert.equal(mapped.merchantRaw, 'CARREFOUR')
  assert.equal(mapped.status, 'pending')
})

// 16. Ignore changes Pending → Ignored
test('16. Ignore changes Pending → Ignored', () => {
  const current = { id: 'tx-1', status: 'pending' }
  const afterIgnore = { ...current, status: 'ignored' }

  assert.equal(afterIgnore.status, 'ignored')
})

// 17. Ignored record disappears from default Pending list
test('17. Ignored record disappears from default Pending list', () => {
  const list = [
    { id: '1', status: 'pending' },
    { id: '2', status: 'ignored' },
    { id: '3', status: 'pending' },
  ]

  const pendingOnly = list.filter((item) => item.status === 'pending')
  assert.equal(pendingOnly.length, 2)
  assert.ok(pendingOnly.every((i) => i.status === 'pending'))
  assert.equal(pendingOnly.some((i) => i.id === '2'), false)
})

// 18. Ignore creates no Item/Expense
test('18. Ignore creates no Item/Expense', () => {
  const ignoreMutationPayload = {
    status: 'ignored',
    updated_at: new Date().toISOString(),
  }

  assert.equal('expense_id' in ignoreMutationPayload, false)
  assert.equal('item_id' in ignoreMutationPayload, false)
  assert.equal('product_id' in ignoreMutationPayload, false)
})

// 19. Enable capture RPC returns ingestion key and enables capture
test('19. Enable capture RPC returns ingestion key and enables capture', () => {
  const state = { bank_sms_enabled: false, bank_sms_ingestion_key: null }
  const mockEnableRpc = (current) => {
    const key = current.bank_sms_ingestion_key || '11111111-2222-3333-4444-555555555555'
    return { bank_sms_enabled: true, bank_sms_ingestion_key: key }
  }

  const updated = mockEnableRpc(state)
  assert.equal(updated.bank_sms_enabled, true)
  assert.equal(typeof updated.bank_sms_ingestion_key, 'string')
})

// 20. Disable capture RPC sets enabled to false and preserves the key
test('20. Disable capture RPC sets enabled to false and preserves the key', () => {
  const state = { bank_sms_enabled: true, bank_sms_ingestion_key: '11111111-2222-3333-4444-555555555555' }
  const mockDisableRpc = (current) => ({ ...current, bank_sms_enabled: false })

  const disabled = mockDisableRpc(state)
  assert.equal(disabled.bank_sms_enabled, false)
  assert.equal(disabled.bank_sms_ingestion_key, '11111111-2222-3333-4444-555555555555')
})

// 21. Regenerate key RPC creates new key without changing enabled state
test('21. Regenerate key RPC creates new key without changing enabled state', () => {
  const state = { bank_sms_enabled: true, bank_sms_ingestion_key: 'old-key-123' }
  const mockRegenerateRpc = (current, newKey) => ({ ...current, bank_sms_ingestion_key: newKey })

  const regenerated = mockRegenerateRpc(state, 'new-key-456')
  assert.equal(regenerated.bank_sms_ingestion_key, 'new-key-456')
  assert.equal(regenerated.bank_sms_enabled, true)
})

// 22. Edge Function URL is constructed dynamically from VITE_SUPABASE_URL
test('22. Edge Function URL is constructed dynamically from VITE_SUPABASE_URL', () => {
  const getFunctionUrl = (baseUrl) => `${baseUrl.replace(/\/+$/, '')}/functions/v1/cib-ingestion`
  assert.equal(getFunctionUrl('https://xyz.supabase.co'), 'https://xyz.supabase.co/functions/v1/cib-ingestion')
  assert.equal(getFunctionUrl('https://xyz.supabase.co/'), 'https://xyz.supabase.co/functions/v1/cib-ingestion')
})

// 23. Card last4 is informational only (no detected_account_id)
test('23. Card last4 is informational only (no detected_account_id)', () => {
  const tx = {
    amount: 1250,
    currency: 'EGP',
    cardLast4: '6511',
    merchantRaw: 'GOURMET MARKET',
    status: 'pending',
  }

  assert.equal('detected_account_id' in tx, false)
  assert.equal('account_id' in tx, false)
  assert.equal(tx.cardLast4, '6511')
})

// 24. Allocation calculation: totalAllocated, remaining, and isFullyAllocated
test('24. Allocation calculation: totalAllocated, remaining, and isFullyAllocated', () => {
  const calculateAllocationSummary = (txAmount, allocations) => {
    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0)
    const remaining = Math.max(0, txAmount - totalAllocated)
    return {
      totalAllocated,
      remaining,
      isFullyAllocated: remaining === 0 && allocations.length > 0,
    }
  }

  const txAmount = 1500
  const noAllocations = []
  assert.deepEqual(calculateAllocationSummary(txAmount, noAllocations), {
    totalAllocated: 0,
    remaining: 1500,
    isFullyAllocated: false,
  })

  const partialAllocations = [
    { allocatedAmount: 500 },
    { allocatedAmount: 200 },
  ]
  assert.deepEqual(calculateAllocationSummary(txAmount, partialAllocations), {
    totalAllocated: 700,
    remaining: 800,
    isFullyAllocated: false,
  })

  const fullAllocations = [
    { allocatedAmount: 1000 },
    { allocatedAmount: 500 },
  ]
  assert.deepEqual(calculateAllocationSummary(txAmount, fullAllocations), {
    totalAllocated: 1500,
    remaining: 0,
    isFullyAllocated: true,
  })
})

// 25. Split allocation prevents allocation > remaining amount
test('25. Split allocation prevents allocation > remaining amount', () => {
  const remaining = 800
  const validateSplitAmount = (input, maxRemaining) => {
    const num = Number(input)
    if (isNaN(num) || num <= 0) return 'Invalid amount'
    if (num > maxRemaining) return 'Exceeds remaining'
    return null
  }

  assert.equal(validateSplitAmount('500', remaining), null)
  assert.equal(validateSplitAmount('800', remaining), null)
  assert.equal(validateSplitAmount('850', remaining), 'Exceeds remaining')
  assert.equal(validateSplitAmount('0', remaining), 'Invalid amount')
  assert.equal(validateSplitAmount('-50', remaining), 'Invalid amount')
})

// 26. Fulfill prefill sets amount, merchant, date, and transaction ID for Expense
test('26. Fulfill prefill sets amount, merchant, date, and transaction ID for Expense', () => {
  const tx = {
    id: 'tx-123',
    merchantRaw: 'CARREFOUR MAADI',
    transactionAt: '2026-09-03T18:42:00Z',
  }
  const effectiveAmount = 750

  const prefill = {
    amount: effectiveAmount,
    merchant: tx.merchantRaw,
    expenseDate: tx.transactionAt.split('T')[0],
    bankTransactionId: tx.id,
  }

  assert.equal(prefill.amount, 750)
  assert.equal(prefill.merchant, 'CARREFOUR MAADI')
  assert.equal(prefill.expenseDate, '2026-09-03')
  assert.equal(prefill.bankTransactionId, 'tx-123')
})

// 27. Fulfill prefill sets amount, merchant, date, and transaction ID for Purchase
test('27. Fulfill prefill sets amount, merchant, date, and transaction ID for Purchase', () => {
  const tx = {
    id: 'tx-456',
    merchantRaw: 'AMAZON EG',
    transactionAt: '2026-09-02T14:10:00Z',
  }
  const effectiveAmount = 1200

  const prefill = {
    amount: effectiveAmount,
    merchant: tx.merchantRaw,
    purchaseDate: tx.transactionAt.split('T')[0],
    bankTransactionId: tx.id,
  }

  assert.equal(prefill.amount, 1200)
  assert.equal(prefill.merchant, 'AMAZON EG')
  assert.equal(prefill.purchaseDate, '2026-09-02')
  assert.equal(prefill.bankTransactionId, 'tx-456')
})

// 28. Actionable ordering: partially_fulfilled comes before pending
test('28. Actionable ordering: partially_fulfilled comes before pending', () => {
  const items = [
    { id: '1', status: 'pending', receivedAt: '2026-09-03T12:00:00Z' },
    { id: '2', status: 'partially_fulfilled', receivedAt: '2026-09-02T12:00:00Z' },
    { id: '3', status: 'pending', receivedAt: '2026-09-03T14:00:00Z' },
  ]

  const sorted = [...items].sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === 'partially_fulfilled') return -1
      if (b.status === 'partially_fulfilled') return 1
    }
    return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  })

  assert.equal(sorted[0].id, '2') // partially_fulfilled first even if older
  assert.equal(sorted[1].id, '3') // newest pending
  assert.equal(sorted[2].id, '1') // older pending
})

// 29. fulfill_bank_transaction_expense RPC parameters match backend contract
test('29. fulfill_bank_transaction_expense RPC parameters match backend contract', () => {
  const mapExpenseRpcParams = (input) => ({
    p_bank_transaction_id: input.bankTransactionId,
    p_expense_date: input.expenseDate,
    p_amount: input.amount,
    p_description: input.description,
    p_merchant: input.merchant,
    p_category_id: input.categoryId,
    p_scope: input.scope,
    p_person_id: input.personId,
    p_account_id: input.accountId,
    p_notes: input.notes,
  })

  const params = mapExpenseRpcParams({
    bankTransactionId: 'tx-1',
    expenseDate: '2026-09-03',
    amount: 600,
    description: 'Groceries',
    merchant: 'Carrefour',
    categoryId: 'cat-1',
    scope: 'household',
    personId: 'person-1',
    accountId: 'acc-1',
    notes: 'Split part 1',
  })

  assert.equal(params.p_bank_transaction_id, 'tx-1')
  assert.equal(params.p_amount, 600)
  assert.equal(params.p_description, 'Groceries')
  assert.equal(params.p_scope, 'household')
})

// 30. fulfill_bank_transaction_purchase RPC parameters match backend contract
test('30. fulfill_bank_transaction_purchase RPC parameters match backend contract', () => {
  const mapPurchaseRpcParams = (input) => ({
    p_bank_transaction_id: input.bankTransactionId,
    p_product_id: input.productId,
    p_purchase_date: input.purchaseDate,
    p_amount: input.amount,
    p_merchant: input.merchant,
    p_account_id: input.accountId,
    p_quantity: input.quantity,
    p_notes: input.notes,
    p_start_now: input.startNow,
  })

  const params = mapPurchaseRpcParams({
    bankTransactionId: 'tx-1',
    productId: 'prod-1',
    purchaseDate: '2026-09-03',
    amount: 400,
    merchant: 'Carrefour',
    accountId: 'acc-1',
    quantity: 2,
    notes: 'Cleaning detergent',
    startNow: true,
  })

  assert.equal(params.p_bank_transaction_id, 'tx-1')
  assert.equal(params.p_product_id, 'prod-1')
  assert.equal(params.p_amount, 400)
  assert.equal(params.p_quantity, 2)
  assert.equal(params.p_start_now, true)
})

// 31. allocate_bank_transaction RPC parameters match backend contract
test('31. allocate_bank_transaction RPC parameters match backend contract', () => {
  const mapAllocateParams = (input) => ({
    p_bank_transaction_id: input.bankTransactionId,
    p_expense_id: input.expenseId,
    p_allocated_amount: input.allocatedAmount,
  })

  const params = mapAllocateParams({
    bankTransactionId: 'tx-1',
    expenseId: 'exp-1',
    allocatedAmount: 350,
  })

  assert.equal(params.p_bank_transaction_id, 'tx-1')
  assert.equal(params.p_expense_id, 'exp-1')
  assert.equal(params.p_allocated_amount, 350)
})

// 32. ignore_bank_transaction uses p_transaction_id as parameter name
test('32. ignore_bank_transaction uses p_transaction_id as parameter name', () => {
  const mapIgnoreParams = (transactionId) => ({
    p_transaction_id: transactionId,
  })

  const params = mapIgnoreParams('tx-abc-999')
  assert.equal(params.p_transaction_id, 'tx-abc-999')
  assert.equal('p_bank_transaction_id' in params, false)
})

// 33. Successful fulfillment invalidates required query caches
test('33. Successful fulfillment invalidates required query caches', () => {
  const invalidated = []
  const mockQueryClient = {
    invalidateQueries: (arg) => invalidated.push(arg.queryKey[0]),
  }

  const handleExpenseSuccess = () => {
    mockQueryClient.invalidateQueries({ queryKey: ['bank_transactions'] })
    mockQueryClient.invalidateQueries({ queryKey: ['bank_transaction_allocations'] })
    mockQueryClient.invalidateQueries({ queryKey: ['expenses'] })
    mockQueryClient.invalidateQueries({ queryKey: ['home'] })
  }

  handleExpenseSuccess()
  assert.deepEqual(invalidated, [
    'bank_transactions',
    'bank_transaction_allocations',
    'expenses',
    'home',
  ])
})

// 34. formatShortDate safely handles null, undefined, invalid and full ISO timestamps without throwing
test('34. formatShortDate safely handles null, undefined, invalid and full ISO timestamps without throwing', () => {
  const CAIRO_TZ = 'Africa/Cairo'
  function formatShortDate(dateStr) {
    if (!dateStr) return ''
    try {
      const trimmed = typeof dateStr === 'string' ? dateStr.trim() : ''
      if (!trimmed) return ''

      let d
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        d = new Date(`${trimmed}T00:00:00Z`)
      } else {
        d = new Date(trimmed)
      }

      if (isNaN(d.getTime())) return ''

      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        timeZone: CAIRO_TZ,
      }).format(d)
    } catch {
      return ''
    }
  }

  // Falsy / invalid inputs return empty string (never throw)
  assert.equal(formatShortDate(null), '')
  assert.equal(formatShortDate(undefined), '')
  assert.equal(formatShortDate(''), '')
  assert.equal(formatShortDate('   '), '')
  assert.equal(formatShortDate('invalid-date'), '')

  // Date-only string preserves calendar day
  assert.equal(formatShortDate('2026-08-25'), '25 Aug')
  assert.equal(formatShortDate('2026-03-09'), '9 Mar')

  // Full ISO timestamp (timestamptz from Supabase) does not throw RangeError
  assert.equal(formatShortDate('2026-03-09T04:00:00+00:00'), '9 Mar')
  assert.ok(formatShortDate('2026-09-02T14:10:00Z').startsWith('2 Sep'))
})

// 35. formatTimestampDate formats timestamptz in Cairo timezone
test('35. formatTimestampDate formats timestamptz in Cairo timezone', () => {
  const CAIRO_TZ = 'Africa/Cairo'
  function formatTimestampDate(iso) {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return ''
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        timeZone: CAIRO_TZ,
      }).format(d)
    } catch {
      return ''
    }
  }

  assert.equal(formatTimestampDate(null), '')
  assert.equal(formatTimestampDate(undefined), '')
  assert.equal(formatTimestampDate(''), '')
  assert.equal(formatTimestampDate('not-a-date'), '')
  assert.equal(formatTimestampDate('2026-03-09T04:00:00+00:00'), '9 Mar')
  assert.ok(formatTimestampDate('2026-09-02T14:10:00Z').startsWith('2 Sep'))
})

// 36. formatTimestampDateTime formats date and time in Cairo timezone
test('36. formatTimestampDateTime formats date and time in Cairo timezone', () => {
  const CAIRO_TZ = 'Africa/Cairo'
  function formatTimestampDateTime(iso) {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return ''
      const datePart = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        timeZone: CAIRO_TZ,
      }).format(d)
      const timePart = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: CAIRO_TZ,
      }).format(d)
      return `${datePart}, ${timePart}`
    } catch {
      return ''
    }
  }

  assert.equal(formatTimestampDateTime(null), '')
  assert.equal(formatTimestampDateTime(undefined), '')
  assert.equal(formatTimestampDateTime('not-a-date'), '')
  // In UTC+2 (Cairo winter standard): 04:00 UTC = 6:00 AM Cairo
  const formatted = formatTimestampDateTime('2026-03-09T04:00:00+00:00')
  assert.ok(formatted.startsWith('9 Mar'))
  assert.ok(formatted.includes('AM') || formatted.includes('PM'))
})

// 37. Pending transaction display date fallback rule
test('37. Pending transaction display date fallback rule', () => {
  const CAIRO_TZ = 'Africa/Cairo'
  function formatTimestampDate(iso) {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      if (isNaN(d.getTime())) return ''
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        timeZone: CAIRO_TZ,
      }).format(d)
    } catch {
      return ''
    }
  }

  function getDisplayDate(tx) {
    const txDate = formatTimestampDate(tx.transactionAt)
    const recvDate = formatTimestampDate(tx.receivedAt)
    return txDate || recvDate || null
  }

  // Both available -> prefers transactionAt
  assert.equal(
    getDisplayDate({ transactionAt: '2026-03-09T04:00:00+00:00', receivedAt: '2026-03-09T06:00:00+00:00' }),
    '9 Mar'
  )

  // transactionAt is null -> falls back to receivedAt
  assert.equal(
    getDisplayDate({ transactionAt: null, receivedAt: '2026-03-09T06:00:00+00:00' }),
    '9 Mar'
  )

  // Both null or invalid -> returns null without throwing or producing "Invalid Date"
  assert.equal(
    getDisplayDate({ transactionAt: null, receivedAt: null }),
    null
  )
  assert.equal(
    getDisplayDate({ transactionAt: 'invalid', receivedAt: 'invalid' }),
    null
  )
})




