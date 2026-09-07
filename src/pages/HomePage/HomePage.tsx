import { IonContent, IonIcon, IonPage, IonRefresher, IonRefresherContent } from '@ionic/react'
import { archiveOutline, chevronForward } from 'ionicons/icons'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentPerson } from '../../core/auth/useCurrentPerson'
import { cairoGreeting } from '../../core/utils/cairoDate'
import { resolveProductVisual } from '../../core/presentation/productVisuals'
import { AttentionList } from '../../features/home/AttentionList'
import { CurrentPeriodSummary } from '../../features/home/CurrentPeriodSummary'
import { useHomeSnapshot } from '../../features/home/useHomeSnapshot'
import { useLongRunningItems } from '../../features/home/useLongRunningItems'
import { useLongStockedItems } from '../../features/home/useLongStockedItems'
import { useRecentActivity } from '../../features/home/useRecentActivity'
import { useStartItem, useUseItem } from '../../features/items/useItemMutations'
import { useCyclePeriod } from '../../features/periods/usePeriodMutations'
import { HomeOSHeader } from '../../shared/components/HomeOSHeader'
import { QueryState } from '../../shared/components/QueryState'
import { Skeleton } from '../../shared/components/Skeleton'
import './HomePage.css'

const ACTIVITY_PREVIEW_COUNT = 3
const STOCKED_PREVIEW_COUNT = 2

function HomeProductIcon({ title }: { title: string }) {
  const visual = resolveProductVisual(title)
  return <span className={`homeos-house-row__icon homeos-house-row__icon--${visual.tone}`} aria-hidden="true">{visual.ruleId ? visual.emoji : '📦'}</span>
}

/** Loading rows matching the household lists. */
function HomeRowsLoading({ rows = 3 }: { rows?: number }) {
  return <div className="homeos-home-loading" role="status" aria-label="Loading household updates">
    {Array.from({ length: rows }, (_, index) => <div className="homeos-home-loading__row" key={index}>
      <Skeleton width="32px" height={32} />
      <div><Skeleton width="72%" height={14} variant="text" /><Skeleton width="46%" height={12} variant="text" /></div>
    </div>)}
  </div>
}

