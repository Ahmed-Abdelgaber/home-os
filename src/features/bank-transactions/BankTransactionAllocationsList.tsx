import { cardOutline, listOutline, cubeOutline } from 'ionicons/icons'
import { useNavigate } from 'react-router-dom'
import { formatShortDate } from '../../core/utils/cairoDate'
import { GroupedCard } from '../../shared/components/GroupedCard'
import { Row } from '../../shared/components/Row'
import { SectionHeader } from '../../shared/components/SectionHeader'
import { type BankTransactionAllocation } from './useBankTransactions'
import './BankTransactionAllocationsList.css'

interface BankTransactionAllocationsListProps {
  allocations: BankTransactionAllocation[]
  currency: string
}

export function BankTransactionAllocationsList({ allocations, currency }: BankTransactionAllocationsListProps) {
  const navigate = useNavigate()

  if (allocations.length === 0) {
    return null
  }

  return (
    <section className="homeos-tx-allocations">
      <SectionHeader icon={listOutline} title={`Allocations (${allocations.length})`} />
      <GroupedCard>
        {allocations.map((alloc) => {
          const exp = alloc.expense
          const isProductPurchase = Boolean(exp?.productName)
          const title = exp?.description || (isProductPurchase ? exp?.productName : 'Expense') || 'Allocation'
          
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
            <Row
              key={alloc.id}
              icon={isProductPurchase ? cubeOutline : cardOutline}
              tone={isProductPurchase ? 'primary' : 'neutral'}
              title={title}
              meta={metaParts.join(' • ') || 'Linked Expense'}
              accessory={<span className="homeos-alloc-amount">{formattedAmount}</span>}
              onClick={() => navigate(`/app/expenses/${alloc.expenseId}`)}
            />
          )
        })}
      </GroupedCard>
    </section>
  )
}
