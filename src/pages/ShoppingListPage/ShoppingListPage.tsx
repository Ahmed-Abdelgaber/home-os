import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IonIcon } from '@ionic/react'
import { cartOutline, checkmarkOutline, closeOutline } from 'ionicons/icons'
import { useShoppingList } from '../../features/shopping-list/useShoppingList'
import { useRemoveFromShoppingList } from '../../features/shopping-list/useShoppingListMutations'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { Skeleton } from '../../shared/components/Skeleton'
import type { ShoppingListItem } from '../../features/shopping-list/shoppingListTypes'
import './ShoppingListPage.css'

const UNCATEGORISED = 'Other'

/** Groups by the product's existing category, alphabetically, with the catch-all group last. */
function groupByCategory(items: ShoppingListItem[]): { category: string; items: ShoppingListItem[] }[] {
  const groups = new Map<string, ShoppingListItem[]>()
  for (const item of items) {
    const key = item.categoryName ?? UNCATEGORISED
    const bucket = groups.get(key)
    if (bucket) bucket.push(item)
    else groups.set(key, [item])
  }

  return [...groups.entries()]
    .map(([category, groupItems]) => ({
      category,
      items: [...groupItems].sort((a, b) => a.productName.localeCompare(b.productName)),
    }))
    .sort((a, b) => {
      if (a.category === UNCATEGORISED) return 1
      if (b.category === UNCATEGORISED) return -1
      return a.category.localeCompare(b.category)
    })
}

export function ShoppingListPage() {
  const shoppingList = useShoppingList()
  const removeFromShoppingList = useRemoveFromShoppingList()
  const navigate = useNavigate()
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())

  const toggleSelect = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const handleRemove = (item: ShoppingListItem) => {
    removeFromShoppingList.mutate(item.id)
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      next.delete(item.productId)
      return next
    })
  }

  const items = useMemo(() => shoppingList.data ?? [], [shoppingList.data])
  const selectedCount = selectedProductIds.size

  const handleBuySelected = () => {
    const selectedItems = items.filter((i) => selectedProductIds.has(i.productId))
    if (selectedItems.length === 0) return
    navigate('/app/shopping-list/buy', {
      state: { selectedItems },
    })
  }

  const footer = items.length > 0 ? (
    <div className="homeos-shopping-list__footer">
      <PrimaryButton onClick={handleBuySelected} disabled={selectedCount === 0}>
        {selectedCount === 0 ? 'Pick what you bought' : `Buy ${selectedCount} selected`}
      </PrimaryButton>
    </div>
  ) : null

  return (
    <AppPage
      title="Shopping List"
      backHref="/app/tabs/more"
      footer={footer}
      onRefresh={async () => { await shoppingList.refetch() }}
    >
      <QueryState
        query={shoppingList}
        skeleton={
          <div className="homeos-shopping-list__skeleton">
            <Skeleton height={16} width="40%" variant="text" />
            <Skeleton height={112} />
            <Skeleton height={16} width="32%" variant="text" />
            <Skeleton height={72} />
          </div>
        }
        error="Couldn't load your shopping list."
      >
        {(resolvedItems) => {
          if (resolvedItems.length === 0) {
            return (
              <EmptyState
                icon={cartOutline}
                title="Nothing to buy"
                message="Products land here when HomeOS notices a replacement is missing, or when you add one yourself from the catalog."
              />
            )
          }

          const groups = groupByCategory(resolvedItems)

          return (
            <div className="homeos-shopping-list">
              <p className="homeos-shopping-list__summary">
                {resolvedItems.length} {resolvedItems.length === 1 ? 'item' : 'items'} across{' '}
                {groups.length} {groups.length === 1 ? 'aisle' : 'aisles'}
              </p>

              {groups.map(({ category, items: groupItems }) => (
                <section key={category} className="homeos-shopping-group">
                  <h2 className="homeos-shopping-group__title">
                    {category}
                    <span className="homeos-shopping-group__count">{groupItems.length}</span>
                  </h2>
                  <ul className="homeos-shopping-group__list">
                    {groupItems.map((item) => {
                      const isChecked = selectedProductIds.has(item.productId)
                      return (
                        <li key={item.id} className="homeos-shopping-item">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={isChecked}
                            className={`homeos-shopping-item__tap ${isChecked ? 'homeos-shopping-item__tap--checked' : ''}`}
                            onClick={() => toggleSelect(item.productId)}
                          >
                            <span className="homeos-shopping-item__box" aria-hidden="true">
                              <IonIcon icon={checkmarkOutline} />
                            </span>
                            <span className="homeos-shopping-item__name">{item.productName}</span>
                            {item.source === 'automatic' && (
                              <span className="homeos-shopping-item__flag">Suggested</span>
                            )}
                          </button>
                          <button
                            type="button"
                            className="homeos-shopping-item__remove"
                            onClick={() => handleRemove(item)}
                            aria-label={`Remove ${item.productName} from shopping list`}
                          >
                            <IonIcon icon={closeOutline} aria-hidden="true" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )
        }}
      </QueryState>
    </AppPage>
  )
}