export function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: personName } = useCurrentPerson()
  const snapshot = useHomeSnapshot()
  const longRunning = useLongRunningItems()
  const longStocked = useLongStockedItems()
  const recentActivity = useRecentActivity()
  const startItem = useStartItem()
  const useItem = useUseItem()
  const cyclePeriod = useCyclePeriod()
  const [showAllActivity, setShowAllActivity] = useState(false)
  const hasMoreActivity = (recentActivity.data?.length ?? 0) > ACTIVITY_PREVIEW_COUNT
  const travel = snapshot.isError ? undefined : snapshot.data?.travel
  const homeStatus = travel ? (travel.kind === 'away'
    ? `${travel.who} is away · ${travel.destination}`
    : 'Everyone is home') : undefined

  return (
    <IonPage>
      <IonContent fullscreen className="homeos-home-content">
        <IonRefresher slot="fixed" onIonRefresh={async (event) => {
          try {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['home'] }),
              queryClient.invalidateQueries({ queryKey: ['bank_transactions'] }),
              queryClient.invalidateQueries({ queryKey: ['shopping-list'] }),
            ])
          } finally { event.detail.complete() }
        }}><IonRefresherContent /></IonRefresher>

        <div className="homeos-home-journal">
          <HomeOSHeader greeting={cairoGreeting()} name={personName ?? ''} status={homeStatus} travel={travel} onSettingsClick={() => navigate('/app/settings')} />

          <main className="homeos-home-body">
            <AttentionList travel={travel} includeTravel={false} />

            <section className="homeos-home-section homeos-home-section--period" aria-label="Current tracking period">
              <QueryState query={snapshot} skeleton={<Skeleton height={100} />} error="Couldn't load the current period.">
                {(data) => <CurrentPeriodSummary
                  currency={data.currency}
                  amount={data.amount}
                  startDate={data.periodStartDate}
                  percentVsPreviousPeriod={data.percentVsLastMonth}
                  isCycling={cyclePeriod.isPending}
                  onCyclePeriod={() => cyclePeriod.mutate(data.activePeriodId)}
                />}
              </QueryState>
              {snapshot.isError && <button className="homeos-home-link" type="button" onClick={() => void snapshot.refetch()}>Try again</button>}
              {cyclePeriod.isError && <p className="homeos-home-feedback" role="alert">Couldn't complete the period change. Check Tracking Periods before trying again. <Link to="/app/periods">View periods</Link></p>}
              {cyclePeriod.isSuccess && <p className="homeos-home-meta" role="status">New tracking period started.</p>}
            </section>

            <section className="homeos-home-section homeos-home-section--house" aria-labelledby="home-items-title">
              <div className="homeos-home-section__heading">
                <div>
                  <h2 id="home-items-title" className="homeos-home-label">Around the house</h2>
                  <p className="homeos-home-subheading">In use the longest</p>
                </div>
                <Link className="homeos-home-link" to="/app/tabs/items">All items<IonIcon icon={chevronForward} aria-hidden="true" /></Link>
              </div>
              <QueryState query={longRunning} skeleton={<HomeRowsLoading />} error="Couldn't load items in use." empty={<p className="homeos-home-empty">No items in use yet.</p>}>
                {(items) => <ul className="homeos-house-list">
                  {items.map((item) => <li key={item.id}>
                    <Link className="homeos-house-row" to={`/app/items/${item.id}`}>
                      <HomeProductIcon title={item.title} />
                      <span className="homeos-house-row__copy"><span className="homeos-house-row__name">{item.title}</span></span>
                      {item.days != null && <span className="homeos-house-row__age">{item.days}<span>day{item.days === 1 ? '' : 's'}</span></span>}
                      <IonIcon className="homeos-home-chevron" icon={chevronForward} aria-hidden="true" />
                    </Link>
                  </li>)}
                </ul>}
              </QueryState>
              {longRunning.isError && <button className="homeos-home-link" type="button" onClick={() => void longRunning.refetch()}>Try again</button>}

              <div className="homeos-home-stocked">
                <div className="homeos-home-stocked-heading">
                  <div className="homeos-home-stocked-copy">
                    <IonIcon icon={archiveOutline} aria-hidden="true" />
                    <div><p className="homeos-home-stocked-title">On the shelf</p><p className="homeos-home-subheading">{longStocked.data?.length === 0 && !longStocked.isError ? 'No items waiting 30+ days' : 'Stocked for 30+ days'}</p></div>
                  </div>
                  <Link className="homeos-home-link" to="/app/tabs/items?view=stocked">View stocked<IonIcon icon={chevronForward} aria-hidden="true" /></Link>
                </div>
                <QueryState query={longStocked} skeleton={<HomeRowsLoading rows={2} />} error="Couldn't load stocked items." empty={<></>}>
                  {(items) => <ul className="homeos-house-list">
                    {items.slice(0, STOCKED_PREVIEW_COUNT).map((item) => {
                      const isOneTime = item.usageMode === 'one_time'
                      const isPending = isOneTime
                        ? useItem.isPending && useItem.variables === item.id
                        : startItem.isPending && startItem.variables === item.id
                      return (
                        <li className="homeos-house-stocked" key={item.id}>
                          <Link className="homeos-house-row" to={`/app/items/${item.id}`}>
                            <HomeProductIcon title={item.title} />
                            <span className="homeos-house-row__copy"><span className="homeos-house-row__name">{item.title}</span><span className="homeos-home-meta">{item.meta}</span></span>
                          </Link>
                          <button
                            className="homeos-home-start"
                            type="button"
                            disabled={isOneTime ? useItem.isPending : startItem.isPending}
                            onClick={() => (isOneTime ? useItem.mutate(item.id) : startItem.mutate(item.id))}
                            aria-label={isOneTime ? `Use ${item.title}` : `Start using ${item.title}`}
                          >
                            {isPending ? (isOneTime ? 'Using…' : 'Starting…') : (isOneTime ? 'Use' : 'Start using')}
                          </button>
                        </li>
                      )
                    })}
                  </ul>}
                </QueryState>
                {longStocked.isError && <button className="homeos-home-link" type="button" onClick={() => void longStocked.refetch()}>Try again</button>}
                {startItem.isError && <p className="homeos-home-feedback" role="alert">Couldn't start this item. Please try again.</p>}
                {startItem.isSuccess && <p className="homeos-home-meta" role="status">Item started.</p>}
                {useItem.isError && <p className="homeos-home-feedback" role="alert">Couldn't use this item. Please try again.</p>}
                {useItem.isSuccess && <p className="homeos-home-meta" role="status">Item used.</p>}
              </div>
            </section>

            <section className="homeos-home-section homeos-home-section--activity" aria-labelledby="home-activity-title">
              <div className="homeos-home-section__heading">
                <h2 id="home-activity-title" className="homeos-home-label">Recent activity</h2>
                {hasMoreActivity && <button type="button" className="homeos-home-link" aria-expanded={showAllActivity} aria-controls="home-activity-feed" onClick={() => setShowAllActivity((shown) => !shown)}>{showAllActivity ? 'Show less' : 'View all'}</button>}
              </div>
              <QueryState query={recentActivity} skeleton={<HomeRowsLoading />} error="Couldn't load recent activity." empty={<p className="homeos-home-empty">Your household updates will appear here.</p>}>
                {(entries) => <ul id="home-activity-feed" className="homeos-activity-feed">
                  {(showAllActivity ? entries : entries.slice(0, ACTIVITY_PREVIEW_COUNT)).map((activity) => {
                    const content = <><span className={`homeos-activity-feed__mark homeos-activity-feed__mark--${activity.tone}`}><IonIcon icon={activity.icon} aria-hidden="true" /></span><span className="homeos-activity-feed__copy">{activity.label}<time dateTime={activity.occurredAt}>{activity.timestamp}</time></span>{activity.href && <IonIcon className="homeos-home-chevron" icon={chevronForward} aria-hidden="true" />}</>
                    return <li key={activity.id}>{activity.href ? <Link className="homeos-activity-feed__row" to={activity.href}>{content}</Link> : <div className="homeos-activity-feed__row">{content}</div>}</li>
                  })}
                </ul>}
              </QueryState>
              {recentActivity.isError && <button className="homeos-home-link" type="button" onClick={() => void recentActivity.refetch()}>Try again</button>}
            </section>
          </main>
        </div>
      </IonContent>
    </IonPage>
  )
}
