import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IonIcon, useIonToast } from '@ionic/react'
import {
  calendarOutline,
  cashOutline,
  checkmarkDoneOutline,
  documentTextOutline,
  flashOutline,
  hourglassOutline,
  layersOutline,
  playOutline,
  storefrontOutline,
  walletOutline,
} from 'ionicons/icons'
import { formatShortDate } from '../../core/utils/cairoDate'
import { resolveProductVisual } from '../../core/presentation/productVisuals'
import { useItem, useProductHistory } from '../../features/items/useItemDetails'
import { useDeleteItem, useFinishItem, useStartItem, useUpdateItemFinishedDate, useUseItem } from '../../features/items/useItemMutations'
import { useShoppingList } from '../../features/shopping-list/useShoppingList'
import { useAddToShoppingList } from '../../features/shopping-list/useShoppingListMutations'
import { AppPage } from '../../shared/components/AppPage'
import { ConfirmationSheet } from '../../shared/components/ConfirmationSheet'
import { HistorySection, type HistoryEntry } from '../../shared/components/HistorySection'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import { StatusChip } from '../../shared/components/StatusChip'
import { CompactRow, ListGroup } from '../../shared/components/CompactList'
import { EditFinishDateSheet } from './EditFinishDateSheet'
import { FinishItemSheet } from './FinishItemSheet'
import { UseItemSheet } from './UseItemSheet'
import '../../shared/components/CompactLedger.css'
import '../../shared/components/CompactList.css'
import './ItemDetailsPage.css'

export function ItemDetailsPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()
  const item = useItem(itemId)
  const history = useProductHistory(item.data?.productId, itemId)
  const shoppingList = useShoppingList()
  const addToShoppingList = useAddToShoppingList()
  const startItem = useStartItem()
  const useItemMutation = useUseItem()
  const finishItem = useFinishItem()
  const updateFinishedDate = useUpdateItemFinishedDate()
  const deleteItem = useDeleteItem()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [finishingItem, setFinishingItem] = useState(false)
  const [usingItem, setUsingItem] = useState(false)
  const [editingFinishDate, setEditingFinishDate] = useState(false)
  const [presentToast] = useIonToast()

  return (
    <AppPage
      title="Item Details"
      backHref="/app/tabs/items"
      className="homeos-compact-ledger homeos-directory-page homeos-item-details-page"
      fullscreen={false}
    >
      <QueryState query={item} skeleton={<Skeleton height={220} />} error="Couldn't load this item.">
        {(detail) => {
          const isOnShoppingList = (shoppingList.data ?? []).some((entry) => entry.productId === detail.productId)
          return (
            <>
              <ItemDetailsBody
                detail={detail}
                historyEntries={history.data ?? []}
                onStart={() => startItem.mutate(detail.id)}
                isStarting={startItem.isPending}
                onRequestUse={() => setUsingItem(true)}
                isUsing={useItemMutation.isPending}
                onRequestFinish={() => setFinishingItem(true)}
                onRequestEditFinishDate={() => setEditingFinishDate(true)}
                isOnShoppingList={isOnShoppingList}
                isAddingToShoppingList={addToShoppingList.isPending}
                onAddToShoppingList={() => addToShoppingList.mutate({ productId: detail.productId, source: 'manual' })}
                onBuyAgain={() => {
                  navigate('/app/purchase', {
                    state: {
                      productId: detail.productId,
                      productName: detail.productName,
                      quantity: detail.quantity,
                      merchant: detail.expense?.merchant ?? null,
                      accountId: detail.expense?.accountId ?? null,
                      previousAmount: detail.expense?.amount ?? null,
                    },
                  })
                }}
                confirmingDelete={confirmingDelete}
                onRequestDelete={() => setConfirmingDelete(true)}
                onCancelDelete={() => setConfirmingDelete(false)}
                onConfirmDelete={() => {
                  setConfirmingDelete(false)
                  deleteItem.mutate(detail.id, { onSuccess: () => navigate('/app/tabs/items', { replace: true }) })
                }}
              />

              <UseItemSheet
                isOpen={usingItem}
                isPending={useItemMutation.isPending}
                onClose={() => setUsingItem(false)}
                onConfirmUse={async (usedDate) => {
                  await useItemMutation.mutateAsync({ itemId: detail.id, usedDate })
                  setUsingItem(false)
                  presentToast({
                    message: 'Item marked as used',
                    duration: 2000,
                    position: 'bottom',
                  })
                }}
              />

              <FinishItemSheet
                isOpen={finishingItem}
                startedDate={detail.startedDate}
                isPending={finishItem.isPending}
                onClose={() => setFinishingItem(false)}
                onConfirmFinish={async (finishedDate) => {
                  await finishItem.mutateAsync({ itemId: detail.id, finishedDate })
                }}
              />

              <EditFinishDateSheet
                isOpen={editingFinishDate}
                currentFinishedDate={detail.finishedDate}
                startedDate={detail.startedDate}
                isOneTime={detail.usageMode === 'one_time'}
                isPending={updateFinishedDate.isPending}
                onClose={() => setEditingFinishDate(false)}
                onConfirmSave={async (finishedDate) => {
                  await updateFinishedDate.mutateAsync({ itemId: detail.id, finishedDate })
                  presentToast({
                    message: detail.usageMode === 'one_time' ? 'Used date updated' : 'Finish date updated',
                    duration: 2000,
                    position: 'bottom',
                  })
                }}
              />
            </>
          )
        }}
      </QueryState>
    </AppPage>
  )
}

