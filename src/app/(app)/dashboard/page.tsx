import { createClient } from '@/utils/supabase/server'
import { CircleDollarSign, Target, Percent, Award, CalendarDays, Car, BarChart2, Clock, ShieldAlert, Activity } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 30 

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: projects },
    { data: leads },
    { data: financials },
    { data: stages },
    { data: projectPurchases },
    { data: stockOutflows },
  ] = await Promise.all([
    supabase.from('projects').select('*'),
    supabase.from('leads').select('*'),
    supabase.from('financials').select('*'),
    supabase.from('production_stages').select('*, profiles(full_name)'),
    supabase.from('project_purchases').select('project_id, total_price'),
    supabase.from('stock_movements').select('project_id, quantity, unit_cost').eq('movement_type', 'out'),
  ])

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // 1. KPIs
  const totalRevenue = financials
    ?.filter(f => f.type === 'income' && f.paid)
    .reduce((acc, f) => acc + Number(f.amount), 0) || 0

  const ticketMedio = projects && projects.length > 0 ? totalRevenue / projects.length : 0

  const concludedProjects = projects?.filter(p => p.status === 'concluido') || []
  const tempoMedioPatio = concludedProjects.length > 0 ? 
    Math.round(concludedProjects.reduce((acc, p) => {
      const start = new Date(p.created_at).getTime()
      const end = new Date(p.updated_at).getTime()
      return acc + (end - start) / (1000 * 60 * 60 * 24)
    }, 0) / concludedProjects.length)
    : 0

  const leadsThisMonth = leads?.filter(l => new Date(l.created_at).getMonth() === currentMonth && new Date(l.created_at).getFullYear() === currentYear) || []
  const contractedThisMonth = leadsThisMonth.filter(l => l.pipeline_stage === 'contracted').length
  const conversaoMes = leadsThisMonth.length > 0 ? Math.round((contractedThisMonth / leadsThisMonth.length) * 100) : 0

  const activeProjects = projects?.filter(p => p.status === 'producao').length || 0
  const pendenciasSicovab = projects?.filter(p => p.status !== 'concluido' && (!p.sicovab_protocol || p.sicovab_status === 'pending')).length || 0

  const faturamentoMes = Array(12).fill(0)
  financials?.filter(f => f.type === 'income' && f.paid && new Date(f.created_at).getFullYear() === currentYear).forEach(f => {
    const month = new Date(f.created_at).getMonth()
    faturamentoMes[month] += Number(f.amount)
  })
  const maxFaturamento = Math.max(...faturamentoMes, 1)
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  // Margem
  const costByProject: Record<string, number> = {}
  stockOutflows?.forEach(m => {
    if (m.project_id) {
      costByProject[m.project_id] = (costByProject[m.project_id] || 0) + (Number(m.unit_cost || 0) * Number(m.quantity))
    }
  })
  projectPurchases?.forEach(p => {
    if (p.project_id) {
      costByProject[p.project_id] = (costByProject[p.project_id] || 0) + Number(p.total_price || 0)
    }
  })
  const totalRealCost = Object.values(costByProject).reduce((a, b) => a + b, 0)
  const totalContractValue = projects?.reduce((acc, p) => acc + Number(p.contract_value || 0), 0) || 0
  const estimatedMargin = totalContractValue - totalRealCost
  const marginPct = totalContractValue > 0 ? Math.round((estimatedMargin / totalContractValue) * 100) : 0

  // 2. Rankings
  const modelsRanking = projects?.reduce((acc: any, p) => {
    const model = p.vehicle_model || 'Não Informado'
    acc[model] = (acc[model] || 0) + 1
    return acc
  }, {})
  const topModels = Object.entries(modelsRanking || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5)

  const lostLeads = leads?.filter(l => l.pipeline_stage === 'lost') || []

  // 3. Forecast
  const today = new Date()
  const next30Days = new Date()
  next30Days.setDate(today.getDate() + 30)

  const upcomingDeliveries = projects?.filter(p => {
    if (p.status === 'concluido' || !p.expected_delivery_date) return false
    const date = new Date(p.expected_delivery_date)
    return date.getTime() >= today.getTime() && date.getTime() <= next30Days.getTime()
  }).sort((a,b) => new Date(a.expected_delivery_date).getTime() - new Date(b.expected_delivery_date).getTime()).slice(0, 5)

  return (
    <div className="flex-1 w-full flex flex-col px-6 py-6 mb-4 space-y-5">
      
      {/* Header Area */}
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Resumo Financeiro</h1>
        <p className="text-[13px] font-medium text-slate-500">Faturamento, Produção e Operações</p>
      </div>

      {/* Top 6 KPIs - Classic Tailwind Slate styling */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Card 1: Faturamento Recebido */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-8 h-8 flex items-center justify-center bg-amber-50 text-amber-600 rounded-lg mb-3">
              <CircleDollarSign className="w-4 h-4" />
            </div>
            <h3 className="text-[12px] font-semibold text-slate-500 mb-1 line-clamp-1">Faturamento Recebido</h3>
            <div className="text-[18px] font-semibold text-slate-800 tracking-tight">R$ {(totalRevenue / 1000).toFixed(1)}k</div>
          </div>
          <p className="text-[10px] font-medium text-slate-400">Total pago recebido</p>
        </div>

        {/* Card 2: Ticket Médio */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg mb-3">
              <BarChart2 className="w-4 h-4" />
            </div>
            <h3 className="text-[12px] font-semibold text-slate-500 mb-1 line-clamp-1">Ticket Médio (Projetos)</h3>
            <div className="text-[18px] font-semibold text-slate-800 tracking-tight">R$ {(ticketMedio / 1000).toFixed(1)}k</div>
          </div>
          <p className="text-[10px] font-medium text-slate-400">Média de {projects?.length || 0} projetos</p>
        </div>

        {/* Card 3: Tempo Médio Pátio */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg mb-3">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-[12px] font-semibold text-slate-500 mb-1 line-clamp-1">Tempo Médio de Pátio</h3>
            <div className="text-[18px] font-semibold text-slate-800 tracking-tight">{tempoMedioPatio} dias</div>
          </div>
          <p className="text-[10px] font-medium text-slate-400">Média para conclusão</p>
        </div>

        {/* Card 4: Conversão Mensal */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg mb-3">
              <Percent className="w-4 h-4" />
            </div>
            <h3 className="text-[12px] font-semibold text-slate-500 mb-1 line-clamp-1">Taxa de Conversão Mensal</h3>
            <div className="text-[18px] font-semibold text-slate-800 tracking-tight">{conversaoMes}%</div>
          </div>
          <p className="text-[10px] font-medium text-slate-400">{contractedThisMonth} leads fechados este mês</p>
        </div>

        {/* Card 5: Pendências Sicovab */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-8 h-8 flex items-center justify-center bg-purple-50 text-purple-600 rounded-lg mb-3">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-[12px] font-semibold text-slate-500 mb-1 line-clamp-1">Pendências SICOVAB</h3>
            <div className="text-[18px] font-semibold text-slate-800 tracking-tight">{pendenciasSicovab}</div>
          </div>
          <p className="text-[10px] font-medium text-slate-400">Projetos sem protocolo</p>
        </div>

        {/* Card 6: Margem Estimada */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="w-8 h-8 flex items-center justify-center bg-green-50 text-green-600 rounded-lg mb-3">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-[12px] font-semibold text-slate-500 mb-1 line-clamp-1">Margem Bruta Estimada</h3>
            <div className="text-[18px] font-semibold text-slate-800 tracking-tight">{marginPct}%</div>
          </div>
          <p className="text-[10px] font-medium text-slate-400">R$ {(estimatedMargin / 1000).toFixed(1)}k</p>
        </div>

      </div>

      {/* Middle Area: Chart & Mini Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-800">Visão Mensal</h2>
              <p className="text-[13px] font-medium text-slate-500">Acompanhamento do rendimento em R$</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1 rounded-lg text-[12px] font-semibold">
              Máx: R$ {maxFaturamento.toLocaleString('pt-BR')}
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between min-h-[220px] pb-2">
            {faturamentoMes.map((val, idx) => {
              const isCurrent = idx === currentMonth;
              const hasData = val > 0;
              const heightPct = hasData ? Math.max((val / maxFaturamento) * 100, 10) : 0;
              
              return (
                <div key={idx} className="flex flex-col items-center justify-end h-full w-full group relative">
                  {/* Tooltip */}
                  {hasData && (
                     <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white px-2 py-1 rounded shadow-md pointer-events-none transform -translate-x-1/2 left-1/2 z-10">
                       <span className="text-[11px] font-semibold whitespace-nowrap">R$ {(val/1000).toFixed(1)}k</span>
                     </div>
                  )}
                  {/* Bar */}
                  <div className="w-3/4 max-w-[28px] h-full flex flex-col justify-end">
                    <div 
                       className={`w-full rounded-t-md transition-all duration-300 ${isCurrent ? 'bg-blue-600' : 'bg-slate-200 group-hover:bg-blue-400'}`}
                       style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  {/* Month Label */}
                  <span className={`text-[10px] uppercase mt-3 ${isCurrent ? 'font-semibold text-slate-800' : 'font-medium text-slate-400'}`}>
                    {meses[idx][0]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-between">
             <div>
               <h3 className="text-[13px] font-medium text-slate-500 mb-1">Modelo Mais Blindado</h3>
               <div className="text-[15px] font-semibold tracking-tight text-slate-800">{topModels[0]?.[0]?.slice(0,18) || 'N/A'}</div>
               <p className="text-[12px] font-medium text-slate-500 mt-1">{topModels[0]?.[1] || 0} unidades</p>
             </div>
             <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
               <Award className="w-5 h-5" />
             </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col">
             <div className="mb-6">
               <h2 className="text-[15px] font-semibold text-slate-800">Volume (Sicovab/Perdas)</h2>
             </div>
             
             <div className="flex flex-col gap-6 flex-1 justify-center">
                <div>
                  <div className="flex justify-between text-[13px] font-medium text-slate-700 mb-2">
                    <span>Aguardando Sicovab</span>
                    <span className="font-semibold">{pendenciasSicovab}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full w-3/4" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[13px] font-medium text-slate-700 mb-2">
                    <span>Leads Perdidos</span>
                    <span className="font-semibold">{lostLeads.length}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-300 rounded-full w-1/3" />
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Area: Forecast */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">Próximas Entregas</h2>
            <p className="text-[13px] font-medium text-slate-500">Previsão para os próximos 30 dias</p>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg">
            <CalendarDays className="w-4 h-4" />
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
            {upcomingDeliveries.length > 0 ? upcomingDeliveries.map((p, idx) => {
              const isLate = new Date(p.expected_delivery_date) < new Date()
              return (
                <div key={p.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-semibold text-slate-800">{p.vehicle_model || 'Não Informado'}</h4>
                      <p className="text-[12px] font-medium text-slate-500">{p.customer_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[13px] font-semibold text-slate-800">
                      {new Date(p.expected_delivery_date).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isLate ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {isLate ? 'Atrasado' : 'No Prazo'}
                    </span>
                  </div>
                </div>
              )
            }) : (
               <div className="p-8 text-center">
                  <p className="text-[13px] font-medium text-slate-500">Nenhuma entrega prevista para os próximos dias.</p>
               </div>
            )}
        </div>
      </div>

    </div>
  )
}
