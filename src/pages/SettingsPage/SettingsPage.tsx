import { useAuth } from '../../core/auth/useAuth'
import { useCurrentPerson } from '../../core/auth/useCurrentPerson'
import { AppPage } from '../../shared/components/AppPage'
import { FactRow } from '../../shared/components/FactRow'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { NotificationSettingsCard } from '../../features/notifications/NotificationSettingsCard'
import { BankSmsSettingsCard } from '../../features/bank-sms/BankSmsSettingsCard'

/**
 * Settings screen: User profile, push notifications, and Bank SMS Capture setup.
 */
export function SettingsPage() {
  const { session } = useAuth()
  const { data: personName } = useCurrentPerson()

  return (
    <AppPage title="Settings" backHref="/app/tabs/more">
      <GroupedCard>
        <FactRow label="Name" value={personName ?? '—'} />
        <FactRow label="Email" value={session?.user.email ?? '—'} />
      </GroupedCard>

      <BankSmsSettingsCard />

      <NotificationSettingsCard />
    </AppPage>
  )
}