interface ItemDetailsBodyProps {
  detail: NonNullable<ReturnType<typeof useItem>['data']>
  historyEntries: ReturnType<typeof useProductHistory>['data']
  onStart: () => void
  isStarting: boolean
  onRequestUse: () => void
  isUsing: boolean
  onRequestFinish: () => void
  onRequestEditFinishDate: () => void
  isOnShoppingList: boolean
  isAddingToShoppingList: boolean
  onAddToShoppingList: () => void
  onBuyAgain: () => void
  confirmingDelete: boolean
  onRequestDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}

function ItemDetailsBody({
  detail,
  historyEntries,
  onStart,
  isStarting,
  onRequestUse,
  isUsing,
  onRequestFinish,
  onRequestEditFinishDate,
  isOnShoppingList,
  isAddingToShoppingList,
  onAddToShoppingList,
  onBuyAgain,
  confirmingDelete,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: ItemDetailsBodyProps) {
  const navigate = useNavigate()
  const visual = resolveProductVisual(detail.productName)
  const isOneTime = detail.usageMode === 'one_time'

  return (
    <div className="homeos-item-details-body">
      <div className="homeos-item-details__identity">
        <div className="homeos-item-details__identity-main">
          <span className={`homeos-list-glyph homeos-list-glyph--${visual.tone}`} aria-hidden="true">
            {visual.ruleId ? visual.emoji : '📦'}
          </span>
          <div className="homeos-item-details__identity-copy">
            <h1 className="homeos-item-details__title">{detail.productName}</h1>
            <span className="homeos-item-details__subtitle">
              {detail.status === 'active'
                ? `Started ${formatShortDate(detail.startedDate)}`
                : detail.status === 'stocked'
                ? (detail.expense ? `Purchased ${formatShortDate(detail.expense.date)}` : 'Stocked')
                : isOneTime
                ? `Used ${formatShortDate(detail.finishedDate)}`
                : `Finished ${formatShortDate(detail.finishedDate)}`}
            </span>
          </div>
        </div>
        <StatusChip status={detail.status} usageMode={detail.usageMode} />
      </div>

      {!isOneTime && detail.metrics && (
        <div className="homeos-item-details__metrics">
          <div className={`homeos-item-details__metric ${detail.status === 'active' ? 'homeos-item-details__metric--highlight' : ''}`}>
            <p className="homeos-item-details__metric-value">{detail.metrics.activeUsageDays}</p>
            <p className="homeos-item-details__metric-label">Active days</p>
          </div>
          <div className="homeos-item-details__metric">
            <p className="homeos-item-details__metric-value">{detail.metrics.calendarDays}</p>
            <p className="homeos-item-details__metric-label">Calendar days</p>
          </div>
          {detail.metrics.awayDays > 0 && (
            <div className="homeos-item-details__metric">
              <p className="homeos-item-details__metric-value">{detail.metrics.awayDays}</p>
              <p className="homeos-item-details__metric-label">Away days</p>
            </div>
          )}
        </div>
      )}

      <section className="homeos-item-details__section" aria-label="Item facts">
        <div className="homeos-ledger-day__heading"><h2>Item details</h2></div>
        <ul className="homeos-tx-details-list">
          <li className="homeos-tx-detail-row">
            <span className="homeos-tx-detail-row__label">
              <IonIcon icon={isOneTime ? flashOutline : hourglassOutline} aria-hidden="true" />
              <span>Usage</span>
            </span>
            <span className="homeos-tx-detail-row__value">{isOneTime ? 'Single use' : 'Track duration'}</span>
          </li>
          {!isOneTime && detail.startedDate && (
            <li className="homeos-tx-detail-row">
              <span className="homeos-tx-detail-row__label">
                <IonIcon icon={playOutline} aria-hidden="true" />
                <span>Started</span>
              </span>
              <span className="homeos-tx-detail-row__value">{formatShortDate(detail.startedDate)}</span>
            </li>
          )}
          {detail.finishedDate && (
            <li className="homeos-tx-detail-row">
              <span className="homeos-tx-detail-row__label">
                <IonIcon icon={checkmarkDoneOutline} aria-hidden="true" />
                <span>{isOneTime ? 'Used' : 'Finished'}</span>
              </span>
              <span className="homeos-tx-detail-row__value">{formatShortDate(detail.finishedDate)}</span>
            </li>
          )}
          <li className="homeos-tx-detail-row">
            <span className="homeos-tx-detail-row__label">
              <IonIcon icon={layersOutline} aria-hidden="true" />
              <span>Quantity</span>
            </span>
            <span className="homeos-tx-detail-row__value">{detail.quantity}</span>
          </li>
          {detail.expense && (
            <>
              <li className="homeos-tx-detail-row">
                <span className="homeos-tx-detail-row__label">
                  <IonIcon icon={calendarOutline} aria-hidden="true" />
                  <span>Purchased</span>
                </span>
                <span className="homeos-tx-detail-row__value">{formatShortDate(detail.expense.date)}</span>
              </li>
              <li className="homeos-tx-detail-row">
                <span className="homeos-tx-detail-row__label">
                  <IonIcon icon={cashOutline} aria-hidden="true" />
                  <span>Amount</span>
                </span>
                <span className="homeos-tx-detail-row__value">
                  EGP {detail.expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </li>
              {detail.expense.merchant && (
                <li className="homeos-tx-detail-row">
                  <span className="homeos-tx-detail-row__label">
                    <IonIcon icon={storefrontOutline} aria-hidden="true" />
                    <span>Merchant</span>
                  </span>
                  <span className="homeos-tx-detail-row__value">{detail.expense.merchant}</span>
                </li>
              )}
              {detail.expense.account && (
                <li className="homeos-tx-detail-row">
                  <span className="homeos-tx-detail-row__label">
                    <IonIcon icon={walletOutline} aria-hidden="true" />
                    <span>Account</span>
                  </span>
                  <span className="homeos-tx-detail-row__value">{detail.expense.account}</span>
                </li>
              )}
            </>
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

      <div className="homeos-item-details__actions">
        {detail.status === 'stocked' && (
          isOneTime ? (
            <PrimaryButton className="homeos-item-details__start" onClick={onRequestUse} disabled={isUsing}>
              {isUsing ? 'Using…' : 'Use item'}
            </PrimaryButton>
          ) : (
            <PrimaryButton className="homeos-item-details__start" onClick={onStart} disabled={isStarting}>
              {isStarting ? 'Starting…' : 'Start using'}
            </PrimaryButton>
          )
        )}
        {detail.status === 'active' && (
          <PrimaryButton onClick={onRequestFinish}>
            Finish item
          </PrimaryButton>
        )}
        {detail.status === 'finished' && (
          <PrimaryButton onClick={onBuyAgain}>
            Buy again
          </PrimaryButton>
        )}
        
        {detail.status !== 'finished' && (
          <SecondaryButton onClick={onBuyAgain}>
            Buy again
          </SecondaryButton>
        )}
        
        {detail.status === 'finished' && (
          <SecondaryButton onClick={onRequestEditFinishDate}>
            {isOneTime ? 'Edit used date' : 'Edit finish date'}
          </SecondaryButton>
        )}
        
        {(detail.status === 'active' || detail.status === 'finished') && (
          isOnShoppingList ? (
            <SecondaryButton onClick={() => navigate('/app/shopping-list')}>
              On shopping list
            </SecondaryButton>
          ) : (
            <SecondaryButton onClick={onAddToShoppingList} disabled={isAddingToShoppingList}>
              {isAddingToShoppingList ? 'Adding…' : 'Add to shopping list'}
            </SecondaryButton>
          )
        )}
      </div>

      <section className="homeos-item-details__related">
        <ListGroup title="Related" count={detail.expenseId ? 2 : 1}>
          <li>
            <CompactRow
              title={detail.productName}
              meta="View product details"
              glyph={visual.ruleId ? visual.emoji : '📦'}
              tone={visual.tone}
              to={`/app/products/${detail.productId}`}
            />
          </li>
          {detail.expenseId && (
            <li>
              <CompactRow
                title={detail.expense ? `EGP ${detail.expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Linked expense'}
                meta={detail.expense?.merchant ? `${detail.expense.merchant} • View expense` : 'View expense'}
                glyph={<IonIcon icon={walletOutline} />}
                tone="blue"
                to={`/app/expenses/${detail.expenseId}`}
              />
            </li>
          )}
        </ListGroup>
      </section>

      {(() => {
        const formattedHistory: HistoryEntry[] = (historyEntries ?? []).map((h) => {
          const hIsOneTime = h.usageMode === 'one_time'
          let title = 'Not started'
          if (hIsOneTime) {
            if (h.finishedDate) {
              title = `Used ${formatShortDate(h.finishedDate)}`
            } else if (h.expense?.date) {
              title = `Purchased ${formatShortDate(h.expense.date)}`
            } else {
              title = 'Single use'
            }
          } else {
            if (h.startedDate && h.finishedDate) {
              title = `${formatShortDate(h.startedDate)} → ${formatShortDate(h.finishedDate)}`
            } else if (h.startedDate) {
              title = `${formatShortDate(h.startedDate)} → In progress`
            }
          }

          let subtitle: string | undefined = undefined
          if (hIsOneTime) {
            subtitle = h.status === 'stocked' ? 'Stocked' : 'Used'
          } else if (h.metrics) {
            const usage = `${h.metrics.activeUsageDays} usage day${h.metrics.activeUsageDays === 1 ? '' : 's'}`
            const away = h.metrics.awayDays > 0 ? ` · ${h.metrics.awayDays} away day${h.metrics.awayDays === 1 ? '' : 's'}` : ''
            subtitle = `${usage}${away}`
          } else if (h.status === 'stocked') {
            subtitle = 'Stocked'
          }

          let meta: string | undefined = undefined
          if (h.expense) {
            const parts: string[] = [`EGP ${h.expense.amount.toLocaleString('en-US')}`]
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
          <HistorySection
            title="Previous cycles"
            entries={formattedHistory}
            onEntryClick={(id) => navigate(`/app/items/${id}`)}
          />
        )
      })()}

      <SecondaryButton className="homeos-item-details__delete" onClick={onRequestDelete}>
        Delete item
      </SecondaryButton>

      <ConfirmationSheet
        isOpen={confirmingDelete}
        header="Delete this item?"
        message="This also deletes its linked expense. This can't be undone."
        confirmLabel="Delete"
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </div>
  )
}

