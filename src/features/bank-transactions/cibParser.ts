/**
 * Deterministic CIB Bank SMS Parser.
 *
 * Extracts critical transaction fields without an LLM.
 * Distinguishes debit purchase transactions from non-debit alerts (OTP, declined, balance, refunds).
 */

export type TransactionType = 'purchase' | 'pos' | 'online' | 'debit'

export type ParsedBankTransaction =
  | {
      kind: 'debit'
      bank: 'CIB'
      amount: number
      currency: string
      merchantRaw?: string
      cardLast4?: string
      transactionAt?: string
      transactionType: TransactionType
    }
  | {
      kind: 'ignored'
      reason:
        | 'otp'
        | 'declined'
        | 'refund_or_reversal'
        | 'balance_notification'
        | 'statement_notification'
        | 'atm_withdrawal'
        | 'security_alert'
        | string
    }
  | {
      kind: 'unsupported'
      reason: string
    }

export type CibParseResult = ParsedBankTransaction

/**
 * Normalizes raw currency token to standard ISO 4217 code.
 */
function normalizeCurrency(rawCurrency: string): string {
  const token = rawCurrency.trim().toUpperCase().replace(/\./g, '')
  if (token === 'EGP' || token === 'LE' || token === 'جم' || token === 'ج م') {
    return 'EGP'
  }
  if (token === 'USD' || token === '$') {
    return 'USD'
  }
  if (token === 'EUR' || token === '€') {
    return 'EUR'
  }
  if (token === 'GBP' || token === '£') {
    return 'GBP'
  }
  return token
}

/**
 * Safely parses numeric string, stripping thousands separators.
 */
function parseNumericAmount(rawAmount: string): number {
  const sanitized = rawAmount.replace(/,/g, '').trim()
  const val = parseFloat(sanitized)
  return isNaN(val) ? 0 : Math.round(val * 100) / 100
}

/**
 * Parses DD/MM/YYYY or YYYY-MM-DD date and optional time into ISO string.
 */
function parseDateTimeString(rawDate: string): string | undefined {
  const trimmed = rawDate.trim()
  
  // Format DD/MM/YYYY HH:mm[:ss]
  const ddmmyyyyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/)
  if (ddmmyyyyMatch) {
    const [, day, month, year, hours = '00', mins = '00', secs = '00'] = ddmmyyyyMatch
    return `${year}-${month}-${day}T${hours}:${mins}:${secs}.000Z`
  }

  // Format YYYY-MM-DD HH:mm[:ss]
  const yyyymmddMatch = trimmed.match(/^(\d{4})[-/](\d{2})[-/](\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/)
  if (yyyymmddMatch) {
    const [, year, month, day, hours = '00', mins = '00', secs = '00'] = yyyymmddMatch
    return `${year}-${month}-${day}T${hours}:${mins}:${secs}.000Z`
  }

  return undefined
}

/**
 * Cleans extracted merchant string from bank SMS artifacts.
 */
function cleanMerchantName(rawMerchant: string): string {
  let cleaned = rawMerchant.trim()
  // Strip trailing "Available balance", "Available limit", punctuation
  cleaned = cleaned.replace(/\s*\.?\s*(?:Available|Current|Your balance|Limit).*/i, '')
  // Strip trailing periods or commas
  cleaned = cleaned.replace(/[.,;]+$/, '').trim()
  return cleaned
}

/**
 * Parses a raw SMS text from CIB Egypt into structured transaction fields or ignored/unsupported classification.
 */
