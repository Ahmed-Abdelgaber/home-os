import { cubeOutline } from 'ionicons/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useActiveItems, useStockedItems } from '../../features/items/useItems'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { QueryState } from '../../shared/components/QueryState'
import { Row } from '../../shared/components/Row'
import { Skeleton } from '../../shared/components/Skeleton'
import './ItemsPage.css'

type ItemsView = 'active' | 'stocked'

export function ItemsPage() {
  const navigate = useNavigate()
  /**
   * The view lives in the URL so Home's "View all" on Long-stocked can land here already
   * switched, and so a reload keeps the tab you were on.
   */
  const [searchParams, setSearchParams] = useSearchParams()
  const view: ItemsView = searchParams.get('view') === 'stocked' ? 'stocked' : 'active'
  const selectView = (next: ItemsView) => setSearchParams(next === 'active' ? {} : { view: next }, { replace: true })

  const activeItems = useActiveItems()
  const stockedItems = useStockedItems()
  const query = view === 'active' ? activeItems : stockedItems

  return (
    <AppPage title="Items">
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
      </div>

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
        empty={view === 'active' ? 'No active items yet.' : 'Nothing stocked yet.'}
      >
        {(items) => (
          <GroupedCard>
            {items.map((item) => (
              <Row
                key={item.id}
                icon={cubeOutline}
                title={item.title}
                meta={item.meta}
                onClick={() => navigate(`/app/items/${item.id}`)}
              />
            ))}
          </GroupedCard>
        )}
      </QueryState>
    </AppPage>
  )
}
