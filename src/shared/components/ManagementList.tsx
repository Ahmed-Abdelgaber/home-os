import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AppPage } from './AppPage'
import { CompactRow, ListGroup, ListHeaderActions } from './CompactList'
import { EmptyState } from './EmptyState'
import { QueryState } from './QueryState'
import { RowSkeleton } from './RowSkeleton'
import { SearchBar } from './SearchBar'

interface ManagedEntry { id: string; name: string; isActive: boolean }
interface ManagementListProps<T extends ManagedEntry> {
  title: string
  singular: string
  query: { data: T[] | undefined; isLoading: boolean; isError: boolean; refetch: () => Promise<unknown> }
  onAdd: () => void
  onEdit: (entry: T) => void
  describe: (entry: T) => string
  visual: (entry: T) => { glyph: ReactNode; tone: string }
  children?: ReactNode
}
export function ManagementList<T extends ManagedEntry>({ title, singular, query, onAdd, onEdit, describe, visual, children }: ManagementListProps<T>) {
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [status, setStatus] = useState('all')
  const searchContainer = useRef<HTMLDivElement>(null)
  return <AppPage title={title} className="homeos-compact-ledger homeos-directory-page" fullscreen={false} backHref="/app/tabs/more" onRefresh={async () => { await query.refetch() }}
    headerActions={<ListHeaderActions searchOpen={searchOpen} addLabel={`Add ${singular}`} onAdd={onAdd} onSearch={() => {
      setSearchOpen(!searchOpen)
      if (searchOpen) setSearch('')
      else requestAnimationFrame(() => searchContainer.current?.querySelector('input')?.focus())
    }} />}>
    <div ref={searchContainer} hidden={!searchOpen}><SearchBar value={search} onChange={value => { setSearch(value); if (!value) searchContainer.current?.querySelector('input')?.focus() }} placeholder={`Search ${title.toLowerCase()}…`} /></div>
    <div className="homeos-ledger-categories homeos-management-filters" role="group" aria-label={`${title} status`}>
      {['all','active','inactive'].map(value => <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)}>{value === 'all' ? 'All' : value === 'active' ? 'Active' : 'Inactive'}</button>)}
    </div>
    <QueryState query={query} skeleton={<RowSkeleton />} error={`Couldn't load ${title.toLowerCase()}.`} empty={<EmptyState title={`No ${title.toLowerCase()} yet`} message={`Add your first ${singular} to get started.`} action={<button className="homeos-list-submit" type="button" onClick={onAdd}>Add {singular}</button>} />}>
      {items => {
        const term = search.trim().toLocaleLowerCase()
        const filtered = items.filter(entry => (status === 'all' || entry.isActive === (status === 'active')) && `${entry.name} ${describe(entry)}`.toLocaleLowerCase().includes(term))
        if (!filtered.length) return <EmptyState title={`No matching ${title.toLowerCase()}`} message="Try another search or status." action={<button className="homeos-ledger-reset" type="button" onClick={() => { setSearch(''); setStatus('all') }}>Clear filters</button>} />
        return [true, false].map(isActive => {
          const group = filtered.filter(entry => entry.isActive === isActive)
          return group.length ? <ListGroup key={String(isActive)} title={isActive ? 'Active' : 'Inactive'} count={group.length}>
            {group.map(entry => { const appearance = visual(entry); return <li key={entry.id}><CompactRow title={entry.name} meta={describe(entry)} glyph={appearance.glyph} tone={isActive ? appearance.tone : 'neutral'} accessory={!isActive && <span className="homeos-list-badge">Inactive</span>} onClick={() => onEdit(entry)} /></li> })}
          </ListGroup> : null
        })
      }}
    </QueryState>
    {query.isError && <button className="homeos-ledger-reset" type="button" onClick={() => void query.refetch()}>Try again</button>}
    {children}
  </AppPage>
}
