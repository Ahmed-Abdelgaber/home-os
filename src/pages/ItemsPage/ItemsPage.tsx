import { useQueryClient } from '@tanstack/react-query'
import { IonIcon } from '@ionic/react'
import { chevronForward, closeOutline, optionsOutline, play, searchOutline } from 'ionicons/icons'
import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resolveProductVisual } from '../../core/presentation/productVisuals'
import { formatShortDate } from '../../core/utils/cairoDate'
import { useStartItem } from '../../features/items/useItemMutations'
import { useActiveItems, useFinishedItems, useStockedItems } from '../../features/items/useItems'
import { groupItemDays, isLongItem, LONG_ITEM_DAYS } from '../../features/items/itemLedger'
import type { ItemOrder, ItemsView } from '../../features/items/itemLedger'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { QueryState } from '../../shared/components/QueryState'
import { SearchBar } from '../../shared/components/SearchBar'
import { Skeleton } from '../../shared/components/Skeleton'
import '../../shared/components/CompactLedger.css'
import './ItemsPage.css'

const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Cairo' })
const viewLabels: Record<ItemsView, string> = { active: 'Active', stocked: 'Stocked', finished: 'Finished' }
const dateLabels: Record<ItemsView, string> = { active: 'Started', stocked: 'Purchased', finished: 'Finished' }

