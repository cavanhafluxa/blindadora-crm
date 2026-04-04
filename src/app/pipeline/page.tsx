import { createClient } from '@/utils/supabase/server'
import KanbanBoard from './KanbanBoard'
import { redirect } from 'next/navigation'
import { PlusIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const supabase = createClient()
  
  // Apenas garante que o utilizador está logado, 
  // embora o middleware.ts já providencie essa proteção
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch leads
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error("Error fetching leads", error)
  }

  return (
    <div className="flex-1 w-full flex flex-col h-screen overflow-hidden p-6 bg-[#F3F5F8]">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-[28px] font-bold text-[#111827] tracking-tight mb-1">Pipeline de Vendas</h2>
          <p className="text-[14px] text-[#6B7280] font-medium">Arraste os leads pelos estágios de conversão</p>
        </div>
        
        <button className="flex items-center gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors cursor-pointer">
          <PlusIcon className="w-5 h-5" /> Adicionar Lead
        </button>
      </div>

      <div className="flex-1 h-full min-h-0 overflow-x-auto pb-4">
        <KanbanBoard initialLeads={leads || []} />
      </div>
    </div>
  )
}
