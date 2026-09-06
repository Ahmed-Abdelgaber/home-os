import type { ExpenseSummary } from './useExpenses'

export function formatExpenseAmount(amount: number, currency = 'EGP'): string {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export interface ExpenseDay {
  date: string
  total: number
  expenses: ExpenseSummary[]
}

/** Sum in minor units so repeated decimal amounts do not accumulate floating-point drift. */
export function groupExpenseDays(expenses: ExpenseSummary[], oldestFirst = false): ExpenseDay[] {
  const groups = new Map<string, ExpenseSummary[]>()
  for (const expense of expenses) {
    const group = groups.get(expense.date) ?? []
    group.push(expense)
    groups.set(expense.date, group)
  }
  return [...groups].sort(([a], [b]) => oldestFirst ? a.localeCompare(b) : b.localeCompare(a))
    .map(([date, entries]) => ({ date, expenses: entries, total: entries.reduce((sum, entry) => sum + Math.round(entry.amountValue * 100), 0) / 100 }))
}

export function filterExpenses(expenses: ExpenseSummary[], search: string, category: string, bounds?: { start: string; end: string }): ExpenseSummary[] {
  const query = search.trim().toLocaleLowerCase()
  return expenses.filter((expense) =>
    (!category || expense.category === category) &&
    (!bounds || (expense.date >= bounds.start && expense.date < bounds.end)) &&
    (!query || [expense.title, expense.meta, expense.amount, formatExpenseAmount(expense.amountValue)].some((value) => value.toLocaleLowerCase().includes(query))),
  )
}

/** Shared curated hints; these never change the recorded expense category. */
export { resolveProductVisual as expenseVisual } from '../../core/presentation/productVisuals.ts'
