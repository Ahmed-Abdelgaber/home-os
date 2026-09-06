import { IonIcon } from '@ionic/react'
import { airplaneOutline } from 'ionicons/icons'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type TripStatus, useTrips } from '../../features/trips/useTrips'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { QueryState } from '../../shared/components/QueryState'
import { RowSkeleton } from '../../shared/components/RowSkeleton'
import { SearchBar } from '../../shared/components/SearchBar'
import { CompactRow, ListGroup, ListHeaderActions } from '../../shared/components/CompactList'
import './TripsPage.css'

const SECTIONS: { status: TripStatus; title: string; tone: string }[] = [
  { status: 'current', title: 'Current', tone: 'green' },
  { status: 'upcoming', title: 'Upcoming', tone: 'blue' },
  { status: 'past', title: 'Past', tone: 'neutral' },
]
export function TripsPage() {
  const navigate = useNavigate()
  const trips = useTrips()
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const searchContainer = useRef<HTMLDivElement>(null)
  const addTrip = () => navigate('/app/trips/new')
  const reset = () => { setSearch(''); setStatusFilter('all') }
  return <AppPage title="Trips" className="homeos-compact-ledger homeos-directory-page homeos-trips-page" fullscreen={false} backHref="/app/tabs/more" onRefresh={async () => { await trips.refetch() }}
    headerActions={<ListHeaderActions searchOpen={searchOpen} onAdd={addTrip} addLabel="Add trip" onSearch={() => {
      setSearchOpen(!searchOpen); if (searchOpen) setSearch(''); else requestAnimationFrame(() => searchContainer.current?.querySelector('input')?.focus())
    }} />}>
    <div hidden={!searchOpen} ref={searchContainer}><SearchBar value={search} onChange={value => { setSearch(value); if (!value) searchContainer.current?.querySelector('input')?.focus() }} placeholder="Search trips…" /></div>
    <div className="homeos-ledger-categories homeos-trips-filters" role="group" aria-label="Trip status">
      {[{status:'all',title:'All',tone:'violet'},...SECTIONS].map(option => <button key={option.status} type="button" className={`homeos-trip-filter--${option.tone}`} aria-pressed={statusFilter === option.status} onClick={() => setStatusFilter(option.status)}>{option.title}</button>)}
    </div>
    <QueryState query={trips} skeleton={<RowSkeleton rows={2} />} error="Couldn't load trips." empty={<EmptyState icon={airplaneOutline} title="No trips yet" message="Plan who's away and when they'll be back." action={<button className="homeos-list-submit" type="button" onClick={addTrip}>Add trip</button>} />}>
      {items => {
        const term = search.trim().toLocaleLowerCase()
        const filtered = items.filter(trip => (statusFilter === 'all' || trip.status === statusFilter) && `${trip.title} ${trip.meta}`.toLocaleLowerCase().includes(term))
        if (!filtered.length) return <EmptyState title="No matching trips" message="Try another search or trip status." action={<button className="homeos-ledger-reset" type="button" onClick={reset}>Clear filters</button>} />
        return SECTIONS.map(({status,title,tone}) => {
          const group = filtered.filter(trip => trip.status === status).sort((a,b) => status === 'past' ? b.departureDate.localeCompare(a.departureDate) : a.departureDate.localeCompare(b.departureDate))
          return group.length ? <ListGroup key={status} title={title} count={group.length}>
            {group.map(trip => <li key={trip.id}><CompactRow title={trip.title} meta={trip.meta} glyph={<IonIcon icon={airplaneOutline} />} tone={tone} to={`/app/trips/${trip.id}/edit`} /></li>)}
          </ListGroup> : null
        })
      }}
    </QueryState>
    {trips.isError && <button className="homeos-ledger-reset" type="button" onClick={() => void trips.refetch()}>Try again</button>}
  </AppPage>
}
