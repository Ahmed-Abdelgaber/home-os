import { useQuery } from '@tanstack/react-query'
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
 * Queries active pending bank transactions (status: 'pending' or 'partially_fulfilled').
 * Ordered by received_at desc (newest first).
 */
export function usePendingBankTransactions() {
  return useQuery({
    queryKey: ['bank_transactions', { status: 'pending_or_partially_fulfilled' }],
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

      return (data ?? []).map(mapRowToTransaction)
    },
  })
}

/**
 * Queries bank transactions filtered optionally by status (default: all).
 */
export function useBankTransactions(statusFilter?: BankTransactionStatus) {
  return useQuery({
    queryKey: ['bank_transactions', { status: statusFilter ?? 'all' }],
    queryFn: async (): Promise<BankTransaction[]> => {
      let query = supabase
        .from('bank_transactions')
        .select('*')
        .order('received_at', { ascending: false })

      if (statusFilter) {
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
