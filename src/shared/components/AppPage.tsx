import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import type { ReactNode } from 'react'

interface AppPageProps {
  title: string
  /**
   * Where back goes when this page was opened directly (deep link, refresh). Ionic prefers the
   * real navigation history when there is one and only falls back to this. Omit on tab roots,
   * which have nothing above them — that also hides the back button.
   */
  backHref?: string
  children: ReactNode
}

/**
 * The standard page chrome: title bar, optional back affordance, padded scroll region.
 * Every screen except Home and Login is this shape, and each was spelling out the same
 * six Ionic elements.
 */
export function AppPage({ title, backHref, children }: AppPageProps) {
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
        {children}
      </IonContent>
    </IonPage>
  )
}
