// Tests for HomeOS Persisted Domain Activity Event System
// Run: node scripts/recent-activity.test.mjs

import test from 'node:test'
import assert from 'node:assert/strict'
import { formatActivityEvent } from '../src/features/activity/activityFormatter.ts'
import { formatRelativeCairoTime } from '../src/core/utils/cairoDate.ts'

const mockActorMap = {
  'user-ahmed-uuid': 'Ahmed',
  'user-esraa-uuid': 'Esraa',
}

// 1. product_purchased formats to natural sentence with correct link and icon
test('1. product_purchased formats to natural sentence with correct link and icon', () => {
  const row = {
    id: 'evt-1',
    event_type: 'product_purchased',
    actor_user_id: 'user-esraa-uuid',
    entity_type: 'products',
    entity_id: 'prod-lavazza',
    related_entity_type: 'items',
    related_entity_id: 'item-101',
    metadata: { product_name: 'Lavazza', amount: 450, merchant: 'Carrefour' },
    occurred_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    actor: { person: { name: 'Esraa' } },
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label, 'Esraa bought Lavazza')
  assert.equal(res.tone, 'success')
  assert.equal(res.href, '/app/items/item-101')
  assert.equal(res.timestamp, '2 min ago')
})

// 2. item_finished formats to natural sentence
test('2. item_finished formats to natural sentence', () => {
  const row = {
    id: 'evt-2',
    event_type: 'item_finished',
    actor_user_id: 'user-ahmed-uuid',
    entity_type: 'items',
    entity_id: 'item-202',
    metadata: { product_name: 'Toothpaste' },
    occurred_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    actor: { person: { name: 'Ahmed' } },
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label, 'Ahmed finished Toothpaste')
  assert.equal(res.tone, 'neutral')
  assert.equal(res.href, '/app/items/item-202')
  assert.equal(res.timestamp, '18 min ago')
})

// 3. item_started formats to natural sentence
test('3. item_started formats to natural sentence', () => {
  const row = {
    id: 'evt-3',
    event_type: 'item_started',
    actor_user_id: 'user-ahmed-uuid',
    entity_type: 'items',
    entity_id: 'item-303',
    metadata: { product_name: 'Downy' },
    occurred_at: new Date().toISOString(),
    actor: { person: { name: 'Ahmed' } },
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label, 'Ahmed started using Downy')
  assert.equal(res.tone, 'info')
  assert.equal(res.href, '/app/items/item-303')
})

// 4. item_created (added to stock) formats to natural sentence
test('4. item_created formats to natural sentence', () => {
  const row = {
    id: 'evt-4',
    event_type: 'item_created',
    actor_user_id: 'user-ahmed-uuid',
    entity_type: 'items',
    entity_id: 'item-404',
    metadata: { product_name: 'Lavazza', quantity: 2 },
    occurred_at: new Date().toISOString(),
    actor: { person: { name: 'Ahmed' } },
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label, 'Ahmed added Lavazza to stock')
  assert.equal(res.tone, 'primary')
  assert.equal(res.href, '/app/items/item-404')
})

// 5. trip_created formats to natural sentence and links to edit route
test('5. trip_created formats to natural sentence and links to edit route', () => {
  const row = {
    id: 'evt-5',
    event_type: 'trip_created',
    actor_user_id: 'user-ahmed-uuid',
    entity_type: 'trips',
    entity_id: 'trip-alex',
    metadata: { trip_name: 'Alexandria' },
    occurred_at: new Date().toISOString(),
    actor: { person: { name: 'Ahmed' } },
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label, 'Ahmed added Alexandria trip')
  assert.equal(res.tone, 'info')
  assert.equal(res.href, '/app/trips/trip-alex/edit')
})

// 6. expense_created with merchant formats naturally
test('6. expense_created with merchant formats naturally', () => {
  const row = {
    id: 'evt-6',
    event_type: 'expense_created',
    actor_user_id: 'user-esraa-uuid',
    entity_type: 'expenses',
    entity_id: 'exp-505',
    metadata: { amount: 450, merchant: 'Carrefour', description: 'Groceries' },
    occurred_at: new Date().toISOString(),
    actor: { person: { name: 'Esraa' } },
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label, 'Esraa added an EGP 450 expense at Carrefour')
  assert.equal(res.tone, 'primary')
  assert.equal(res.href, '/app/expenses/exp-505')
})

// 7. expense_created without merchant uses description fallback
test('7. expense_created without merchant uses description fallback', () => {
  const row = {
    id: 'evt-7',
    event_type: 'expense_created',
    actor_user_id: 'user-ahmed-uuid',
    entity_type: 'expenses',
    entity_id: 'exp-606',
    metadata: { amount: 150, merchant: null, description: 'Dry cleaning' },
    occurred_at: new Date().toISOString(),
    actor: { person: { name: 'Ahmed' } },
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label, 'Ahmed added an EGP 150 expense for Dry cleaning')
  assert.equal(res.href, '/app/expenses/exp-606')
})

