import { createClient } from '@/utils/supabase/server'
import {
  CircleDollarSign, Target, Percent, Award,
  CalendarDays, Car, BarChart2, Clock,
  ShieldAlert, Activity, TrendingUp, TrendingDown,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

export const revalidate = 30
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let projects: any[] = [], 
      leads: any[] = [], 
      financials: any[] = [], 
      stages: any[] = [], 
      projectPurchases: any[] = [], 
      stockOutflows: any[] = [];

  const currentMonth = new Date().getMonth()
  const currentYear  = new Date().getFullYear()
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  try {
    const supabase = await createClient()
    const results = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('leads').select('*'),
      supabase.from('financials').select('*'),
      supabase.from('production_stages').select('*'), 
      supabase.from('project_purchases').select('project_id, total_price'),
      supabase.from('stock_movements').select('project_id, quantity, unit_cost').eq('movement_type', 'out'),
    ])

    projects = results[0]?.data || []
    leads = results[1]?.data || []
    financials = results[2]?.data || []
    stages = results[3]?.data || []
    projectPurchases = results[4]?.data || []
    stockOutflows = results[5]?.data || []
  } catch (err) {
    console.error('Erro ao carregar dados do Dashboard:', err)
  }

  // ── KPIs com Segurança Total ──────────────────
  const totalRevenue = financials
    .filter(f => f && f.type === 'income' && f.paid)
    .reduce((acc, f) => acc + Number(f.amount || 0), 0)

  const ticketMedio = projects.length > 0 ? totalRevenue / projects.length : 0

  const concludedProjects = projects.filter(p => p && p.status === 'concluido')
  const tempoMedioPatio   = concludedProjects.length > 0
    ? Math.round(concludedProjects.reduce((acc, p) => {
        const start = p.created_at ? new Date(p.created_at).getTime() : Date.now()
        const end   = p.updated_at ? new Date(p.updated_at).getTime() : Date.now()
        return acc + Math.max(0, (end - start) / (1000 * 60 * 60 * 24))
      }, 0) / concludedProjects.length)
    : 0

  const leadsThisMonth = leads.filter(l => 
    l && l.created_at && 
    new Date(l.created_at).getMonth() === currentMonth &&
    new Date(l.created_at).getFullYear() === currentYear
  )
  const contractedThisMonth = leadsThisMonth.filter(l => l && l.pipeline_stage === 'contracted').length
  const conversaoMes = leadsThisMonth.length > 0 ? Math.round((contractedThisMonth / leadsThisMonth.length) * 100) : 0

  const activeProjects = projects.filter(p => p && p.status === 'producao').length
  const pendenciasSicovab = projects.filter(p => 
    p && p.status !== 'concluido' && (!p.sicovab_protocol || p.sicovab_status === 'pending')
  ).length

  // ── Faturamento mensal ────────────────────────
  const faturamentoMes = Array(12).fill(0)
  financials
    .filter(f => f && f.type === 'income' && f.paid && f.created_at && new Date(f.created_at).getFullYear() === currentYear)
    .forEach(f => {
      const month = new Date(f.created_at).getMonth()
      faturamentoMes[month] += Number(f.amount || 0)
    })

  const maxFaturamento = Math.max(...faturamentoMes, 1)

  // ── Margem ───────────────────────────────────
  const costByProject: Record<string, number> = {}
  stockOutflows.forEach(m => {
    if (m && m.project_id) {
      costByProject[m.project_id] = (costByProject[m.project_id] || 0) + 
        (Number(m.unit_cost || 0) * Number(m.quantity || 0))
    }
  })
  projectPurchases.forEach(p => {
    if (p && p.project_id) {
      costByProject[p.project_id] = (costByProject[p.project_id] || 0) + Number(p.total_price || 0)
    }
  })
  const totalRealCost = Object.values(costByProject).reduce((a, b) => a + (Number(b) || 0), 0)
  const totalContractValue = projects.reduce((acc, p) => acc + Number(p.contract_value || 0), 0)
  const estimatedMargin = totalContractValue - totalRealCost
  const marginPct = totalContractValue > 0 ? Math.round((estimatedMargin / totalContractValue) * 100) : 0

  // ── Rankings ─────────────────────────────────
  const modelsRanking: Record<string, number> = projects.reduce((acc: Record<string, number>, p) => {
    const model = p.vehicle_model || 'Não Informado'
    acc[model] = (acc[model] || 0) + 1
    return acc
  }, {})
  const topModels = Object.entries(modelsRanking).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // ── Forecast ─────────────────────────────────
  const today = new Date()
  const next30Days = new Date(); next30Days.setDate(today.getDate() + 30)

  const upcomingDeliveries = projects
    .filter(p => {
      if (!p || p.status === 'concluido' || !p.expected_delivery_date) return false
      const date = new Date(p.expected_delivery_date)
      return date.getTime() >= today.getTime() && date.getTime() <= next30Days.getTime()
    })
    .sort((a, b) => {
      const da = a.expected_delivery_date ? new Date(a.expected_delivery_date).getTime() : 0
      const db = b.expected_delivery_date ? new Date(b.expected_delivery_date).getTime() : 0
      return da - db
    })
    .slice(0, 5)

  const recentFinancials = [...financials]
    .filter(f => f && f.created_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)

  return (
    <div className="flex-1 w-full flex flex-col px-6 py-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-[13px] font-medium mt-0.5 text-slate-500">Resumo financeiro e operacional — {meses[currentMonth]} {currentYear}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg text-white text-[12px] font-bold">
          <span className="opacity-50">{meses[currentMonth]}</span>
          <span>{currentYear}</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="w-full grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {[
          { label: 'Faturamento Recebido', value: `R$ ${(totalRevenue / 1000).toFixed(1)}k`, sub: 'Total pago confirmado' },
          { label: 'Ticket Médio', value: `R$ ${(ticketMedio / 1000).toFixed(1)}k`, sub: `${projects.length} projetos` },
          { label: 'Margem Bruta Est.', value: `${marginPct}%`, sub: `R$ ${(estimatedMargin / 1000).toFixed(1)}k` },
          { label: 'Conversão Mensal', value: `${conversaoMes}%`, sub: `${contractedThisMonth} leads fechados` },
          { label: 'Tempo Médio Pátio', value: `${tempoMedioPatio}d`, sub: 'Média de conclusão' },
          { label: 'Pendências SICOVAB', value: `${pendenciasSicovab}`, sub: 'Sem protocolo' },
        ].map((kpi, i) => (
          <div key={i} className={`flex flex-col justify-between p-5 ${i < 5 ? 'border-r border-slate-100' : ''} min-h-[100px]`}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">{kpi.label}</p>
            <div>
              <div className="text-2xl font-black tracking-tight text-slate-900 leading-none mb-1">{kpi.value}</div>
              <p className="text-[11px] font-medium text-slate-400">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visão Mensal Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Visão Mensal</h2>
              <p className="text-[12px] font-medium text-slate-500">Faturamento mês a mês — {currentYear}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-900" />
                <span className="text-[11px] font-semibold text-slate-500 text-slate-900 uppercase">Faturado</span>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 min-h-[220px]">
            {faturamentoMes.map((val, idx) => {
              const isCurrent = idx === currentMonth
              const heightPct = val > 0 ? Math.max((val / maxFaturamento) * 100, 8) : 4
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {val > 0 && (
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white p-2 rounded-lg text-[10px] font-bold z-10 whitespace-nowrap">
                      R$ {(val / 1000).toFixed(1)}k
                    </div>
                  )}
                  <div className="w-full flex flex-col justify-end h-full px-1">
                    <div 
                      className={`w-full rounded-t-md transition-all duration-300 ${isCurrent ? 'bg-slate-900' : val > 0 ? 'bg-slate-200 hover:bg-slate-300' : 'bg-slate-50'}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className={`mt-3 text-[9px] font-bold uppercase tracking-wider ${isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>
                    {meses[idx][0]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Small Analytics Side */}
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900 p-6 rounded-xl text-white flex items-center justify-between shadow-xl">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Top Blindado</p>
              <h3 className="text-lg font-black tracking-tight mb-1">{topModels[0]?.[0] || 'N/A'}</h3>
              <p className="text-xs text-slate-400">{topModels[0]?.[1] || 0} unidades este ano</p>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex-1">
            <h3 className="text-[13px] font-bold text-slate-900 mb-6 uppercase tracking-tight">Status Operacional</h3>
            <div className="space-y-6">
              {[
                { label: 'Aguardando SICOVAB', value: pendenciasSicovab, color: 'bg-slate-900', pct: Math.min(100, (pendenciasSicovab / Math.max(projects.length, 1)) * 100) },
                { label: 'Em Produção', value: activeProjects, color: 'bg-slate-400', pct: Math.min(100, (activeProjects / Math.max(projects.length, 1)) * 100) }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[12px] font-bold text-slate-600">{item.label}</span>
                    <span className="text-[11px] font-black">{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-slate-900">Últimas Movimentações</h3>
            <Link href="/financial" className="text-[11px] font-bold text-slate-400 hover:text-slate-900 flex items-center gap-1">
              VER TODAS <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-0">
            {recentFinancials.map((f, i) => (
              <div key={f.id} className="flex items-center px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                <div className={`w-2 h-2 rounded-full mr-4 ${f.type === 'income' ? 'bg-slate-900' : 'bg-slate-300'}`} />
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-[13px] font-bold text-slate-800 truncate">{f.description || (f.type === 'income' ? 'Receita' : 'Despesa')}</p>
                  <p className="text-[11px] text-slate-400">{new Date(f.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[13px] font-black ${f.type === 'income' ? 'text-slate-900' : 'text-slate-500'}`}>
                    {f.type === 'income' ? '+' : '-'} R$ {Number(f.amount || 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-[9px] font-bold uppercase text-slate-300">{f.paid ? 'Confirmado' : 'Pendente'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deliveries */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-slate-900">Entregas Previstas</h3>
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {upcomingDeliveries.map((p) => {
              const isLate = new Date(p.expected_delivery_date) < new Date()
              return (
                <div key={p.id} className="p-5 flex items-center hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mr-4">
                    <Car className="w-5 h-5 text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-[13px] font-black text-slate-800 truncate">{p.vehicle_model || 'N/A'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{p.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] font-black text-slate-900">{new Date(p.expected_delivery_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isLate ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {isLate ? 'ESTOURO' : 'NO PRAZO'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
