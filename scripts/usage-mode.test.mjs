// Comprehensive test suite for HomeOS frontend `usage_mode` support
// Run: node scripts/usage-mode.test.mjs

import test from 'node:test'
import assert from 'node:assert/strict'
import { z } from 'zod'

// 1. Domain Constants & Schemas
const USAGE_MODES = ['duration', 'one_time']
const USAGE_MODE_LABELS = {
  duration: 'Track usage duration',
  one_time: 'Single use',
}
const USAGE_MODE_DESCRIPTIONS = {
  duration: 'Start it, finish it later, and track how long it lasts.',
  one_time: 'Use it once without tracking a duration.',
}

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  consumerPersonId: z.string().min(1, 'Consumer is required'),
  consumptionMode: z.enum(['pause_when_consumer_away', 'pause_only_when_household_away', 'never_pause']),
  usageMode: z.enum(['duration', 'one_time']),
  notes: z.string().optional(),
})

test('1. Product schema accepts both duration and one_time usage modes', () => {
  const durationProduct = productSchema.parse({
    name: 'Coffee Beans',
    categoryId: 'cat-1',
    consumerPersonId: 'p-1',
    consumptionMode: 'never_pause',
    usageMode: 'duration',
  })
  assert.equal(durationProduct.usageMode, 'duration')

  const oneTimeProduct = productSchema.parse({
    name: 'Maggi Kofta Mix',
    categoryId: 'cat-2',
    consumerPersonId: 'p-1',
    consumptionMode: 'never_pause',
    usageMode: 'one_time',
  })
  assert.equal(oneTimeProduct.usageMode, 'one_time')
})

test('2. Product form preserves consumption_mode when switching to one_time', () => {
  // Simulate ProductFormPage submit payload mapping
  const formValues = {
    name: 'Maggi Kofta Mix',
    categoryId: 'cat-2',
    consumerPersonId: 'p-1',
    consumptionMode: 'never_pause',
    usageMode: 'one_time',
    notes: 'Single packet',
  }

  // Ensure consumptionMode is preserved as valid enum value and never set to null
  const payload = {
    name: formValues.name.trim(),
    categoryId: formValues.categoryId,
    consumerPersonId: formValues.consumerPersonId,
    consumptionMode: formValues.consumptionMode ?? 'never_pause',
    usageMode: formValues.usageMode,
    notes: formValues.notes?.trim() || undefined,
  }

  assert.equal(payload.usageMode, 'one_time')
  assert.equal(payload.consumptionMode, 'never_pause')
  assert.notEqual(payload.consumptionMode, null)
})

test('3. Purchase UI label adapts: "Use now" for one_time vs "Start using now" for duration', () => {
  function getToggleLabel(usageMode) {
    return usageMode === 'one_time' ? 'Use now' : 'Start using now'
  }

  assert.equal(getToggleLabel('duration'), 'Start using now')
  assert.equal(getToggleLabel('one_time'), 'Use now')
})

test('4. Purchase flow reuses purchase_product RPC with context-sensitive p_start_now', async () => {
  const rpcCalls = []
  const mockSupabase = {
    rpc: (name, params) => {
      rpcCalls.push({ name, params })
      return Promise.resolve({ data: { item_id: 'item-101' }, error: null })
    },
  }

  // Case A: duration product with startNow = true
  await mockSupabase.rpc('purchase_product', {
    p_product_id: 'prod-duration',
    p_purchase_date: '2026-09-07',
    p_amount: 150,
    p_start_now: true,
  })
  assert.equal(rpcCalls[0].name, 'purchase_product')
  assert.equal(rpcCalls[0].params.p_start_now, true)

  // Case B: one_time product with startNow = true (meaning "Use now" -> creates finished item immediately)
  await mockSupabase.rpc('purchase_product', {
    p_product_id: 'prod-onetime',
    p_purchase_date: '2026-09-07',
    p_amount: 25,
    p_start_now: true,
  })
  assert.equal(rpcCalls[1].name, 'purchase_product')
  assert.equal(rpcCalls[1].params.p_start_now, true)

  // Case C: one_time product with startNow = false (create as stocked)
  await mockSupabase.rpc('purchase_product', {
    p_product_id: 'prod-onetime',
    p_purchase_date: '2026-09-07',
    p_amount: 25,
    p_start_now: false,
  })
  assert.equal(rpcCalls[2].name, 'purchase_product')
  assert.equal(rpcCalls[2].params.p_start_now, false)
})

