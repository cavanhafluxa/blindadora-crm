import { createClient } from '@/utils/supabase/server'
import { CircleDollarSign, Truck, Receipt, Flame, ArrowUp, BarChart3, Clock, Percent, ShieldAlert, Award, CalendarDays, TrendingDown, Target } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 30 // Cache for 30 seconds to speed up navigation

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: projects },
    { data: leads },
    { data: financials },
    { data: stages },
  ] = await Promise.all([
    supabase.from('projects').select('*'),
    supabase.from('leads').select('*'),
    supabase.from('financials').select('*'),
    supabase.from('production_stages').select('*, profiles(full_name)'),
  ])

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // -------------------------
  // KPIs base
  // -------------------------
  const totalRevenue = financials
    ?.filter(f => f.type === 'income' && f.paid)
    .reduce((acc, f) => acc + Number(f.amount), 0) || 0

  const activeProjects = projects?.filter(p => p.status === 'producao').length || 0
  const totalLeads = leads?.length || 0

  const funnelStats = {
    total: leads?.length || 0,
    new: leads?.filter(l => l.pipeline_stage === 'new').length || 0,
    prospecting: leads?.filter(l => l.pipeline_stage === 'prospecting').length || 0,
    quoted: leads?.filter(l => l.pipeline_stage === 'quoted').length || 0,
    contracted: leads?.filter(l => l.pipeline_stage === 'contracted').length || 0,
  }

  const conversionRate = funnelStats.total > 0 ? Math.round((funnelStats.contracted / funnelStats.total) * 100) : 0
  
  const leadsThisMonth = leads?.filter(l => new Date(l.created_at).getMonth() === currentMonth && new Date(l.created_at).getFullYear() === currentYear) || []
  const contractedThisMonth = leadsThisMonth.filter(l => l.pipeline_stage === 'contracted').length
  const conversaoMes = leadsThisMonth.length > 0 ? Math.round((contractedThisMonth / leadsThisMonth.length) * 100) : 0

  const ticketMedio = projects && projects.length > 0 ? totalRevenue / projects.length : 0

  const concludedProjects = projects?.filter(p => p.status === 'concluido') || []
  const tempoMedioPatio = concludedProjects.length > 0 ? 
    Math.round(concludedProjects.reduce((acc, p) => {
      const start = new Date(p.created_at).getTime()
      const end = new Date(p.updated_at).getTime()
      return acc + (end - start) / (1000 * 60 * 60 * 24)
    }, 0) / concludedProjects.length)
    : 0

  const pendenciasSicovab = projects?.filter(p => p.status !== 'concluido' && (!p.sicovab_protocol || p.sicovab_status === 'pending')).length || 0

  const faturamentoMes = Array(12).fill(0)
  financials?.filter(f => f.type === 'income' && f.paid && new Date(f.created_at).getFullYear() === currentYear).forEach(f => {
    const month = new Date(f.created_at).getMonth()
    faturamentoMes[month] += Number(f.amount)
  })
  const maxFaturamento = Math.max(...faturamentoMes, 1)
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  const kpis = [
    { label: 'Faturamento Recebido', value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, sub: 'Total pago recebido', icon: CircleDollarSign, color: 'text-amber-600', bg: 'bg-amber-50', grad: 'bg-amber-200' },
    { label: 'Ticket Médio (Projetos)', value: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, sub: `Média de ${projects?.length || 0} projetos`, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50', grad: 'bg-blue-200' },
    { label: 'Tempo Médio de Pátio', value: `${tempoMedioPatio} dias`, sub: 'Média para conclusão', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50', grad: 'bg-indigo-200' },
    { label: 'Taxa de Conversão Mensal', value: `${conversaoMes}%`, sub: `${contractedThisMonth} leads fechados este mês`, icon: Percent, color: 'text-emerald-600', bg: 'bg-emerald-50', grad: 'bg-emerald-200' },
    { label: 'Pendências SICOVAB', value: `${pendenciasSicovab}`, sub: 'Projetos sem protocolo', icon: ShieldAlert, color: 'text-purple-600', bg: 'bg-purple-50', grad: 'bg-purple-200' },
  ]

  // -------------------------
  // Cockpit Gerencial (Analytics)
  // -------------------------

  // 1. Ranking de Modelos
  const modelsRanking = projects?.reduce((acc: any, p) => {
    const model = p.vehicle_model || 'Não Informado'
    acc[model] = (acc[model] || 0) + 1
    return acc
  }, {})
  const topModels = Object.entries(modelsRanking || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5)

  // 2. Análise de Leads Perdidos
  const lostLeads = leads?.filter(l => l.pipeline_stage === 'lost') || []
  const lostValue = lostLeads.reduce((acc, l) => acc + (Number(l.quoted_value) || 0), 0)

  // 3. Eficiência do Time (Tarefas concluídas no mês)
  const completedStagesThisMonth = stages?.filter(s => s.status === 'completed' && s.completed_at && new Date(s.completed_at).getMonth() === currentMonth && new Date(s.completed_at).getFullYear() === currentYear) || []
  const teamEfficiency = completedStagesThisMonth.reduce((acc: any, s) => {
    const name = s.profiles?.full_name || 'Desconhecido'
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {})
  const topPerformers = Object.entries(teamEfficiency || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 4)

  // 4. Forecast Entregas
  const today = new Date()
  const next30Days = new Date()
  next30Days.setDate(today.getDate() + 30)

  const upcomingDeliveries = projects?.filter(p => {
    if (p.status === 'concluido' || !p.expected_delivery_date) return false
    const date = new Date(p.expected_delivery_date)
    return date.getTime() >= today.getTime() && date.getTime() <= next30Days.getTime()
  }).sort((a,b) => new Date(a.expected_delivery_date).getTime() - new Date(b.expected_delivery_date).getTime()).slice(0, 5)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Cockpit de Gestão</h1>
        <p className="text-slate-500 text-sm mt-1">Analytics em tempo real da blindadora</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="soft-card p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 border-b-4 border-transparent hover:border-amber-500">
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${kpi.grad} group-hover:opacity-40 transition-opacity`} />
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-4`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className="text-xs font-semibold text-slate-500 mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-bold text-slate-800 mb-1 leading-none">{kpi.value}</h3>
            <p className="text-[10px] text-slate-400 font-medium">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Analytics Grid 1 - Faturamento & Modelos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 soft-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <CircleDollarSign className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-slate-800">Evolução do Faturamento ({currentYear})</h2>
          </div>
          
          <div className="flex items-end gap-2 h-48 pt-4">
            {faturamentoMes.map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end group cursor-pointer relative h-full">
                {val > 0 && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[10px] font-bold text-slate-700 mb-2 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md absolute -mt-8 z-10 shadow-sm pointer-events-none">
                    R$ {val.toLocaleString('pt-BR')}
                  </div>
                )}
                <div 
                  className={`w-full max-w-[40px] rounded-t-sm transition-all relative overflow-hidden ${idx === currentMonth ? 'bg-amber-300' : 'bg-slate-200 group-hover:bg-slate-300'}`}
                  style={{ height: `${(val / maxFaturamento) * 100}%`, minHeight: val > 0 ? '4px' : '0' }}
                >
                  <div className={`absolute bottom-0 w-full opacity-90 h-full bg-gradient-to-t ${idx === currentMonth ? 'from-amber-500 to-amber-400' : 'from-slate-400 to-slate-300'}`}></div>
                </div>
                <span className={`text-[10px] font-bold mt-2 ${idx === currentMonth ? 'text-amber-600' : 'text-slate-400'}`}>{meses[idx]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking de Modelos */}
        <div className="soft-card p-6 bg-gradient-to-br from-white to-slate-50 border border-slate-200">
           <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-indigo-500" />
            <h2 className="font-semibold text-slate-800">Top 5 Modelos</h2>
          </div>
          <div className="space-y-4">
             {topModels.length > 0 ? topModels.map((item: any, idx) => (
               <div key={item[0]} className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/50' : 'bg-slate-200 text-slate-600'}`}>
                     {idx + 1}
                   </div>
                   <span className="text-sm font-semibold text-slate-700 truncate max-w-[150px]">{item[0]}</span>
                 </div>
                 <div className="text-xs font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-full text-slate-600">
                   {item[1]} vols
                 </div>
               </div>
             )) : (
               <p className="text-sm text-slate-400">Nenhum veículo registrado.</p>
             )}
          </div>
        </div>
      </div>

      {/* Analytics Grid 2 - Eficiência, Forecast e Perdas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Forecast Entregas */}
        <div className="soft-card p-6 border-t-4 border-emerald-500">
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays className="w-5 h-5 text-emerald-500" />
            <h2 className="font-semibold text-slate-800">Forecast Pendentes (30 Dias)</h2>
          </div>
          {upcomingDeliveries && upcomingDeliveries.length > 0 ? (
            <div className="space-y-3">
              {upcomingDeliveries.map(p => {
                const isLate = new Date(p.expected_delivery_date) < new Date()
                return (
                  <Link key={p.id} href={`/projects/${p.id}`} className="block p-3 bg-white border border-slate-100 hover:border-emerald-200 rounded-xl transition-colors">
                    <p className="text-sm font-bold text-slate-700 truncate">{p.vehicle_model || 'Veículo'} - {p.customer_name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(p.expected_delivery_date).toLocaleDateString('pt-BR')}
                      </span>
                      {isLate ? (
                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Atrasado</span>
                      ) : (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">No prazo</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <span className="text-slate-400 text-sm">Nenhuma entrega prevista</span>
            </div>
          )}
        </div>

        {/* Eficiência do Time */}
        <div className="soft-card p-6 border-t-4 border-indigo-500">
          <div className="flex items-center gap-2 mb-5">
            <Award className="w-5 h-5 text-indigo-500" />
            <h2 className="font-semibold text-slate-800">Eficiência da Equipe (Mês)</h2>
          </div>
          {topPerformers.length > 0 ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 mb-2">Baseado em etapas concluídas no mês atual</p>
              {topPerformers.map((item: any, idx) => {
                // max is topPerformers[0][1]
                const max = topPerformers[0][1] as number
                const perc = Math.round((item[1] / max) * 100)
                return (
                  <div key={item[0]}>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-xs font-bold text-slate-700 truncate">{item[0]}</span>
                      <span className="text-[10px] font-bold text-indigo-600">{item[1]} etapas</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${perc}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <span className="text-slate-400 text-sm">Nenhuma etapa concluída no mês</span>
            </div>
          )}
        </div>

        {/* Custo e Perdas */}
        <div className="soft-card p-6 border-t-4 border-red-500 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 text-red-50 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
            <TrendingDown className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-2 mb-5 relative z-10">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-slate-800">Análise de Entradas & Perdas</h2>
          </div>
          
          <div className="space-y-4 relative z-10">
            <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
               <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Leads Perdidos (Total)</p>
               <div className="flex items-end gap-2">
                 <span className="text-2xl font-black text-red-600">{lostLeads.length}</span>
                 <span className="text-xs text-red-700/60 font-semibold mb-1">negócios não fechados</span>
               </div>
               {lostValue > 0 && (
                 <p className="text-xs text-red-700 font-semibold mt-2 pt-2 border-t border-red-200/50">
                    Oportunidade perdida: R$ {lostValue.toLocaleString('pt-BR')}
                 </p>
               )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Conversão Funil</p>
               <div className="flex items-end gap-2 text-slate-800">
                 <span className="text-3xl font-black">{conversionRate}%</span>
                 <span className="text-xs text-slate-500 font-semibold mb-1">de {funnelStats.total} leads</span>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
