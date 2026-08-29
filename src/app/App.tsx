import { IonApp, setupIonicReact } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'

import '@ionic/react/css/core.css'
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'

import '../theme/tokens.css'
import '../theme/ionic-overrides.css'
import '../theme/global.css'

import { AppProviders } from './providers'
import { AppRoutes } from './routes'
import { ErrorBoundary } from '../shared/components/ErrorBoundary'
import { InstallPrompt } from '../shared/components/InstallPrompt'

setupIonicReact()

export function App() {
  return (
    <IonApp>
      {/* Outermost so it catches throws from the providers and router too, not just pages. */}
      <ErrorBoundary>
        <AppProviders>
          <IonReactRouter>
            <AppRoutes />
          </IonReactRouter>
          <InstallPrompt />
        </AppProviders>
      </ErrorBoundary>
    </IonApp>
  )
}