export function parseCibMessage(message: string): ParsedBankTransaction {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return { kind: 'unsupported', reason: 'Empty message' }
  }

  const text = message.trim()

  // 1. Identify non-debit / excluded messages first

  // OTP / Verification
  if (/(\bOTP\b|verification code|one.time.password|رمز التحقق|رمز التأكيد)/i.test(text)) {
    return { kind: 'ignored', reason: 'otp' }
  }

  // Declined / Failed transactions
  if (/(declined|failed|insufficient funds|unsuccessful|not successful|تم رفض|فشلت العملية|رصيد غير كاف)/i.test(text)) {
    return { kind: 'ignored', reason: 'declined' }
  }

  // Reversal / Refund (do not treat as normal expense)
  if (/(refund|reversed|reversal|refunded|استرداد|رد المبلغ)/i.test(text)) {
    return { kind: 'ignored', reason: 'refund_or_reversal' }
  }

  // ATM cash withdrawal
  if (/(ATM withdrawal|cash withdrawal|سحب نقدي من ماكينة|سحب نقدية)/i.test(text)) {
    return { kind: 'ignored', reason: 'atm_withdrawal' }
  }

  // Statement notifications
  if (/(statement is ready|monthly statement|كشف الحساب الشهري)/i.test(text)) {
    return { kind: 'ignored', reason: 'statement_notification' }
  }

  // Balance-only notification without purchase
  if (/(your balance is|available balance is|current balance is) (?:\w+ )?[\d,.]+(?: [A-Z]{3})?$/i.test(text) && !/(purchase|used for|spent|اشترى|شراء)/i.test(text)) {
    return { kind: 'ignored', reason: 'balance_notification' }
  }

  // 2. Identify CIB debit patterns

  // Pattern A (English standard):
  // "Your card ending with 1234 has been used for a purchase of EGP 450.00 at CARREFOUR on 03/09/2026 14:32."
  // or "...was used for purchase of USD 25.00 at APPLE.COM/BILL..."
  const patternA = new RegExp(
    '(?:your (?:credit |debit )?card ending (?:with )?(\\d{4}) (?:has been|was) used for (?:a )?purchase of ([A-Z]{3}|[A-Z]{1,3}\\.?|جم) ?([\\d,]+(?:\\.\\d{2})?) at (.+?)(?: on (\\d{2}[-/]\\d{2}[-/]\\d{4}(?:\\s+\\d{2}:\\d{2}(?::\\d{2})?)?))?(?:\\.|$))',
    'i',
  )
  const matchA = text.match(patternA)
  if (matchA) {
    const [, cardLast4, curr, amtStr, merchRaw, dateRaw] = matchA
    return {
      kind: 'debit',
      bank: 'CIB',
      amount: parseNumericAmount(amtStr),
      currency: normalizeCurrency(curr),
      cardLast4,
      merchantRaw: cleanMerchantName(merchRaw),
      transactionAt: dateRaw ? parseDateTimeString(dateRaw) : undefined,
      transactionType: 'purchase',
    }
  }

  // Pattern B (English "Dear customer..."):
  // "Dear Customer, a purchase of EGP 1,250.00 was made with card ending 6511 at GOURMET MARKET on 03/09/2026 20:42."
  const patternB = new RegExp(
    'purchase of ([A-Z]{3}|[A-Z]{1,3}\\.?|جم) ?([\\d,]+(?:\\.\\d{2})?) was made with card ending (\\d{4}) at (.+?)(?: on (\\d{2}[-/]\\d{2}[-/]\\d{4}(?:\\s+\\d{2}:\\d{2}(?::\\d{2})?)?))?(?:\\.|$)',
    'i',
  )
  const matchB = text.match(patternB)
  if (matchB) {
    const [, curr, amtStr, cardLast4, merchRaw, dateRaw] = matchB
    return {
      kind: 'debit',
      bank: 'CIB',
      amount: parseNumericAmount(amtStr),
      currency: normalizeCurrency(curr),
      cardLast4,
      merchantRaw: cleanMerchantName(merchRaw),
      transactionAt: dateRaw ? parseDateTimeString(dateRaw) : undefined,
      transactionType: 'purchase',
    }
  }

  // Pattern C (English Online/POS short format):
  // "Purchase with card ending 1234 for EGP 450.00 at CARREFOUR on 03/09/2026 14:32"
  const patternC = new RegExp(
    'purchase (?:with card )?(?:ending )?(\\d{4})? ?(?:for|of) ([A-Z]{3}|[A-Z]{1,3}\\.?|جم) ?([\\d,]+(?:\\.\\d{2})?) at (.+?)(?: on (\\d{2}[-/]\\d{2}[-/]\\d{4}(?:\\s+\\d{2}:\\d{2}(?::\\d{2})?)?))?(?:\\.|$)',
    'i',
  )
  const matchC = text.match(patternC)
  if (matchC) {
    const [, cardLast4, curr, amtStr, merchRaw, dateRaw] = matchC
    return {
      kind: 'debit',
      bank: 'CIB',
      amount: parseNumericAmount(amtStr),
      currency: normalizeCurrency(curr),
      cardLast4: cardLast4 || undefined,
      merchantRaw: cleanMerchantName(merchRaw),
      transactionAt: dateRaw ? parseDateTimeString(dateRaw) : undefined,
      transactionType: 'purchase',
    }
  }

  // Pattern D (Online purchase notification):
  // "Online purchase of EGP 350.00 with card ending 4321 at AMAZON on 02/09/2026"
  const patternD = new RegExp(
    'online purchase of ([A-Z]{3}|[A-Z]{1,3}\\.?|جم) ?([\\d,]+(?:\\.\\d{2})?) with card ending (\\d{4}) at (.+?)(?: on (\\d{2}[-/]\\d{2}[-/]\\d{4}(?:\\s+\\d{2}:\\d{2}(?::\\d{2})?)?))?(?:\\.|$)',
    'i',
  )
  const matchD = text.match(patternD)
  if (matchD) {
    const [, curr, amtStr, cardLast4, merchRaw, dateRaw] = matchD
    return {
      kind: 'debit',
      bank: 'CIB',
      amount: parseNumericAmount(amtStr),
      currency: normalizeCurrency(curr),
      cardLast4,
      merchantRaw: cleanMerchantName(merchRaw),
      transactionAt: dateRaw ? parseDateTimeString(dateRaw) : undefined,
      transactionType: 'online',
    }
  }

  // Pattern E (Arabic CIB debit):
  // Format: Card ending in 1234 used for purchase of 450.00 EGP at CARREFOUR on 03/09/2026 14:32
  const patternE = new RegExp(
    'تم استخدام بطاقتك المنتهية برقم (\\d{4}) في عملية شراء بمبلغ ([\\d,]+(?:\\.\\d{2})?) ?([A-Z]{3}|جم|ج م) لدى (.+?)(?: في (\\d{2}[-/]\\d{2}[-/]\\d{4}(?:\\s+\\d{2}:\\d{2})?))?(?:\\.|$)',
    'i',
  )
  const matchE = text.match(patternE)
  if (matchE) {
    const [, cardLast4, amtStr, curr, merchRaw, dateRaw] = matchE
    return {
      kind: 'debit',
      bank: 'CIB',
      amount: parseNumericAmount(amtStr),
      currency: normalizeCurrency(curr),
      cardLast4,
      merchantRaw: cleanMerchantName(merchRaw),
      transactionAt: dateRaw ? parseDateTimeString(dateRaw) : undefined,
      transactionType: 'purchase',
    }
  }

  return {
    kind: 'unsupported',
    reason: 'Message does not match supported CIB debit purchase patterns',
  }
}

