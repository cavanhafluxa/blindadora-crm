import { createClient } from '@/utils/supabase/server'
import ProposalsClient from './ProposalsClient'

export const dynamic = 'force-dynamic'

export default async function ProposalsPage() {
  const supabase = await createClient()
  const [{ data: proposals }, { data: leads }] = await Promise.all([
    supabase.from('proposals').select('*').order('created_at', { ascending: false }),
    supabase.from('leads').select('id, customer_name, vehicle_model').order('customer_name'),
  ])

  return <ProposalsClient initialProposals={proposals || []} leads={leads || []} />
}
