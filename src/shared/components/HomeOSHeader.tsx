import { IonIcon } from '@ionic/react'
import { settingsOutline } from 'ionicons/icons'
import './HomeOSHeader.css'

interface HomeOSHeaderProps {
  greeting: string
  name: string
  onSettingsClick?: () => void
}

/**
 * The household masthead: the Ahmed & Esraa photograph, full-bleed, with the greeting set
 * over its lower edge. The photo is the product's identity mark — it is deliberately the
 * first and largest thing on Home, not a background texture. The crop is pinned near the
 * top of the frame because that is where both faces sit in the source image; the scrim
 * only reaches the lower third, so it never crosses them.
 */
export function HomeOSHeader({ greeting, name, onSettingsClick }: HomeOSHeaderProps) {
  return (
    <header className="homeos-masthead">
      <img
        className="homeos-masthead__photo"
        src="/images/IMG_5718.JPG"
        alt="Ahmed and Esraa at home"
      />
      <div className="homeos-masthead__scrim" aria-hidden="true" />

      <div className="homeos-masthead__bar">
        <span className="homeos-masthead__brand">HomeOS</span>
        {onSettingsClick && (
          <button
            type="button"
            className="homeos-masthead__settings"
            aria-label="Settings"
            onClick={onSettingsClick}
          >
            <IonIcon icon={settingsOutline} />
          </button>
        )}
      </div>

      <div className="homeos-masthead__caption">
        <p className="homeos-masthead__greeting">{greeting}</p>
        <p className="homeos-masthead__name">{name}</p>
      </div>
    </header>
  )
}
