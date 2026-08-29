import {
  airplaneOutline,
  cubeOutline,
  logOutOutline,
  personOutline,
  pricetagOutline,
  settingsOutline,
  walletOutline,
} from 'ionicons/icons'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../core/supabase/client'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { Row } from '../../shared/components/Row'
import './MorePage.css'

export function MorePage() {
  const navigate = useNavigate()

  return (
    <AppPage title="More">
      <GroupedCard>
        <Row icon={airplaneOutline} tone="info" title="Trips" meta="Current, upcoming, and past" onClick={() => navigate('/app/trips')} />
        <Row
          icon={cubeOutline}
          title="Product Catalog"
          meta="Products, categories, consumption modes"
          onClick={() => navigate('/app/products')}
        />
        <Row icon={walletOutline} tone="primary" title="Accounts" meta="Where money moves from" onClick={() => navigate('/app/accounts')} />
        <Row icon={pricetagOutline} title="Categories" meta="Group expenses and products" onClick={() => navigate('/app/categories')} />
        <Row icon={personOutline} title="People" meta="Household members" onClick={() => navigate('/app/people')} />
        <Row icon={settingsOutline} title="Settings" meta="Your account" onClick={() => navigate('/app/settings')} />
      </GroupedCard>

      <GroupedCard className="homeos-more__logout">
        <Row icon={logOutOutline} tone="danger" title="Logout" meta="End your session" onClick={() => supabase.auth.signOut()} />
      </GroupedCard>
    </AppPage>
  )
}
