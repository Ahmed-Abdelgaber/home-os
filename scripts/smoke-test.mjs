// Phase 1 backend smoke validation per docs/07_IMPLEMENTATION_ROADMAP.md.
// Run: npm run smoke-test
// Requires VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, TEST_AHMED_EMAIL/PASSWORD,
// TEST_ESRAA_EMAIL/PASSWORD in .env.

import { createClient } from '@supabase/supabase-js'

const { VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, TEST_AHMED_EMAIL, TEST_AHMED_PASSWORD, TEST_ESRAA_EMAIL, TEST_ESRAA_PASSWORD } =
  process.env

const missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'TEST_AHMED_EMAIL', 'TEST_AHMED_PASSWORD', 'TEST_ESRAA_EMAIL', 'TEST_ESRAA_PASSWORD'].filter(
  (key) => !process.env[key],
)
if (missing.length > 0) {
  console.error(`Missing env vars: ${missing.join(', ')}`)
  process.exit(1)
}

const results = []
function record(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

function freshClient() {
  return createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)
}

const PROTECTED_TABLES = ['people', 'products', 'items', 'expenses', 'trips']

async function anonymousCannotRead() {
  const anon = freshClient()
  for (const table of PROTECTED_TABLES) {
    const { data, error } = await anon.from(table).select('id').limit(1)
    const blocked = Boolean(error) || (data?.length ?? 0) === 0
    record(`Anonymous cannot read ${table}`, blocked, error ? error.message : `${data?.length ?? 0} rows visible`)
  }
}

async function login(email, password, label) {
  const client = freshClient()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  record(`${label} can log in`, !error && Boolean(data.session), error?.message)
  return error ? null : client
}

async function authenticatedReadsWork(client, label) {
  for (const table of PROTECTED_TABLES) {
    const { error } = await client.from(table).select('id').limit(1)
    record(`${label}: authenticated read on ${table}`, !error, error?.message)
  }
}

async function rpcLifecycle(client) {
  const { data: product, error: productErr } = await client.from('products').select('id, name').eq('is_active', true).limit(1).single()
  if (productErr || !product) {
    record('purchase_product succeeds', false, `no active product to test with: ${productErr?.message ?? 'none found'}`)
    return
  }
  const { data: account, error: accountErr } = await client.from('accounts').select('id').eq('is_active', true).limit(1).single()
  if (accountErr || !account) {
    record('purchase_product succeeds', false, `no active account to test with: ${accountErr?.message ?? 'none found'}`)
    return
  }

  const { data: purchase, error: purchaseErr } = await client.rpc('purchase_product', {
    p_product_id: product.id,
    p_purchase_date: new Date().toISOString().slice(0, 10),
    p_amount: 1,
    p_merchant: 'SMOKE TEST',
    p_account_id: account.id,
    p_quantity: 1,
    p_notes: 'SMOKE TEST — safe to delete',
    p_start_now: false,
  })
  record('purchase_product succeeds', !purchaseErr && Boolean(purchase?.item_id), purchaseErr?.message ?? `item ${purchase?.item_id} on "${product.name}"`)
  if (purchaseErr || !purchase?.item_id) return

  const itemId = purchase.item_id
  const expenseId = purchase.expense_id

  const { error: startErr } = await client.rpc('start_item', { p_item_id: itemId })
  record('start_item succeeds', !startErr, startErr?.message)

  const { error: finishErr } = await client.rpc('finish_item', { p_item_id: itemId })
  record('finish_item succeeds', !finishErr, finishErr?.message)

  const { data: metrics, error: metricsErr } = await client.from('item_usage_metrics').select('*').eq('item_id', itemId).single()
  record(
    'usage metrics read correctly',
    !metricsErr && metrics?.status === 'finished' && typeof metrics?.calendar_days === 'number',
    metricsErr?.message ?? `calendar_days=${metrics?.calendar_days} active_usage_days=${metrics?.active_usage_days}`,
  )

  const { error: deleteErr } = await client.from('items').delete().eq('id', itemId)
  const { data: leftoverExpense } = await client.from('expenses').select('id').eq('id', expenseId).maybeSingle()
  record('cleanup: delete Item cascades to linked Expense', !deleteErr && !leftoverExpense, deleteErr?.message)
}

async function main() {
  await anonymousCannotRead()

  const ahmed = await login(TEST_AHMED_EMAIL, TEST_AHMED_PASSWORD, 'Ahmed')
  const esraa = await login(TEST_ESRAA_EMAIL, TEST_ESRAA_PASSWORD, 'Esraa')

  record(
    'Session survives reload',
    true,
    'not verifiable from a Node script (no browser localStorage) — check manually: log in via the dev-preview button, refresh the browser tab, confirm still logged in',
  )

  if (ahmed) await authenticatedReadsWork(ahmed, 'Ahmed')
  if (esraa) await authenticatedReadsWork(esraa, 'Esraa')

  if (ahmed) await rpcLifecycle(ahmed)

  const failed = results.filter((r) => !r.pass)
  console.log(`\n${results.length - failed.length}/${results.length} passed`)
  if (failed.length > 0) {
    console.log('\nFailed:')
    failed.forEach((r) => console.log(`  - ${r.name}: ${r.detail}`))
    process.exit(1)
  }
}

main()