/** Named export for parseCibSms */
export const parseCibSms = parseCibMessage

/**
 * Generates a stable deterministic fingerprint string for deduplication.
 * Uses normalized bank and message contents.
 */
export function generateMessageFingerprint(bank: string, rawMessage: string): string {
  const normalized = `${bank.toLowerCase()}:${rawMessage.trim().toLowerCase().replace(/\s+/g, ' ')}`
  
  // Simple deterministic 64-character hex hash from string (FNV-1a / DJB2 combination or SHA representation)
  // For portable execution in both browser and worker without requiring async crypto everywhere:
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)

  const part1 = (h1 >>> 0).toString(16).padStart(8, '0')
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0')
  
  // Compute second 16-char segment with inverted seed for 32-char hex fingerprint
  let h3 = 0x811c9dc5
  let h4 = 0x9e3779b9
  for (let i = normalized.length - 1; i >= 0; i--) {
    const ch = normalized.charCodeAt(i)
    h3 = Math.imul(h3 ^ ch, 16777619)
    h4 = Math.imul(h4 ^ ch, 2166136261)
  }
  const part3 = (h3 >>> 0).toString(16).padStart(8, '0')
  const part4 = (h4 >>> 0).toString(16).padStart(8, '0')

  return `${part1}${part2}${part3}${part4}`
}
