import { IonBackButton, IonButtons, IonContent, IonFooter, IonHeader, IonPage, IonRefresher, IonRefresherContent, IonTitle, IonToolbar } from '@ionic/react'
import type { ReactNode } from 'react'

interface AppPageProps {
  title: string
  /**
   * Where back goes when this page was opened directly (deep link, refresh). Ionic prefers the
   * real navigation history when there is one and only falls back to this. Omit on tab roots,
   * which have nothing above them — that also hides the back button.
   */
  backHref?: string
  /** When provided, pull-to-refresh triggers this callback. Should return a promise (e.g. query invalidation). */
  onRefresh?: () => Promise<void>
  /** Optional sticky footer content rendered outside the scrollable area. */
  footer?: ReactNode
  children: ReactNode
}

/**
 * The standard page chrome: title bar, optional back affordance, padded scroll region.
 * Every screen except Home and Login is this shape, and each was spelling out the same
 * six Ionic elements.
 */
export function AppPage({ title, backHref, onRefresh, footer, children }: AppPageProps) {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {backHref && (
            <IonButtons slot="start">
              <IonBackButton defaultHref={backHref} text="" />
            </IonButtons>
          )}
          <IonTitle>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="homeos-page-content" fullscreen>
        {onRefresh && (
          <IonRefresher
            slot="fixed"
            onIonRefresh={async (event) => {
              await onRefresh()
              event.detail.complete()
            }}
          >
            <IonRefresherContent />
          </IonRefresher>
        )}
        <div className="homeos-page-rise">
          {children}
        </div>
      </IonContent>
      {footer && (
        <IonFooter className="ion-no-border">
          {footer}
        </IonFooter>
      )}
    </IonPage>
  )
}

