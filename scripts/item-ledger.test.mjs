import test from 'node:test'
import assert from 'node:assert/strict'
import { groupItemDays, isLongItem } from '../src/features/items/itemLedger.ts'

const items = [
  {id:'a',title:'A',meta:'',startedDate:'2026-09-01',purchaseDate:'2026-08-20',finishedDate:'2026-09-02',days:45},
  {id:'b',title:'B',meta:'',startedDate:'2026-08-27',purchaseDate:'2026-09-01',finishedDate:'2026-09-04',days:11},
  {id:'c',title:'C',meta:'',startedDate:'2026-09-01',quantity:3,days:1},
  {id:'unknown',title:'Unknown',meta:''},
]
test('groups by the relevant lifecycle date and preserves the established view ordering', () => {
  assert.deepEqual(groupItemDays(items,'active').map(g=>g.date), ['2026-08-27','2026-09-01',''])
  assert.deepEqual(groupItemDays(items,'stocked').map(g=>g.date), ['2026-09-01','2026-08-20',''])
  assert.deepEqual(groupItemDays(items,'finished').map(g=>g.date), ['2026-09-04','2026-09-02',''])
  assert.deepEqual(groupItemDays(items,'active')[1].items.map(i=>i.id), ['a','c'])
  assert.equal(groupItemDays(items,'active')[1].items[1].quantity,3)
})
test('explicit ordering keeps unknown dates last and does not mutate query data', () => {
  assert.equal(groupItemDays(items,'active','newest')[0].date,'2026-09-01')
  assert.equal(groupItemDays(items,'stocked','oldest')[0].date,'2026-08-20')
  assert.deepEqual(items.map(i=>i.id), ['a','b','c','unknown'])
  assert.deepEqual(groupItemDays([],'active'), [])
})
test('duration filters preserve 45-day active and 30-day stocked boundaries', () => {
  assert.equal(isLongItem({days:44},'active'),false)
  assert.equal(isLongItem({days:45},'active'),true)
  assert.equal(isLongItem({days:29},'stocked'),false)
  assert.equal(isLongItem({days:30},'stocked'),true)
  assert.equal(isLongItem({days:100},'finished'),false)
  assert.equal(isLongItem({},'stocked'),false)
})
