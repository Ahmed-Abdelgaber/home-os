import { useNavigate, useParams } from 'react-router-dom'
import { formatShortDate } from '../../core/utils/cairoDate'
import { calculateTypicalUsage, useProductHistory } from '../../features/items/useItemDetails'
import { CONSUMPTION_MODE_LABELS } from '../../features/products/consumptionMode'
import { useLatestProductPurchase } from '../../features/products/useLatestProductPurchase'
import { type ProductDetail, useProduct } from '../../features/products/useProductDetail'
import { useSetProductActive } from '../../features/products/useProductMutations'
import { AppPage } from '../../shared/components/AppPage'
import { FactRow } from '../../shared/components/FactRow'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { HistorySection, type HistoryEntry } from '../../shared/components/HistorySection'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import './ProductDetailsPage.css'

export function ProductDetailsPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const product = useProduct(productId)
  const history = useProductHistory(productId, undefined)
  const latestPurchase = useLatestProductPurchase(productId)
  const setActive = useSetProductActive()

  const handleBuyAgain = (detail: ProductDetail) => {
    const purchase = latestPurchase.data
    navigate('/app/purchase', {
      state: {
        productId: detail.id,
        productName: detail.name,
        quantity: purchase?.quantity ?? 1,
        merchant: purchase?.merchant ?? null,
        accountId: purchase?.accountId ?? null,
        previousAmount: purchase?.amount ?? null,
      },
    })
  }

  return (
    <AppPage title="Product Details" backHref="/app/products">
      <QueryState query={product} skeleton={<Skeleton height={220} />} error="Couldn't load this product.">
        {(detail) => {
          const items = history.data ?? []
          const currentCoverageItems = items.filter(
            (item) => item.status === 'active' || item.status === 'stocked',
          )
          const finishedHistoryItems = items.filter(
            (item) => item.status === 'finished',
          )
          const typicalUsage = calculateTypicalUsage(items)

          const currentEntries: HistoryEntry[] = currentCoverageItems.map((h) => {
            const title = h.expense?.date
              ? formatShortDate(h.expense.date)
              : h.startedDate
                ? formatShortDate(h.startedDate)
                : 'Current item'

            const subtitle =
              h.status === 'active'
                ? `Active${h.metrics ? ` · ${h.metrics.activeUsageDays} usage day${h.metrics.activeUsageDays === 1 ? '' : 's'}` : ''}${
                    h.metrics && h.metrics.awayDays > 0
                      ? ` · ${h.metrics.awayDays} away day${h.metrics.awayDays === 1 ? '' : 's'}`
                      : ''
                  }`
                : `Stocked${h.quantity > 1 ? ` · Qty ${h.quantity}` : ''}`

            let meta: string | undefined = undefined
            if (h.expense) {
              const parts = [`EGP ${h.expense.amount.toLocaleString('en-US')}`]
              if (h.expense.merchant) parts.push(h.expense.merchant)
              meta = parts.join(' · ')
            }

            return {
              id: h.id,
              title,
              subtitle,
              meta,
              status: h.status,
            }
          })

          const finishedEntries: HistoryEntry[] = finishedHistoryItems.map((h) => {
            const title =
              h.startedDate && h.finishedDate
                ? `${formatShortDate(h.startedDate)} → ${formatShortDate(h.finishedDate)}`
                : h.expense?.date
                  ? formatShortDate(h.expense.date)
                  : 'Finished cycle'

            let subtitle = `Finished${
              h.metrics ? ` · ${h.metrics.activeUsageDays} usage day${h.metrics.activeUsageDays === 1 ? '' : 's'}` : ''
            }${
              h.metrics && h.metrics.awayDays > 0
                ? ` · ${h.metrics.awayDays} away day${h.metrics.awayDays === 1 ? '' : 's'}`
                : ''
            }`
            if (h.quantity > 1) {
              subtitle += ` · Qty ${h.quantity}`
            }

            let meta: string | undefined = undefined
            if (h.expense) {
              const parts = [`EGP ${h.expense.amount.toLocaleString('en-US')}`]
              if (h.expense.merchant) parts.push(h.expense.merchant)
              meta = parts.join(' · ')
            }

            return {
              id: h.id,
              title,
              subtitle,
              meta,
            }
          })

          return (
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
                {typicalUsage != null && <FactRow label="Typical usage" value={`${typicalUsage} days`} />}
                {detail.notes && <FactRow label="Notes" value={detail.notes} />}
              </GroupedCard>

              <div className="homeos-product-details__actions">
                <PrimaryButton disabled={!detail.isActive} onClick={() => handleBuyAgain(detail)}>
                  Buy again
                </PrimaryButton>

                <SecondaryButton onClick={() => navigate(`/app/products/${detail.id}/edit`)}>
                  Edit product
                </SecondaryButton>

                <SecondaryButton
                  className="homeos-product-details__toggle"
                  disabled={setActive.isPending}
                  onClick={() => setActive.mutate({ id: detail.id, isActive: !detail.isActive })}
                >
                  {detail.isActive ? 'Archive product' : 'Reactivate product'}
                </SecondaryButton>
              </div>

              {currentEntries.length > 0 && (
                <HistorySection
                  title="Current coverage"
                  entries={currentEntries}
                  onEntryClick={(id) => navigate(`/app/items/${id}`)}
                />
              )}

              <HistorySection
                title="Previous purchases"
                summary={typicalUsage != null ? `Typical usage: ${typicalUsage} days` : undefined}
                entries={finishedEntries}
                onEntryClick={(id) => navigate(`/app/items/${id}`)}
              />
            </>
          )
        }}
      </QueryState>
    </AppPage>
  )
}