// 8. expense_deleted has no navigation link and danger tone
test('8. expense_deleted has no navigation link and danger tone', () => {
  const row = {
    id: 'evt-8',
    event_type: 'expense_deleted',
    actor_user_id: 'user-ahmed-uuid',
    entity_type: 'expenses',
    entity_id: 'exp-del',
    metadata: {},
    occurred_at: new Date().toISOString(),
    actor: { person: { name: 'Ahmed' } },
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label, 'Ahmed deleted an expense')
  assert.equal(res.tone, 'danger')
  assert.equal(res.href, null)
})

// 9. bank_transaction_captured uses system phrasing without fake user actor
test('9. bank_transaction_captured uses system phrasing without fake user actor', () => {
  const row = {
    id: 'evt-9',
    event_type: 'bank_transaction_captured',
    actor_user_id: null,
    entity_type: 'bank_transactions',
    entity_id: 'tx-cib-789',
    metadata: { merchant: 'CARREFOUR', amount: 1250 },
    occurred_at: new Date().toISOString(),
    actor: null,
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label, 'CIB transaction detected at CARREFOUR')
  assert.equal(res.tone, 'warning')
  assert.equal(res.href, '/app/pending-transactions/tx-cib-789')
})

// 10. bank_transaction_allocation_created formats correctly
test('10. bank_transaction_allocation_created formats correctly', () => {
  const row = {
    id: 'evt-10',
    event_type: 'bank_transaction_allocation_created',
    actor_user_id: 'user-ahmed-uuid',
    entity_type: 'bank_transactions',
    entity_id: 'tx-cib-789',
    metadata: { amount: 450, merchant: 'CARREFOUR' },
    occurred_at: new Date().toISOString(),
    actor: { person: { name: 'Ahmed' } },
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label, 'Ahmed allocated EGP 450 from a bank transaction')
  assert.equal(res.tone, 'primary')
  assert.equal(res.href, '/app/pending-transactions/tx-cib-789')
})

// 11. bank_transaction_fulfilled formats correctly
test('11. bank_transaction_fulfilled formats correctly', () => {
  const row = {
    id: 'evt-11',
    event_type: 'bank_transaction_fulfilled',
    actor_user_id: 'user-ahmed-uuid',
    entity_type: 'bank_transactions',
    entity_id: 'tx-cib-789',
    metadata: {},
    occurred_at: new Date().toISOString(),
    actor: { person: { name: 'Ahmed' } },
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label, 'Ahmed completed a bank transaction')
  assert.equal(res.tone, 'success')
  assert.equal(res.href, '/app/pending-transactions/tx-cib-789')
})

// 12. bank_transaction_ignored formats correctly
test('12. bank_transaction_ignored formats correctly', () => {
  const row = {
    id: 'evt-12',
    event_type: 'bank_transaction_ignored',
    actor_user_id: 'user-esraa-uuid',
    entity_type: 'bank_transactions',
    entity_id: 'tx-cib-999',
    metadata: {},
    occurred_at: new Date().toISOString(),
    actor: { person: { name: 'Esraa' } },
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label, 'Esraa ignored a bank transaction')
  assert.equal(res.tone, 'neutral')
  assert.equal(res.href, '/app/pending-transactions/tx-cib-999')
})

// 13. shopping_item_added formats correctly
test('13. shopping_item_added formats correctly', () => {
  const row = {
    id: 'evt-13',
    event_type: 'shopping_item_added',
    actor_user_id: 'user-esraa-uuid',
    entity_type: 'shopping_list_items',
    entity_id: 'slip-1',
    metadata: { product_name: 'Lavazza' },
    occurred_at: new Date().toISOString(),
    actor: { person: { name: 'Esraa' } },
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label, 'Esraa added Lavazza to the shopping list')
  assert.equal(res.tone, 'warning')
  assert.equal(res.href, '/app/shopping-list')
})

// 14. Fallback actor map works when join is missing
test('14. Fallback actor map works when join is missing', () => {
  const row = {
    id: 'evt-14',
    event_type: 'item_finished',
    actor_user_id: 'user-ahmed-uuid',
    entity_type: 'items',
    entity_id: 'item-888',
    metadata: { product_name: 'Tea' },
    occurred_at: new Date().toISOString(),
    actor: null, // join unpopulated
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label, 'Ahmed finished Tea')
})

// 15. formatRelativeCairoTime relative formatting rules
test('15. formatRelativeCairoTime relative formatting rules', () => {
  const now = new Date('2026-09-05T18:00:00Z')

  // 30 seconds ago
  const sec30 = new Date('2026-09-05T17:59:30Z').toISOString()
  assert.equal(formatRelativeCairoTime(sec30, now), 'Just now')

  // 2 minutes ago
  const min2 = new Date('2026-09-05T17:58:00Z').toISOString()
  assert.equal(formatRelativeCairoTime(min2, now), '2 min ago')

  // 18 minutes ago
  const min18 = new Date('2026-09-05T17:42:00Z').toISOString()
  assert.equal(formatRelativeCairoTime(min18, now), '18 min ago')

  // 3 hours ago (same Cairo calendar day)
  const hours3 = new Date('2026-09-05T15:00:00Z').toISOString()
  assert.equal(formatRelativeCairoTime(hours3, now), '3 hours ago')
})

