import { createClient } from '@/utils/supabase/server'
import MaterialsClient from './MaterialsClient'

export const dynamic = 'force-dynamic'

export default async function MaterialsPage() {
  const supabase = await createClient()
  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .order('name')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Estoque de Materiais</h1>
        <p className="text-slate-500 text-sm mt-1">Controle de materiais de blindagem</p>
      </div>
      <MaterialsClient materials={materials || []} />
    </div>
  )
}
