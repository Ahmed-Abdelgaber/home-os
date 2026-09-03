import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatShortDate } from '../../core/utils/cairoDate'
import { useItem, useProductHistory } from '../../features/items/useItemDetails'
import { useDeleteItem, useFinishItem, useStartItem } from '../../features/items/useItemMutations'
import { AppPage } from '../../shared/components/AppPage'
import { ConfirmationSheet } from '../../shared/components/ConfirmationSheet'
import { FactRow } from '../../shared/components/FactRow'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { HistorySection } from '../../shared/components/HistorySection'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import { StatusChip } from '../../shared/components/StatusChip'
import './ItemDetailsPage.css'

export function ItemDetailsPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()
  const item = useItem(itemId)
  const history = useProductHistory(item.data?.productId, itemId)
  const startItem = useStartItem()
  const finishItem = useFinishItem()
  const deleteItem = useDeleteItem()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <AppPage title="Item Details" backHref="/app/tabs/items">
      <QueryState query={item} skeleton={<Skeleton height={220} />} error="Couldn't load this item.">
        {(detail) => (
          <ItemDetailsBody
            detail={detail}
            historyEntries={history.data ?? []}
            onStart={() => startItem.mutate(detail.id)}
            isStarting={startItem.isPending}
            onFinish={() => finishItem.mutate(detail.id)}
            isFinishing={finishItem.isPending}
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
        )}
      </QueryState>
    </AppPage>
  )
}

interface ItemDetailsBodyProps {
  detail: NonNullable<ReturnType<typeof useItem>['data']>
  historyEntries: ReturnType<typeof useProductHistory>['data']
  onStart: () => void
  isStarting: boolean
  onFinish: () => void
  isFinishing: boolean
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
  onFinish,
  isFinishing,
  onBuyAgain,
  confirmingDelete,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: ItemDetailsBodyProps) {
  const navigate = useNavigate()
  return (
    <>
      <div className="homeos-item-details__identity">
        <h1 className="homeos-item-details__title">{detail.productName}</h1>
        <StatusChip status={detail.status} />
      </div>

      {detail.metrics && (
        <div className="homeos-item-details__metrics">
          <div className="homeos-item-details__metric">
            <p className="homeos-item-details__metric-value">{detail.metrics.activeUsageDays}</p>
            <p className="homeos-item-details__metric-label">Active usage days</p>
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

      <GroupedCard className="homeos-item-details__facts">
        {detail.startedDate && <FactRow label="Started" value={formatShortDate(detail.startedDate)} />}
        {detail.finishedDate && <FactRow label="Finished" value={formatShortDate(detail.finishedDate)} />}
        <FactRow label="Quantity" value={String(detail.quantity)} />
        {detail.expense && (
          <>
            <FactRow label="Purchased" value={formatShortDate(detail.expense.date)} />
            <FactRow label="Amount" value={`EGP ${detail.expense.amount.toLocaleString('en-US')}`} />
            {detail.expense.merchant && <FactRow label="Merchant" value={detail.expense.merchant} />}
            {detail.expense.account && <FactRow label="Account" value={detail.expense.account} />}
          </>
        )}
        {detail.notes && <FactRow label="Notes" value={detail.notes} />}
      </GroupedCard>

      <div className="homeos-item-details__actions">
        {detail.status === 'stocked' && (
          <PrimaryButton onClick={onStart} disabled={isStarting}>
            {isStarting ? 'Starting…' : 'Start using'}
          </PrimaryButton>
        )}
        {detail.status === 'active' && (
          <PrimaryButton onClick={onFinish} disabled={isFinishing}>
            {isFinishing ? 'Finishing…' : 'Finish item'}
          </PrimaryButton>
        )}
        <SecondaryButton onClick={onBuyAgain}>Buy again</SecondaryButton>
      </div>

      <HistorySection title="Previous cycles" entries={historyEntries ?? []} onEntryClick={(id) => navigate(`/app/items/${id}`)} />

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
    </>
  )
}
