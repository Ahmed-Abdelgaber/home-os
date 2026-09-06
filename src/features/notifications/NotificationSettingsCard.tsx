import { IonToggle, IonInput } from '@ionic/react'
import { notificationsOutline, walletOutline, airplaneOutline, homeOutline, cubeOutline } from 'ionicons/icons'
import { useState } from 'react'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { Row } from '../../shared/components/Row'
import { useNotificationSettings, useUpdateNotificationSettings } from './useNotificationSettings'
import { usePushSubscription } from './usePushSubscription'

export function NotificationSettingsCard() {
  const { data: settings } = useNotificationSettings()
  const { mutateAsync: updateSettings } = useUpdateNotificationSettings()
  const { subscribe, unsubscribe } = usePushSubscription()

  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  )

  const handleEnable = async () => {
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm === 'granted') {
        await subscribe.mutateAsync()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDisable = async () => {
    try {
      await unsubscribe.mutateAsync()
      // We can't revoke browser permission programmatically, but we can clear our subscription
    } catch (err) {
      console.error(err)
    }
  }

  const isEnabled = permission === 'granted'

  return (
    <section className="homeos-settings-section" aria-label="Notifications">
      <h2 className="homeos-settings-heading">Notifications</h2>

      {!isEnabled && (
        <GroupedCard>
          <Row
            icon={notificationsOutline}
            tone="success"
            title="Push notifications"
            meta="Alerts for spend limits and trips"
            trailing={<button type="button" className="homeos-settings-enable" aria-label="Enable notifications" onClick={handleEnable}>Enable</button>}
          />
        </GroupedCard>
      )}

      {isEnabled && (
        <GroupedCard>
          <Row
            icon={walletOutline}
            tone="warning"
            title="Period spending limit"
            meta="Warn me when spending in the current period passes"
            trailing={
              <IonToggle aria-label="Period spending limit"
                checked={settings?.spend_warning_enabled ?? false}
                onIonChange={(e) => updateSettings({ spend_warning_enabled: e.detail.checked })}
              />
            }
          />
          {settings?.spend_warning_enabled && (
            <div className="homeos-settings-field">
              <IonInput
                type="number"
                label="Threshold (EGP)"
                labelPlacement="stacked"
                value={settings?.monthly_spend_limit ?? ''}
                onIonChange={(e) => updateSettings({ monthly_spend_limit: Number(e.detail.value) || null })}
              />
            </div>
          )}

          <Row
            icon={airplaneOutline}
            tone="info"
            title="Trip Starting"
            meta="Remind the day before a trip"
            trailing={
              <IonToggle aria-label="Trip starting"
                checked={settings?.trip_start_enabled ?? false}
                onIonChange={(e) => updateSettings({ trip_start_enabled: e.detail.checked })}
              />
            }
          />

          <Row
            icon={homeOutline}
            tone="success"
            title="Trip Ending"
            meta="Remind the day before returning"
            trailing={
              <IonToggle aria-label="Trip ending"
                checked={settings?.trip_end_enabled ?? false}
                onIonChange={(e) => updateSettings({ trip_end_enabled: e.detail.checked })}
              />
            }
          />

          <Row
            icon={cubeOutline}
            tone="warning"
            title="Long-Stocked Items"
            meta="Alert if item sits in stock too long"
            trailing={
              <IonToggle aria-label="Long-stocked items"
                checked={settings?.long_stocked_enabled ?? false}
                onIonChange={(e) => updateSettings({ long_stocked_enabled: e.detail.checked })}
              />
            }
          />
          {settings?.long_stocked_enabled && (
            <div className="homeos-settings-field">
              <IonInput
                type="number"
                label="Days in stock"
                labelPlacement="stacked"
                value={settings?.long_stocked_days ?? 30}
                onIonChange={(e) => updateSettings({ long_stocked_days: Number(e.detail.value) || 30 })}
              />
            </div>
          )}

          <div className="homeos-settings-disable-wrap">
            <button type="button" className="homeos-settings-disable" onClick={handleDisable}>Disable Push Delivery</button>
          </div>
        </GroupedCard>
      )}
    </section>
  )
}
