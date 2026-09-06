import { useQueryClient } from '@tanstack/react-query'
import { cubeOutline } from 'ionicons/icons'
import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resolveProductVisual } from '../../core/presentation/productVisuals'
import { useProductCatalog } from '../../features/products/useProductCatalog'
import { useInactiveProducts } from '../../features/products/useInactiveProducts'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { QueryState } from '../../shared/components/QueryState'
import { RowSkeleton } from '../../shared/components/RowSkeleton'
import { SearchBar } from '../../shared/components/SearchBar'
import { CompactRow, ListGroup, ListHeaderActions } from '../../shared/components/CompactList'
import './ProductCatalogPage.css'

export function ProductCatalogPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchContainer = useRef<HTMLDivElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get('view') === 'inactive' ? 'inactive' : 'active'
  const activeProducts = useProductCatalog(false)
  const inactiveProducts = useInactiveProducts()
  const query = view === 'active' ? activeProducts : inactiveProducts
  const addProduct = () => navigate('/app/products/new')
  return <AppPage title="Product catalog" className="homeos-compact-ledger homeos-directory-page homeos-catalog-page" fullscreen={false} backHref="/app/tabs/more" onRefresh={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
    headerActions={<ListHeaderActions searchOpen={searchOpen} onAdd={addProduct} addLabel="Add product" onSearch={() => {
      setSearchOpen(!searchOpen); if (searchOpen) setSearch(''); else requestAnimationFrame(() => searchContainer.current?.querySelector('input')?.focus())
    }} />}>
    <div hidden={!searchOpen} ref={searchContainer}><SearchBar value={search} onChange={value => { setSearch(value); if (!value) searchContainer.current?.querySelector('input')?.focus() }} placeholder="Search products…" /></div>
    <div className="homeos-ledger-categories homeos-catalog-filters" role="group" aria-label="Product status">
      {(['active','inactive'] as const).map(status => <button type="button" key={status} aria-pressed={view === status} className={`homeos-catalog-filter--${status}`} onClick={() => {
        const params = new URLSearchParams(searchParams); if(status === 'active') params.delete('view'); else params.set('view',status); setSearchParams(params,{replace:true}); setSearch('')
      }}>{status === 'active' ? 'Active' : 'Inactive'}</button>)}
    </div>
    <QueryState query={query} skeleton={<RowSkeleton />} error={`Couldn't load ${view} products.`} empty={<EmptyState icon={cubeOutline} title={view === 'active' ? 'No products yet' : 'Nothing retired'} message={view === 'active' ? 'Add a product to use it in purchases and your shopping list.' : 'Products you stop buying will appear here.'} action={view === 'active' && <button className="homeos-list-submit" type="button" onClick={addProduct}>Add product</button>} />}>
      {items => {
        const term = search.trim().toLocaleLowerCase()
        const filtered = items.filter(product => `${product.title} ${product.meta}`.toLocaleLowerCase().includes(term))
        if (!filtered.length) return <EmptyState title="No matching products" message="Try another product name or category." action={<button className="homeos-ledger-reset" type="button" onClick={() => setSearch('')}>Clear search</button>} />
        const categories = [...new Set(filtered.map(product => product.meta || 'Uncategorized'))].sort((a,b) => a.localeCompare(b))
        return categories.map(category => {
          const group = filtered.filter(product => (product.meta || 'Uncategorized') === category)
          return <ListGroup key={category} title={category} count={group.length}>
            {group.map(product => { const visual = resolveProductVisual(product.title, product.meta); return <li key={product.id}><CompactRow title={product.title} meta={product.meta || 'Uncategorized'} glyph={visual.ruleId ? visual.emoji : '📦'} tone={view === 'inactive' ? 'neutral' : visual.tone} accessory={view === 'inactive' && <span className="homeos-list-badge">Inactive</span>} to={`/app/products/${product.id}`} /></li> })}
          </ListGroup>
        })
      }}
    </QueryState>
    {query.isError && <button className="homeos-ledger-reset" type="button" onClick={() => void query.refetch()}>Try again</button>}
  </AppPage>
}