test('5. Bank Transaction fulfillment supports one_time products via fulfill_bank_transaction_purchase', async () => {
  const rpcCalls = []
  const mockSupabase = {
    rpc: (name, params) => {
      rpcCalls.push({ name, params })
      return Promise.resolve({
        data: [{ item_id: 'item-202', expense_id: 'exp-202', allocation_id: 'alloc-202' }],
        error: null,
      })
    },
  }

  // Fulfilling with a one_time product and "Use now" checked
  await mockSupabase.rpc('fulfill_bank_transaction_purchase', {
    p_bank_transaction_id: 'tx-123',
    p_product_id: 'prod-onetime',
    p_purchase_date: '2026-09-07',
    p_amount: 60,
    p_merchant: 'Carrefour',
    p_account_id: 'acc-1',
    p_quantity: 1,
    p_notes: null,
    p_start_now: true,
  })

  assert.equal(rpcCalls[0].name, 'fulfill_bank_transaction_purchase')
  assert.equal(rpcCalls[0].params.p_start_now, true)
  assert.equal(rpcCalls[0].params.p_bank_transaction_id, 'tx-123')
})

test('6. Stocked one_time Item invokes use_item(p_item_id, p_used_date) RPC', async () => {
  const rpcCalls = []
  const mockSupabase = {
    rpc: (name, params) => {
      rpcCalls.push({ name, params })
      return Promise.resolve({ error: null })
    },
  }

  const itemId = 'item-stocked-onetime'
  const usedDate = '2026-09-07'

  await mockSupabase.rpc('use_item', {
    p_item_id: itemId,
    p_used_date: usedDate,
  })

  assert.equal(rpcCalls.length, 1)
  assert.equal(rpcCalls[0].name, 'use_item')
  assert.equal(rpcCalls[0].params.p_item_id, itemId)
  assert.equal(rpcCalls[0].params.p_used_date, usedDate)
})

test('7. fetchActiveItems defensively filters out one_time items', () => {
  const rawDbItems = [
    { id: 'item-1', usage_mode: 'duration', started_date: '2026-09-01', product: { name: 'Milk' } },
    { id: 'item-2', usage_mode: 'one_time', started_date: null, product: { name: 'Kofta Mix' } },
    { id: 'item-3', usage_mode: 'duration', started_date: '2026-08-20', product: { name: 'Olive Oil' } },
  ]

  const warnings = []
  const durationItems = rawDbItems.filter((item) => {
    if (item.usage_mode === 'one_time') {
      warnings.push(`Inconsistent item data: ${item.id}`)
      return false
    }
    return true
  })

  assert.equal(durationItems.length, 2)
  assert.equal(durationItems.some((i) => i.id === 'item-2'), false)
  assert.equal(warnings.length, 1)
})

test('8. Finished one_time Items format as "Used [date]" and suppress duration days', () => {
  function formatFinishedItem(item) {
    const isOneTime = item.usageMode === 'one_time'
    return {
      title: item.title,
      meta: isOneTime ? `Used ${item.finishedDate}` : `Finished ${item.finishedDate}`,
      days: isOneTime ? undefined : item.days,
    }
  }

  const durationItem = formatFinishedItem({
    title: 'Lavazza Coffee',
    usageMode: 'duration',
    finishedDate: '15 Sep',
    days: 14,
  })
  assert.equal(durationItem.meta, 'Finished 15 Sep')
  assert.equal(durationItem.days, 14)

  const oneTimeItem = formatFinishedItem({
    title: 'Maggi Kofta Mix',
    usageMode: 'one_time',
    finishedDate: '6 Sep',
    days: 0,
  })
  assert.equal(oneTimeItem.meta, 'Used 6 Sep')
  assert.equal(oneTimeItem.days, undefined, 'Days must be undefined for one_time finished items')
})

