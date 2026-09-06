import { formatShortDate } from '../../core/utils/cairoDate'
import { resolveProductVisual } from '../../core/presentation/productVisuals'
import { CompactRow, ListGroup } from '../../shared/components/CompactList'
import { type BankTransactionAllocation } from './useBankTransactions'
import './BankTransactionAllocationsList.css'

interface BankTransactionAllocationsListProps {
  allocations: BankTransactionAllocation[]
  currency: string
}

export function BankTransactionAllocationsList({ allocations, currency }: BankTransactionAllocationsListProps) {
  if (allocations.length === 0) {
    return null
  }

  return (
    <section className="homeos-tx-allocations">
      <ListGroup title="Allocations" count={allocations.length}>
        {allocations.map((alloc) => {
          const exp = alloc.expense
          const isProductPurchase = Boolean(exp?.productName)
          const title = exp?.description || exp?.productName || (isProductPurchase ? 'Purchase' : 'Expense')
          const category = exp?.categoryName || ''
          const visual = resolveProductVisual(exp?.productName || exp?.description || '', category)
          const emoji = visual.ruleId ? visual.emoji : (isProductPurchase && visual.emoji === '🧾' ? '📦' : visual.emoji)

          const metaParts: string[] = []
          if (exp?.categoryName) metaParts.push(exp.categoryName)
          if (exp?.accountName) metaParts.push(exp.accountName)
          const expDate = formatShortDate(exp?.expenseDate)
          if (expDate) metaParts.push(expDate)

          const formattedAmount = `${currency} ${alloc.allocatedAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`

          return (
            <li key={alloc.id}>
              <CompactRow
                title={title}
                meta={metaParts.join(' • ') || 'Linked Expense'}
                glyph={emoji}
                tone={visual.tone}
                accessory={<span className="homeos-alloc-amount">{formattedAmount}</span>}
                to={`/app/expenses/${alloc.expenseId}`}
              />
            </li>
          )
        })}
      </ListGroup>
    </section>
  )
}


