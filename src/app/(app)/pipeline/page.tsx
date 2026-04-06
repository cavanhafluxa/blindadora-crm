import { createClient } from '@/utils/supabase/server'
import PipelineClient from './PipelineClient'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name')

  if (error) {
    console.error('Pipeline error:', error.message)
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden p-6">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Pipeline de Vendas</h1>
        <p className="text-slate-500 text-sm mt-1">Arraste os leads entre os estágios de conversão</p>
      </div>
      <PipelineClient initialLeads={leads || []} teamMembers={teamMembers || []} />
    </div>
  )
}