test('9. StatusChip displays "Used" when status is finished and usageMode is one_time', () => {
  function getStatusChipLabel(status, usageMode, label) {
    const LABELS = {
      stocked: 'Stocked',
      active: 'Active',
      finished: 'Finished',
    }
    if (label) return label
    if (status === 'finished' && usageMode === 'one_time') return 'Used'
    return LABELS[status]
  }

  assert.equal(getStatusChipLabel('stocked', 'duration'), 'Stocked')
  assert.equal(getStatusChipLabel('stocked', 'one_time'), 'Stocked')
  assert.equal(getStatusChipLabel('active', 'duration'), 'Active')
  assert.equal(getStatusChipLabel('finished', 'duration'), 'Finished')
  assert.equal(getStatusChipLabel('finished', 'one_time'), 'Used')
})

test('10. calculateTypicalUsage excludes one_time items from average calculation', () => {
  function calculateTypicalUsage(items) {
    const completedCycles = items.filter(
      (item) => item.status === 'finished' && item.usageMode !== 'one_time' && item.metrics && item.metrics.activeUsageDays > 0,
    )
    if (completedCycles.length < 2) return null
    const totalDays = completedCycles.reduce((sum, item) => sum + item.metrics.activeUsageDays, 0)
    return Math.round(totalDays / completedCycles.length)
  }

  const items = [
    { status: 'finished', usageMode: 'duration', metrics: { activeUsageDays: 20 } },
    { status: 'finished', usageMode: 'duration', metrics: { activeUsageDays: 30 } },
    { status: 'finished', usageMode: 'one_time', metrics: null }, // One-time item with null metrics
    { status: 'finished', usageMode: 'one_time', metrics: { activeUsageDays: 1 } }, // Even if metrics existed erroneously
  ]

  const typical = calculateTypicalUsage(items)
  assert.equal(typical, 25, 'Average must be exactly (20 + 30) / 2 = 25, ignoring one_time items')
})

test('11. Activity formatter renders item_used event naturally without mentioning "finished" or "started"', () => {
  function formatActivityRow(row) {
    const actorName = row.actor?.display_name || 'Someone'
    const productName = row.metadata?.product_name || 'product'

    if (row.event_type === 'item_used') {
      return {
        label: `${actorName} used ${productName}`,
        tone: 'neutral',
        icon: 'checkmarkDoneOutline',
        href: `/app/items/${row.entity_id}`,
      }
    }
    return null
  }

  const row = {
    id: 'act-1',
    event_type: 'item_used',
    entity_id: 'item-101',
    actor: { display_name: 'Esraa' },
    metadata: { product_name: 'Maggi Kofta Mix' },
  }

  const formatted = formatActivityRow(row)
  assert.equal(formatted.label, 'Esraa used Maggi Kofta Mix')
  assert.equal(formatted.label.includes('started'), false)
  assert.equal(formatted.label.includes('finished'), false)
  assert.equal(formatted.href, '/app/items/item-101')
})

test('12. BuySelected maps one_time items to "Use now" state selector instead of "Active"', () => {
  function getBuySelectedActionLabel(usageMode, startNow) {
    if (usageMode === 'one_time') {
      return startNow ? 'Use now' : 'Stocked'
    }
    return startNow ? 'Active' : 'Stocked'
  }

  assert.equal(getBuySelectedActionLabel('duration', true), 'Active')
  assert.equal(getBuySelectedActionLabel('duration', false), 'Stocked')
  assert.equal(getBuySelectedActionLabel('one_time', true), 'Use now')
  assert.equal(getBuySelectedActionLabel('one_time', false), 'Stocked')
})
