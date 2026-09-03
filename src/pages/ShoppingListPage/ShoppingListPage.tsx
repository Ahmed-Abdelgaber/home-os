import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listOutline, sparklesOutline } from 'ionicons/icons'
import { useShoppingList } from '../../features/shopping-list/useShoppingList'
import { useRemoveFromShoppingList } from '../../features/shopping-list/useShoppingListMutations'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { SectionHeader } from '../../shared/components/SectionHeader'
import { Skeleton } from '../../shared/components/Skeleton'
import type { ShoppingListItem } from '../../features/shopping-list/shoppingListTypes'
import './ShoppingListPage.css'

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

  return (
    <AppPage title="Shopping List" backHref="/app/tabs/more">
      <QueryState query={shoppingList} skeleton={<Skeleton height={200} />} error="Couldn't load your shopping list.">
        {(items) => {
          if (items.length === 0) {
            return (
              <EmptyState message="Shopping list is clear. Everything you need is already covered." />
            )
          }

          const automaticItems = items.filter((i) => i.source === 'automatic')
          const manualItems = items.filter((i) => i.source === 'manual')
          const selectedCount = selectedProductIds.size

          const handleBuySelected = () => {
            const selectedItems = items.filter((i) => selectedProductIds.has(i.productId))
            if (selectedItems.length === 0) return
            navigate('/app/shopping-list/buy', {
              state: { selectedItems },
            })
          }

          return (
            <div className="homeos-shopping-list">
              {automaticItems.length > 0 && (
                <section className="homeos-shopping-list__section">
                  <SectionHeader icon={sparklesOutline} title="Suggested by HomeOS" />
                  <GroupedCard>
                    {automaticItems.map((item) => {
                      const isChecked = selectedProductIds.has(item.productId)
                      return (
                        <div key={item.id} className="homeos-shopping-list__item">
                          <label className="homeos-shopping-list__checkbox-label">
                            <input
                              type="checkbox"
                              className="homeos-shopping-list__checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelect(item.productId)}
                            />
                            <div className="homeos-shopping-list__info">
                              <span className="homeos-shopping-list__name">{item.productName}</span>
                              <span className="homeos-shopping-list__meta">No replacement in stock</span>
                            </div>
                          </label>
                          <button
                            type="button"
                            className="homeos-shopping-list__remove"
                            onClick={() => handleRemove(item)}
                            aria-label={`Remove ${item.productName} from shopping list`}
                          >
                            Remove
                          </button>
                        </div>
                      )
                    })}
                  </GroupedCard>
                </section>
              )}

              {manualItems.length > 0 && (
                <section className="homeos-shopping-list__section">
                  <SectionHeader icon={listOutline} title="Added manually" />
                  <GroupedCard>
                    {manualItems.map((item) => {
                      const isChecked = selectedProductIds.has(item.productId)
                      return (
                        <div key={item.id} className="homeos-shopping-list__item">
                          <label className="homeos-shopping-list__checkbox-label">
                            <input
                              type="checkbox"
                              className="homeos-shopping-list__checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelect(item.productId)}
                            />
                            <div className="homeos-shopping-list__info">
                              <span className="homeos-shopping-list__name">{item.productName}</span>
                              {item.categoryName && (
                                <span className="homeos-shopping-list__meta">{item.categoryName}</span>
                              )}
                            </div>
                          </label>
                          <button
                            type="button"
                            className="homeos-shopping-list__remove"
                            onClick={() => handleRemove(item)}
                            aria-label={`Remove ${item.productName} from shopping list`}
                          >
                            Remove
                          </button>
                        </div>
                      )
                    })}
                  </GroupedCard>
                </section>
              )}

              <div className="homeos-shopping-list__footer">
                <PrimaryButton onClick={handleBuySelected} disabled={selectedCount === 0}>
                  Buy selected {selectedCount > 0 ? `(${selectedCount})` : ''}
                </PrimaryButton>
              </div>
            </div>
          )
        }}
      </QueryState>
    </AppPage>
  )
}
