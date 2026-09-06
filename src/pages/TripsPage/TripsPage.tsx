import { airplaneOutline, searchOutline } from 'ionicons/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type TripStatus, useTrips } from '../../features/trips/useTrips'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { Row } from '../../shared/components/Row'
import { RowSkeleton } from '../../shared/components/RowSkeleton'
import { SearchBar } from '../../shared/components/SearchBar'
import { SectionHeader } from '../../shared/components/SectionHeader'
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
      {/* Both hidden while there are no trips at all — the empty state does the asking. */}
      {(trips.data?.length ?? 0) > 0 && (
        <>
          <PrimaryButton className="homeos-page-cta" onClick={() => navigate('/app/trips/new')}>
            Add trip
          </PrimaryButton>

          <SearchBar value={search} onChange={setSearch} placeholder="Search trips…" />
        </>
      )}

      <QueryState
        query={trips}
        skeleton={<RowSkeleton rows={2} />}
        error="Couldn't load trips."
        empty={
          <EmptyState
            icon={airplaneOutline}
            title="No trips yet"
            message="Log a trip and HomeOS knows who is away, so Home can say it without you checking."
            action={<PrimaryButton onClick={() => navigate('/app/trips/new')}>Add trip</PrimaryButton>}
          />
        }
      >
        {(items) => {
          const filtered = lowerSearch
            ? items.filter((t) => t.title.toLowerCase().includes(lowerSearch) || t.meta.toLowerCase().includes(lowerSearch))
            : items
          if (filtered.length === 0 && lowerSearch) {
            return (
              <EmptyState
                icon={searchOutline}
                title="No matching trips"
                message={`No trips match "${search}".`}
              />
            )
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
                      tone={status === 'current' ? 'success' : status === 'upcoming' ? 'info' : 'neutral'}
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

