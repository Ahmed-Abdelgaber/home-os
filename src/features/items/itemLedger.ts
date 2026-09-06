import type { ItemSummary } from './itemQueries'

export type ItemsView = 'active' | 'stocked' | 'finished'
export type ItemOrder = 'default' | 'oldest' | 'newest'
export const LONG_ITEM_DAYS = { active: 45, stocked: 30 } as const

export function itemLedgerDate(item: ItemSummary, view: ItemsView): string {
  return (view === 'active' ? item.startedDate : view === 'stocked' ? item.purchaseDate : item.finishedDate) ?? ''
}

export function groupItemDays(items: ItemSummary[], view: ItemsView, order: ItemOrder = 'default') {
  const oldestFirst = order === 'oldest' || (order === 'default' && view === 'active')
  const groups = new Map<string, ItemSummary[]>()
  for (const item of items) {
    const date = itemLedgerDate(item, view)
    const entries = groups.get(date) ?? []
    entries.push(item)
    groups.set(date, entries)
  }
  return [...groups].sort(([a], [b]) => !a ? 1 : !b ? -1 : oldestFirst ? a.localeCompare(b) : b.localeCompare(a))
    .map(([date, entries]) => ({ date, items: entries }))
}

export function isLongItem(item: ItemSummary, view: ItemsView): boolean {
  return view !== 'finished' && item.days != null && item.days >= LONG_ITEM_DAYS[view]
}
