import test from 'node:test'
import assert from 'node:assert/strict'
import { filterExpenses, formatExpenseAmount, groupExpenseDays } from '../src/features/expenses/expenseLedger.ts'

function expense(id, date, amountValue, title = 'Tomato', category = 'Groceries') {
  return { id, date, amountValue, title, category, meta: `${category} · ${date}`, amount: `EGP ${amountValue}` }
}

test('ledger groups nonadjacent dates, preserves entries and sums decimal amounts precisely', () => {
  const rows = [expense('a', '2026-09-05', 0.1), expense('b', '2026-09-06', 145), expense('c', '2026-09-05', 0.2)]
  const groups = groupExpenseDays(rows)
  assert.deepEqual(groups.map(g => [g.date, g.total]), [['2026-09-06', 145], ['2026-09-05', 0.3]])
  assert.deepEqual(groups[1].expenses.map(e => e.id), ['a', 'c'])
  assert.equal(groupExpenseDays(rows, true)[0].date, '2026-09-05')
  assert.deepEqual(rows.map(e => e.id), ['a', 'b', 'c'])
})

test('category, search and month boundaries compose before totals are calculated', () => {
  const rows = [expense('a', '2026-09-01', 45), expense('b', '2026-09-30', 60, 'Taxi', 'Transport'), expense('c', '2026-10-01', 80), expense('d', '2026-08-31', 10)]
  const result = filterExpenses(rows, ' TOMATO ', 'Groceries', { start: '2026-09-01', end: '2026-10-01' })
  assert.deepEqual(result.map(e => e.id), ['a'])
  assert.equal(groupExpenseDays(result)[0].total, 45)
  assert.equal(filterExpenses(rows, 'not found', '').length, 0)
  assert.equal(filterExpenses(rows, '', '').length, 4)
})

test('formatted currency and Arabic descriptions remain searchable', () => {
  const row = expense('a', '2026-09-06', 1234.5, 'ملوخيه')
  assert.equal(formatExpenseAmount(row.amountValue), 'EGP 1,234.50')
  assert.equal(filterExpenses([row], '1,234.50', '').length, 1)
  assert.equal(filterExpenses([row], 'ملوخيه', '').length, 1)
  assert.deepEqual(groupExpenseDays([]), [])
})
