import test from 'node:test'
import assert from 'node:assert/strict'
import { PRODUCT_VISUAL_CATALOG } from '../src/core/presentation/productVisualCatalog.ts'
import { normalizeProductName, resolveProductVisual } from '../src/core/presentation/productVisuals.ts'

test('every catalog alias resolves to its intended entry, with no conflicting IDs', () => {
  assert.equal(new Set(PRODUCT_VISUAL_CATALOG.map(rule => rule.id)).size, PRODUCT_VISUAL_CATALOG.length)
  for (const rule of PRODUCT_VISUAL_CATALOG) {
    assert.ok(rule.aliases.length > 0)
    for (const alias of rule.aliases) {
      assert.ok(normalizeProductName(alias).length > 0)
      assert.equal(resolveProductVisual(alias).ruleId, rule.id, `${rule.id}: ${alias}`)
    }
  }
})

test('product form wins over scent or ingredient and specific phrases beat general words', () => {
  const examples = [
    ['Coconut shampoo 400ml','shampoo'], ['شامبو جوز الهند','shampoo'],
    ['Olive oil soap','soap'], ['Strawberry yogurt 120g','yogurt'],
    ['Milk chocolate with almonds','chocolate'], ['Carrot cake','cake'],
    ['Tomato ketchup 500g','ketchup'], ['Green beans 1 kg','green-beans'],
    ['Engine oil 5L','engine-oil'], ['Olive oil 1L','olive-oil'],
    ['Printer toner black','printer-ink'], ['Air conditioner filter','air-conditioner'],
    ['Maggi خلطه كفته','spices'], ['Dolphin tuna crushed 200gm','tuna'],
    ['Lavazza Crema E Gusto | 250 gr','coffee'], ['جيفركس ملوخيه','molokhia'],
    ['Farm thin fries','fries'], ['Barquq','plum'], ['Biking powder tag el molouk','baking-powder'],
    ['Afia oil 2.2L','cooking-oil'], ['Dr argan hair mask','hair-mask'],
  ]
  for (const [name, expected] of examples) assert.equal(resolveProductVisual(name).ruleId, expected, name)
})

test('token boundaries prevent unrelated substring matches', () => {
  for (const name of ['grapefruit','boiler','chocolatey','research','chairman','teapot']) {
    assert.equal(resolveProductVisual(name).ruleId, null, name)
  }
  assert.equal(resolveProductVisual('Aluminium foil 30m').ruleId, 'foil')
})

test('Arabic spelling, definite articles, diacritics and punctuation are normalized', () => {
  assert.equal(resolveProductVisual('الطَّمَاطِم').ruleId, 'tomato')
  assert.equal(resolveProductVisual('مُلُوخِيَّة').ruleId, 'molokhia')
  assert.equal(resolveProductVisual('  ICE-CREAM  ').ruleId, 'ice-cream')
  assert.equal(resolveProductVisual('والشامبو').ruleId, 'shampoo')
})

test('unknown descriptions fall back to the real category without inventing a product match', () => {
  assert.deepEqual(resolveProductVisual('XYZ 123','Cleaning Supplies'), {emoji:'🧽',tone:'green',ruleId:null})
  assert.equal(resolveProductVisual('XYZ 123','Uber').emoji, '🚗')
  assert.equal(resolveProductVisual('XYZ 123','Personal Care').emoji, '🧴')
  assert.deepEqual(resolveProductVisual('',''), {emoji:'🧾',tone:'violet',ruleId:null})
})
