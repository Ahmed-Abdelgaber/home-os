import { useAuth } from '../../core/auth/useAuth'
import { useCurrentPerson } from '../../core/auth/useCurrentPerson'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { NotificationSettingsCard } from '../../features/notifications/NotificationSettingsCard'
import { BankSmsSettingsCard } from '../../features/bank-sms/BankSmsSettingsCard'
import './SettingsPage.css'

/** Extract up to two initials from a display name. */
function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0][0]?.toUpperCase() ?? '?'
}

/**
 * Settings screen: User profile, push notifications, and Bank SMS Capture setup.
 */
export function SettingsPage() {
  const { session } = useAuth()
  const { data: personName } = useCurrentPerson()

  const displayName = personName ?? '—'
  const email = session?.user.email ?? '—'

  return (
    <AppPage title="Settings" backHref="/app/tabs/more">
      <GroupedCard>
        <div className="homeos-profile-card">
          <span className="homeos-profile-card__avatar" aria-hidden="true">
            {getInitials(personName)}
          </span>
          <div className="homeos-profile-card__info">
            <span className="homeos-profile-card__name">{displayName}</span>
            <span className="homeos-profile-card__email">{email}</span>
          </div>
        </div>
      </GroupedCard>

      <BankSmsSettingsCard />

      <NotificationSettingsCard />
    </AppPage>
  )
}
