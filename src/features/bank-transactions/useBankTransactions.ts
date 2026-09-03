import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../core/supabase/client'

export type BankTransactionStatus = 'pending' | 'partially_fulfilled' | 'fulfilled' | 'ignored'

export interface BankTransaction {
  id: string
  sourceUserId?: string | null
  bank: string
  amount: number
  currency: string
  merchantRaw: string | null
  transactionAt: string | null
  cardLast4: string | null
  transactionType: string | null
  rawMessage: string
  status: BankTransactionStatus
  messageFingerprint: string
  receivedAt: string
  createdAt: string
  updatedAt: string
  remainingAmount?: number
}

export interface BankTransactionAllocation {
  id: string
  bankTransactionId: string
  expenseId: string
  allocatedAmount: number
  createdAt: string
  expense?: {
    id: string
    description: string
    amount: number
    expenseDate: string
    merchant: string | null
    categoryId?: string
    categoryName?: string
    accountId?: string
    accountName?: string
    personId?: string
    personName?: string
    itemId?: string | null
    productName?: string | null
  }
}

interface BankTransactionRow {
  id: string
  source_user_id?: string | null
  bank: string
  amount: number | string
  currency: string
  merchant_raw: string | null
  transaction_at: string | null
  card_last4: string | null
  transaction_type: string | null
  raw_message: string
  status: BankTransactionStatus
  message_fingerprint: string
  received_at: string
  created_at: string
  updated_at: string
}

function mapRowToTransaction(row: BankTransactionRow): BankTransaction {
  return {
    id: row.id,
    sourceUserId: row.source_user_id ?? null,
    bank: row.bank,
    amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
    currency: row.currency,
    merchantRaw: row.merchant_raw,
    transactionAt: row.transaction_at,
    cardLast4: row.card_last4,
    transactionType: row.transaction_type,
    rawMessage: row.raw_message,
    status: row.status,
    messageFingerprint: row.message_fingerprint,
    receivedAt: row.received_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Calculates total allocated and remaining unallocated amounts.
 */
export function calculateAllocationSummary(
  transactionAmount: number,
  allocations: BankTransactionAllocation[]
) {
  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0)
  const remaining = Math.max(0, transactionAmount - totalAllocated)
  return {
    totalAllocated,
    remaining,
    isFullyAllocated: remaining === 0 && allocations.length > 0,
  }
}

/**
 * Queries actionable bank transactions (partially_fulfilled, then pending, then newest).
 */
export function usePendingBankTransactions() {
  return useQuery({
    queryKey: ['bank_transactions', { status: 'actionable' }],
    queryFn: async (): Promise<BankTransaction[]> => {
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .in('status', ['pending', 'partially_fulfilled'])
        .order('received_at', { ascending: false })

      if (error) {
        if (error.code === '42P01' || error.message.includes('relation "bank_transactions" does not exist')) {
          return []
        }
        throw new Error(error.message)
      }

      const items = (data ?? []).map(mapRowToTransaction)

      // Fetch remaining amount for any partially fulfilled transactions
      const partialItems = items.filter((it) => it.status === 'partially_fulfilled')
      if (partialItems.length > 0) {
        try {
          const { data: allocRows } = await supabase
            .from('bank_transaction_allocations')
            .select('bank_transaction_id, allocated_amount')
            .in('bank_transaction_id', partialItems.map((p) => p.id))

          if (allocRows && allocRows.length > 0) {
            const totalsByTx: Record<string, number> = {}
            for (const row of allocRows as Array<{ bank_transaction_id: string; allocated_amount: number | string }>) {
              const txId = row.bank_transaction_id
              totalsByTx[txId] = (totalsByTx[txId] ?? 0) + Number(row.allocated_amount)
            }
            for (const item of items) {
              if (item.status === 'partially_fulfilled') {
                const totalAlloc = totalsByTx[item.id] ?? 0
                item.remainingAmount = Math.max(0, item.amount - totalAlloc)
              }
            }
          }
        } catch {
          // Gracefully fallback if allocations query fails
        }
      }

      // Priority ordering: partially_fulfilled first, then pending, then newest first
      return items.sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === 'partially_fulfilled') return -1
          if (b.status === 'partially_fulfilled') return 1
        }
        return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      })
    },
  })
}

