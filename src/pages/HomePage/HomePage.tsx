import { IonContent, IonPage, IonRefresher, IonRefresherContent } from '@ionic/react'
import { archiveOutline, cubeOutline, hourglassOutline, pulseOutline } from 'ionicons/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentPerson } from '../../core/auth/useCurrentPerson'
import { cairoGreeting } from '../../core/utils/cairoDate'
import { useHomeSnapshot } from '../../features/home/useHomeSnapshot'
import { useLongRunningItems } from '../../features/home/useLongRunningItems'
import { useLongStockedItems } from '../../features/home/useLongStockedItems'
import { RECENT_ACTIVITY_PREVIEW_COUNT, useRecentActivity } from '../../features/home/useRecentActivity'
import { useStartItem } from '../../features/items/useItemMutations'
import { HomeOSHeader } from '../../shared/components/HomeOSHeader'
import { HeroSnapshotCard } from '../../shared/components/HeroSnapshotCard'
import { SectionHeader } from '../../shared/components/SectionHeader'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { QueryState } from '../../shared/components/QueryState'
import { Row } from '../../shared/components/Row'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { Skeleton } from '../../shared/components/Skeleton'
import './HomePage.css'

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="homeos-section-skeleton-stack">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} height={68} />
      ))}
    </div>
  )
}

/**
 * Pass B data binding per docs/06_HOME_SCREEN_SPEC.md §8 — real Supabase queries via
 * src/features/home hooks, with loading/error/empty states per AGENTS.md Definition of Done.
 */
export function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: personName } = useCurrentPerson()
  const snapshot = useHomeSnapshot()
  const longRunning = useLongRunningItems()
  const longStocked = useLongStockedItems()
  const recentActivity = useRecentActivity()
  const startItem = useStartItem()
  const [showAllActivity, setShowAllActivity] = useState(false)
  const hasMoreActivity = (recentActivity.data?.length ?? 0) > RECENT_ACTIVITY_PREVIEW_COUNT

  return (
    <IonPage>
      <IonContent fullscreen className="homeos-home-content">
        <IonRefresher
          slot="fixed"
          onIonRefresh={async (event) => {
            await queryClient.invalidateQueries({ queryKey: ['home'] })
            event.detail.complete()
          }}
        >
          <IonRefresherContent />
        </IonRefresher>
        
        <HomeOSHeader greeting={`${cairoGreeting()} 👋`} name={personName ?? ''} avatarInitial={personName?.charAt(0) ?? '?'} />

        <div className="homeos-home-body">
          <QueryState query={snapshot} skeleton={<Skeleton height={220} />} error="Couldn't load this month's snapshot.">
            {(data) => (
              <HeroSnapshotCard
                currency={data.currency}
                amount={data.amount}
                percentVsLastMonth={data.percentVsLastMonth}
                travel={data.travel}
              />
            )}
          </QueryState>

          <section>
            {/* Home shows only the three oldest; the full list lives on the Items tab. */}
            <SectionHeader
              icon={hourglassOutline}
              title="Long-running items"
              actionLabel="View all"
              onAction={() => navigate('/app/tabs/items')}
            />
            <QueryState
              query={longRunning}
              skeleton={<ListSkeleton rows={3} />}
              error="Couldn't load long-running items."
              empty="Everything looks normal."
            >
              {(items) => (
                <GroupedCard>
                  {items.map((item) => (
                    <Row
                      key={item.id}
                      icon={cubeOutline}
                      title={item.title}
                      meta={item.meta}
                      onClick={() => navigate(`/app/items/${item.id}`)}
                    />
                  ))}
                </GroupedCard>
              )}
            </QueryState>
          </section>

          <section>
            {/* Home lists only what has sat 30+ days; Items → Stocked shows everything stocked. */}
            <SectionHeader
              icon={archiveOutline}
              title="Long-stocked"
              actionLabel="View all"
              onAction={() => navigate('/app/tabs/items?view=stocked')}
            />
            <QueryState
              query={longStocked}
              skeleton={<ListSkeleton rows={2} />}
              error="Couldn't load long-stocked items."
              empty="Nothing has been stocked for too long."
            >
              {(items) => (
                <GroupedCard>
                  {items.map((item) => (
                    <Row
                      key={item.id}
                      icon={cubeOutline}
                      title={item.title}
                      meta={item.meta}
                      onClick={() => navigate(`/app/items/${item.id}`)}
                      trailing={
                        <SecondaryButton disabled={startItem.isPending} onClick={() => startItem.mutate(item.id)}>
                          Start using
                        </SecondaryButton>
                      }
                    />
                  ))}
                </GroupedCard>
              )}
            </QueryState>
          </section>

          <section>
            {/* There is no activity screen to link to, so "View all" reveals the remainder in
                place — and only appears once there is a remainder to reveal. The header stays
                outside the query state so the section keeps its title while empty or failed. */}
            <SectionHeader
              icon={pulseOutline}
              title="Recent activity"
              actionLabel={hasMoreActivity ? (showAllActivity ? 'Show less' : 'View all') : undefined}
              onAction={hasMoreActivity ? () => setShowAllActivity((shown) => !shown) : undefined}
            />
            <QueryState
              query={recentActivity}
              skeleton={<ListSkeleton rows={2} />}
              error="Couldn't load recent activity."
              empty="Nothing to show yet."
            >
              {(entries) => (
                <GroupedCard>
                  {(showAllActivity ? entries : entries.slice(0, RECENT_ACTIVITY_PREVIEW_COUNT)).map((activity) => (
                    <Row
                      key={activity.id}
                      icon={activity.icon}
                      tone={activity.tone}
                      media="badge"
                      title={activity.label}
                      meta={activity.timestamp}
                      onClick={() => navigate(activity.href)}
                    />
                  ))}
                </GroupedCard>
              )}
            </QueryState>
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
