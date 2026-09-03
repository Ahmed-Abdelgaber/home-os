const CAIRO_TZ = 'Africa/Cairo'

/** Today's date in Africa/Cairo as YYYY-MM-DD, per docs/01 usage-metrics rules. */
export function cairoToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CAIRO_TZ }).format(new Date())
}

/** YYYY-MM-DD, `days` before today in Africa/Cairo. */
export function cairoDateMinusDays(days: number): string {
  const d = new Date(`${cairoToday()}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

/** [start, end) YYYY-MM-DD bounds for the Cairo calendar month `monthOffset` months from now (0 = current). */
export function cairoMonthRange(monthOffset: number): { start: string; end: string } {
  const [year, month] = cairoToday().split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1 + monthOffset, 1))
  const end = new Date(Date.UTC(year, month + monthOffset, 1))
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

/**
 * Converts any timestamp or date string to YYYY-MM-DD in Africa/Cairo timezone.
 * Returns empty string if invalid or falsy.
 */
export function cairoDateOnlyFromTimestamp(iso?: string | null): string {
  if (!iso) return ''
  try {
    const trimmed = typeof iso === 'string' ? iso.trim() : ''
    if (!trimmed) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const d = new Date(trimmed)
    if (isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('en-CA', { timeZone: CAIRO_TZ }).format(d)
  } catch {
    return ''
  }
}

/**
 * "25 Aug" style, for date-only (YYYY-MM-DD) strings.
 * Safely handles null, undefined, empty, or full ISO timestamps as fallback without throwing.
 */
export function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    const trimmed = typeof dateStr === 'string' ? dateStr.trim() : ''
    if (!trimmed) return ''

    let d: Date
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      d = new Date(`${trimmed}T00:00:00Z`)
    } else {
      d = new Date(trimmed)
    }

    if (isNaN(d.getTime())) return ''

    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: CAIRO_TZ,
    }).format(d)
  } catch {
    return ''
  }
}

/**
 * "25 Aug" style, specifically for ISO timestamps (e.g. timestamptz like "2026-03-09T04:00:00+00:00").
 * Formats the date part in Africa/Cairo timezone. Returns empty string if invalid or falsy.
 */
export function formatTimestampDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: CAIRO_TZ,
    }).format(d)
  } catch {
    return ''
  }
}

/**
 * "25 Aug, 6:00 AM" style, for full ISO timestamps (e.g. bank transaction received_at / created_at).
 * Formats date and time in Africa/Cairo timezone. Returns empty string if invalid or falsy.
 */
export function formatTimestampDateTime(iso?: string | null): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const datePart = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: CAIRO_TZ,
    }).format(d)
    const timePart = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: CAIRO_TZ,
    }).format(d)
    return `${datePart}, ${timePart}`
  } catch {
    return ''
  }
}

/** "Today • 7:45 PM" / "Yesterday • 9:30 PM" / "25 Aug • 9:30 PM", for activity timestamps. */
export function formatActivityTimestamp(iso?: string | null): string {
  if (!iso) return ''
  try {
    const date = new Date(iso)
    if (isNaN(date.getTime())) return ''

    const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: CAIRO_TZ }).format(date)
    const time = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: CAIRO_TZ,
    }).format(date)

    if (dateStr === cairoToday()) return `Today • ${time}`
    if (dateStr === cairoDateMinusDays(1)) return `Yesterday • ${time}`
    const shortDate = formatShortDate(dateStr)
    return shortDate ? `${shortDate} • ${time}` : time
  } catch {
    return ''
  }
}

/** Time-of-day greeting per docs/06 §1 — "Greeting varies by time later if desired." */
export function cairoGreeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: CAIRO_TZ }).format(new Date()),
  )
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
