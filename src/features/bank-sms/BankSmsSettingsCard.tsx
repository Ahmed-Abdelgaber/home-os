import { useState } from 'react'
import { IonIcon, IonModal, IonToggle, useIonToast } from '@ionic/react'
import { chevronForward, close, copyOutline, phonePortraitOutline, refreshOutline } from 'ionicons/icons'
import { ConfirmationSheet } from '../../shared/components/ConfirmationSheet'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { Row } from '../../shared/components/Row'
import { SecondaryButton } from '../../shared/components/SecondaryButton'
import { SectionHeader } from '../../shared/components/SectionHeader'
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

          {isEnabled && (
            <>
              <div className="homeos-bank-sms-setup-header">iPhone Setup</div>

              <div className="homeos-bank-sms-steps">
                <div className="homeos-bank-sms-step">
                  <div className="homeos-bank-sms-step__left">
                    <span className="homeos-bank-sms-step__num">1</span>
                    <div className="homeos-bank-sms-step__content">
                      <span className="homeos-bank-sms-step__title">Install Shortcut</span>
                      <span className="homeos-bank-sms-step__desc">Add HomeOS Bank Capture to your iPhone</span>
                    </div>
                  </div>
                  <a
                    href={SHORTCUT_INSTALL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="homeos-bank-sms-step__btn"
                    aria-label="Install Shortcut"
                  >
                    Install
                  </a>
                </div>

                <div className="homeos-bank-sms-step">
                  <div className="homeos-bank-sms-step__left">
                    <span className="homeos-bank-sms-step__num">2</span>
                    <div className="homeos-bank-sms-step__content">
                      <span className="homeos-bank-sms-step__title">Connect to HomeOS</span>
                      <span className="homeos-bank-sms-step__desc">Securely link the shortcut</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={!ingestionKey}
                    className="homeos-bank-sms-step__btn"
                    aria-label="Connect to HomeOS"
                  >
                    Connect
                  </button>
                </div>

                <div className="homeos-bank-sms-step">
                  <div className="homeos-bank-sms-step__left">
                    <span className="homeos-bank-sms-step__num">3</span>
                    <div className="homeos-bank-sms-step__content">
                      <span className="homeos-bank-sms-step__title">Enable Automation</span>
                      <span className="homeos-bank-sms-step__desc">Capture CIB SMS automatically</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAutomationModal(true)}
                    className="homeos-bank-sms-step__btn"
                    aria-label="Set Up Automation"
                  >
                    Set Up
                  </button>
                </div>
              </div>
            </>
          )}

          {/* {isEnabled && ingestionKey && (
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
          )} */}

          {/* {isEnabled && ingestionKey && (
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
          )} */}
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
        initialBreakpoint={0.92}
        breakpoints={[0, 0.92, 1]}
      >
        <div className="homeos-automation-modal">
          <header className="homeos-automation-modal__header">
            <div className="homeos-automation-modal__title-wrap">
              <h2 className="homeos-automation-modal__title">Enable CIB Automation</h2>
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
            <PrimaryButton onClick={handleOpenShortcuts}>
              Open Shortcuts
            </PrimaryButton>
            <SecondaryButton onClick={() => setShowAutomationModal(false)}>
              Done
            </SecondaryButton>
          </footer>
        </div>
      </IonModal>
    </section>
  )
}
