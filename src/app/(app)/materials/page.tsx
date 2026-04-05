import { createClient } from '@/utils/supabase/server'
import MaterialsClient from './MaterialsClient'

export const dynamic = 'force-dynamic'

export default async function MaterialsPage() {
  const supabase = await createClient()
  const { data: materials } = await supabase.from('materials').select('*').order('name')
  return <MaterialsClient initialMaterials={materials || []} />
}
