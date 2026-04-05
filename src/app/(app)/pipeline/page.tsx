import { createClient } from '@/utils/supabase/server'
import PipelineClient from './PipelineClient'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: leads } = await supabase.from('leads').select('*').order('created_at', { ascending: false })

  return (
    <div className="flex flex-col h-screen overflow-hidden p-6">
      <div className="flex justify-between items-start mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pipeline de Vendas</h1>
          <p className="text-slate-500 text-sm mt-1">Arraste os leads entre os estágios</p>
        </div>
        <button
          id="add-lead-btn"
          className="btn-primary"
          onClick={() => {}}
        >
          <Plus className="w-4 h-4" /> Novo Lead
        </button>
      </div>
      <PipelineClient initialLeads={leads || []} />
    </div>
  )
}
