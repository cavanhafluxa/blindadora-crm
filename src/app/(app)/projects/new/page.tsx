import { createClient } from '@/utils/supabase/server'
import NewProjectClient from './NewProjectClient'

export const dynamic = 'force-dynamic'

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: leads } = await supabase
    .from('leads')
    .select('id, customer_name, vehicle_model, plate, quoted_value')
    .eq('pipeline_stage', 'contracted')

  return <NewProjectClient leads={leads || []} />
}
