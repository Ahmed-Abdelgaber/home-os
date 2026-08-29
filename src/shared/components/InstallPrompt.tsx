import { useState } from 'react'
import './InstallPrompt.css'

const DISMISSED_KEY = 'homeos-install-prompt-dismissed'

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua)
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)
  return isIos && isSafari
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone === true
}

/**
 * iOS has no native install prompt — per docs/00 §Delivery model, the install path is
 * manual (Share → Add to Home Screen), so this is the closest thing to onboarding for it.
 */
export function InstallPrompt() {
  const [visible, setVisible] = useState(() => !isStandalone() && isIosSafari() && !localStorage.getItem(DISMISSED_KEY))

  if (!visible) return null

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="homeos-install-prompt" role="status">
      <p className="homeos-install-prompt__text">
        Install HomeOS: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
      </p>
      <button type="button" className="homeos-install-prompt__dismiss" aria-label="Dismiss" onClick={dismiss}>
        ×
      </button>
    </div>
  )
}
