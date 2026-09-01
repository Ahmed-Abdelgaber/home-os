import { IonToggle, IonInput, IonButton } from '@ionic/react'
import { notificationsOutline, walletOutline, airplaneOutline, homeOutline, cubeOutline } from 'ionicons/icons'
import { useState } from 'react'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { Row } from '../../shared/components/Row'
import { SectionHeader } from '../../shared/components/SectionHeader'
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
    <section style={{ marginTop: 'var(--homeos-space-32)', paddingBottom: 'var(--homeos-space-32)' }}>
      <SectionHeader icon={notificationsOutline} title="Notifications" />
      
      {!isEnabled && (
        <GroupedCard>
          <div style={{ padding: 'var(--homeos-space-16)', textAlign: 'center' }}>
            <p style={{ margin: '0 0 var(--homeos-space-12)', color: 'var(--homeos-ink-600)' }}>
              Get pushed alerts for spend limits and trips.
            </p>
            <IonButton expand="block" onClick={handleEnable}>Enable Notifications</IonButton>
          </div>
        </GroupedCard>
      )}

      {isEnabled && (
        <GroupedCard>
          <Row 
            icon={walletOutline}
            title="Monthly Spend Warning"
            meta="Alert when passing a threshold"
            trailing={
              <IonToggle 
                checked={settings?.spend_warning_enabled ?? false} 
                onIonChange={(e) => updateSettings({ spend_warning_enabled: e.detail.checked })}
              />
            }
          />
          {settings?.spend_warning_enabled && (
            <div style={{ padding: '0 var(--homeos-space-16) var(--homeos-space-16)' }}>
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
            title="Trip Starting"
            meta="Remind the day before a trip"
            trailing={
              <IonToggle 
                checked={settings?.trip_start_enabled ?? false} 
                onIonChange={(e) => updateSettings({ trip_start_enabled: e.detail.checked })}
              />
            }
          />

          <Row 
            icon={homeOutline}
            title="Trip Ending"
            meta="Remind the day before returning"
            trailing={
              <IonToggle 
                checked={settings?.trip_end_enabled ?? false} 
                onIonChange={(e) => updateSettings({ trip_end_enabled: e.detail.checked })}
              />
            }
          />

          <Row 
            icon={cubeOutline}
            title="Long-Stocked Items"
            meta="Alert if item sits in stock too long"
            trailing={
              <IonToggle 
                checked={settings?.long_stocked_enabled ?? false} 
                onIonChange={(e) => updateSettings({ long_stocked_enabled: e.detail.checked })}
              />
            }
          />
          {settings?.long_stocked_enabled && (
            <div style={{ padding: '0 var(--homeos-space-16) var(--homeos-space-16)' }}>
              <IonInput 
                type="number"
                label="Days in stock"
                labelPlacement="stacked"
                value={settings?.long_stocked_days ?? 30}
                onIonChange={(e) => updateSettings({ long_stocked_days: Number(e.detail.value) || 30 })}
              />
            </div>
          )}
          
          <div style={{ padding: 'var(--homeos-space-16)', textAlign: 'center', borderTop: '1px solid var(--homeos-border)' }}>
            <IonButton fill="clear" color="danger" onClick={handleDisable}>Disable Push Delivery</IonButton>
          </div>
        </GroupedCard>
      )}
    </section>
  )
}
