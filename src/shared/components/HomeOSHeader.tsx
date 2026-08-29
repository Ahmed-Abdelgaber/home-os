import './HomeOSHeader.css'

interface HomeOSHeaderProps {
  greeting: string
  name: string
  avatarInitial: string
}

/**
 * Dark branded header per docs/05_UI_UX_DESIGN_SYSTEM.md §8/§9.
 * Home-only for now — other pages use the lighter IonHeader family.
 */
export function HomeOSHeader({ greeting, name, avatarInitial }: HomeOSHeaderProps) {
  return (
    <div className="homeos-header">
      <div className="homeos-header__top">
        <span className="homeos-header__brand">HomeOS</span>
        <div className="homeos-header__avatar" aria-hidden="true">
          {avatarInitial}
        </div>
      </div>
      <p className="homeos-header__greeting">{greeting}</p>
      <p className="homeos-header__name">{name}</p>
    </div>
  )
}