export function ItemsPage() {
  const queryClient = useQueryClient()
  const startItem = useStartItem()
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [order, setOrder] = useState<ItemOrder>('default')
  const [longOnly, setLongOnly] = useState(false)
  const searchContainer = useRef<HTMLDivElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const rawView = searchParams.get('view')
  const view: ItemsView = rawView === 'stocked' ? 'stocked' : rawView === 'finished' ? 'finished' : 'active'
  const activeItems = useActiveItems()
  const stockedItems = useStockedItems()
  const finishedItems = useFinishedItems()
  const queries = { active: activeItems, stocked: stockedItems, finished: finishedItems }
  const query = queries[view]
  const lowerSearch = search.trim().toLocaleLowerCase()
  const filterLong = longOnly && view !== 'finished'

  function resetFilters() { setSearch(''); setLongOnly(false); setOrder('default') }
  function selectView(next: ItemsView) {
    const params = new URLSearchParams(searchParams)
    if (next === 'active') params.delete('view'); else params.set('view', next)
    setSearchParams(params, { replace: true })
    resetFilters()
    if (!startItem.isPending) startItem.reset()
  }

  return (
    <AppPage title="Items" className={`homeos-compact-ledger homeos-items-page homeos-items-page--${view}`} fullscreen={false}
      headerActions={<>
        <button type="button" className="homeos-ledger-tool" aria-label={searchOpen ? 'Close item search' : 'Search items'} aria-expanded={searchOpen} aria-controls="items-search" onClick={() => {
          setSearchOpen(!searchOpen)
          if (searchOpen) setSearch('')
          else requestAnimationFrame(() => searchContainer.current?.querySelector('input')?.focus())
        }}><IonIcon icon={searchOpen ? closeOutline : searchOutline} aria-hidden="true" /></button>
        <button type="button" className={`homeos-ledger-tool ${filterLong || order !== 'default' ? 'homeos-ledger-tool--selected' : ''}`} aria-label="Filter items" aria-expanded={filtersOpen} aria-controls="items-filters" onClick={() => setFiltersOpen(!filtersOpen)}><IonIcon icon={optionsOutline} aria-hidden="true" /></button>
      </>}
      onRefresh={() => queryClient.invalidateQueries({ queryKey: ['items'] })}>
      <div id="items-search" ref={searchContainer} hidden={!searchOpen}>
        <SearchBar value={search} onChange={(value) => { setSearch(value); if (!value) searchContainer.current?.querySelector('input')?.focus() }} placeholder="Search items…" />
      </div>
      <div className="homeos-ledger-categories homeos-items-views" role="group" aria-label="Item status">
        {(['active', 'stocked', 'finished'] as const).map((status) => <button key={status} type="button" className={`homeos-items-view--${status}`} aria-pressed={view === status} onClick={() => selectView(status)}>
          {viewLabels[status]}{!queries[status].isError && queries[status].data && <span className="homeos-items-count">{queries[status].data.length}</span>}
        </button>)}
      </div>
      {filtersOpen && <div className="homeos-ledger-filters" id="items-filters">
        <fieldset><legend>{dateLabels[view]} date</legend><div className="homeos-ledger-options">
          {(['default', 'oldest', 'newest'] as const).map((value) => <button key={value} type="button" aria-pressed={order === value} onClick={() => setOrder(value)}>{value === 'default' ? 'Default order' : value === 'oldest' ? 'Oldest first' : 'Newest first'}</button>)}
        </div></fieldset>
        {view !== 'finished' && <fieldset><legend>{view === 'active' ? 'Time in use' : 'Time in storage'}</legend><div className="homeos-ledger-options">
          <button type="button" aria-pressed={!longOnly} onClick={() => setLongOnly(false)}>All durations</button>
          <button type="button" aria-pressed={longOnly} onClick={() => setLongOnly(true)}>{LONG_ITEM_DAYS[view]}+ days only</button>
        </div></fieldset>}
        <button type="button" className="homeos-ledger-reset" onClick={resetFilters}>Reset filters</button>
      </div>}
      {startItem.isError && <p className="homeos-items-feedback" role="alert">Couldn't start this item. Please try again.</p>}
      {startItem.isSuccess && <p className="homeos-ledger-feedback" role="status">Item started. You can find it in Active.</p>}
      <QueryState query={query} skeleton={<div className="homeos-items-skeleton-stack"><Skeleton height={20} width="50%" />{[0, 1, 2, 3].map((row) => <Skeleton key={row} height={72} />)}</div>}
        error={`Couldn't load ${view} items.`}
        empty={<EmptyState title={view === 'active' ? 'No active items yet' : view === 'stocked' ? 'Nothing stocked yet' : 'No finished items yet'} message={view === 'active' ? 'Start using a stocked item to see it here.' : view === 'stocked' ? 'New purchases kept for later will appear here.' : 'Items you finish will appear here with how long they lasted.'} />}>
        {(items) => {
          const filtered = items.filter(item => (!lowerSearch || `${item.title} ${item.meta}`.toLocaleLowerCase().includes(lowerSearch)) && (!filterLong || isLongItem(item, view)))
          if (!filtered.length) return <EmptyState icon={searchOutline} title="No matching items" message="Try another search or duration filter." action={<button type="button" className="homeos-ledger-reset" onClick={resetFilters}>Clear filters</button>} />
          return <div aria-label={`${viewLabels[view]} items by date`}>
            {(lowerSearch || filterLong) && <p className="homeos-ledger-feedback" role="status">{filtered.length} matching {filtered.length === 1 ? 'item' : 'items'}</p>}
            {groupItemDays(filtered, view, order).map(group => {
              const label = group.date ? `${dateLabels[view]} ${dateFormatter.format(new Date(`${group.date}T00:00:00Z`))}` : `${dateLabels[view]} date unavailable`
              return <section className="homeos-ledger-day" key={group.date} aria-label={label}>
                <div className="homeos-ledger-day__heading"><h2>{label}</h2><span>{group.items.length} {group.items.length === 1 ? 'item' : 'items'}</span></div>
                <ul className="homeos-ledger-rows">
                  {group.items.map(item => {
                    const visual = resolveProductVisual(item.title)
                    const long = isLongItem(item, view)
                    const statusLabel = view === 'active' ? (long ? 'Long-running' : 'In use') : view === 'stocked' ? (long ? 'Long-stocked' : 'In stock') : item.startedDate ? `Started ${formatShortDate(item.startedDate)}` : 'Finished'
                    return <li className="homeos-item-ledger-entry" key={item.id}>
                      <Link className="homeos-ledger-row homeos-item-ledger-row" to={`/app/items/${item.id}`}>
                        <span className={`homeos-ledger-row__icon homeos-ledger-row__icon--${visual.tone}`} aria-hidden="true">{visual.ruleId ? visual.emoji : '📦'}</span>
                        <span className="homeos-ledger-row__copy"><strong dir="auto">{item.title}{item.quantity != null && item.quantity > 1 && <span className="homeos-item-quantity"> ×{item.quantity}</span>}</strong><span className={`homeos-item-status homeos-item-status--${long ? 'warning' : view}`}>{statusLabel}</span></span>
                        <span className={`homeos-item-duration homeos-item-duration--${long ? 'warning' : view}`}>
                          {item.days != null ? <><strong>{item.days}</strong><span>{`${item.days === 1 ? 'day' : 'days'}${view === 'finished' ? ' lasted' : ''}`}</span></> : <span>—</span>}
                        </span>
                        {view !== 'stocked' && <IonIcon className="homeos-ledger-chevron" icon={chevronForward} aria-hidden="true" />}
                      </Link>
                      {view === 'stocked' && <button type="button" className="homeos-item-start" disabled={startItem.isPending} aria-busy={startItem.isPending && startItem.variables === item.id} aria-label={`Start using ${item.title}`} onClick={() => startItem.mutate(item.id)}>
                        <IonIcon icon={play} aria-hidden="true" /><span>{startItem.isPending && startItem.variables === item.id ? 'Starting…' : 'Start'}</span>
                      </button>}
                    </li>
                  })}
                </ul>
              </section>
            })}
          </div>
        }}
      </QueryState>
      {query.isError && <button className="homeos-ledger-reset" type="button" onClick={() => void query.refetch()}>Try again</button>}
    </AppPage>
  )
}
