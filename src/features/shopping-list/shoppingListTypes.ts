import type { UsageMode } from '../products/usageMode'

export type ShoppingListSource = 'automatic' | 'manual'

export interface ShoppingListItem {
  id: string
  productId: string
  productName: string
  categoryName: string | null
  source: ShoppingListSource
  createdAt: string
  isActive: boolean
  usageMode?: UsageMode
}
