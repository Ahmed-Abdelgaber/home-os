import { useState } from 'react'
import { IonIcon, IonModal, IonToggle, useIonToast } from '@ionic/react'
import { close, phonePortraitOutline } from 'ionicons/icons'
import { ConfirmationSheet } from '../../shared/components/ConfirmationSheet'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { Row } from '../../shared/components/Row'
import { Skeleton } from '../../shared/components/Skeleton'
import {
  useDisableBankSmsCapture,
  useEnableBankSmsCapture,
  useRegenerateBankSmsKey,
  useUserPreferences,
} from './useBankSmsSettings'
import './BankSmsSettingsCard.css'

export const SHORTCUT_INSTALL_URL = 'https://www.icloud.com/shortcuts/3696b64724894b7887d8116d101f4b13'
export const SHORTCUTS_APP_URL = 'shortcuts://'

export function buildShortcutsConnectUrl(ingestionKey: string): string {
  const payload = `HOMEOS_CONFIG:${ingestionKey}`
  return (
    `shortcuts://run-shortcut?name=${encodeURIComponent('HomeOS Bank Capture')}` +
    `&input=text&text=${encodeURIComponent(payload)}`
  )
}

export const AUTOMATION_STEPS = [
  { step: 1, text: 'Open Shortcuts' },
  { step: 2, text: 'Go to Automation' },
  { step: 3, text: 'Tap + and choose Message' },
  { step: 4, text: 'Set Sender to CIB' },
  { step: 5, text: 'Choose "Run Immediately"' },
  { step: 6, text: 'Select "HomeOS Bank Capture"' },
  { step: 7, text: 'Make sure the received message is passed as the Shortcut Input' },
  { step: 8, text: 'Save the automation' },
]

export function BankSmsSettingsCard() {
  const { data: preferences, isLoading, isError } = useUserPreferences()
  const enableMutation = useEnableBankSmsCapture()
  const disableMutation = useDisableBankSmsCapture()
  const regenerateMutation = useRegenerateBankSmsKey()

  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [showAutomationModal, setShowAutomationModal] = useState(false)
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

  const handleConnect = () => {
    if (!ingestionKey) return
    const url = buildShortcutsConnectUrl(ingestionKey)
    window.location.href = url
  }

  const handleOpenShortcuts = () => {
    window.location.href = SHORTCUTS_APP_URL
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
    <section className="homeos-settings-section homeos-bank-sms-settings" aria-label="Bank messages">
      <h2 className="homeos-settings-heading">Bank messages</h2>

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
            tone="info"
            title="Bank SMS capture"
            meta="Automatically capture bank purchases"
            trailing={
              <IonToggle
                className="homeos-bank-sms-toggle"
                aria-label="Bank SMS capture"
                checked={isEnabled}
                disabled={isPending}
                onIonChange={(e) => handleToggle(e.detail.checked)}
              />
            }
          />

          {isEnabled && (
            <div className="homeos-bank-sms-setup">
              <div className="homeos-bank-sms-setup-header">iPhone setup <span>3 steps</span></div>
              <ol className="homeos-bank-sms-steps">
                <li className="homeos-bank-sms-step homeos-bank-sms-step--install">
                  <span className="homeos-bank-sms-step__number" aria-hidden="true">1</span>
                  <div className="homeos-bank-sms-step__content">
                    <span className="homeos-bank-sms-step__title">Add the shortcut</span>
                    <span className="homeos-bank-sms-step__desc">Get HomeOS Bank Capture on your iPhone.</span>
                    <a href={SHORTCUT_INSTALL_URL} target="_blank" rel="noopener noreferrer" className="homeos-bank-sms-step__action" aria-label="Install Shortcut">Install shortcut</a>
                  </div>
                </li>
                <li className="homeos-bank-sms-step homeos-bank-sms-step--connect">
                  <span className="homeos-bank-sms-step__number" aria-hidden="true">2</span>
                  <div className="homeos-bank-sms-step__content">
                    <span className="homeos-bank-sms-step__title">Link it to HomeOS</span>
                    <span className="homeos-bank-sms-step__desc">Connect the shortcut to your account.</span>
                    <button type="button" onClick={handleConnect} disabled={!ingestionKey} className="homeos-bank-sms-step__action" aria-label="Connect to HomeOS">Connect shortcut</button>
                  </div>
                </li>
                <li className="homeos-bank-sms-step homeos-bank-sms-step--automation">
                  <span className="homeos-bank-sms-step__number" aria-hidden="true">3</span>
                  <div className="homeos-bank-sms-step__content">
                    <span className="homeos-bank-sms-step__title">Automate bank messages</span>
                    <span className="homeos-bank-sms-step__desc">Set up CIB messages in Shortcuts.</span>
                    <button type="button" onClick={() => setShowAutomationModal(true)} className="homeos-bank-sms-step__action" aria-label="Set Up Automation">Show setup steps</button>
                  </div>
                </li>
              </ol>
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

      <IonModal
        isOpen={showAutomationModal}
        onDidDismiss={() => setShowAutomationModal(false)}
        className="homeos-compact-ledger homeos-settings-overlay"
        aria-labelledby="homeos-automation-title"
        initialBreakpoint={0.92}
        breakpoints={[0, 0.92, 1]}
      >
        <div className="homeos-automation-modal">
          <header className="homeos-automation-modal__header">
            <div className="homeos-automation-modal__title-wrap">
              <h2 id="homeos-automation-title" className="homeos-automation-modal__title">Enable CIB Automation</h2>
              <p className="homeos-automation-modal__subtitle">
                Set this up once and HomeOS will capture future CIB purchase messages automatically.
              </p>
            </div>
            <button
              type="button"
              className="homeos-automation-modal__close"
              aria-label="Close"
              onClick={() => setShowAutomationModal(false)}
            >
              <IonIcon icon={close} />
            </button>
          </header>

          <div className="homeos-automation-modal__body homeos-page-rise">
            <ol className="homeos-automation-steps">
              {AUTOMATION_STEPS.map((s) => (
                <li key={s.step} className="homeos-automation-step-item">
                  <span className="homeos-automation-step-item__num">{s.step}</span>
                  <span className="homeos-automation-step-item__text">{s.text}</span>
                </li>
              ))}
            </ol>
          </div>

          <footer className="homeos-automation-modal__footer">
            <button type="button" className="homeos-list-submit" onClick={handleOpenShortcuts}>
              Open Shortcuts
            </button>
            <button type="button" className="homeos-ledger-reset" onClick={() => setShowAutomationModal(false)}>
              Done
            </button>
          </footer>
        </div>
      </IonModal>
    </section>
  )
}
