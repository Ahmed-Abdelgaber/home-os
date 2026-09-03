import { useState } from 'react'
import { IonIcon, IonToggle, useIonToast } from '@ionic/react'
import { copyOutline, phonePortraitOutline } from 'ionicons/icons'
import { ConfirmationSheet } from '../../shared/components/ConfirmationSheet'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { Row } from '../../shared/components/Row'
import { SectionHeader } from '../../shared/components/SectionHeader'
import { Skeleton } from '../../shared/components/Skeleton'
import {
  useDisableBankSmsCapture,
  useEnableBankSmsCapture,
  useRegenerateBankSmsKey,
  useUserPreferences,
} from './useBankSmsSettings'
import './BankSmsSettingsCard.css'

export function BankSmsSettingsCard() {
  const { data: preferences, isLoading, isError } = useUserPreferences()
  const enableMutation = useEnableBankSmsCapture()
  const disableMutation = useDisableBankSmsCapture()
  const regenerateMutation = useRegenerateBankSmsKey()

  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [presentToast] = useIonToast()

  const isEnabled = Boolean(preferences?.bankSmsEnabled)
  const ingestionKey = preferences?.bankSmsIngestionKey

  const handleToggle = async (checked: boolean) => {
    try {
      if (checked) {
        await enableMutation.mutateAsync()
        presentToast({
          message: 'Bank SMS Capture enabled',
          duration: 2000,
          position: 'bottom',
        })
      } else {
        await disableMutation.mutateAsync()
        presentToast({
          message: 'Bank SMS Capture disabled',
          duration: 2000,
          position: 'bottom',
        })
      }
    } catch (err: any) {
      presentToast({
        message: err.message || 'Failed to update Bank SMS Capture',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
      })
    }
  }

  const handleCopyKey = async () => {
    if (!ingestionKey) return
    try {
      await navigator.clipboard.writeText(ingestionKey)
      presentToast({
        message: 'Copied',
        duration: 1500,
        position: 'bottom',
      })
    } catch {
      presentToast({
        message: 'Could not copy to clipboard',
        duration: 2000,
        position: 'bottom',
        color: 'warning',
      })
    }
  }

  const handleRegenerate = async () => {
    try {
      await regenerateMutation.mutateAsync()
      setShowRegenerateConfirm(false)
      presentToast({
        message: 'New key generated',
        duration: 2000,
        position: 'bottom',
      })
    } catch (err: any) {
      presentToast({
        message: err.message || 'Failed to regenerate key',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
      })
    }
  }

  const isPending = enableMutation.isPending || disableMutation.isPending || regenerateMutation.isPending

  return (
    <section className="homeos-bank-sms-settings">
      <SectionHeader icon={phonePortraitOutline} title="Bank SMS Capture" />

      {isLoading ? (
        <GroupedCard>
          <div className="homeos-bank-sms-settings__skeleton">
            <Skeleton height={56} />
            <Skeleton height={56} />
          </div>
        </GroupedCard>
      ) : isError ? (
        <GroupedCard>
          <p className="homeos-bank-sms-settings__error">
            Unable to load Bank SMS preferences.
          </p>
        </GroupedCard>
      ) : (
        <GroupedCard>
          <Row
            icon={phonePortraitOutline}
            tone={isEnabled ? 'success' : 'neutral'}
            title="Bank SMS Capture"
            meta={isEnabled ? 'Active' : 'Disabled'}
            trailing={
              <IonToggle
                checked={isEnabled}
                disabled={isPending}
                onIonChange={(e) => handleToggle(e.detail.checked)}
              />
            }
          />

          {isEnabled && ingestionKey && (
            <button
              type="button"
              className="homeos-shortcut-key-row"
              onClick={handleCopyKey}
              aria-label={`Shortcut Key ${ingestionKey}. Tap to copy.`}
            >
              <div className="homeos-shortcut-key-row__content">
                <span className="homeos-shortcut-key-row__label">Shortcut Key</span>
                <code className="homeos-shortcut-key-row__value">{ingestionKey}</code>
              </div>
              <IonIcon icon={copyOutline} className="homeos-shortcut-key-row__icon" aria-hidden="true" />
            </button>
          )}

          {isEnabled && ingestionKey && (
            <div className="homeos-bank-sms-settings__footer">
              <button
                type="button"
                className="homeos-bank-sms-settings__regenerate-link"
                disabled={isPending}
                onClick={() => setShowRegenerateConfirm(true)}
              >
                Regenerate Key
              </button>
            </div>
          )}

          {!isEnabled && (
            <div className="homeos-bank-sms-settings__hint-box">
              <p className="homeos-bank-sms-settings__hint">
                {ingestionKey
                  ? 'Capture is paused. Turn on to resume importing transactions.'
                  : 'Turn on capture to generate a Shortcut Key for your iPhone.'}
              </p>
            </div>
          )}
        </GroupedCard>
      )}

      <ConfirmationSheet
        isOpen={showRegenerateConfirm}
        header="Regenerate Shortcut Key?"
        message="Your existing key will stop working immediately. You will need to copy the new key into your iPhone Shortcut."
        confirmLabel="Regenerate"
        onConfirm={handleRegenerate}
        onCancel={() => setShowRegenerateConfirm(false)}
      />
    </section>
  )
}
