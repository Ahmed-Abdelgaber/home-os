import { useQueryClient } from '@tanstack/react-query'
import { IonIcon } from '@ionic/react'
import {
  archiveOutline,
  checkmarkCircleOutline,
  chevronForward,
  play,
  pulseOutline,
  searchOutline,
  timeOutline,
} from 'ionicons/icons'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatShortDate } from '../../core/utils/cairoDate'
import { useStartItem } from '../../features/items/useItemMutations'
import { useActiveItems, useFinishedItems, useStockedItems } from '../../features/items/useItems'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { QueryState } from '../../shared/components/QueryState'
import { SearchBar } from '../../shared/components/SearchBar'
import { Skeleton } from '../../shared/components/Skeleton'
import './ItemsPage.css'

type ItemsView = 'active' | 'stocked' | 'finished'

export function ItemsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const startItem = useStartItem()
  const [search, setSearch] = useState('')

  /**
   * The view lives in the URL so Home's "View all" on Long-stocked can land here already
   * switched, and so a reload keeps the tab you were on.
   */
  const [searchParams, setSearchParams] = useSearchParams()
  const rawView = searchParams.get('view')
  const view: ItemsView = rawView === 'stocked' ? 'stocked' : rawView === 'finished' ? 'finished' : 'active'

  const selectView = (next: ItemsView) => {
    setSearchParams(next === 'active' ? {} : { view: next }, { replace: true })
    setSearch('')
  }

  const activeItems = useActiveItems()
  const stockedItems = useStockedItems()
  const finishedItems = useFinishedItems()
  const query = view === 'active' ? activeItems : view === 'stocked' ? stockedItems : finishedItems

  const activeCount = activeItems.data?.length
  const stockedCount = stockedItems.data?.length
  const finishedCount = finishedItems.data?.length

  const lowerSearch = search.toLowerCase()

  return (
    <AppPage title="Items" onRefresh={() => queryClient.invalidateQueries({ queryKey: ['items'] })}>
      <div className="homeos-items-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'active'}
          className={`homeos-items-toggle__option ${view === 'active' ? 'homeos-items-toggle__option--selected' : ''}`}
          onClick={() => selectView('active')}
        >
          <span>Active</span>
          {activeCount != null && (
            <span className="homeos-items-toggle__count">{activeCount}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'stocked'}
          className={`homeos-items-toggle__option ${view === 'stocked' ? 'homeos-items-toggle__option--selected' : ''}`}
          onClick={() => selectView('stocked')}
        >
          <span>Stocked</span>
          {stockedCount != null && (
            <span className="homeos-items-toggle__count">{stockedCount}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'finished'}
          className={`homeos-items-toggle__option ${view === 'finished' ? 'homeos-items-toggle__option--selected' : ''}`}
          onClick={() => selectView('finished')}
        >
          <span>Finished</span>
          {finishedCount != null && (
            <span className="homeos-items-toggle__count">{finishedCount}</span>
          )}
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search items…" />

      <QueryState
        query={query}
        skeleton={
          <div className="homeos-items-skeleton-stack">
            <Skeleton height={68} />
            <Skeleton height={68} />
            <Skeleton height={68} />
            <Skeleton height={68} />
          </div>
        }
        error={`Couldn't load ${view} items.`}
        empty={view === 'active' ? 'No active items yet.' : view === 'stocked' ? 'Nothing stocked yet.' : 'No finished items yet.'}
      >
        {(items) => {
          const filtered = lowerSearch ? items.filter((item) => item.title.toLowerCase().includes(lowerSearch)) : items
          if (filtered.length === 0 && lowerSearch) {
            return (
              <EmptyState
                icon={searchOutline}
                title="No matching items"
                message={`No ${view} items match "${search}".`}
              />
            )
          }
          return (
            <div className="homeos-items-card-list">
              {filtered.map((item) => {
                const isLongRunning = view === 'active' && item.days != null && item.days >= 45
                const isLongStocked = view === 'stocked' && item.days != null && item.days >= 30

                let icon = pulseOutline
                let iconTone = 'success'
                let badgeTone = 'success'
                let badgeIcon = pulseOutline
                let badgeText = item.days != null ? `${item.days}d in use` : 'In use'
                let subtitle = item.startedDate ? `Started ${formatShortDate(item.startedDate)}` : 'In active use'

                if (view === 'active') {
                  icon = pulseOutline
                  iconTone = 'success'
                  if (isLongRunning) {
                    badgeTone = 'warning'
                    badgeIcon = timeOutline
                    badgeText = `${item.days}d · Long`
                  } else {
                    badgeTone = 'success'
                    badgeIcon = pulseOutline
                    badgeText = item.days != null ? `${item.days}d active` : 'Active'
                  }
                  subtitle = item.startedDate ? `Started ${formatShortDate(item.startedDate)}` : 'In active use'
                } else if (view === 'stocked') {
                  icon = archiveOutline
                  if (isLongStocked) {
                    iconTone = 'warning'
                    badgeTone = 'warning'
                    badgeIcon = timeOutline
                    badgeText = `${item.days}d in storage`
                  } else {
                    iconTone = 'info'
                    badgeTone = 'info'
                    badgeIcon = archiveOutline
                    badgeText = item.days != null ? `${item.days}d stocked` : 'In stock'
                  }
                  subtitle = item.purchaseDate ? `Purchased ${formatShortDate(item.purchaseDate)}` : 'Awaiting use'
                } else if (view === 'finished') {
                  icon = checkmarkCircleOutline
                  iconTone = 'neutral'
                  badgeTone = 'neutral'
                  badgeIcon = checkmarkCircleOutline
                  badgeText = item.days != null ? `Lasted ${item.days}d` : 'Finished'
                  subtitle =
                    item.startedDate && item.finishedDate
                      ? `${formatShortDate(item.startedDate)} → ${formatShortDate(item.finishedDate)}`
                      : 'Completed'
                }

                return (
                  <div
                    key={item.id}
                    className={`homeos-item-card homeos-item-card--${view}`}
                    onClick={() => navigate(`/app/items/${item.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/app/items/${item.id}`)
                      }
                    }}
                  >
                    <div className={`homeos-item-card__icon homeos-item-card__icon--${iconTone}`} aria-hidden="true">
                      <IonIcon icon={icon} />
                    </div>

                    <div className="homeos-item-card__content">
                      <div className="homeos-item-card__header">
                        <div className="homeos-item-card__title-group">
                          <h3 className="homeos-item-card__title">{item.title}</h3>
                          {item.quantity != null && item.quantity > 1 && (
                            <span className="homeos-item-card__quantity">×{item.quantity}</span>
                          )}
                        </div>
                        <span className={`homeos-item-badge homeos-item-badge--${badgeTone}`}>
                          <IonIcon icon={badgeIcon} className="homeos-item-badge__icon" aria-hidden="true" />
                          <span>{badgeText}</span>
                        </span>
                      </div>

                      <div className="homeos-item-card__meta-row">
                        <span className="homeos-item-card__subtitle">{subtitle}</span>
                        {view === 'stocked' ? (
                          <button
                            type="button"
                            className="homeos-item-card__start-btn"
                            disabled={startItem.isPending}
                            onClick={(e) => {
                              e.stopPropagation()
                              startItem.mutate(item.id)
                            }}
                            aria-label={`Start using ${item.title}`}
                          >
                            <IonIcon icon={play} aria-hidden="true" />
                            <span>Start</span>
                          </button>
                        ) : (
                          <IonIcon icon={chevronForward} className="homeos-item-card__chevron" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }}
      </QueryState>
    </AppPage>
  )
}
