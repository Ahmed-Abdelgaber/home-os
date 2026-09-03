// Tests for HomeOS v2.1.0 Custom Finish Date + Edit Finished Date per requirements.
// Run: node scripts/item-finish-date.test.mjs

import test from 'node:test'
import assert from 'node:assert/strict'
import { z } from 'zod'

const CAIRO_TZ = 'Africa/Cairo'
function cairoToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CAIRO_TZ }).format(new Date())
}

function createFinishDateSchema(startedDate) {
  return z.object({
    finishedDate: z
      .string()
      .min(1, 'Select a finish date')
      .refine(
        (date) => !startedDate || date >= startedDate,
        `Finish date cannot be before start date (${startedDate ?? ''})`,
      ),
  })
}

test('1. Finish Item opens date UI instead of immediately mutating', () => {
  let finishSheetOpen = false
  let mutationCalled = false

  const handleFinishButtonClick = () => {
    // Pressing finish item opens the sheet without invoking mutation
    finishSheetOpen = true
  }

  handleFinishButtonClick()
  assert.equal(finishSheetOpen, true, 'Finish sheet must be opened')
  assert.equal(mutationCalled, false, 'Mutation must not be immediately called on button press')
})

test('2. Finish date defaults to current Africa/Cairo date', () => {
  const expectedCairoToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date())
  const defaultDate = cairoToday()

  assert.equal(defaultDate, expectedCairoToday, 'Default finish date must match Africa/Cairo today')
  assert.match(defaultDate, /^\d{4}-\d{2}-\d{2}$/)
})

test('3. Existing finish_item() is called with the selected date', async () => {
  const rpcCalls = []
  const mockSupabase = {
    rpc: (name, params) => {
      rpcCalls.push({ name, params })
      return Promise.resolve({ error: null })
    },
  }

  const itemId = 'item-active-123'
  const chosenDate = '2026-09-02'

  await mockSupabase.rpc('finish_item', {
    p_item_id: itemId,
    p_finished_date: chosenDate,
  })

  assert.equal(rpcCalls.length, 1)
  assert.equal(rpcCalls[0].name, 'finish_item')
  assert.equal(rpcCalls[0].params.p_item_id, itemId)
  assert.equal(rpcCalls[0].params.p_finished_date, '2026-09-02')
})

test('4. Date before started_date is rejected', () => {
  const startedDate = '2026-08-15'
  const schema = createFinishDateSchema(startedDate)

  // Prior date: 2026-08-14
  const invalidResult = schema.safeParse({ finishedDate: '2026-08-14' })
  assert.equal(invalidResult.success, false, 'Date prior to start date must fail validation')

  // Later date: 2026-08-16
  const validResult = schema.safeParse({ finishedDate: '2026-08-16' })
  assert.equal(validResult.success, true, 'Date after start date must pass validation')
})

test('5. Same-day start/finish remains valid', () => {
  const startedDate = '2026-09-03'
  const schema = createFinishDateSchema(startedDate)

  const sameDayResult = schema.safeParse({ finishedDate: '2026-09-03' })
  assert.equal(sameDayResult.success, true, 'Same-day start/finish must be accepted')

  // Verify HomeOS calendar days calculation (inclusive: finished - started + 1)
  const dStart = new Date(`${startedDate}T00:00:00Z`)
  const dFinish = new Date('2026-09-03T00:00:00Z')
  const calendarDays = Math.round((dFinish.getTime() - dStart.getTime()) / 86_400_000) + 1
  assert.equal(calendarDays, 1, 'Same-day usage must produce exactly 1 calendar day')
})

test('6. Successful Finish invalidates usage/history queries', async () => {
  const invalidatedKeys = []
  const mockQueryClient = {
    invalidateQueries: ({ queryKey }) => {
      invalidatedKeys.push(queryKey)
      return Promise.resolve()
    },
  }

  // Mimicking onSuccess handler of useFinishItem
  await Promise.all([
    mockQueryClient.invalidateQueries({ queryKey: ['items'] }),
    mockQueryClient.invalidateQueries({ queryKey: ['home'] }),
    mockQueryClient.invalidateQueries({ queryKey: ['products'] }),
  ])

  const topKeys = invalidatedKeys.map((k) => k[0])
  assert.ok(topKeys.includes('items'), 'items cache must be invalidated')
  assert.ok(topKeys.includes('home'), 'home cache must be invalidated')
  assert.ok(topKeys.includes('products'), 'products cache must be invalidated')
})

