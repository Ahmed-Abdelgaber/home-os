import { useState } from 'react'
import { IonIcon, IonToggle, useIonToast } from '@ionic/react'
import { chevronForward, copyOutline, phonePortraitOutline, refreshOutline } from 'ionicons/icons'
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
            meta="Automatically capture bank purchases"
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
                <span className="homeos-shortcut-key-row__value">{ingestionKey}</span>
              </div>
              <div className="homeos-shortcut-key-row__icon-wrap" aria-hidden="true">
                <IonIcon icon={copyOutline} className="homeos-shortcut-key-row__icon" />
              </div>
            </button>
          )}

          {isEnabled && ingestionKey && (
            <button
              type="button"
              className="homeos-regenerate-row"
              disabled={isPending}
              onClick={() => setShowRegenerateConfirm(true)}
            >
              <div className="homeos-regenerate-row__left">
                <IonIcon icon={refreshOutline} className="homeos-regenerate-row__icon" aria-hidden="true" />
                <span className="homeos-regenerate-row__title">Regenerate Shortcut Key</span>
              </div>
              <IonIcon icon={chevronForward} className="homeos-regenerate-row__chevron" aria-hidden="true" />
            </button>
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
