import { useNavigate, useParams } from 'react-router-dom'
import { IonIcon } from '@ionic/react'
import {
  documentTextOutline,
  flashOutline,
  hourglassOutline,
  personOutline,
  pricetagOutline,
  repeatOutline,
  timerOutline,
} from 'ionicons/icons'
import { formatShortDate } from '../../core/utils/cairoDate'
import { resolveProductVisual } from '../../core/presentation/productVisuals'
import { calculateTypicalUsage, useProductHistory } from '../../features/items/useItemDetails'
import { CONSUMPTION_MODE_LABELS } from '../../features/products/consumptionMode'
import { USAGE_MODE_LABELS } from '../../features/products/usageMode'
import { useLatestProductPurchase } from '../../features/products/useLatestProductPurchase'
import { type ProductDetail, useProduct } from '../../features/products/useProductDetail'
import { useSetProductActive } from '../../features/products/useProductMutations'
import { AppPage } from '../../shared/components/AppPage'
import { HistorySection, type HistoryEntry } from '../../shared/components/HistorySection'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import '../../shared/components/CompactLedger.css'
import '../../shared/components/CompactList.css'
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
    <AppPage
      title="Product Details"
      backHref="/app/products"
      className="homeos-compact-ledger homeos-directory-page homeos-product-details-page"
      fullscreen={false}
    >
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
          const visual = resolveProductVisual(detail.name, detail.categoryName)
          const isOneTime = detail.usageMode === 'one_time'

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
            const hIsOneTime = h.usageMode === 'one_time'
            const title =
              hIsOneTime
                ? (h.finishedDate ? `Used ${formatShortDate(h.finishedDate)}` : (h.expense?.date ? formatShortDate(h.expense.date) : 'Used'))
                : (h.startedDate && h.finishedDate
                    ? `${formatShortDate(h.startedDate)} → ${formatShortDate(h.finishedDate)}`
                    : h.expense?.date
                      ? formatShortDate(h.expense.date)
                      : 'Finished cycle')

            let subtitle = hIsOneTime
              ? 'Used'
              : `Finished${
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
            <div className="homeos-product-details-body">
              <div className="homeos-product-details__identity">
                <div className="homeos-product-details__identity-main">
                  <span className={`homeos-list-glyph homeos-list-glyph--${visual.tone}`} aria-hidden="true">
                    {visual.ruleId ? visual.emoji : '📦'}
                  </span>
                  <div className="homeos-product-details__identity-copy">
                    <h1 className="homeos-product-details__title">{detail.name}</h1>
                    <span className="homeos-product-details__subtitle">
                      {detail.categoryName} • {detail.consumerName}
                    </span>
                  </div>
                </div>
                <span
                  className={`homeos-product-details__badge ${
                    detail.isActive ? 'homeos-product-details__badge--active' : 'homeos-product-details__badge--inactive'
                  }`}
                >
                  {detail.isActive ? 'Active' : 'Archived'}
                </span>
              </div>

              <div className="homeos-product-details__metrics">
                {!isOneTime && (
                  <div className={`homeos-product-details__metric ${typicalUsage != null ? 'homeos-product-details__metric--highlight' : ''}`}>
                    <p className="homeos-product-details__metric-value">{typicalUsage != null ? typicalUsage : '—'}</p>
                    <p className="homeos-product-details__metric-label">Typical Days</p>
                  </div>
                )}
                <div className="homeos-product-details__metric">
                  <p className="homeos-product-details__metric-value">{currentCoverageItems.length}</p>
                  <p className="homeos-product-details__metric-label">{isOneTime ? 'In Stock' : 'In Stock / Active'}</p>
                </div>
                <div className="homeos-product-details__metric">
                  <p className="homeos-product-details__metric-value">{finishedHistoryItems.length}</p>
                  <p className="homeos-product-details__metric-label">{isOneTime ? 'Used' : 'Finished'}</p>
                </div>
              </div>

              <section className="homeos-product-details__section" aria-label="Product details">
                <div className="homeos-ledger-day__heading"><h2>Product details</h2></div>
                <ul className="homeos-tx-details-list">
                  <li className="homeos-tx-detail-row">
                    <span className="homeos-tx-detail-row__label">
                      <IonIcon icon={isOneTime ? flashOutline : hourglassOutline} aria-hidden="true" />
                      <span>Usage</span>
                    </span>
                    <span className="homeos-tx-detail-row__value">{USAGE_MODE_LABELS[detail.usageMode ?? 'duration']}</span>
                  </li>
                  <li className="homeos-tx-detail-row">
                    <span className="homeos-tx-detail-row__label">
                      <IonIcon icon={pricetagOutline} aria-hidden="true" />
                      <span>Category</span>
                    </span>
                    <span className="homeos-tx-detail-row__value">{detail.categoryName}</span>
                  </li>
                  <li className="homeos-tx-detail-row">
                    <span className="homeos-tx-detail-row__label">
                      <IonIcon icon={personOutline} aria-hidden="true" />
                      <span>Consumer</span>
                    </span>
                    <span className="homeos-tx-detail-row__value">{detail.consumerName}</span>
                  </li>
                  {!isOneTime && (
                    <li className="homeos-tx-detail-row">
                      <span className="homeos-tx-detail-row__label">
                        <IonIcon icon={repeatOutline} aria-hidden="true" />
                        <span>Consumption</span>
                      </span>
                      <span className="homeos-tx-detail-row__value">{CONSUMPTION_MODE_LABELS[detail.consumptionMode]}</span>
                    </li>
                  )}
                  {!isOneTime && typicalUsage != null && (
                    <li className="homeos-tx-detail-row">
                      <span className="homeos-tx-detail-row__label">
                        <IonIcon icon={timerOutline} aria-hidden="true" />
                        <span>Typical usage</span>
                      </span>
                      <span className="homeos-tx-detail-row__value">{typicalUsage} days</span>
                    </li>
                  )}
                  {detail.notes && (
                    <li className="homeos-tx-detail-row">
                      <span className="homeos-tx-detail-row__label">
                        <IonIcon icon={documentTextOutline} aria-hidden="true" />
                        <span>Notes</span>
                      </span>
                      <span className="homeos-tx-detail-row__value">{detail.notes}</span>
                    </li>
                  )}
                </ul>
              </section>

              <div className="homeos-product-details__actions">
                <PrimaryButton disabled={!detail.isActive} onClick={() => handleBuyAgain(detail)}>
                  Buy again
                </PrimaryButton>

                <SecondaryButton onClick={() => navigate(`/app/products/${detail.id}/edit`)}>
                  Edit product
                </SecondaryButton>

                <SecondaryButton
                  className={`homeos-product-details__toggle ${detail.isActive ? 'homeos-product-details__toggle--archive' : ''}`}
                  tone={detail.isActive ? 'danger' : 'brand'}
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
                summary={!isOneTime && typicalUsage != null ? `Typical usage: ${typicalUsage} days` : undefined}
                entries={finishedEntries}
                onEntryClick={(id) => navigate(`/app/items/${id}`)}
              />
            </div>
          )
        }}
      </QueryState>
    </AppPage>
  )
}
