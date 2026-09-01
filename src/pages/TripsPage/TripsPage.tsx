import { airplaneOutline } from 'ionicons/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type TripStatus, useTrips } from '../../features/trips/useTrips'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { Row } from '../../shared/components/Row'
import { SearchBar } from '../../shared/components/SearchBar'
import { SectionHeader } from '../../shared/components/SectionHeader'
import { Skeleton } from '../../shared/components/Skeleton'
import './TripsPage.css'

const SECTIONS: { status: TripStatus; title: string }[] = [
  { status: 'current', title: 'Current' },
  { status: 'upcoming', title: 'Upcoming' },
  { status: 'past', title: 'Past' },
]

export function TripsPage() {
  const navigate = useNavigate()
  const trips = useTrips()
  const [search, setSearch] = useState('')
  const lowerSearch = search.toLowerCase()

  return (
    <AppPage title="Trips" backHref="/app/tabs/more" onRefresh={async () => { await trips.refetch() }}>
      <PrimaryButton className="homeos-trips__add" onClick={() => navigate('/app/trips/new')}>
        Add trip
      </PrimaryButton>

      <SearchBar value={search} onChange={setSearch} placeholder="Search trips…" />

      <QueryState
        query={trips}
        skeleton={
          <div className="homeos-trips-skeleton-stack">
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        }
        error="Couldn't load trips."
        empty="No trips yet."
      >
        {(items) => {
          const filtered = lowerSearch
            ? items.filter((t) => t.title.toLowerCase().includes(lowerSearch) || t.meta.toLowerCase().includes(lowerSearch))
            : items
          if (filtered.length === 0 && lowerSearch) {
            return <p className="homeos-items-empty-search">No trips match "{search}".</p>
          }
          return SECTIONS.map(({ status, title }) => {
            const sectionTrips = filtered.filter((trip) => trip.status === status)
            if (sectionTrips.length === 0) return null
            return (
              <section key={status} className="homeos-trips__section">
                <SectionHeader icon={airplaneOutline} title={title} />
                <GroupedCard>
                  {sectionTrips.map((trip) => (
                    <Row
                      key={trip.id}
                      icon={airplaneOutline}
                      tone="info"
                      title={trip.title}
                      meta={trip.meta}
                      onClick={() => navigate(`/app/trips/${trip.id}/edit`)}
                    />
                  ))}
                </GroupedCard>
              </section>
            )
          })
        }}
      </QueryState>
    </AppPage>
  )
}

