import { cubeOutline } from 'ionicons/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInactiveProducts } from '../../features/products/useInactiveProducts'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { QueryState } from '../../shared/components/QueryState'
import { Row } from '../../shared/components/Row'
import { SearchBar } from '../../shared/components/SearchBar'
import { Skeleton } from '../../shared/components/Skeleton'
import './InactiveProductsPage.css'

export function InactiveProductsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const products = useInactiveProducts()
  const lowerSearch = search.toLowerCase()

  return (
    <AppPage title="Inactive Products" backHref="/app/products">
      <SearchBar value={search} onChange={setSearch} placeholder="Search inactive products…" />

      <QueryState
        query={products}
        skeleton={
          <div className="homeos-inactive-products-skeleton-stack">
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        }
        error="Couldn't load inactive products."
        empty="No inactive products."
      >
        {(items) => {
          const filtered = lowerSearch
            ? items.filter((p) => p.title.toLowerCase().includes(lowerSearch) || p.meta.toLowerCase().includes(lowerSearch))
            : items
          if (filtered.length === 0 && lowerSearch) {
            return <p className="homeos-items-empty-search">No products match "{search}".</p>
          }
          return (
            <GroupedCard>
              {filtered.map((product) => (
                <Row
                  key={product.id}
                  icon={cubeOutline}
                  title={product.title}
                  meta={[product.meta, 'Inactive'].filter(Boolean).join(' • ')}
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
