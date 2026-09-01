import { calendarOutline } from 'ionicons/icons'
import { useEndPeriod, useStartPeriod } from '../../features/periods/usePeriodMutations'
import { usePeriods } from '../../features/periods/usePeriods'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { Row } from '../../shared/components/Row'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import './PeriodsPage.css'

export function PeriodsPage() {
  const periods = usePeriods()
  const startPeriod = useStartPeriod()
  const endPeriod = useEndPeriod()

  return (
    <AppPage title="Tracking Periods" backHref="/app/tabs/more" onRefresh={async () => { await periods.refetch() }}>
      <QueryState
        query={periods}
        skeleton={
          <div className="homeos-periods-skeleton-stack">
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        }
        error="Couldn't load periods."
      >
        {(items) => {
          if (items.length === 0) {
            return (
              <>
                <p className="homeos-empty-state">No periods started yet.</p>
                <PrimaryButton
                  disabled={startPeriod.isPending}
                  onClick={() => startPeriod.mutate()}
                >
                  Start First Period
                </PrimaryButton>
              </>
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
                        disabled={endPeriod.isPending}
                        onClick={() => endPeriod.mutate(activePeriod.id)}
                      >
                        End Period
                      </SecondaryButton>
                    }
                  />
                </GroupedCard>
              ) : (
                <PrimaryButton
                  disabled={startPeriod.isPending}
                  onClick={() => startPeriod.mutate()}
                  style={{ marginBottom: 'var(--homeos-space-24)' }}
                >
                  Start New Period
                </PrimaryButton>
              )}

              {items.length > (activePeriod ? 1 : 0) && (
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
              )}
            </>
          )
        }}
      </QueryState>
    </AppPage>
  )
}
