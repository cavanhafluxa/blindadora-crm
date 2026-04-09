import { createClient } from '@/utils/supabase/server'
import { CircleDollarSign, Truck, Receipt, Flame, ArrowUp, BarChart3, Clock, Percent, ShieldAlert } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: projects },
    { data: leads },
    { data: financials },
  ] = await Promise.all([
    supabase.from('projects').select('*'),
    supabase.from('leads').select('*'),
    supabase.from('financials').select('*'),
  ])

  const totalRevenue = financials
    ?.filter(f => f.type === 'income' && f.paid)
    .reduce((acc, f) => acc + Number(f.amount), 0) || 0

  const activeProjects = projects?.filter(p => p.status === 'producao').length || 0
  const totalLeads = leads?.length || 0
  const pendingRevenue = financials
    ?.filter(f => f.type === 'income' && !f.paid)
    .reduce((acc, f) => acc + Number(f.amount), 0) || 0

  // Funnel Stats
  const funnelStats = {
    total: leads?.length || 0,
    new: leads?.filter(l => l.pipeline_stage === 'new').length || 0,
    prospecting: leads?.filter(l => l.pipeline_stage === 'prospecting').length || 0,
    quoted: leads?.filter(l => l.pipeline_stage === 'quoted').length || 0,
    contracted: leads?.filter(l => l.pipeline_stage === 'contracted').length || 0,
  }

  // Conversão Global & do Mês
  const conversionRate = funnelStats.total > 0 ? Math.round((funnelStats.contracted / funnelStats.total) * 100) : 0
  
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const leadsThisMonth = leads?.filter(l => new Date(l.created_at).getMonth() === currentMonth && new Date(l.created_at).getFullYear() === currentYear) || []
  const contractedThisMonth = leadsThisMonth.filter(l => l.pipeline_stage === 'contracted').length
  const conversaoMes = leadsThisMonth.length > 0 ? Math.round((contractedThisMonth / leadsThisMonth.length) * 100) : 0

  // Ticket Médio
  const ticketMedio = projects && projects.length > 0 ? totalRevenue / projects.length : 0

  // Tempo Médio de Pátio
  const concludedProjects = projects?.filter(p => p.status === 'concluido') || []
  const tempoMedioPatio = concludedProjects.length > 0 ? 
    Math.round(concludedProjects.reduce((acc, p) => {
      const start = new Date(p.created_at).getTime()
      const end = new Date(p.updated_at).getTime()
      return acc + (end - start) / (1000 * 60 * 60 * 24)
    }, 0) / concludedProjects.length)
    : 0

  // Pendências SICOVAB
  const pendenciasSicovab = projects?.filter(p => p.status !== 'concluido' && (!p.sicovab_protocol || p.sicovab_status === 'pending')).length || 0

  // Gráfico de Faturamento CSS
  const faturamentoMes = Array(12).fill(0)
  financials?.filter(f => f.type === 'income' && f.paid && new Date(f.created_at).getFullYear() === currentYear).forEach(f => {
    const month = new Date(f.created_at).getMonth()
    faturamentoMes[month] += Number(f.amount)
  })
  const maxFaturamento = Math.max(...faturamentoMes, 1)
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  const kpis = [
    {
      label: 'Faturamento Recebido',
      value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
      sub: 'Total pago recebido',
      icon: CircleDollarSign,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      grad: 'bg-amber-200',
    },
    {
      label: 'Ticket Médio (Projetos)',
      value: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
      sub: `Média de ${projects?.length || 0} projetos`,
      icon: BarChart3,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      grad: 'bg-blue-200',
    },
    {
      label: 'Tempo Médio de Pátio',
      value: `${tempoMedioPatio} dias`,
      sub: 'Média para conclusão',
      icon: Clock,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      grad: 'bg-indigo-200',
    },
    {
      label: 'Taxa de Conversão Mensal',
      value: `${conversaoMes}%`,
      sub: `${contractedThisMonth} leads fechados este mês`,
      icon: Percent,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      grad: 'bg-emerald-200',
    },
    {
      label: 'Pendências SICOVAB',
      value: `${pendenciasSicovab}`,
      sub: 'Projetos sem protocolo',
      icon: ShieldAlert,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      grad: 'bg-purple-200',
    },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Cockpit de Performance</h1>
        <p className="text-slate-500 text-sm mt-1">Visão geral da operação e conversão</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="soft-card p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${kpi.grad} group-hover:opacity-40 transition-opacity`} />
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-4`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className="text-xs font-semibold text-slate-500 mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{kpi.value}</h3>
            <p className="text-xs text-slate-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráfico de Faturamento por Mês */}
      <div className="soft-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <CircleDollarSign className="w-5 h-5 text-green-500" />
          <h2 className="font-semibold text-slate-800">Faturamento por Mês ({currentYear})</h2>
        </div>
        
        <div className="flex items-end gap-2 h-40 pt-4">
          {faturamentoMes.map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center justify-end group">
              {val > 0 && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-green-600 mb-1 bg-green-50 px-1 py-0.5 rounded absolute -mt-6">
                  R$ {val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                </div>
              )}
              <div 
                className="w-full max-w-[40px] bg-green-100 rounded-t-sm group-hover:bg-green-200 transition-colors relative overflow-hidden" 
                style={{ height: `${(val / maxFaturamento) * 100}%`, minHeight: val > 0 ? '4px' : '0' }}
              >
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 to-green-400 opacity-90 h-full"></div>
              </div>
              <span className="text-[10px] text-slate-500 font-medium mt-2">{meses[idx]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Layout inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taxa de Conversão Funil */}
        <div className="soft-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-slate-800">Funil (Todos os Tempos)</h2>
            <div className="text-right">
              <span className="text-xs text-slate-400">Conversão Global</span>
              <p className="text-2xl font-bold text-green-600">{conversionRate}%</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {[
              { label: 'Novos', val: funnelStats.new, color: 'bg-red-100', text: 'text-red-700' },
              { label: 'Prospecção', val: funnelStats.prospecting, color: 'bg-yellow-100', text: 'text-yellow-700' },
              { label: 'Orçados', val: funnelStats.quoted, color: 'bg-orange-100', text: 'text-orange-700' },
              { label: 'Contratados', val: funnelStats.contracted, color: 'bg-green-100', text: 'text-green-700' },
            ].map((step, idx, arr) => {
              const stepPercent = funnelStats.total > 0 ? Math.round((step.val / funnelStats.total) * 100) : 0
              return (
                <div key={step.label} className="flex-1 w-full relative pt-2">
                  <div className={`rounded-xl p-4 ${step.color} ${step.text} flex flex-col items-center justify-center relative z-10 hover:opacity-80 transition-opacity cursor-pointer`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">{step.label}</p>
                    <p className="text-2xl font-black">{step.val}</p>
                    <p className="text-[10px] font-semibold mt-1 opacity-80">{stepPercent}%</p>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-white border border-slate-200 rounded-full flex justify-center items-center z-20 transform -translate-y-1/2">
                      <span className="text-slate-400 text-xs text-center w-full block">→</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Projetos Recentes */}
        <div className="soft-card p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-slate-800">Projetos em Destaque</h2>
            <a href="/projects" className="text-xs text-green-600 font-semibold hover:underline">Ver todos →</a>
          </div>
          {projects && projects.length > 0 ? (
            <div className="space-y-3">
              {projects.slice(0, 4).map((p) => (
                <a key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{p.customer_name}</p>
                    <p className="text-xs text-slate-500">{p.vehicle_model || 'Veículo'} · {p.plate || 'Sem placa'}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-24 progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${p.overall_progress}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 text-right">{p.overall_progress}% concluído</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              Nenhum projeto.<br />
              <a href="/projects" className="text-green-600 font-medium hover:underline">Criar projeto →</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
