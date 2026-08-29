import { Component, type ErrorInfo, type ReactNode } from 'react'
import './ErrorBoundary.css'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Last line of defence for the installed PWA. A render-time throw on a phone has no console
 * and no way back, so this trades the white screen for a readable message and a reload.
 * Reloading is the only recovery offered on purpose: the app's state lives in Supabase and
 * TanStack Query, so a fresh boot is a real fix rather than a retry that re-throws.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="homeos-error-boundary" role="alert">
        <div className="homeos-error-boundary__panel">
          <h1 className="homeos-error-boundary__title">HomeOS hit a problem</h1>
          <p className="homeos-error-boundary__body">
            This screen stopped responding. Reloading usually clears it — nothing you saved has been lost.
          </p>
          <button type="button" className="homeos-error-boundary__action" onClick={() => window.location.reload()}>
            Reload HomeOS
          </button>
          <p className="homeos-error-boundary__detail">{error.message}</p>
        </div>
      </div>
    )
  }
}
