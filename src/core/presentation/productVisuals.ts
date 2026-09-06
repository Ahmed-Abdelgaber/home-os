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
  [/grocer|food|supermarket|بقالة|بقال|طعام|اغذية|اغذيه|سوبرماركت/, '🛒', 'violet'],
  [/dairy|cheese|milk|butter|yogurt|البان|ألبان|جبن|جبنة|لبن|زبادي|زبادى|قشطة/, '🥛', 'blue'],
  [/meat|poultry|chicken|beef|butcher|لحوم|لحم|فراخ|دواجن|جزارة/, '🥩', 'rose'],
  [/bakery|bread|pastry|مخبوزات|مخبوز|عيش|خبز|فطائر/, '🍞', 'amber'],
  [/fruit|vegetable|produce|خضار|فاكهة|خضروات|فواكه/, '🍎', 'green'],
  [/beverage|drink|juice|water|soda|coffee|tea|مشروبات|عصائر|عصير|مياه|قهوة|شاي/, '🧃', 'blue'],
  [/snack|candy|sweet|chocolate|chips|سناكس|حلويات|مسليات|شيبسي|شوكولاتة/, '🍫', 'amber'],
  [/dining|restaurant|outings|cafe|كافيه|مطعم|خروج|اكل جاهز/, '🍽️', 'amber'],
  [/transport|fuel|uber|car|gas|مواصلات|بنزين|سيارة|مواصل/, '🚗', 'blue'],
  [/cleaning|detergent|laundry|dish|منظفات|تنظيف|غسيل|صابون/, '🧽', 'green'],
  [/personal care|beauty|hygiene|hair|skin|عناية|تجميل|نظافة شخصية|شعر|بشرة/, '🧴', 'rose'],
  [/personal shopping|clothing|fashion|clothes|ملابس|تسوق|ازياء/, '🛍️', 'violet'],
  [/health|medical|pharmacy|medicine|صيدلية|صحة|علاج|دواء|ادوية/, '💊', 'rose'],
  [/utilit|bill|electricity|water bill|gas bill|فواتير|كهرباء|مياه|غاز|نت/, '💡', 'amber'],
  [/charity|donation|تبرع|صدقة|خيرية/, '🤲', 'green'],
  [/family|kids|children|عيلة|عائلة|اسرة|اطفال/, '👨‍👩‍👧', 'green'],
  [/subscription|اشتراك|خدمات/, '🔄', 'blue'],
  [/education|school|college|books|تعليم|مدرسة|دراسة|كتب/, '🎓', 'blue'],
  [/pet|vet|حيوان|بيطري/, '🐾', 'amber'],
  [/baby|diaper|طفل|بامبرز/, '👶', 'blue'],
  [/electronic|gadget|appliances|الكترونيات|اجهزة/, '🔌', 'blue'],
  [/travel|flight|hotel|سفر|طيران|فندق/, '🧳', 'blue'],
  [/entertainment|cinema|games|ترفيه|سينما|العاب/, '🎬', 'violet'],
  [/home|house|household|decor|kitchen|منزل|بيت|مطبخ|ادوات منزلية/, '🏠', 'amber'],
]

export function resolveProductVisual(title: string, category = ''): ProductVisual {
  const cleanTitle = (title || '').trim()
  if (cleanTitle.length > 0) {
    const words = normalizeProductName(cleanTitle).split(' ')
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
  }

  // Fallback to category visual if title didn't yield a specific match
  const cleanCategory = (category || '').trim()
  if (cleanCategory.length > 0) {
    // Check if category itself matches any catalog rule directly
    const catWords = normalizeProductName(cleanCategory).split(' ')
    for (let position = 0; position < catWords.length; position++) {
      for (const candidate of aliasIndex.get(catWords[position]) ?? []) {
        if (!candidate.words.every((word, index) => word === catWords[position + index])) continue
        return { emoji: candidate.rule.emoji, tone: candidate.rule.tone, ruleId: candidate.rule.id }
      }
    }

    const fallback = categoryVisuals.find(([pattern]) => pattern.test(normalizeProductName(cleanCategory)))
    if (fallback) {
      return { emoji: fallback[1], tone: fallback[2], ruleId: `cat-${fallback[1]}` }
    }
  }

  return { emoji: '📦', tone: 'violet', ruleId: null }
}
