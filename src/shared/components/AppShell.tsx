import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react'
import { cubeOutline, ellipsisHorizontalOutline, homeOutline, walletOutline } from 'ionicons/icons'
import { Navigate, Route } from 'react-router-dom'
import { HomePage } from '../../pages/HomePage/HomePage'
import { ItemsPage } from '../../pages/ItemsPage/ItemsPage'
import { ExpensesPage } from '../../pages/ExpensesPage/ExpensesPage'
import { MorePage } from '../../pages/MorePage/MorePage'
import { GlobalAddButton } from './GlobalAddButton'
import './AppShell.css'

/**
 * Authenticated tab shell: Home / Items / (Global Add) / Expenses / More.
 * Per docs/04_INFORMATION_ARCHITECTURE.md — contextual pages push above this shell later.
 */
export function AppShell() {
  return (
    <IonTabs className="homeos-app-shell">
      <IonRouterOutlet>
        <Route path="home" element={<HomePage />} />
        <Route path="items" element={<ItemsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="more" element={<MorePage />} />
        <Route index element={<Navigate to="home" replace />} />
      </IonRouterOutlet>
      <GlobalAddButton />
      <IonTabBar slot="bottom">
        <svg className="homeos-tab-bar-notch" viewBox="0 0 200 24" preserveAspectRatio="none" aria-hidden="true">
          <path className="homeos-tab-bar-notch__fill" d="M80,0 C90,0 94,14 100,14 C106,14 110,0 120,0 Z" />
          <path
            className="homeos-tab-bar-notch__stroke"
            d="M0,0 L80,0 C90,0 94,14 100,14 C106,14 110,0 120,0 L200,0"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <IonTabButton tab="home" href="/app/tabs/home">
          <IonIcon icon={homeOutline} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>
        <IonTabButton tab="items" href="/app/tabs/items">
          <IonIcon icon={cubeOutline} />
          <IonLabel>Items</IonLabel>
        </IonTabButton>
        <IonTabButton tab="expenses" href="/app/tabs/expenses">
          <IonIcon icon={walletOutline} />
          <IonLabel>Expenses</IonLabel>
        </IonTabButton>
        <IonTabButton tab="more" href="/app/tabs/more">
          <IonIcon icon={ellipsisHorizontalOutline} />
          <IonLabel>More</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  )
}
