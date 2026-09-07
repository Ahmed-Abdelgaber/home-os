export type UsageMode = 'duration' | 'one_time'

export const USAGE_MODES: [UsageMode, ...UsageMode[]] = ['duration', 'one_time']

export const USAGE_MODE_LABELS: Record<UsageMode, string> = {
  duration: 'Track duration',
  one_time: 'Single use',
}

export const USAGE_MODE_DESCRIPTIONS: Record<UsageMode, string> = {
  duration: 'Start it, finish it later, and track how long it lasts.',
  one_time: 'Use it once without tracking a duration.',
}
