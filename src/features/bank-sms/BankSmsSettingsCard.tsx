import { useState } from 'react'
import { IonButton, IonIcon, IonToggle, useIonToast } from '@ionic/react'
import { copyOutline, phonePortraitOutline, refreshOutline } from 'ionicons/icons'
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

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
  const functionUrl = `${supabaseUrl}/functions/v1/cib-ingestion`

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

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      presentToast({
        message: `${label} copied`,
        duration: 2000,
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
        message: 'New ingestion key generated',
        duration: 2500,
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
            <Skeleton height={60} />
            <Skeleton height={120} />
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
            title="Automatic Capture"
            meta={
              isEnabled
                ? 'On — Accepting SMS from iPhone Shortcut'
                : 'Off — Forwarded SMS will not be imported'
            }
            trailing={
              <IonToggle
                checked={isEnabled}
                disabled={isPending}
                onIonChange={(e) => handleToggle(e.detail.checked)}
              />
            }
          />

          <div className="homeos-bank-sms-settings__content">
            <p className="homeos-bank-sms-settings__description">
              Automatically capture supported bank purchase SMS messages from your iPhone Shortcut and add them to HomeOS as pending bank transactions.
            </p>

            {ingestionKey ? (
              <div className="homeos-bank-sms-settings__key-box">
                <div className="homeos-bank-sms-settings__key-header">
                  <span className="homeos-bank-sms-settings__key-label">Shortcut Ingestion Key</span>
                  <span
                    className={`homeos-status-chip ${
                      isEnabled ? 'homeos-status-chip--active' : 'homeos-status-chip--finished'
                    }`}
                  >
                    {isEnabled ? 'Active' : 'Paused'}
                  </span>
                </div>

                <div className="homeos-bank-sms-settings__key-display">
                  <code>{ingestionKey}</code>
                </div>

                <div className="homeos-bank-sms-settings__key-actions">
                  <IonButton
                    fill="outline"
                    size="small"
                    className="homeos-bank-sms-settings__action-btn"
                    onClick={() => handleCopy(ingestionKey, 'Ingestion key')}
                  >
                    <IonIcon slot="start" icon={copyOutline} />
                    Copy Key
                  </IonButton>

                  <IonButton
                    fill="clear"
                    size="small"
                    color="medium"
                    className="homeos-bank-sms-settings__action-btn"
                    disabled={isPending}
                    onClick={() => setShowRegenerateConfirm(true)}
                  >
                    <IonIcon slot="start" icon={refreshOutline} />
                    Regenerate Key
                  </IonButton>
                </div>

                {!isEnabled && (
                  <p className="homeos-bank-sms-settings__hint">
                    Capture is paused. Messages forwarded by your Shortcut will not be accepted until turned back on. Your existing key is preserved.
                  </p>
                )}

                {isEnabled && (
                  <div className="homeos-bank-sms-settings__guide">
                    <h4 className="homeos-bank-sms-settings__guide-title">iPhone Shortcut Setup</h4>

                    <div className="homeos-bank-sms-settings__guide-item">
                      <span className="homeos-bank-sms-settings__guide-label">Request URL</span>
                      <div className="homeos-bank-sms-settings__guide-url-row">
                        <code className="homeos-bank-sms-settings__guide-url">{functionUrl}</code>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => handleCopy(functionUrl, 'Request URL')}
                        >
                          <IonIcon slot="icon-only" icon={copyOutline} />
                        </IonButton>
                      </div>
                    </div>

                    <div className="homeos-bank-sms-settings__guide-item">
                      <span className="homeos-bank-sms-settings__guide-label">Method</span>
                      <code>POST</code>
                    </div>

                    <div className="homeos-bank-sms-settings__guide-item">
                      <span className="homeos-bank-sms-settings__guide-label">Header</span>
                      <code>X-HomeOS-Ingestion-Key: &lt;your copied key&gt;</code>
                    </div>

                    <div className="homeos-bank-sms-settings__guide-item">
                      <span className="homeos-bank-sms-settings__guide-label">Body (JSON)</span>
                      <pre className="homeos-bank-sms-settings__guide-json">
{`{
  "message": "<SMS text>"
}`}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="homeos-bank-sms-settings__empty">
                <p className="homeos-bank-sms-settings__hint">
                  Turn on capture to generate a personal ingestion key for your iPhone Shortcut.
                </p>
              </div>
            )}
          </div>
        </GroupedCard>
      )}

      <ConfirmationSheet
        isOpen={showRegenerateConfirm}
        header="Regenerate Ingestion Key?"
        message="Your existing key will stop working immediately. You will need to copy the new key into your iPhone Shortcut."
        confirmLabel="Regenerate"
        onConfirm={handleRegenerate}
        onCancel={() => setShowRegenerateConfirm(false)}
      />
    </section>
  )
}
