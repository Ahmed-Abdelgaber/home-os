import {
  airplaneOutline,
  cubeOutline,
  logOutOutline,
  pricetagOutline,
  settingsOutline,
  walletOutline,
  listOutline,
  calendarOutline,
  peopleOutline,
} from 'ionicons/icons'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../core/supabase/client'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { Row } from '../../shared/components/Row'
import { SectionHeader } from '../../shared/components/SectionHeader'
import './MorePage.css'

export function MorePage() {
  const navigate = useNavigate()

  return (
    <AppPage title="More">
      <GroupedCard>
        <Row icon={airplaneOutline} tone="info" title="Trips" meta="Current, upcoming, and past" onClick={() => navigate('/app/trips')} />
        <Row
          icon={cubeOutline}
          tone="primary"
          title="Product Catalog"
          meta="Products, categories, consumption modes"
          onClick={() => navigate('/app/products')}
        />
        <Row tone="neutral" icon={settingsOutline} title="Settings" meta="Your account" onClick={() => navigate('/app/settings')} />
      </GroupedCard>

      <section className="homeos-more__section">
        <SectionHeader icon={listOutline} title="Master data" />
        <GroupedCard>
          <Row tone="primary" icon={calendarOutline} title="Tracking Periods" meta="Start and end active periods" onClick={() => navigate('/app/periods')} />
          <Row tone="success" icon={pricetagOutline} title="Categories" meta="Group expenses and products" onClick={() => navigate('/app/categories')} />
          <Row tone="info" icon={walletOutline} title="Accounts" meta="Where money moves from" onClick={() => navigate('/app/accounts')} />
          <Row tone="neutral" icon={peopleOutline} title="People" meta="Household members" onClick={() => navigate('/app/people')} />
        </GroupedCard>
      </section>

      <GroupedCard className="homeos-more__logout">
        <Row icon={logOutOutline} tone="danger" title="Logout" meta="End your session" onClick={() => supabase.auth.signOut()} />
      </GroupedCard>
    </AppPage>
  )
}
