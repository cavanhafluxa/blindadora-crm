import { createClient } from '@/utils/supabase/server'
import ProposalsClient from './ProposalsClient'

export const dynamic = 'force-dynamic'

export default async function ProposalsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: proposals },
    { data: leads },
    { data: profile }
  ] = await Promise.all([
    supabase.from('proposals').select('*').order('created_at', { ascending: false }),
    supabase.from('leads').select('id, customer_name, vehicle_model').order('customer_name'),
    supabase.from('profiles').select('organizations(*)').eq('id', user?.id).single()
  ])

  // @ts-ignore
  const organization = Array.isArray(profile?.organizations) ? profile?.organizations[0] : profile?.organizations

  return (
    <ProposalsClient 
      initialProposals={proposals || []} 
      leads={leads || []} 
      organization={organization}
    />
  )
}
