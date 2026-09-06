import { IonIcon } from '@ionic/react'
import { airplaneOutline, chevronForward, homeOutline, settingsOutline } from 'ionicons/icons'
import { Link } from 'react-router-dom'
import type { TravelStatus } from './HeroSnapshotCard'
import './HomeOSHeader.css'

interface HomeOSHeaderProps {
  greeting: string
  name: string
  status?: string
  travel?: TravelStatus
  onSettingsClick?: () => void
}

/** A single household cover photograph, softened behind the greeting. */
export function HomeOSHeader({ greeting, name, status, travel, onSettingsClick }: HomeOSHeaderProps) {
  const date = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Cairo',
  }).format(new Date())
  const trip = travel?.kind === 'away'
    ? { label: 'Away now', detail: `${travel.who} · ${travel.destination} · Back ${travel.returnLabel}` }
    : travel?.upcoming
      ? { label: 'Upcoming trip', detail: `${travel.upcoming.person} · ${travel.upcoming.destination} · ${travel.upcoming.rangeLabel}` }
      : null
  return (
    <header className="homeos-masthead">
      <img className="homeos-masthead__cover" src="/images/IMG_5718.JPG" alt="Ahmed and Esraa at home" />
      <div className="homeos-masthead__shade" aria-hidden="true" />
      <div className="homeos-masthead__bar">
        <span className="homeos-masthead__brand"><IonIcon icon={homeOutline} aria-hidden="true" />HomeOS</span>
        {onSettingsClick && (
          <button
            type="button"
            className="homeos-masthead__settings"
            aria-label="Settings"
            onClick={onSettingsClick}
          >
            <IonIcon icon={settingsOutline} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="homeos-masthead__scene">
        <div className="homeos-masthead__caption">
          <p className="homeos-masthead__date">{date}</p>
          <h1 className="homeos-masthead__greeting">{greeting}{name && ','}<span>{name}</span></h1>
          <p className={`homeos-masthead__status homeos-masthead__status--${travel?.kind ?? 'unknown'}`}><span aria-hidden="true" />{status ?? 'Your household, at a glance'}</p>
        </div>
      </div>
      {trip && (
        <Link className="homeos-masthead__trip" to="/app/trips">
          <span className="homeos-masthead__trip-icon"><IonIcon icon={airplaneOutline} aria-hidden="true" /></span>
          <span className="homeos-masthead__trip-copy">
            <span className="homeos-masthead__trip-label">{trip.label}</span>
            <span className="homeos-masthead__trip-detail">{trip.detail}</span>
          </span>
          <IonIcon className="homeos-masthead__trip-chevron" icon={chevronForward} aria-hidden="true" />
        </Link>
      )}
    </header>
  )
}
