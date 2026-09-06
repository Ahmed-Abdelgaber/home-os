import { IonIcon } from '@ionic/react'
import { useQueryClient } from '@tanstack/react-query'
import { cardOutline, chevronForward, closeOutline, optionsOutline, searchOutline } from 'ionicons/icons'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cairoMonthRange } from '../../core/utils/cairoDate'
import { useExpenses } from '../../features/expenses/useExpenses'
import { ExpensePendingCards } from '../../features/expenses/ExpensePendingCards'
import { expenseVisual, filterExpenses, formatExpenseAmount, groupExpenseDays } from '../../features/expenses/expenseLedger'
import { AppPage } from '../../shared/components/AppPage'
import { EmptyState } from '../../shared/components/EmptyState'
import { PrimaryButton } from '../../shared/components/PrimaryButton'
import { QueryState } from '../../shared/components/QueryState'
import { RowSkeleton } from '../../shared/components/RowSkeleton'
import { SearchBar } from '../../shared/components/SearchBar'
import '../../shared/components/CompactLedger.css'
import './ExpensesPage.css'

const ledgerDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Cairo' })

export function ExpensesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const expenses = useExpenses()
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [range, setRange] = useState('all')
  const [oldestFirst, setOldestFirst] = useState(false)
  const searchContainer = useRef<HTMLDivElement>(null)
  const categoryCounts = new Map<string, number>()
  for (const expense of expenses.data ?? []) categoryCounts.set(expense.category, (categoryCounts.get(expense.category) ?? 0) + 1)
  const categories = [...categoryCounts.keys()].sort((a, b) => (categoryCounts.get(b)! - categoryCounts.get(a)!) || a.localeCompare(b))
  const hasFilters = Boolean(category || range !== 'all' || search.trim())
  const bounds = range === 'all' ? undefined : cairoMonthRange(range === 'month' ? 0 : -1)
  function clearFilters() { setSearch(''); setCategory(''); setRange('all'); setOldestFirst(false) }

  return (
    <AppPage
      title="Expenses"
      className="homeos-compact-ledger homeos-expenses-page"
      fullscreen={false}
      headerActions={<>
        <button type="button" className="homeos-ledger-tool" aria-label={searchOpen ? 'Close search' : 'Search expenses'} aria-expanded={searchOpen} aria-controls="expense-search" onClick={() => {
          setSearchOpen(!searchOpen)
          if (searchOpen) setSearch('')
          else requestAnimationFrame(() => searchContainer.current?.querySelector('input')?.focus())
        }}><IonIcon icon={searchOpen ? closeOutline : searchOutline} aria-hidden="true" /></button>
        <button type="button" className={`homeos-ledger-tool ${range !== 'all' || oldestFirst ? 'homeos-ledger-tool--selected' : ''}`} aria-label="Filter expenses" aria-expanded={filtersOpen} aria-controls="expense-filters" onClick={() => setFiltersOpen(!filtersOpen)}><IonIcon icon={optionsOutline} aria-hidden="true" /></button>
      </>}
      onRefresh={async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['expenses'] }),
          queryClient.invalidateQueries({ queryKey: ['bank_transactions'] }),
        ])
      }}
    >
      <div id="expense-search" hidden={!searchOpen} ref={searchContainer}>
        <SearchBar value={search} onChange={(value) => { setSearch(value); if (!value) searchContainer.current?.querySelector('input')?.focus() }} placeholder="Search expenses…" />
      </div>
      <div className="homeos-ledger-categories" role="group" aria-label="Expense category">
        {['', ...categories].map((name) => <button type="button" key={name} aria-pressed={category === name} onClick={() => setCategory(name)}>{name || 'All'}</button>)}
      </div>
      {filtersOpen && <div className="homeos-ledger-filters" id="expense-filters">
        <fieldset><legend>Date range</legend><div className="homeos-ledger-options">
          {[['all', 'All dates'], ['month', 'This month'], ['previous', 'Last month']].map(([value, label]) => <button type="button" key={value} aria-pressed={range === value} onClick={() => setRange(value)}>{label}</button>)}
        </div></fieldset>
        <fieldset><legend>Order</legend><div className="homeos-ledger-options">
          <button type="button" aria-pressed={!oldestFirst} onClick={() => setOldestFirst(false)}>Newest first</button>
          <button type="button" aria-pressed={oldestFirst} onClick={() => setOldestFirst(true)}>Oldest first</button>
        </div></fieldset>
        <button type="button" className="homeos-ledger-reset" onClick={clearFilters}>Reset filters</button>
      </div>}
      <ExpensePendingCards />
      {expenses.data && expenses.data.length >= 100 && <p className="homeos-ledger-feedback">Latest 100 expenses. Totals and filters cover these entries.</p>}
      <QueryState query={expenses} skeleton={<RowSkeleton />} error="Couldn't load expenses." empty={
        <EmptyState icon={cardOutline} title="No expenses yet" message="Your purchases will appear here, grouped by day." action={<PrimaryButton onClick={() => navigate('/app/expenses/add')}>Add expense</PrimaryButton>} />
      }>
        {(items) => {
          const filtered = filterExpenses(items, search, category, bounds)
          if (!filtered.length) return <EmptyState icon={searchOutline} title="No matching expenses" message="Try another category, date range, or search." action={<button type="button" className="homeos-ledger-reset" onClick={clearFilters}>Clear filters</button>} />
          return <div className="homeos-ledger" aria-label="Expenses by day">
            {hasFilters && <p className="homeos-ledger-feedback" role="status">{filtered.length} matching {filtered.length === 1 ? 'expense' : 'expenses'} · daily totals reflect filters</p>}
            {groupExpenseDays(filtered, oldestFirst).map((day) => <section className="homeos-ledger-day" key={day.date} aria-label={ledgerDate.format(new Date(`${day.date}T00:00:00Z`))}>
              <div className="homeos-ledger-day__heading"><h2><time dateTime={day.date}>{ledgerDate.format(new Date(`${day.date}T00:00:00Z`))}</time></h2><span aria-label={`Day total ${formatExpenseAmount(day.total)}`}>{formatExpenseAmount(day.total)}</span></div>
              <ul className="homeos-ledger-rows">
                {day.expenses.map((expense) => {
                  const visual = expenseVisual(expense.title, expense.category)
                  return <li key={expense.id}><Link className="homeos-ledger-row" to={`/app/expenses/${expense.id}`}>
                    <span className={`homeos-ledger-row__icon homeos-ledger-row__icon--${visual.tone}`} aria-hidden="true">{visual.emoji}</span>
                    <span className="homeos-ledger-row__copy"><strong dir="auto">{expense.title}</strong><span className="homeos-ledger-meta">{expense.category}</span></span>
                    <strong className="homeos-ledger-row__amount">{formatExpenseAmount(expense.amountValue)}</strong>
                    <IonIcon className="homeos-ledger-chevron" icon={chevronForward} aria-hidden="true" />
                  </Link></li>
                })}
              </ul>
            </section>)}
          </div>
        }}
      </QueryState>
      {expenses.isError && <button type="button" className="homeos-ledger-reset" onClick={() => void expenses.refetch()}>Try again</button>}
    </AppPage>
  )
}