/**
 * Queries completed bank transactions (fulfilled and ignored).
 */
export function useCompletedBankTransactions() {
  return useQuery({
    queryKey: ['bank_transactions', { status: 'completed' }],
    queryFn: async (): Promise<BankTransaction[]> => {
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .in('status', ['fulfilled', 'ignored'])
        .order('received_at', { ascending: false })

      if (error) {
        if (error.code === '42P01' || error.message.includes('relation "bank_transactions" does not exist')) {
          return []
        }
        throw new Error(error.message)
      }

      return (data ?? []).map(mapRowToTransaction)
    },
  })
}

/**
 * Queries bank transactions filtered optionally by status (default: all).
 */
export function useBankTransactions(statusFilter?: BankTransactionStatus | 'all') {
  return useQuery({
    queryKey: ['bank_transactions', { status: statusFilter ?? 'all' }],
    queryFn: async (): Promise<BankTransaction[]> => {
      let query = supabase
        .from('bank_transactions')
        .select('*')
        .order('received_at', { ascending: false })

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) {
        if (error.code === '42P01' || error.message.includes('relation "bank_transactions" does not exist')) {
          return []
        }
        throw new Error(error.message)
      }

      return (data ?? []).map(mapRowToTransaction)
    },
  })
}

/**
 * Queries a single bank transaction by ID.
 */
export function useBankTransactionDetails(transactionId: string | undefined) {
  return useQuery({
    queryKey: ['bank_transactions', transactionId],
    enabled: Boolean(transactionId),
    queryFn: async (): Promise<BankTransaction> => {
      if (!transactionId) {
        throw new Error('Transaction ID is required')
      }

      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return mapRowToTransaction(data as BankTransactionRow)
    },
  })
}

/**
 * Queries persisted allocations for a given bank transaction.
 * Gracefully returns empty array if the backend table does not exist yet.
 */
export function useBankTransactionAllocations(transactionId: string | undefined) {
  return useQuery({
    queryKey: ['bank_transaction_allocations', transactionId],
    enabled: Boolean(transactionId),
    queryFn: async (): Promise<BankTransactionAllocation[]> => {
      if (!transactionId) return []

      const { data, error } = await supabase
        .from('bank_transaction_allocations')
        .select(`
          id,
          bank_transaction_id,
          expense_id,
          allocated_amount,
          created_at,
          expenses (
            id,
            description,
            amount,
            expense_date,
            merchant,
            category_id,
            account_id,
            person_id,
            categories ( name ),
            accounts ( name ),
            people ( name ),
            items (
              id,
              products ( name )
            )
          )
        `)
        .eq('bank_transaction_id', transactionId)
        .order('created_at', { ascending: true })

      if (error) {
        // If table doesn't exist yet, return empty list gracefully
        if (error.code === '42P01' || error.message.includes('relation "bank_transaction_allocations" does not exist')) {
          return []
        }
        throw new Error(error.message)
      }

      return (data ?? []).map((row: any) => {
        const exp = row.expenses
        const item = exp?.items?.[0]
        return {
          id: row.id,
          bankTransactionId: row.bank_transaction_id,
          expenseId: row.expense_id,
          allocatedAmount:
            typeof row.allocated_amount === 'string'
              ? parseFloat(row.allocated_amount)
              : Number(row.allocated_amount),
          createdAt: row.created_at,
          expense: exp
            ? {
                id: exp.id,
                description: exp.description,
                amount:
                  typeof exp.amount === 'string' ? parseFloat(exp.amount) : Number(exp.amount),
                expenseDate: exp.expense_date,
                merchant: exp.merchant,
                categoryId: exp.category_id,
                categoryName: exp.categories?.name,
                accountId: exp.account_id,
                accountName: exp.accounts?.name,
                personId: exp.person_id,
                personName: exp.people?.name,
                itemId: item?.id ?? null,
                productName: item?.products?.name ?? null,
              }
            : undefined,
        }
      })
    },
  })
}

