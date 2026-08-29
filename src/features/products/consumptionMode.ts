export const CONSUMPTION_MODES = ['pause_when_consumer_away', 'pause_only_when_household_away', 'never_pause'] as const

export type ConsumptionMode = (typeof CONSUMPTION_MODES)[number]

/** Human-readable labels per docs/01 §6 — hide raw enum values from the UI. */
export const CONSUMPTION_MODE_LABELS: Record<ConsumptionMode, string> = {
  pause_when_consumer_away: 'Pause when consumer is away',
  pause_only_when_household_away: 'Pause only when household is away',
  never_pause: 'Never pause',
}
