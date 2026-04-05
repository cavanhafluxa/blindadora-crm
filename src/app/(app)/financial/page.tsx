import { createClient } from '@/utils/supabase/server'
import FinancialClient from './FinancialClient'

export const dynamic = 'force-dynamic'

export default async function FinancialPage() {
  const supabase = await createClient()
  const { data: financials } = await supabase
    .from('financials')
    .select('*')
    .order('created_at', { ascending: false })

  return <FinancialClient initialData={financials || []} />
}
