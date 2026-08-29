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

/** "25 Aug" style, for trip dates. */
export function formatShortDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: CAIRO_TZ }).format(
    new Date(`${dateStr}T00:00:00Z`),
  )
}

/** "Today • 7:45 PM" / "Yesterday • 9:30 PM" / "25 Aug • 9:30 PM", for activity timestamps. */
export function formatActivityTimestamp(iso: string): string {
  const date = new Date(iso)
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: CAIRO_TZ }).format(date)
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: CAIRO_TZ }).format(
    date,
  )

  if (dateStr === cairoToday()) return `Today • ${time}`
  if (dateStr === cairoDateMinusDays(1)) return `Yesterday • ${time}`
  return `${formatShortDate(dateStr)} • ${time}`
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
