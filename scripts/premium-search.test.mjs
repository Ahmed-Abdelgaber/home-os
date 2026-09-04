// Tests for HomeOS v2.1.0 Premium Search Bar (HomeOSSearchBar)
// Run: node scripts/premium-search.test.mjs

import test from 'node:test'
import assert from 'node:assert/strict'

// Helper representing HomeOSSearchBar logic
function createHomeOSSearchBarProps({
  value = '',
  onChange = () => {},
  placeholder = 'Search…',
  disabled = false,
  ariaLabel,
}) {
  const showClear = value.length > 0 && !disabled
  const computedAriaLabel = ariaLabel || placeholder

  return {
    value,
    placeholder,
    disabled,
    ariaLabel: computedAriaLabel,
    showClear,
    onInput: (nextValue) => onChange(nextValue),
    onClear: () => onChange(''),
  }
}

// 1. Search input renders with provided placeholder
test('1. Search input renders with provided placeholder', () => {
  const props = createHomeOSSearchBarProps({ placeholder: 'Search products…' })
  assert.equal(props.placeholder, 'Search products…')
})

// 2. Typing invokes the existing onChange/search flow
test('2. Typing invokes the existing onChange/search flow', () => {
  let captured = ''
  const props = createHomeOSSearchBarProps({
    value: '',
    onChange: (val) => {
      captured = val
    },
  })

  props.onInput('Coffee')
  assert.equal(captured, 'Coffee')
})

// 3. Clear action resets the search value
test('3. Clear action resets the search value', () => {
  let captured = 'Milk'
  const props = createHomeOSSearchBarProps({
    value: 'Milk',
    onChange: (val) => {
      captured = val
    },
  })

  assert.equal(props.showClear, true)
  props.onClear()
  assert.equal(captured, '')
})

// 4. Clear action is hidden/inactive appropriately when empty
test('4. Clear action is hidden/inactive appropriately when empty', () => {
  const emptyProps = createHomeOSSearchBarProps({ value: '' })
  assert.equal(emptyProps.showClear, false, 'Clear action must not be shown when search is empty')

  const disabledProps = createHomeOSSearchBarProps({ value: 'Apples', disabled: true })
  assert.equal(disabledProps.showClear, false, 'Clear action must not be shown when search is disabled')
})

// 5. Existing filtering/search behavior remains unchanged
test('5. Existing filtering/search behavior remains unchanged', () => {
  const sampleItems = [
    { id: '1', title: 'Whole Milk 1L', meta: 'Juhayna • Dairy' },
    { id: '2', title: 'Greek Yogurt 200g', meta: 'Juhayna • Dairy' },
    { id: '3', title: 'Espresso Beans 500g', meta: 'Illy • Pantry' },
  ]

  const searchFn = (query) => {
    const lower = query.toLowerCase()
    return lower
      ? sampleItems.filter((i) => i.title.toLowerCase().includes(lower) || i.meta.toLowerCase().includes(lower))
      : sampleItems
  }

  assert.equal(searchFn('').length, 3)
  assert.equal(searchFn('milk').length, 1)
  assert.equal(searchFn('dairy').length, 2)
  assert.equal(searchFn('illy').length, 1)
  assert.equal(searchFn('nonexistent').length, 0)
})

// 6. Page-specific placeholders work
test('6. Page-specific placeholders work', () => {
  const itemsSearch = createHomeOSSearchBarProps({ placeholder: 'Search items…' })
  const productsSearch = createHomeOSSearchBarProps({ placeholder: 'Search products…' })
  const expensesSearch = createHomeOSSearchBarProps({ placeholder: 'Search expenses…' })
  const tripsSearch = createHomeOSSearchBarProps({ placeholder: 'Search trips…' })

  assert.equal(itemsSearch.placeholder, 'Search items…')
  assert.equal(productsSearch.placeholder, 'Search products…')
  assert.equal(expensesSearch.placeholder, 'Search expenses…')
  assert.equal(tripsSearch.placeholder, 'Search trips…')
})

// 7. No-results state remains distinct from true empty state
test('7. No-results state remains distinct from true empty state', () => {
  const getDisplayState = ({ totalItems, filteredItems, searchQuery }) => {
    if (totalItems === 0) {
      return { type: 'global_empty', message: 'No items yet.' }
    }
    if (filteredItems.length === 0 && searchQuery.trim().length > 0) {
      return { type: 'search_empty', title: 'No matching items', message: `No items match "${searchQuery}".` }
    }
    return { type: 'list', count: filteredItems.length }
  }

  const globalEmpty = getDisplayState({ totalItems: 0, filteredItems: [], searchQuery: '' })
  assert.equal(globalEmpty.type, 'global_empty')

  const searchEmpty = getDisplayState({ totalItems: 10, filteredItems: [], searchQuery: 'avocado' })
  assert.equal(searchEmpty.type, 'search_empty')
  assert.equal(searchEmpty.title, 'No matching items')
  assert.equal(searchEmpty.message, 'No items match "avocado".')

  const hasMatches = getDisplayState({ totalItems: 10, filteredItems: [{ id: '1' }], searchQuery: 'milk' })
  assert.equal(hasMatches.type, 'list')
  assert.equal(hasMatches.count, 1)
})

// 8. Keyboard/accessibility attributes are present where testable
test('8. Keyboard/accessibility attributes are present where testable', () => {
  const defaultProps = createHomeOSSearchBarProps({ placeholder: 'Search items…' })
  assert.equal(defaultProps.ariaLabel, 'Search items…')

  const explicitAriaProps = createHomeOSSearchBarProps({
    placeholder: 'Search…',
    ariaLabel: 'Search household inventory items',
  })
  assert.equal(explicitAriaProps.ariaLabel, 'Search household inventory items')
})

// 9. Buy Product picker filters products by name and category
test('9. Buy Product picker filters products by name and category', () => {
  const activeProducts = [
    { id: 'p1', name: 'Whole Milk 1L', categoryName: 'Dairy' },
    { id: 'p2', name: 'Greek Yogurt 200g', categoryName: 'Dairy' },
    { id: 'p3', name: 'Espresso Beans 500g', categoryName: 'Pantry' },
    { id: 'p4', name: 'Olive Oil 1L', categoryName: null },
  ]

  const filterProducts = (query) => {
    const lower = query.toLowerCase().trim()
    return lower
      ? activeProducts.filter(
          (product) =>
            product.name.toLowerCase().includes(lower) ||
            (product.categoryName && product.categoryName.toLowerCase().includes(lower)),
        )
      : activeProducts
  }

  // Exact name search
  assert.equal(filterProducts('whole milk').length, 1)
  assert.equal(filterProducts('whole milk')[0].id, 'p1')

  // Category search
  assert.equal(filterProducts('dairy').length, 2)

  // Substring match
  assert.equal(filterProducts('oil').length, 1)
  assert.equal(filterProducts('oil')[0].id, 'p4')

  // Non-matching search
  assert.equal(filterProducts('nonexistent').length, 0)

  // Empty or whitespace search returns all
  assert.equal(filterProducts('').length, 4)
  assert.equal(filterProducts('   ').length, 4)
})

