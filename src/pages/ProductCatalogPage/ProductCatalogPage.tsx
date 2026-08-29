import { cubeOutline } from 'ionicons/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProductCatalog } from '../../features/products/useProductCatalog'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { QueryState } from '../../shared/components/QueryState'
import { Row } from '../../shared/components/Row'
import { Skeleton } from '../../shared/components/Skeleton'
import './ProductCatalogPage.css'

export function ProductCatalogPage() {
  const navigate = useNavigate()
  const [showInactive, setShowInactive] = useState(false)
  const products = useProductCatalog(showInactive)

  return (
    <AppPage title="Product Catalog" backHref="/app/tabs/more">
      <label className="homeos-catalog-toggle">
        <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
        <span>Show inactive</span>
      </label>

      <QueryState
        query={products}
        skeleton={
          <div className="homeos-catalog-skeleton-stack">
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        }
        error="Couldn't load the product catalog."
        empty={showInactive ? 'No products yet.' : 'No active products yet.'}
      >
        {(items) => (
          <GroupedCard>
            {items.map((product) => (
              <Row
                key={product.id}
                icon={cubeOutline}
                title={product.title}
                meta={product.isActive ? product.meta : [product.meta, 'Inactive'].filter(Boolean).join(' • ')}
                onClick={() => navigate(`/app/products/${product.id}`)}
              />
            ))}
          </GroupedCard>
        )}
      </QueryState>
    </AppPage>
  )
}
