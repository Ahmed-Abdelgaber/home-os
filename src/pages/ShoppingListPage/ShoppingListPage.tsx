import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IonIcon } from '@ionic/react'
import { cartOutline, checkmarkOutline, closeOutline } from 'ionicons/icons'
import { useShoppingList } from '../../features/shopping-list/useShoppingList'
import { useRemoveFromShoppingList } from '../../features/shopping-list/useShoppingListMutations'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { ListGroup, ListHeaderActions } from '../../shared/components/CompactList'
import { SearchBar } from '../../shared/components/SearchBar'
import { resolveProductVisual } from '../../core/presentation/productVisuals'
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
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [source, setSource] = useState('all')
  const searchContainer = useRef<HTMLDivElement>(null)
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
    removeFromShoppingList.mutate(item.id, { onSuccess: () => {
      setSelectedProductIds(prev => {
        const next = new Set(prev)
        next.delete(item.productId)
        return next
      })
    } })
  }

  const items = useMemo(() => shoppingList.data ?? [], [shoppingList.data])
  const selectedCount = items.filter(item => selectedProductIds.has(item.productId)).length

  const handleBuySelected = () => {
    const selectedItems = items.filter((i) => selectedProductIds.has(i.productId))
    if (selectedItems.length === 0) return
    navigate('/app/shopping-list/buy', {
      state: { selectedItems },
    })
  }

  const footer = items.length > 0 ? (
    <div className="homeos-shopping-list__footer">
      <button type="button" className="homeos-list-submit" onClick={handleBuySelected} disabled={selectedCount === 0}>
        {selectedCount === 0 ? 'Pick what you bought' : `Buy ${selectedCount} selected`}
      </button>
    </div>
  ) : null

  return (
    <AppPage
      title="Shopping list"
      className="homeos-compact-ledger homeos-directory-page homeos-shopping-page"
      fullscreen={false}
      headerActions={<ListHeaderActions searchOpen={searchOpen} onAdd={() => navigate('/app/products')} addLabel="Browse products" onSearch={() => {
        setSearchOpen(!searchOpen)
        if (searchOpen) setSearch('')
        else requestAnimationFrame(() => searchContainer.current?.querySelector('input')?.focus())
      }} />}
      backHref="/app/tabs/more"
      footer={footer}
      onRefresh={async () => { await shoppingList.refetch() }}
    >
      <div ref={searchContainer} hidden={!searchOpen}><SearchBar value={search} onChange={setSearch} placeholder="Search shopping list…" /></div>
      <div className="homeos-ledger-categories" role="group" aria-label="Shopping list source">
        {[['all', 'All'], ['automatic', 'Suggested'], ['manual', 'Added by you']].map(([value, label]) => <button type="button" key={value} aria-pressed={source === value} onClick={() => setSource(value)}>{label}</button>)}
      </div>
      {removeFromShoppingList.isError && <p className="homeos-list-error" role="alert">Couldn't remove that item. Please try again.</p>}
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
                message="Your next shop starts here. Add products from the catalog, or find suggested replacements when something runs out."
                action={<button type="button" className="homeos-list-submit" onClick={() => navigate('/app/products')}>Browse products</button>}
              />
            )
          }

          const term = search.trim().toLocaleLowerCase()
          const visibleItems = resolvedItems.filter(item => (source === 'all' || item.source === source) && `${item.productName} ${item.categoryName ?? ''}`.toLocaleLowerCase().includes(term))
          const groups = groupByCategory(visibleItems)
          if (!visibleItems.length) return <EmptyState title="No matching products" message="Try another search or source." action={<button type="button" className="homeos-ledger-reset" onClick={() => { setSearch(''); setSource('all') }}>Clear filters</button>} />

          return <div className="homeos-shopping-list">
            <p className="homeos-ledger-feedback">{visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'} · Select what you bought</p>
            {groups.map(({ category, items: groupItems }) => <ListGroup key={category} title={category} count={groupItems.length}>
              {groupItems.map(item => {
                const isChecked = selectedProductIds.has(item.productId)
                const visual = resolveProductVisual(item.productName, item.categoryName ?? '')
                return <li key={item.id} className={`homeos-shopping-item ${isChecked ? 'homeos-shopping-item--checked' : ''}`}>
                  <button type="button" role="checkbox" aria-checked={isChecked} className="homeos-shopping-item__tap" onClick={() => toggleSelect(item.productId)}>
                    <span className="homeos-shopping-item__box" aria-hidden="true"><IonIcon icon={checkmarkOutline} /></span>
                    <span className={`homeos-list-glyph homeos-list-glyph--${visual.tone}`} aria-hidden="true">{visual.ruleId ? visual.emoji : '📦'}</span>
                    <span className="homeos-ledger-row__copy"><strong dir="auto">{item.productName}</strong><span className={`homeos-list-meta ${item.source === 'automatic' ? 'homeos-shopping-item__suggested' : ''}`}>{item.source === 'automatic' ? 'Suggested' : 'Added by you'}</span></span>
                  </button>
                  <button type="button" className="homeos-shopping-item__remove" disabled={removeFromShoppingList.isPending} onClick={() => handleRemove(item)} aria-label={`Remove ${item.productName} from shopping list`}><IonIcon icon={closeOutline} aria-hidden="true" /></button>
                </li>
              })}
            </ListGroup>)}
          </div>
        }}
      </QueryState>
      {shoppingList.isError && <button type="button" className="homeos-ledger-reset" onClick={() => void shoppingList.refetch()}>Try again</button>}
    </AppPage>
  )
}
