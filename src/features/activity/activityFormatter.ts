import {
  airplaneOutline,
  bagHandleOutline,
  cardOutline,
  cartOutline,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  closeCircleOutline,
  createOutline,
  cubeOutline,
  hourglassOutline,
  notificationsOutline,
  playOutline,
  swapHorizontalOutline,
  trashOutline,
} from 'ionicons/icons'
import { formatRelativeCairoTime } from '../../core/utils/cairoDate.ts'
import type { ActivityEventRow, RecentActivityEntry } from './activityTypes.ts'

/**
 * Maps a raw ActivityEventRow into a polished, natural-language RecentActivityEntry.
 *
 * Rules:
 * - Natural household phrasing ("Ahmed finished Toothpaste", "Esraa bought Lavazza")
 * - Strictly hides database/technical fields (no UUIDs, no table names, no JSON)
 * - Assigns domain-consistent icon and RowTone
 * - Resolves valid navigation URL if the entity is clickable
 */
export function formatActivityEvent(
  row: ActivityEventRow,
  actorMap?: Record<string, string>,
): RecentActivityEntry {
  const actorName =
    row.actor?.person?.name ||
    (row.actor_user_id ? actorMap?.[row.actor_user_id] : null) ||
    row.metadata?.actor_name ||
    'Someone'

  const metadata = row.metadata || {}
  const relativeTime = formatRelativeCairoTime(row.occurred_at)

  switch (row.event_type) {
    case 'product_purchased': {
      const product = metadata.product_name || 'an item'
      // If linked item ID exists, navigate to item details; otherwise product details
      const href =
        row.related_entity_type === 'items' && row.related_entity_id
          ? `/app/items/${row.related_entity_id}`
          : row.entity_type === 'products' && row.entity_id
            ? `/app/products/${row.entity_id}`
            : row.entity_id
              ? `/app/items/${row.entity_id}`
              : null

      return {
        id: row.id,
        icon: bagHandleOutline,
        tone: 'success',
        label: `${actorName} bought ${product}`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href,
      }
    }

    case 'item_created': {
      const product = metadata.product_name || 'item'
      return {
        id: row.id,
        icon: cubeOutline,
        tone: 'primary',
        label: `${actorName} added ${product} to stock`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: row.entity_id ? `/app/items/${row.entity_id}` : null,
      }
    }

    case 'item_started': {
      const product = metadata.product_name || 'item'
      return {
        id: row.id,
        icon: playOutline,
        tone: 'info',
        label: `${actorName} started using ${product}`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: row.entity_id ? `/app/items/${row.entity_id}` : null,
      }
    }

    case 'item_finished': {
      const product = metadata.product_name || 'item'
      return {
        id: row.id,
        icon: checkmarkCircleOutline,
        tone: 'neutral',
        label: `${actorName} finished ${product}`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: row.entity_id ? `/app/items/${row.entity_id}` : null,
      }
    }

    case 'expense_created': {
      const amount =
        metadata.amount != null
          ? `EGP ${Number(metadata.amount).toLocaleString('en-US')}`
          : 'an expense'
      const merchant = metadata.merchant?.trim()
      const description = metadata.description?.trim()

      let label: string
      if (merchant) {
        label = `${actorName} added an ${amount} expense at ${merchant}`
      } else if (description) {
        label = `${actorName} added an ${amount} expense for ${description}`
      } else {
        label = `${actorName} added ${amount}`
      }

      return {
        id: row.id,
        icon: cardOutline,
        tone: 'primary',
        label,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: row.entity_id ? `/app/expenses/${row.entity_id}` : null,
      }
    }

    case 'expense_updated': {
      const merchant = metadata.merchant?.trim()
      const label = merchant
        ? `${actorName} updated an expense at ${merchant}`
        : `${actorName} updated an expense`

      return {
        id: row.id,
        icon: createOutline,
        tone: 'neutral',
        label,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: row.entity_id ? `/app/expenses/${row.entity_id}` : null,
      }
    }

    case 'expense_deleted': {
      return {
        id: row.id,
        icon: trashOutline,
        tone: 'danger',
        label: `${actorName} deleted an expense`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: null,
      }
    }

    case 'trip_created': {
      const tripName = metadata.trip_name || 'a'
      return {
        id: row.id,
        icon: airplaneOutline,
        tone: 'info',
        label: `${actorName} added ${tripName} trip`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: row.entity_id ? `/app/trips/${row.entity_id}/edit` : null,
      }
    }

    case 'trip_updated': {
      const tripName = metadata.trip_name || 'a'
      return {
        id: row.id,
        icon: airplaneOutline,
        tone: 'info',
        label: `${actorName} updated ${tripName} trip`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: row.entity_id ? `/app/trips/${row.entity_id}/edit` : null,
      }
    }

    case 'trip_deleted': {
      const tripName = metadata.trip_name || 'a'
      return {
        id: row.id,
        icon: trashOutline,
        tone: 'danger',
        label: `${actorName} deleted ${tripName} trip`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: null,
      }
    }

    case 'bank_transaction_captured': {
      const merchant = metadata.merchant?.trim()
      const label = merchant
        ? `CIB transaction detected at ${merchant}`
        : `CIB transaction detected`

      return {
        id: row.id,
        icon: notificationsOutline,
        tone: 'warning',
        label,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: row.entity_id ? `/app/pending-transactions/${row.entity_id}` : null,
      }
    }

    case 'bank_transaction_allocation_created': {
      const amount =
        metadata.amount != null
          ? `EGP ${Number(metadata.amount).toLocaleString('en-US')}`
          : 'an amount'

      return {
        id: row.id,
        icon: swapHorizontalOutline,
        tone: 'primary',
        label: `${actorName} allocated ${amount} from a bank transaction`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: row.entity_id ? `/app/pending-transactions/${row.entity_id}` : null,
      }
    }

    case 'bank_transaction_partially_fulfilled': {
      return {
        id: row.id,
        icon: hourglassOutline,
        tone: 'warning',
        label: `${actorName} partially processed a bank transaction`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: row.entity_id ? `/app/pending-transactions/${row.entity_id}` : null,
      }
    }

    case 'bank_transaction_fulfilled': {
      return {
        id: row.id,
        icon: checkmarkDoneOutline,
        tone: 'success',
        label: `${actorName} completed a bank transaction`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: row.entity_id ? `/app/pending-transactions/${row.entity_id}` : null,
      }
    }

    case 'bank_transaction_ignored': {
      return {
        id: row.id,
        icon: closeCircleOutline,
        tone: 'neutral',
        label: `${actorName} ignored a bank transaction`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: row.entity_id ? `/app/pending-transactions/${row.entity_id}` : null,
      }
    }

    case 'shopping_item_added': {
      const product = metadata.product_name || 'an item'
      return {
        id: row.id,
        icon: cartOutline,
        tone: 'warning',
        label: `${actorName} added ${product} to the shopping list`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: '/app/shopping-list',
      }
    }

    case 'shopping_item_purchased': {
      const product = metadata.product_name || 'an item'
      return {
        id: row.id,
        icon: cartOutline,
        tone: 'success',
        label: `${actorName} marked ${product} as purchased`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: '/app/shopping-list',
      }
    }

    case 'shopping_item_removed': {
      const product = metadata.product_name || 'an item'
      return {
        id: row.id,
        icon: cartOutline,
        tone: 'neutral',
        label: `${actorName} removed ${product} from the shopping list`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: '/app/shopping-list',
      }
    }

    default: {
      return {
        id: row.id,
        icon: cubeOutline,
        tone: 'neutral',
        label: `${actorName} recorded an update`,
        timestamp: relativeTime,
        occurredAt: row.occurred_at,
        href: null,
      }
    }
  }
}
