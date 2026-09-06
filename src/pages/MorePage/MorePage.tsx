import { airplaneOutline, cardOutline, cartOutline, cubeOutline, logOutOutline, pricetagOutline, settingsOutline, walletOutline, calendarOutline, peopleOutline, chevronForward } from 'ionicons/icons'
import { Link } from 'react-router-dom'
import { IonIcon, useIonAlert } from '@ionic/react'
import { supabase } from '../../core/supabase/client'
import { usePendingBankTransactions } from '../../features/bank-transactions/useBankTransactions'
import { AppPage } from '../../shared/components/AppPage'
import '../../shared/components/CompactLedger.css'
import './MorePage.css'

const menuGroups = [
  { title: 'Everyday', entries: [
    { title: 'Shopping list', detail: 'Planned purchases and suggestions', icon: cartOutline, tone: 'green', href: '/app/shopping-list' },
    { title: 'Trips', detail: 'Current, upcoming and past', icon: airplaneOutline, tone: 'blue', href: '/app/trips' },
    { title: 'Product catalog', detail: 'Your reusable product list', icon: cubeOutline, tone: 'violet', href: '/app/products' },
  ] },
  { title: 'Money & planning', entries: [
    { title: 'Pending transactions', detail: 'Bank payments waiting for review', icon: cardOutline, tone: 'amber', href: '/app/pending-transactions' },
    { title: 'Tracking periods', detail: 'Current period and past spending', icon: calendarOutline, tone: 'violet', href: '/app/periods' },
    { title: 'Accounts', detail: 'Where you pay from', icon: walletOutline, tone: 'blue', href: '/app/accounts' },
  ] },
  { title: 'Household', entries: [
    { title: 'People', detail: 'Members of your household', icon: peopleOutline, tone: 'green', href: '/app/people' },
    { title: 'Categories', detail: 'Organize products and spending', icon: pricetagOutline, tone: 'rose', href: '/app/categories' },
    { title: 'Settings', detail: 'Your account and preferences', icon: settingsOutline, tone: 'neutral', href: '/app/settings' },
  ] },
]

export function MorePage() {
  const [presentAlert] = useIonAlert()
  const pending = usePendingBankTransactions()
  const actionableCount = pending.data?.length ?? 0

  const handleLogout = () => {
    presentAlert({
      header: 'Log Out',
      message: 'Are you sure you want to end your session?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Log out', role: 'destructive', handler: () => supabase.auth.signOut() },
      ],
    })
  }

  return (
    <AppPage title="More" className="homeos-compact-ledger homeos-more-page" fullscreen={false}>
      <nav aria-label="More household tools">
        {menuGroups.map(group => <section className="homeos-more-group" key={group.title} aria-label={group.title}>
          <h2 className="homeos-more-group__title">{group.title}</h2>
          <ul className="homeos-ledger-rows">
            {group.entries.map(entry => <li key={entry.href}>
              <Link className="homeos-ledger-row homeos-more-row" to={entry.href}>
                <span className={`homeos-more-icon homeos-more-icon--${entry.tone}`}><IonIcon icon={entry.icon} aria-hidden="true" /></span>
                <span className="homeos-ledger-row__copy"><strong>{entry.title}</strong><span className="homeos-more-detail">{entry.detail}</span></span>
                {entry.href === '/app/pending-transactions' && !pending.isError && <>
                  {pending.isLoading ? <span className="homeos-more-count" aria-label="Loading pending count">…</span> : actionableCount > 0 && <span className="homeos-more-count" aria-label={`${actionableCount} waiting for review`}>{actionableCount}</span>}
                </>}
                <IonIcon className="homeos-ledger-chevron" icon={chevronForward} aria-hidden="true" />
              </Link>
            </li>)}
          </ul>
          {group.title === 'Money & planning' && pending.isError && <p className="homeos-more-feedback" role="alert">Couldn't check pending transactions. <button className="homeos-ledger-reset" type="button" onClick={() => void pending.refetch()}>Retry</button></p>}
        </section>)}
      </nav>
      <button className="homeos-logout-button" type="button" onClick={handleLogout}>
        <IonIcon icon={logOutOutline} aria-hidden="true" />Log out
      </button>
    </AppPage>
  )
}
