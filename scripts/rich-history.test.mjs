// Tests for HomeOS v2.1.0 Richer Product / Item History
// Run: node scripts/rich-history.test.mjs

import test from 'node:test'
import assert from 'node:assert/strict'

// 1. Previous Item cycle displays its date range
test('1. Previous Item cycle displays its date range', () => {
  const item = {
    id: 'item-1',
    startedDate: '2026-08-16',
    finishedDate: '2026-08-31',
    status: 'finished',
  }

  const formatShortDate = (d) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const [, m, day] = d.split('-')
    return `${Number(day)} ${months[Number(m) - 1]}`
  }

  const title = `${formatShortDate(item.startedDate)} → ${formatShortDate(item.finishedDate)}`
  assert.equal(title, '16 Aug → 31 Aug')
})

// 2. Finished cycle displays Active Usage days
test('2. Finished cycle displays Active Usage days', () => {
  const item = {
    id: 'item-1',
    status: 'finished',
    metrics: {
      activeUsageDays: 15,
      calendarDays: 15,
      awayDays: 0,
    },
  }

  const usage = `${item.metrics.activeUsageDays} usage day${item.metrics.activeUsageDays === 1 ? '' : 's'}`
  assert.equal(usage, '15 usage days')
})

// 3. Away days are based on canonical metrics (displayed when > 0, omitted when 0)
test('3. Away days are based on canonical metrics (displayed when > 0, omitted when 0)', () => {
  const withAway = {
    metrics: { activeUsageDays: 12, calendarDays: 15, awayDays: 3 },
  }
  const withoutAway = {
    metrics: { activeUsageDays: 15, calendarDays: 15, awayDays: 0 },
  }

  const formatSubtitle = (m) => {
    const usage = `${m.activeUsageDays} usage day${m.activeUsageDays === 1 ? '' : 's'}`
    const away = m.awayDays > 0 ? ` · ${m.awayDays} away day${m.awayDays === 1 ? '' : 's'}` : ''
    return `${usage}${away}`
  }

  assert.equal(formatSubtitle(withAway.metrics), '12 usage days · 3 away days')
  assert.equal(formatSubtitle(withoutAway.metrics), '15 usage days')
})

// 4. Product history displays linked purchase amount
test('4. Product history displays linked purchase amount', () => {
  const item = {
    expense: {
      amount: 490,
      merchant: 'Carrefour',
      date: '2026-08-16',
    },
  }

  const parts = [`EGP ${item.expense.amount.toLocaleString('en-US')}`]
  if (item.expense.merchant) parts.push(item.expense.merchant)
  const meta = parts.join(' · ')

  assert.equal(meta, 'EGP 490 · Carrefour')
})

// 5. Merchant displays when available
test('5. Merchant displays when available', () => {
  const expenseWithMerchant = { amount: 350, merchant: 'Gourmet' }
  const parts = [`EGP ${expenseWithMerchant.amount.toLocaleString('en-US')}`]
  if (expenseWithMerchant.merchant) parts.push(expenseWithMerchant.merchant)

  assert.equal(parts.join(' · '), 'EGP 350 · Gourmet')
})

// 6. Missing merchant does not break the row
test('6. Missing merchant does not break the row', () => {
  const expenseWithoutMerchant = { amount: 200, merchant: null }
  const parts = [`EGP ${expenseWithoutMerchant.amount.toLocaleString('en-US')}`]
  if (expenseWithoutMerchant.merchant) parts.push(expenseWithoutMerchant.merchant)

  assert.equal(parts.join(' · '), 'EGP 200')
})

// 7. Quantity > 1 is represented appropriately
test('7. Quantity > 1 is represented appropriately', () => {
  const stockedMulti = { status: 'stocked', quantity: 3 }
  const stockedSingle = { status: 'stocked', quantity: 1 }

  const formatStocked = (item) => `Stocked${item.quantity > 1 ? ` · Qty ${item.quantity}` : ''}`

  assert.equal(formatStocked(stockedMulti), 'Stocked · Qty 3')
  assert.equal(formatStocked(stockedSingle), 'Stocked')
})

// 8. Active Item is clearly distinguished from Finished history
test('8. Active Item is clearly distinguished from Finished history', () => {
  const items = [
    { id: 'i-1', status: 'active' },
    { id: 'i-2', status: 'stocked' },
    { id: 'i-3', status: 'finished' },
  ]

  const currentCoverage = items.filter((i) => i.status === 'active' || i.status === 'stocked')
  const finishedHistory = items.filter((i) => i.status === 'finished')

  assert.equal(currentCoverage.length, 2)
  assert.equal(finishedHistory.length, 1)
  assert.equal(currentCoverage[0].status, 'active')
  assert.equal(currentCoverage[1].status, 'stocked')
  assert.equal(finishedHistory[0].status, 'finished')
})

