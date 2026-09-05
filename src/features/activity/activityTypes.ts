import type { RowTone } from '../../shared/components/Row'

export type ActivityEventType =
  | 'product_purchased'
  | 'item_created'
  | 'item_started'
  | 'item_finished'
  | 'expense_created'
  | 'expense_updated'
  | 'expense_deleted'
  | 'trip_created'
  | 'trip_updated'
  | 'trip_deleted'
  | 'bank_transaction_captured'
  | 'bank_transaction_allocation_created'
  | 'bank_transaction_partially_fulfilled'
  | 'bank_transaction_fulfilled'
  | 'bank_transaction_ignored'
  | 'shopping_item_added'
  | 'shopping_item_purchased'
  | 'shopping_item_removed'

export interface ActivityMetadata {
  product_name?: string
  amount?: number
  currency?: string
  merchant?: string | null
  description?: string
  trip_name?: string
  quantity?: number
  actor_name?: string
  departure_date?: string
  return_date?: string
  [key: string]: unknown
}

export interface ActivityEventRow {
  id: string
  event_type: ActivityEventType | string
  actor_user_id: string | null
  entity_type: string
  entity_id: string | null
  related_entity_type?: string | null
  related_entity_id?: string | null
  metadata: ActivityMetadata | null
  correlation_id?: string | null
  source_operation?: string | null
  occurred_at: string
  actor?: {
    person?: {
      name?: string | null
    } | null
  } | null
}

export interface RecentActivityEntry {
  id: string
  icon: string
  tone: RowTone
  label: string
  timestamp: string
  occurredAt: string
  /** The record this entry describes. If empty or null, the row is not clickable. */
  href: string | null
}
