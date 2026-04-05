import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from('maintenance_orders')
    .select('*, projects(customer_name, vehicle_model)')
    .order('created_at', { ascending: false })

  const statusLabels: Record<string, { label: string; class: string }> = {
    scheduled: { label: 'Agendado', class: 'bg-blue-100 text-blue-700' },
    in_progress: { label: 'Em Andamento', class: 'bg-yellow-100 text-yellow-700' },
    completed: { label: 'Concluído', class: 'bg-green-100 text-green-700' },
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Pós-Venda / Manutenção</h1>
        <p className="text-slate-500 text-sm mt-1">Ordens de manutenção e revisão</p>
      </div>

      <div className="soft-card">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{orders?.length || 0} ordens de serviço</h2>
        </div>
        {orders && orders.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {orders.map(o => {
              const st = statusLabels[o.status] || { label: o.status, class: 'bg-slate-100 text-slate-600' }
              return (
                <div key={o.id} className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-800">{(o.projects as any)?.customer_name || 'Cliente'}</p>
                      <span className={`stage-badge ${st.class}`}>{st.label}</span>
                    </div>
                    <p className="text-sm text-slate-500">{(o.projects as any)?.vehicle_model || 'Veículo'}</p>
                    {o.issue_description && <p className="text-sm text-slate-600 mt-1">{o.issue_description}</p>}
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    {o.scheduled_date && <p>{new Date(o.scheduled_date).toLocaleDateString('pt-BR')}</p>}
                    {o.cost && <p className="font-semibold text-slate-800">R$ {Number(o.cost).toLocaleString('pt-BR')}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">Nenhuma ordem de manutenção ainda.</div>
        )}
      </div>
    </div>
  )
}
