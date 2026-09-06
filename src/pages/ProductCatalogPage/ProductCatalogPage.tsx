import { useQueryClient } from '@tanstack/react-query'
import { cubeOutline, searchOutline } from 'ionicons/icons'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useProductCatalog } from '../../features/products/useProductCatalog'
import { useInactiveProducts } from '../../features/products/useInactiveProducts'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { QueryState } from '../../shared/components/QueryState'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { Row } from '../../shared/components/Row'
import { RowSkeleton } from '../../shared/components/RowSkeleton'
import { SearchBar } from '../../shared/components/SearchBar'
import './ProductCatalogPage.css'

type ProductsView = 'active' | 'inactive'

export function ProductCatalogPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const rawView = searchParams.get('view')
  const view: ProductsView = rawView === 'inactive' ? 'inactive' : 'active'
  const selectView = (next: ProductsView) => {
    setSearchParams(next === 'active' ? {} : { view: next }, { replace: true })
    setSearch('')
  }

  const activeProducts = useProductCatalog(false)
  const inactiveProducts = useInactiveProducts()
  const query = view === 'active' ? activeProducts : inactiveProducts
  const lowerSearch = search.toLowerCase()

  return (
    <AppPage title="Product Catalog" backHref="/app/tabs/more" onRefresh={() => queryClient.invalidateQueries({ queryKey: ['products'] })}>
      <div className="homeos-catalog-view-toggle" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'active'}
          className={`homeos-catalog-view-toggle__option ${view === 'active' ? 'homeos-catalog-view-toggle__option--selected' : ''}`}
          onClick={() => selectView('active')}
        >
          Active
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'inactive'}
          className={`homeos-catalog-view-toggle__option ${view === 'inactive' ? 'homeos-catalog-view-toggle__option--selected' : ''}`}
          onClick={() => selectView('inactive')}
        >
          Inactive
        </button>
      </div>

      {(query.data?.length ?? 0) > 0 && (
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={view === 'active' ? 'Search products…' : 'Search inactive products…'}
        />
      )}

      <QueryState
        query={query}
        skeleton={<RowSkeleton />}
        error={`Couldn't load ${view} products.`}
        empty={
          view === 'active' ? (
            <EmptyState
              icon={cubeOutline}
              title="No products yet"
              message="A product is the thing you buy — a brand of coffee, a filter, a bag of rice. Add one and it becomes available everywhere you record a purchase."
              action={<PrimaryButton onClick={() => navigate('/app/products/new')}>Add product</PrimaryButton>}
            />
          ) : (
            <EmptyState
              icon={cubeOutline}
              title="Nothing retired"
              message="Products you stop buying end up here. None have been retired yet."
            />
          )
        }
      >
        {(items) => {
          const filtered = lowerSearch
            ? items.filter((p) => p.title.toLowerCase().includes(lowerSearch) || p.meta.toLowerCase().includes(lowerSearch))
            : items
          if (filtered.length === 0 && lowerSearch) {
            return (
              <EmptyState
                icon={searchOutline}
                title="No matching products"
                message={`No ${view} products match "${search}".`}
              />
            )
          }
          return (
            <GroupedCard>
              {filtered.map((product) => (
                <Row
                  key={product.id}
                  icon={cubeOutline}
                  title={product.title}
                  meta={view === 'inactive' ? [product.meta, 'Inactive'].filter(Boolean).join(' • ') : product.meta}
                  onClick={() => navigate(`/app/products/${product.id}`)}
                />
              ))}
            </GroupedCard>
          )
        }}
      </QueryState>
    </AppPage>
  )
}