// 16. Technical fields are completely excluded from the user label
test('16. Technical fields are completely excluded from the user label', () => {
  const row = {
    id: 'evt-16',
    event_type: 'product_purchased',
    actor_user_id: '550e8400-e29b-41d4-a716-446655440000',
    entity_type: 'products',
    entity_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    related_entity_type: 'items',
    related_entity_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    metadata: { product_name: 'Lavazza', amount: 450 },
    correlation_id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    source_operation: 'purchase_product',
    occurred_at: new Date().toISOString(),
    actor: { person: { name: 'Esraa' } },
  }

  const res = formatActivityEvent(row, mockActorMap)
  assert.equal(res.label.includes('550e8400'), false)
  assert.equal(res.label.includes('6ba7b810'), false)
  assert.equal(res.label.includes('product_purchased'), false)
  assert.equal(res.label.includes('purchase_product'), false)
  assert.equal(res.label, 'Esraa bought Lavazza')
})

// 17. Multi-event completeness: single purchase produces distinct domain events
test('17. Multi-event completeness: single purchase produces distinct domain events', () => {
  const correlationId = 'corr-purchase-123'
  const occurredAt = new Date().toISOString()

  const rawEvents = [
    {
      id: 'evt-p1',
      event_type: 'product_purchased',
      actor_user_id: 'user-ahmed-uuid',
      entity_type: 'products',
      entity_id: 'prod-lavazza',
      related_entity_type: 'items',
      related_entity_id: 'item-lavazza',
      metadata: { product_name: 'Lavazza', amount: 450, merchant: 'Carrefour' },
      correlation_id: correlationId,
      occurred_at: occurredAt,
      actor: { person: { name: 'Ahmed' } },
    },
    {
      id: 'evt-p2',
      event_type: 'item_created',
      actor_user_id: 'user-ahmed-uuid',
      entity_type: 'items',
      entity_id: 'item-lavazza',
      related_entity_type: 'products',
      related_entity_id: 'prod-lavazza',
      metadata: { product_name: 'Lavazza' },
      correlation_id: correlationId,
      occurred_at: occurredAt,
      actor: { person: { name: 'Ahmed' } },
    },
    {
      id: 'evt-p3',
      event_type: 'expense_created',
      actor_user_id: 'user-ahmed-uuid',
      entity_type: 'expenses',
      entity_id: 'exp-lavazza',
      metadata: { amount: 450, merchant: 'Carrefour' },
      correlation_id: correlationId,
      occurred_at: occurredAt,
      actor: { person: { name: 'Ahmed' } },
    },
  ]

  const formatted = rawEvents.map((e) => formatActivityEvent(e, mockActorMap))

  assert.equal(formatted.length, 3, 'All 3 domain events are preserved and not collapsed')
  assert.equal(formatted[0].label, 'Ahmed bought Lavazza')
  assert.equal(formatted[1].label, 'Ahmed added Lavazza to stock')
  assert.equal(formatted[2].label, 'Ahmed added an EGP 450 expense at Carrefour')
})

// 18. shopping_item_purchased and shopping_item_removed format correctly
test('18. shopping_item_purchased and shopping_item_removed format correctly', () => {
  const purchaseEvt = {
    id: 'evt-shop-1',
    event_type: 'shopping_item_purchased',
    actor_user_id: 'user-esraa-uuid',
    entity_type: 'shopping_list_items',
    entity_id: 'slip-1',
    metadata: { product_name: 'Nutella' },
    occurred_at: new Date().toISOString(),
    actor: { person: { name: 'Esraa' } },
  }
  assert.equal(formatActivityEvent(purchaseEvt, mockActorMap).label, 'Esraa marked Nutella as purchased')
  assert.equal(formatActivityEvent(purchaseEvt, mockActorMap).tone, 'success')

  const removeEvt = {
    id: 'evt-shop-2',
    event_type: 'shopping_item_removed',
    actor_user_id: 'user-ahmed-uuid',
    entity_type: 'shopping_list_items',
    entity_id: 'slip-2',
    metadata: { product_name: 'Batteries' },
    occurred_at: new Date().toISOString(),
    actor: { person: { name: 'Ahmed' } },
  }
  assert.equal(formatActivityEvent(removeEvt, mockActorMap).label, 'Ahmed removed Batteries from the shopping list')
  assert.equal(formatActivityEvent(removeEvt, mockActorMap).tone, 'neutral')
})

// 19. Graceful fallback when metadata or actor name is completely missing
test('19. Graceful fallback when metadata or actor name is completely missing', () => {
  const blankEvent = {
    id: 'evt-blank',
    event_type: 'unknown_event_type',
    actor_user_id: null,
    entity_type: 'unknown',
    entity_id: null,
    metadata: null,
    occurred_at: new Date().toISOString(),
  }

  const res = formatActivityEvent(blankEvent)
  assert.equal(res.label, 'Someone recorded an update')
  assert.equal(res.tone, 'neutral')
  assert.equal(res.href, null)
})
