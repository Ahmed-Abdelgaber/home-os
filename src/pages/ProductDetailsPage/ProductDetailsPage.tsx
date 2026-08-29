import { useNavigate, useParams } from 'react-router-dom'
import { useProductHistory } from '../../features/items/useItemDetails'
import { CONSUMPTION_MODE_LABELS } from '../../features/products/consumptionMode'
import { useProduct } from '../../features/products/useProductDetail'
import { useSetProductActive } from '../../features/products/useProductMutations'
import { AppPage } from '../../shared/components/AppPage'
import { FactRow } from '../../shared/components/FactRow'
import { QueryState } from '../../shared/components/QueryState'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { HistorySection } from '../../shared/components/HistorySection'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import './ProductDetailsPage.css'

export function ProductDetailsPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const product = useProduct(productId)
  const history = useProductHistory(productId, undefined)
  const setActive = useSetProductActive()

  return (
    <AppPage title="Product Details" backHref="/app/products">
      <QueryState query={product} skeleton={<Skeleton height={220} />} error="Couldn't load this product.">
        {(detail) => (
          <>
            <div className="homeos-product-details__identity">
              <h1 className="homeos-product-details__title">{detail.name}</h1>
              <span
                className={`homeos-product-details__badge ${
                  detail.isActive ? 'homeos-product-details__badge--active' : 'homeos-product-details__badge--inactive'
                }`}
              >
                {detail.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <GroupedCard className="homeos-product-details__facts">
              <FactRow label="Category" value={detail.categoryName} />
              <FactRow label="Consumer" value={detail.consumerName} />
              <FactRow label="Consumption" value={CONSUMPTION_MODE_LABELS[detail.consumptionMode]} />
              {detail.notes && <FactRow label="Notes" value={detail.notes} />}
            </GroupedCard>

            <PrimaryButton onClick={() => navigate(`/app/products/${detail.id}/edit`)}>Edit product</PrimaryButton>

            <SecondaryButton
              className="homeos-product-details__toggle"
              disabled={setActive.isPending}
              onClick={() => setActive.mutate({ id: detail.id, isActive: !detail.isActive })}
            >
              {detail.isActive ? 'Archive product' : 'Reactivate product'}
            </SecondaryButton>

            <HistorySection title="Previous purchases" entries={history.data ?? []} />
          </>
        )}
      </QueryState>
    </AppPage>
  )
}