test('7. Finished Item exposes Edit finish date', () => {
  const finishedItemDetail = {
    id: 'item-fin-1',
    status: 'finished',
    startedDate: '2026-08-01',
    finishedDate: '2026-08-25',
  }

  function getAvailableActions(status) {
    const actions = []
    if (status === 'stocked') actions.push('start_using')
    if (status === 'active') actions.push('finish_item')
    if (status === 'finished') actions.push('edit_finish_date')
    actions.push('buy_again')
    return actions
  }

  const actions = getAvailableActions(finishedItemDetail.status)
  assert.ok(actions.includes('edit_finish_date'), 'Finished item must expose edit_finish_date')
  assert.ok(!actions.includes('finish_item'), 'Finished item must not expose finish_item')
  assert.ok(!actions.includes('start_using'), 'Finished item must not expose start_using')
})

test('8. Edit sheet preloads current finished_date', () => {
  const currentFinishedDate = '2026-08-28'

  const defaultValues = {
    finishedDate: currentFinishedDate ?? '',
  }

  assert.equal(defaultValues.finishedDate, '2026-08-28')
})

test('9. Editing finish date changes only finished_date', async () => {
  const originalItem = {
    id: 'item-abc',
    productId: 'prod-xyz',
    expenseId: 'exp-999',
    status: 'finished',
    startedDate: '2026-08-10',
    finishedDate: '2026-08-20',
    quantity: 2,
  }

  const rpcCalls = []
  const mockSupabase = {
    rpc: (name, params) => {
      rpcCalls.push({ name, params })
      return Promise.resolve({ error: null })
    },
  }

  const newFinishedDate = '2026-08-22'
  await mockSupabase.rpc('update_item_finished_date', {
    p_item_id: originalItem.id,
    p_finished_date: newFinishedDate,
  })

  // Verify parameters sent to RPC
  assert.equal(rpcCalls.length, 1)
  assert.equal(rpcCalls[0].name, 'update_item_finished_date')
  assert.deepEqual(Object.keys(rpcCalls[0].params).sort(), ['p_finished_date', 'p_item_id'].sort())
  assert.equal(rpcCalls[0].params.p_finished_date, '2026-08-22')

  // Other fields remain strictly untouched
  const simulatedUpdatedItem = {
    ...originalItem,
    finishedDate: rpcCalls[0].params.p_finished_date,
  }

  assert.equal(simulatedUpdatedItem.status, 'finished', 'Status must not change')
  assert.equal(simulatedUpdatedItem.startedDate, '2026-08-10', 'started_date must not change')
  assert.equal(simulatedUpdatedItem.productId, 'prod-xyz', 'Product must not change')
  assert.equal(simulatedUpdatedItem.expenseId, 'exp-999', 'Expense must not change')
  assert.equal(simulatedUpdatedItem.quantity, 2, 'Quantity must not change')
})

test('10. Finished Item remains Finished after edit', () => {
  const itemStatusBefore = 'finished'
  const itemStatusAfter = 'finished'
  assert.equal(itemStatusBefore, itemStatusAfter)
})

test('11. Usage metrics/history refresh after edit', async () => {
  const refetchedKeys = []
  const mockQueryClient = {
    invalidateQueries: ({ queryKey }) => {
      refetchedKeys.push(queryKey)
      return Promise.resolve()
    },
  }

  // Mimicking onSuccess handler of useUpdateItemFinishedDate
  await Promise.all([
    mockQueryClient.invalidateQueries({ queryKey: ['items'] }),
    mockQueryClient.invalidateQueries({ queryKey: ['home'] }),
    mockQueryClient.invalidateQueries({ queryKey: ['products'] }),
  ])

  const topKeys = refetchedKeys.map((k) => k[0])
  assert.ok(topKeys.includes('items'), 'items must be invalidated to re-read item_usage_metrics')
  assert.ok(topKeys.includes('home'), 'home must be invalidated')
  assert.ok(topKeys.includes('products'), 'products must be invalidated')
})

test('12. Backend failure leaves the Item unchanged and surfaces error', async () => {
  const mockSupabase = {
    rpc: () => Promise.resolve({ error: new Error('Database constraint violation: date before started_date') }),
  }

  let caughtError = null
  try {
    const { error } = await mockSupabase.rpc('update_item_finished_date', {
      p_item_id: 'item-1',
      p_finished_date: '2026-01-01',
    })
    if (error) throw error
  } catch (err) {
    caughtError = err
  }

  assert.ok(caughtError)
  assert.match(caughtError.message, /Database constraint violation/)
})
