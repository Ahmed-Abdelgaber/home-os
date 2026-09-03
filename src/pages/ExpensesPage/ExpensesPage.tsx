import { useQueryClient } from '@tanstack/react-query'
import { cardOutline } from 'ionicons/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpenses } from '../../features/expenses/useExpenses'
import { AppPage } from '../../shared/components/AppPage'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { QueryState } from '../../shared/components/QueryState'
import { Row } from '../../shared/components/Row'
import { SearchBar } from '../../shared/components/SearchBar'
import { Skeleton } from '../../shared/components/Skeleton'
import './ExpensesPage.css'

export function ExpensesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const expenses = useExpenses()
  const [search, setSearch] = useState('')
  const lowerSearch = search.toLowerCase()

  return (
    <AppPage title="Expenses" onRefresh={() => queryClient.invalidateQueries({ queryKey: ['expenses'] })}>
      <SearchBar value={search} onChange={setSearch} placeholder="Search expenses…" />

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
        {(items) => {
          const filtered = lowerSearch
            ? items.filter(
                (e) =>
                  e.title.toLowerCase().includes(lowerSearch) ||
                  e.meta.toLowerCase().includes(lowerSearch) ||
                  e.amount.toLowerCase().includes(lowerSearch),
              )
            : items
          if (filtered.length === 0 && lowerSearch) {
            return <p className="homeos-items-empty-search">No expenses match "{search}".</p>
          }
          return (
            <GroupedCard>
              {filtered.map((expense) => (
                <Row
                  key={expense.id}
                  icon={cardOutline}
                  tone="neutral"
                  title={expense.title}
                  meta={expense.meta}
                  accessory={expense.amount}
                  onClick={() => navigate(`/app/expenses/${expense.id}`)}
                />
              ))}
            </GroupedCard>
          )
        }}
      </QueryState>
    </AppPage>
  )
}

