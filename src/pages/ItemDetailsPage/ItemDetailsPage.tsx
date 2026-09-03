import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useIonToast } from '@ionic/react'
import { cubeOutline, linkOutline, walletOutline } from 'ionicons/icons'
import { formatShortDate } from '../../core/utils/cairoDate'
import { useItem, useProductHistory } from '../../features/items/useItemDetails'
import { useDeleteItem, useFinishItem, useStartItem, useUpdateItemFinishedDate } from '../../features/items/useItemMutations'
import { useShoppingList } from '../../features/shopping-list/useShoppingList'
import { useAddToShoppingList } from '../../features/shopping-list/useShoppingListMutations'
import { AppPage } from '../../shared/components/AppPage'
import { ConfirmationSheet } from '../../shared/components/ConfirmationSheet'
import { FactRow } from '../../shared/components/FactRow'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { HistorySection } from '../../shared/components/HistorySection'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { Row } from '../../shared/components/Row'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { SectionHeader } from '../../shared/components/SectionHeader'
import { Skeleton } from '../../shared/components/Skeleton'
import { StatusChip } from '../../shared/components/StatusChip'
import { EditFinishDateSheet } from './EditFinishDateSheet'
import { FinishItemSheet } from './FinishItemSheet'
import './ItemDetailsPage.css'

export function ItemDetailsPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()
  const item = useItem(itemId)
  const history = useProductHistory(item.data?.productId, itemId)
  const shoppingList = useShoppingList()
  const addToShoppingList = useAddToShoppingList()
  const startItem = useStartItem()
  const finishItem = useFinishItem()
  const updateFinishedDate = useUpdateItemFinishedDate()
  const deleteItem = useDeleteItem()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [finishingItem, setFinishingItem] = useState(false)
  const [editingFinishDate, setEditingFinishDate] = useState(false)
  const [presentToast] = useIonToast()

  return (
    <AppPage title="Item Details" backHref="/app/tabs/items">
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
                isPending={updateFinishedDate.isPending}
                onClose={() => setEditingFinishDate(false)}
                onConfirmSave={async (finishedDate) => {
                  await updateFinishedDate.mutateAsync({ itemId: detail.id, finishedDate })
                  presentToast({
                    message: 'Finish date updated',
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
          <PrimaryButton onClick={onRequestFinish}>
            Finish item
          </PrimaryButton>
        )}
        {detail.status === 'finished' && (
          <SecondaryButton onClick={onRequestEditFinishDate}>
            Edit finish date
          </SecondaryButton>
        )}
        <SecondaryButton onClick={onBuyAgain}>Buy again</SecondaryButton>
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
        <SectionHeader icon={linkOutline} title="Related" />
        <GroupedCard>
          <Row
            icon={cubeOutline}
            tone="primary"
            title={detail.productName}
            meta="View product"
            onClick={() => navigate(`/app/products/${detail.productId}`)}
          />
          {detail.expenseId && (
            <Row
              icon={walletOutline}
              tone="info"
              title={detail.expense ? `EGP ${detail.expense.amount.toLocaleString('en-US')}` : 'Linked expense'}
              meta={detail.expense?.merchant ? `${detail.expense.merchant} • View expense` : 'View expense'}
              onClick={() => navigate(`/app/expenses/${detail.expenseId}`)}
            />
          )}
        </GroupedCard>
      </section>

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
