import { airplaneOutline } from 'ionicons/icons'
import { useNavigate } from 'react-router-dom'
import { type TripStatus, useTrips } from '../../features/trips/useTrips'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { Row } from '../../shared/components/Row'
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

  return (
    <AppPage title="Trips" backHref="/app/tabs/more">
      <PrimaryButton className="homeos-trips__add" onClick={() => navigate('/app/trips/new')}>
        Add trip
      </PrimaryButton>

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
        {(items) =>
          SECTIONS.map(({ status, title }) => {
            const sectionTrips = items.filter((trip) => trip.status === status)
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
        }
      </QueryState>
    </AppPage>
  )
}
