import { useQueryClient } from '@tanstack/react-query'
import { cubeOutline } from 'ionicons/icons'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useActiveItems, useFinishedItems, useStockedItems } from '../../features/items/useItems'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { QueryState } from '../../shared/components/QueryState'
import { Row } from '../../shared/components/Row'
import { SearchBar } from '../../shared/components/SearchBar'
import { Skeleton } from '../../shared/components/Skeleton'
import './ItemsPage.css'

type ItemsView = 'active' | 'stocked' | 'finished'

export function ItemsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
          Active
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'stocked'}
          className={`homeos-items-toggle__option ${view === 'stocked' ? 'homeos-items-toggle__option--selected' : ''}`}
          onClick={() => selectView('stocked')}
        >
          Stocked
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'finished'}
          className={`homeos-items-toggle__option ${view === 'finished' ? 'homeos-items-toggle__option--selected' : ''}`}
          onClick={() => selectView('finished')}
        >
          Finished
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
          </div>
        }
        error={`Couldn't load ${view} items.`}
        empty={view === 'active' ? 'No active items yet.' : view === 'stocked' ? 'Nothing stocked yet.' : 'No finished items yet.'}
      >
        {(items) => {
          const filtered = lowerSearch ? items.filter((item) => item.title.toLowerCase().includes(lowerSearch)) : items
          if (filtered.length === 0 && lowerSearch) {
            return <p className="homeos-items-empty-search">No items match "{search}".</p>
          }
          return (
            <GroupedCard>
              {filtered.map((item) => (
                <Row
                  key={item.id}
                  icon={cubeOutline}
                  tone={view === 'active' ? 'success' : view === 'stocked' ? 'info' : 'neutral'}
                  title={item.title}
                  meta={item.meta}
                  onClick={() => navigate(`/app/items/${item.id}`)}
                />
              ))}
            </GroupedCard>
          )
        }}
      </QueryState>
    </AppPage>
  )
}

