import { calendarOutline } from 'ionicons/icons'
import { useEndPeriod, useStartPeriod } from '../../features/periods/usePeriodMutations'
import { usePeriods } from '../../features/periods/usePeriods'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { Row } from '../../shared/components/Row'
import { RowSkeleton } from '../../shared/components/RowSkeleton'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { SectionHeader } from '../../shared/components/SectionHeader'
import './PeriodsPage.css'

export function PeriodsPage() {
  const periods = usePeriods()
  const startPeriod = useStartPeriod()
  const endPeriod = useEndPeriod()

  return (
    <AppPage title="Tracking Periods" backHref="/app/tabs/more" onRefresh={async () => { await periods.refetch() }}>
      <QueryState
        query={periods}
        skeleton={<RowSkeleton rows={2} />}
        error="Couldn't load periods."
      >
        {(items) => {
          if (items.length === 0) {
            return (
              <EmptyState
                icon={calendarOutline}
                title="No periods yet"
                message="A period is the stretch of time HomeOS totals spending over. Start one to begin tracking."
                action={
                  <PrimaryButton disabled={startPeriod.isPending} onClick={() => startPeriod.mutate()}>
                    {startPeriod.isPending ? 'Starting…' : 'Start first period'}
                  </PrimaryButton>
                }
              />
            )
          }
          const activePeriod = items.find((p) => p.isActive)
          return (
            <>
              {activePeriod ? (
                <GroupedCard>
                  <Row
                    icon={calendarOutline}
                    tone="primary"
                    title={activePeriod.title}
                    meta={activePeriod.meta}
                    trailing={
                      <SecondaryButton
                        tone="danger"
                        disabled={endPeriod.isPending}
                        onClick={() => endPeriod.mutate(activePeriod.id)}
                      >
                        {endPeriod.isPending ? 'Ending…' : 'End period'}
                      </SecondaryButton>
                    }
                  />
                </GroupedCard>
              ) : (
                <PrimaryButton
                  className="homeos-page-cta"
                  disabled={startPeriod.isPending}
                  onClick={() => startPeriod.mutate()}
                >
                  {startPeriod.isPending ? 'Starting…' : 'Start new period'}
                </PrimaryButton>
              )}

              {items.length > (activePeriod ? 1 : 0) && (
                <section className="homeos-periods__closed">
                  <SectionHeader icon={calendarOutline} title="Closed" />
                  <GroupedCard>
                    {items
                      .filter((p) => !p.isActive)
                      .map((period) => (
                        <Row
                          key={period.id}
                          icon={calendarOutline}
                          title={period.title}
                          meta={period.meta}
                        />
                      ))}
                  </GroupedCard>
                </section>
              )}
            </>
          )
        }}
      </QueryState>
    </AppPage>
  )
}
