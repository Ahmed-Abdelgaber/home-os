import { PRODUCT_VISUAL_CATALOG } from './productVisualCatalog.ts'
import type { ProductVisualRule, VisualTone } from './productVisualCatalog.ts'

export interface ProductVisual {
  emoji: string
  tone: VisualTone
  ruleId: string | null
}

/** Normalize spelling, not meaning; keep token boundaries to avoid oil matching foil. */
export function normalizeProductName(value: string): string {
  return value.normalize('NFKD').toLowerCase()
    .replace(/\p{M}|ـ/gu, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/)
    .map((word) => word.startsWith('وال') && word.length > 5 ? word.slice(3)
      : word.startsWith('ال') && word.length > 4 ? word.slice(2) : word)
    .join(' ')
}

interface IndexedAlias { rule: ProductVisualRule; words: string[]; length: number }
// Index by first word once, rather than compiling or scanning every alias for each rendered row.
const aliasIndex = new Map<string, IndexedAlias[]>()
for (const rule of PRODUCT_VISUAL_CATALOG) {
  const uniqueAliases = new Set(rule.aliases.map(normalizeProductName))
  for (const alias of uniqueAliases) {
    const words = alias.split(' ')
    const entries = aliasIndex.get(words[0]) ?? []
    entries.push({ rule, words, length: alias.length })
    aliasIndex.set(words[0], entries)
  }
}

const categoryVisuals: [RegExp, string, VisualTone][] = [
  [/grocer|food|بقال|طعام/, '🛒', 'violet'],
  [/dining|restaurant|outings|مطعم|خروج/, '🍽️', 'amber'],
  [/transport|fuel|uber|مواصل/, '🚗', 'blue'],
  [/cleaning|تنظيف/, '🧽', 'green'],
  [/personal care|beauty|عنايه|تجميل/, '🧴', 'rose'],
  [/personal shopping|clothing|ملابس/, '🛍️', 'violet'],
  [/health|medical|صح|علاج/, '💊', 'rose'],
  [/utilit|bill|فواتير/, '💡', 'amber'],
  [/charity|donation|تبرع|صدقه/, '🤲', 'green'],
  [/family|عيله|عائله|اسره/, '👨‍👩‍👧', 'green'],
  [/subscription|اشتراك/, '🔄', 'blue'],
  [/education|تعليم/, '🎓', 'blue'],
  [/pet|حيوان/, '🐾', 'amber'],
  [/baby|طفل|اطفال/, '👶', 'blue'],
  [/electronic|الكترون/, '🔌', 'blue'],
  [/travel|سفر/, '🧳', 'blue'],
  [/entertainment|ترفيه/, '🎬', 'violet'],
  [/home|house|منزل|بيت/, '🏠', 'amber'],
]

export function resolveProductVisual(title: string, category = ''): ProductVisual {
  const words = normalizeProductName(title).split(' ')
  let best: ProductVisualRule | undefined
  let bestScore = -1
  for (let position = 0; position < words.length; position++) {
    for (const candidate of aliasIndex.get(words[position]) ?? []) {
      if (!candidate.words.every((word, index) => word === words[position + index])) continue
      // Whole-name matches win; otherwise a product form (shampoo) beats its scent (coconut).
      const exact = position === 0 && candidate.words.length === words.length
      const score = (exact ? 1_000_000 : 0) + candidate.rule.priority * 1000 + candidate.words.length * 100 + candidate.length
      if (score > bestScore) { best = candidate.rule; bestScore = score }
    }
  }
  if (best) return { emoji: best.emoji, tone: best.tone, ruleId: best.id }
  const fallback = categoryVisuals.find(([pattern]) => pattern.test(normalizeProductName(category)))
  return { emoji: fallback?.[1] ?? '🧾', tone: fallback?.[2] ?? 'violet', ruleId: null }
}
