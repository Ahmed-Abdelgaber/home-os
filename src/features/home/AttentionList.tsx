import { IonIcon } from '@ionic/react'
import { airplaneOutline, cardOutline, cartOutline, checkmarkOutline, chevronForward } from 'ionicons/icons'
import { useNavigate } from 'react-router-dom'
import { cairoToday } from '../../core/utils/cairoDate'
import { Skeleton } from '../../shared/components/Skeleton'
import type { TravelStatus } from '../../shared/components/HeroSnapshotCard'
import { usePendingBankTransactions } from '../bank-transactions/useBankTransactions'
import { useShoppingList } from '../shopping-list/useShoppingList'
import './AttentionList.css'

interface AttentionItem {
  id: string
  icon: string
  tone: 'warning' | 'primary' | 'info'
  label: string
  href: string
}

/** Whole days from today (Cairo) to a YYYY-MM-DD date. Negative when already past. */
function daysUntil(date: string): number {
  const from = new Date(`${cairoToday()}T00:00:00Z`).getTime()
  const to = new Date(`${date}T00:00:00Z`).getTime()
  return Math.round((to - from) / 86_400_000)
}

function tripLabel(travel: TravelStatus): string | null {
  if (travel.kind === 'away') {
    return `${travel.who} is away — back ${travel.returnLabel}`
  }
  if (!travel.upcoming) return null
  const { destination, departureDate } = travel.upcoming
  if (!departureDate) return `Trip to ${destination} is coming up`
  const days = daysUntil(departureDate)
  if (days <= 0) return `Trip to ${destination} starts today`
  if (days === 1) return `Trip to ${destination} starts tomorrow`
  return `Trip to ${destination} starts in ${days} days`
}

/**
 * The first thing Home answers: what is waiting on you right now. Every line is read from
 * data the app already holds — nothing here is a new domain concept, a score, or a metric.
 * A line only appears when it has something to say, so an empty list means nothing is due.
 */
export function AttentionList({ travel }: { travel: TravelStatus | undefined }) {
  const navigate = useNavigate()
  const transactions = usePendingBankTransactions()
  const shoppingList = useShoppingList()

  const isLoading = transactions.isLoading || shoppingList.isLoading

  const items: AttentionItem[] = []

  const txCount = transactions.data?.length ?? 0
  if (txCount > 0) {
    items.push({
      id: 'transactions',
      icon: cardOutline,
      tone: 'warning',
      label: `${txCount} bank ${txCount === 1 ? 'transaction' : 'transactions'} waiting`,
      href: '/app/pending-transactions',
    })
  }

  const listCount = shoppingList.data?.length ?? 0
  if (listCount > 0) {
    items.push({
      id: 'shopping-list',
      icon: cartOutline,
      tone: 'primary',
      label: `${listCount} ${listCount === 1 ? 'item' : 'items'} on the shopping list`,
      href: '/app/shopping-list',
    })
  }

  const trip = travel ? tripLabel(travel) : null
  if (trip) {
    items.push({ id: 'trip', icon: airplaneOutline, tone: 'info', label: trip, href: '/app/trips' })
  }

  if (isLoading) {
    return (
      <section className="homeos-attention" aria-busy="true">
        <p className="homeos-attention__eyebrow">Needs attention</p>
        <div className="homeos-attention__loading">
          <Skeleton height={14} width="62%" variant="text" />
          <Skeleton height={14} width="48%" variant="text" />
        </div>
      </section>
    )
  }

  return (
    <section className="homeos-attention">
      <p className="homeos-attention__eyebrow">Needs attention</p>
      {items.length === 0 ? (
        <p className="homeos-attention__clear">
          <IonIcon icon={checkmarkOutline} aria-hidden="true" />
          Nothing is waiting on you.
        </p>
      ) : (
        <ul className="homeos-attention__list">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="homeos-attention__row" onClick={() => navigate(item.href)}>
                <span className={`homeos-attention__dot homeos-attention__dot--${item.tone}`} aria-hidden="true">
                  <IonIcon icon={item.icon} />
                </span>
                <span className="homeos-attention__label">{item.label}</span>
                <IonIcon icon={chevronForward} className="homeos-attention__chevron" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
