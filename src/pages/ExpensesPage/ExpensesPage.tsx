import { cardOutline } from 'ionicons/icons'
import { useNavigate } from 'react-router-dom'
import { useExpenses } from '../../features/expenses/useExpenses'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { QueryState } from '../../shared/components/QueryState'
import { Row } from '../../shared/components/Row'
import { Skeleton } from '../../shared/components/Skeleton'
import './ExpensesPage.css'

export function ExpensesPage() {
  const navigate = useNavigate()
  const expenses = useExpenses()

  return (
    <AppPage title="Expenses">
      <QueryState
        query={expenses}
        skeleton={
          <div className="homeos-expenses-skeleton-stack">
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        }
        error="Couldn't load expenses."
        empty="No expenses yet."
      >
        {(items) => (
          <GroupedCard>
            {items.map((expense) => (
              <Row
                key={expense.id}
                icon={cardOutline}
                tone="primary"
                title={expense.title}
                meta={expense.meta}
                accessory={expense.amount}
                onClick={() => navigate(`/app/expenses/${expense.id}`)}
              />
            ))}
          </GroupedCard>
        )}
      </QueryState>
    </AppPage>
  )
}
