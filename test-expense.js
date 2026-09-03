import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function test() {
  const { data, error } = await supabase
    .from('items')
    .select('id, expense_id')
    .not('expense_id', 'is', null)
    .limit(1)
  
  if (data && data.length > 0) {
    const expenseId = data[0].expense_id
    const { data: expData, error: expError } = await supabase
      .from('expenses')
      .select('id, items(id, status, product_id, product:products(id, name))')
      .eq('id', expenseId)
      .single()
    console.log("Expense fetch result:", JSON.stringify({ data: expData, error: expError }, null, 2))
  } else {
    console.log("No items with expense_id found")
  }
}
test()