export interface FulfillBankExpenseInput {
  bankTransactionId: string
  expenseDate: string
  amount: number
  description: string
  merchant: string | null
  categoryId: string
  scope: 'household' | 'personal' | string
  personId: string
  accountId: string
  notes: string | null
}

export interface FulfillBankExpenseResult {
  expense_id: string
  allocation_id: string
  transaction_status: BankTransactionStatus
  remaining_amount: number
}

/**
 * Fulfills a Bank Transaction as a regular Expense atomically via the backend RPC.
 */
export function useFulfillBankTransactionExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: FulfillBankExpenseInput): Promise<FulfillBankExpenseResult> => {
      const { data, error } = await supabase.rpc('fulfill_bank_transaction_expense', {
        p_bank_transaction_id: input.bankTransactionId,
        p_expense_date: input.expenseDate,
        p_amount: input.amount,
        p_description: input.description,
        p_merchant: input.merchant,
        p_category_id: input.categoryId,
        p_scope: input.scope,
        p_person_id: input.personId,
        p_account_id: input.accountId,
        p_notes: input.notes,
      })

      if (error) {
        throw new Error(error.message)
      }

      const row = Array.isArray(data) ? data[0] : data
      return row as FulfillBankExpenseResult
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bank_transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['bank_transaction_allocations'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
      ])
    },
  })
}

export interface FulfillBankPurchaseInput {
  bankTransactionId: string
  productId: string
  purchaseDate: string
  amount: number
  merchant: string | null
  accountId: string
  quantity: number
  notes: string | null
  startNow: boolean
}

export interface FulfillBankPurchaseResult {
  item_id: string
  expense_id: string
  allocation_id: string
  transaction_status: BankTransactionStatus
  remaining_amount: number
}

/**
 * Fulfills a Bank Transaction as a Product Purchase atomically via the backend RPC.
 */
export function useFulfillBankTransactionPurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: FulfillBankPurchaseInput): Promise<FulfillBankPurchaseResult> => {
      const { data, error } = await supabase.rpc('fulfill_bank_transaction_purchase', {
        p_bank_transaction_id: input.bankTransactionId,
        p_product_id: input.productId,
        p_purchase_date: input.purchaseDate,
        p_amount: input.amount,
        p_merchant: input.merchant,
        p_account_id: input.accountId,
        p_quantity: input.quantity,
        p_notes: input.notes,
        p_start_now: input.startNow,
      })

      if (error) {
        throw new Error(error.message)
      }

      const row = Array.isArray(data) ? data[0] : data
      return row as FulfillBankPurchaseResult
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bank_transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['bank_transaction_allocations'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['items'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['shopping-list'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
      ])
    },
  })
}

export interface AllocateBankTransactionInput {
  bankTransactionId: string
  expenseId: string
  allocatedAmount: number
}

export interface AllocateBankTransactionResult {
  allocation_id: string
  transaction_status: BankTransactionStatus
  remaining_amount: number
}

/**
 * Links an already existing Expense to a Bank Transaction via the backend RPC.
 */
export function useAllocateBankTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AllocateBankTransactionInput): Promise<AllocateBankTransactionResult> => {
      const { data, error } = await supabase.rpc('allocate_bank_transaction', {
        p_bank_transaction_id: input.bankTransactionId,
        p_expense_id: input.expenseId,
        p_allocated_amount: input.allocatedAmount,
      })

      if (error) {
        throw new Error(error.message)
      }

      const row = Array.isArray(data) ? data[0] : data
      return row as AllocateBankTransactionResult
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bank_transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['bank_transaction_allocations'] }),
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
      ])
    },
  })
}

/**
 * Marks a Bank Transaction as ignored via the backend RPC.
 */
export function useIgnoreBankTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const { data, error } = await supabase.rpc('ignore_bank_transaction', {
        p_transaction_id: transactionId,
      })

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bank_transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
      ])
    },
  })
}
