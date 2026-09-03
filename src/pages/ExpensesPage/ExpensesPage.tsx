import { useQueryClient } from '@tanstack/react-query'
import { cardOutline, searchOutline } from 'ionicons/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpenses } from '../../features/expenses/useExpenses'
import { PendingTransactionsSection } from '../../features/bank-transactions/PendingTransactionsSection'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
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
    <AppPage
      title="Expenses"
      onRefresh={async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['expenses'] }),
          queryClient.invalidateQueries({ queryKey: ['bank_transactions'] }),
        ])
      }}
    >
      <SearchBar value={search} onChange={setSearch} placeholder="Search expenses…" />

      {!lowerSearch && <PendingTransactionsSection />}

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
            return (
              <EmptyState
                icon={searchOutline}
                title="No matching expenses"
                message={`No expenses match "${search}".`}
              />
            )
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

