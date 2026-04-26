import { createClient } from '@/utils/supabase/server'
import MaterialsClient from './MaterialsClient'

export const revalidate = 30 // Inventory cache for 30 seconds

export default async function MaterialsPage() {
  const supabase = await createClient()
  const [
    { data: materials },
    { data: suppliers },
    { data: projects },
    { data: profiles }
  ] = await Promise.all([
    supabase.from('materials').select('*, suppliers(name)').order('name'),
    supabase.from('suppliers').select('id, name').order('name'),
    supabase.from('projects').select('id, customer_name, vehicle_model').neq('status', 'concluido').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').order('full_name')
  ])

  return <MaterialsClient 
    initialMaterials={materials || []} 
    suppliers={suppliers || []} 
    projects={projects || []} 
    profiles={profiles || []}
  />
}