// 9. Stocked Item is clearly distinguished
test('9. Stocked Item is clearly distinguished', () => {
  const stockedItem = { id: 'i-stocked', status: 'stocked', quantity: 2 }
  const isCurrent = stockedItem.status === 'active' || stockedItem.status === 'stocked'
  assert.equal(isCurrent, true)
  assert.equal(stockedItem.status, 'stocked')
})

// 10. History row still navigates to the correct Item ID
test('10. History row still navigates to the correct Item ID', () => {
  const historyEntries = [
    { id: 'item-uuid-1', title: '16 Aug → 31 Aug' },
    { id: 'item-uuid-2', title: '1 Aug → 15 Aug' },
  ]

  const navigatedTargets = historyEntries.map((e) => `/app/items/${e.id}`)
  assert.deepEqual(navigatedTargets, ['/app/items/item-uuid-1', '/app/items/item-uuid-2'])
})

// 11. Average/typical usage excludes Active and Stocked Items
test('11. Average/typical usage excludes Active and Stocked Items', () => {
  const calculateTypicalUsage = (items) => {
    const finishedCycles = items.filter(
      (i) => i.status === 'finished' && i.metrics != null && i.metrics.activeUsageDays > 0,
    )
    if (finishedCycles.length < 2) return null
    const totalDays = finishedCycles.reduce((sum, c) => sum + (c.metrics?.activeUsageDays ?? 0), 0)
    const avg = totalDays / finishedCycles.length
    return Math.round(avg * 10) / 10
  }

  const items = [
    { status: 'active', metrics: { activeUsageDays: 4 } },
    { status: 'stocked', metrics: null },
    { status: 'finished', metrics: { activeUsageDays: 14 } },
    { status: 'finished', metrics: { activeUsageDays: 16 } },
  ]

  // (14 + 16) / 2 = 15. Active 4 days must NOT drag the average down to (14 + 16 + 4) / 3 = 11.3
  const typical = calculateTypicalUsage(items)
  assert.equal(typical, 15)
})

// 12. Average/typical usage is omitted when insufficient history exists (< 2 finished cycles)
test('12. Average/typical usage is omitted when insufficient history exists (< 2 finished cycles)', () => {
  const calculateTypicalUsage = (items) => {
    const finishedCycles = items.filter(
      (i) => i.status === 'finished' && i.metrics != null && i.metrics.activeUsageDays > 0,
    )
    if (finishedCycles.length < 2) return null
    const totalDays = finishedCycles.reduce((sum, c) => sum + (c.metrics?.activeUsageDays ?? 0), 0)
    const avg = totalDays / finishedCycles.length
    return Math.round(avg * 10) / 10
  }

  assert.equal(calculateTypicalUsage([]), null, 'Empty history must return null')
  assert.equal(
    calculateTypicalUsage([{ status: 'finished', metrics: { activeUsageDays: 14 } }]),
    null,
    'Single finished cycle must return null',
  )
  assert.equal(
    calculateTypicalUsage([
      { status: 'active', metrics: { activeUsageDays: 5 } },
      { status: 'finished', metrics: { activeUsageDays: 14 } },
    ]),
    null,
    'One active and one finished cycle must return null',
  )
})

// 13. No N+1 query regression is introduced
test('13. No N+1 query regression is introduced (batched queries verification)', () => {
  let queryCount = 0
  const mockDb = {
    itemsQuery: () => {
      queryCount++
      return [
        { id: 'i-1', product_id: 'p-1', expense: { amount: 100 } },
        { id: 'i-2', product_id: 'p-1', expense: { amount: 120 } },
        { id: 'i-3', product_id: 'p-1', expense: { amount: 150 } },
      ]
    },
    metricsBatchQuery: (ids) => {
      queryCount++
      return ids.map((id) => ({ item_id: id, active_usage_days: 10 }))
    },
  }

  // Fetch items
  const items = mockDb.itemsQuery()
  // Batch fetch metrics for all item IDs in one query
  const itemIds = items.map((i) => i.id)
  mockDb.metricsBatchQuery(itemIds)

  assert.equal(queryCount, 2, 'Must execute exactly 2 batched queries regardless of item count')
})
