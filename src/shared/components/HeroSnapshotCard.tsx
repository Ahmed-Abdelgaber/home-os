import { IonIcon } from '@ionic/react'
import { briefcaseOutline, checkmarkCircle, chevronForward, trendingUpOutline } from 'ionicons/icons'
import './HeroSnapshotCard.css'

export type TravelStatus =
  | { kind: 'away'; who: string; destination: string; returnLabel: string }
  | { kind: 'home'; upcoming?: { person: string; destination: string; rangeLabel: string } }

interface HeroSnapshotCardProps {
  currency: string
  amount: string
  /** null when last month had no spend to compare against. */
  percentVsLastMonth: number | null
  travel: TravelStatus
}

/**
 * One hero card per docs/06_HOME_SCREEN_SPEC.md §2 — spend and travel status
 * are shown together, never split into separate dashboard tiles.
 */
export function HeroSnapshotCard({ currency, amount, percentVsLastMonth, travel }: HeroSnapshotCardProps) {
  return (
    <div className="homeos-hero-card">
      <div className="homeos-hero-card__glow" aria-hidden="true" />

      <div className="homeos-hero-card__spend">
        <p className="homeos-hero-card__label">This month's spend</p>
        <p className="homeos-hero-card__amount">
          <span className="homeos-hero-card__currency">{currency}</span> {amount}
        </p>
        {percentVsLastMonth === null ? (
          <p className="homeos-hero-card__delta">No spend last month to compare</p>
        ) : (
          <p className="homeos-hero-card__delta">
            <IonIcon icon={trendingUpOutline} />
            {percentVsLastMonth >= 0 ? '+' : ''}
            {percentVsLastMonth}% vs last month
          </p>
        )}
      </div>

      <div className="homeos-hero-card__divider" />

      <div className="homeos-hero-card__status">
        <span className="homeos-hero-card__status-icon">
          <IonIcon icon={checkmarkCircle} />
        </span>
        <div>
          <p className="homeos-hero-card__status-title">
            {travel.kind === 'away' ? `${travel.who} is away` : 'Everyone is home'}
          </p>
          <p className="homeos-hero-card__status-subtitle">
            {travel.kind === 'away' ? `${travel.destination} • Back ${travel.returnLabel}` : 'All systems normal'}
          </p>
        </div>
      </div>

      {travel.kind === 'home' && travel.upcoming && (
        <button type="button" className="homeos-hero-card__upcoming">
          <span className="homeos-hero-card__upcoming-icon">
            <IonIcon icon={briefcaseOutline} />
          </span>
          <span className="homeos-hero-card__upcoming-text">
            <span className="homeos-hero-card__upcoming-label">Upcoming trip</span>
            <span className="homeos-hero-card__upcoming-detail">
              {travel.upcoming.person} • {travel.upcoming.destination} • {travel.upcoming.rangeLabel}
            </span>
          </span>
          <IonIcon icon={chevronForward} className="homeos-hero-card__chevron" />
        </button>
      )}
    </div>
  )
}
