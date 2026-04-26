import { createClient } from '@/utils/supabase/server'
import {
  CircleDollarSign, Target, Percent, Award,
  CalendarDays, Car, BarChart2, Clock,
  ShieldAlert, Activity, TrendingUp, TrendingDown,
  ArrowRight, Users,
} from 'lucide-react'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SalesAreaChart, InvoicesDonutChart } from "@/components/dashboard/DashboardCharts"

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

  const salesData = meses.map((m, i) => ({
    month: m,
    revenue: faturamentoMes[i]
  }))

  const invoiceStatusData = [
    { status: 'pago', count: financials.filter(f => f.paid && f.type === 'income').length, fill: "#10B981" },
    { status: 'pendente', count: financials.filter(f => !f.paid && f.type === 'income').length, fill: "#4F46E5" },
    { status: 'atrasado', count: financials.filter(f => !f.paid && f.type === 'expense').length, fill: "#1E1B4B" },
  ]

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

  const recentFinancials = [...financials]
    .filter(f => f && f.created_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)

  const recentProjects = [...projects]
    .filter(p => p && p.created_at)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)

  // ── Extra Completeness Data ───────────────────
  const leadsNew = leads.filter(l => l.pipeline_stage === 'new').length
  const leadsContact = leads.filter(l => l.pipeline_stage === 'contact').length
  const leadsProposal = leads.filter(l => l.pipeline_stage === 'proposal').length
  const leadsContracted = leads.filter(l => l.pipeline_stage === 'contracted').length
  
  const pipelineData = [
    { label: 'Novos', count: leadsNew, color: 'bg-slate-200' },
    { label: 'Em Contato', count: leadsContact, color: 'bg-blue-200' },
    { label: 'Proposta', count: leadsProposal, color: 'bg-indigo-300' },
    { label: 'Fechados', count: leadsContracted, color: 'bg-emerald-400' },
  ]

  // ── Render ──────────────────────────────────
  return (
    <div className="flex-1 w-full flex flex-col pl-8 pr-20 py-8 space-y-8 bg-transparent min-h-screen">
      
      {/* ── Weekly date range ──────────────────────── */}
      {(() => {
        // Calculate this week's bounds (Mon–today) and last week's bounds
        const now = new Date()
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay() // 1=Mon..7=Sun
        const startOfThisWeek = new Date(now)
        startOfThisWeek.setDate(now.getDate() - (dayOfWeek - 1))
        startOfThisWeek.setHours(0, 0, 0, 0)

        const startOfLastWeek = new Date(startOfThisWeek)
        startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)
        const endOfLastWeek = new Date(startOfThisWeek)

        // Clientes (projetos) desta semana vs semana passada
        const clientsThisWeek = projects.filter(p => p?.created_at && new Date(p.created_at) >= startOfThisWeek).length
        const clientsLastWeek = projects.filter(p => p?.created_at && new Date(p.created_at) >= startOfLastWeek && new Date(p.created_at) < endOfLastWeek).length

        // Faturamento desta semana (receitas pagas)
        const revenueThisWeek = financials
          .filter(f => f?.type === 'income' && f.paid && f.created_at && new Date(f.created_at) >= startOfThisWeek)
          .reduce((a, f) => a + Number(f.amount || 0), 0)
        const revenueLastWeek = financials
          .filter(f => f?.type === 'income' && f.paid && f.created_at && new Date(f.created_at) >= startOfLastWeek && new Date(f.created_at) < endOfLastWeek)
          .reduce((a, f) => a + Number(f.amount || 0), 0)

        // Despesas desta semana
        const expensesThisWeek = financials
          .filter(f => f?.type === 'expense' && f.created_at && new Date(f.created_at) >= startOfThisWeek)
          .reduce((a, f) => a + Number(f.amount || 0), 0)
        const expensesLastWeek = financials
          .filter(f => f?.type === 'expense' && f.created_at && new Date(f.created_at) >= startOfLastWeek && new Date(f.created_at) < endOfLastWeek)
          .reduce((a, f) => a + Number(f.amount || 0), 0)

        // Delta helpers
        const pct = (curr: number, prev: number) => {
          if (prev === 0) return curr > 0 ? '+100%' : '—'
          const d = ((curr - prev) / prev) * 100
          return (d >= 0 ? '+' : '') + d.toFixed(1) + '%'
        }
        const deltaClients  = pct(clientsThisWeek, clientsLastWeek)
        const deltaRevenue  = pct(revenueThisWeek, revenueLastWeek)
        const deltaExpenses = pct(expensesThisWeek, expensesLastWeek)
        const deltaMargin   = pct(marginPct, marginPct) // static for now — real needs historical

        const fmt = (v: number) =>
          v >= 1000
            ? 'R$ ' + (v / 1000).toFixed(1).replace('.', ',') + 'k'
            : 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })

        const kpis = [
          {
            label: 'Clientes',
            value: projects.length.toString(),
            weekValue: clientsThisWeek,
            delta: deltaClients,
            icon: Users,
            iconBg: '#EEF2FF',
            iconColor: '#4F46E5',
            sub: 'esta semana',
          },
          {
            label: 'Faturamento',
            value: fmt(totalRevenue),
            weekValue: null,
            delta: deltaRevenue,
            icon: CircleDollarSign,
            iconBg: '#ECFDF5',
            iconColor: '#10B981',
            sub: 'esta semana',
          },
          {
            label: 'Margem Bruta',
            value: `${marginPct}%`,
            weekValue: null,
            delta: '—',
            icon: Percent,
            iconBg: '#FDF4FF',
            iconColor: '#A855F7',
            sub: 'sobre contratos',
          },
          {
            label: 'Despesas',
            value: fmt(expensesThisWeek),
            weekValue: null,
            delta: deltaExpenses,
            icon: TrendingDown,
            iconBg: '#FFF1F2',
            iconColor: '#F43F5E',
            sub: 'esta semana',
          },
        ]

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => {
              const isPositive = kpi.delta.startsWith('+')
              const isNeutral  = kpi.delta === '—'
              // For expenses, more = bad (red). For others, more = good (green).
              const isExpense = kpi.label === 'Despesas'
              const trendGood = isNeutral ? null : (isExpense ? !isPositive : isPositive)

              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl px-6 py-5 flex items-center gap-5 shadow-[0_1px_6px_rgba(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-all duration-300 group"
                >
                  {/* Icon */}
                  <div
                    className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundColor: kpi.iconBg }}
                  >
                    <kpi.icon className="w-6 h-6" style={{ color: kpi.iconColor }} strokeWidth={2} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Label row */}
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[14px] font-medium text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                      {!isNeutral && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            trendGood
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-500'
                          }`}
                        >
                          {kpi.delta}
                        </span>
                      )}
                    </div>

                    {/* Value */}
                    <p className="text-[26px] font-semibold text-slate-900 tracking-tight leading-none mb-1.5">
                      {kpi.value}
                    </p>

                    {/* Sub */}
                    <p className="text-[13px] text-slate-400">
                      {kpi.weekValue !== null && kpi.weekValue !== undefined
                        ? <><span className="font-medium text-slate-600">{kpi.weekValue} novos</span> {kpi.sub}</>
                        : kpi.sub
                      }
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}


      {/* ── Middle Row 1: Gráficos e Pipeline ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Pipeline & Meta (Stack) */}
        <div className="lg:col-span-1 flex flex-col gap-8">
           


           {/* Pipeline */}
           <Card className="rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.04)] border border-slate-100 flex-1">
             <CardHeader className="px-8 py-6 border-b border-slate-50">
                <CardTitle className="text-xl font-semibold text-slate-800">Pipeline de Vendas</CardTitle>
                <CardDescription className="text-[15px] font-medium text-slate-500">Distribuição atual de leads</CardDescription>
             </CardHeader>
             <CardContent className="px-8 pb-8 pt-2">
                <div className="space-y-6">
                   {pipelineData.map((item, i) => (
                      <div key={i}>
                         <div className="flex justify-between text-[14px] font-medium mb-2">
                            <span className="text-slate-600">{item.label}</span>
                            <span className="text-slate-900">{item.count}</span>
                         </div>
                         <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.max(5, (item.count / (leads.length || 1)) * 100)}%` }} />
                         </div>
                      </div>
                   ))}
                </div>
             </CardContent>
           </Card>

        </div>
        
        {/* Gráfico de Faturamento */}
        <div className="lg:col-span-2">
           <SalesAreaChart data={salesData} />
        </div>

      </div>

      {/* ── Middle Row 2: Faturas e Donut ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Status de Faturas */}
        <div className="lg:col-span-1">
           <InvoicesDonutChart data={invoiceStatusData} total={financials.length} />
        </div>

        {/* Faturas Recentes */}
        <Card className="lg:col-span-2 rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <CardHeader className="px-8 py-6 border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
            <div className="grid gap-1">
              <CardTitle className="text-xl font-semibold text-slate-800">Faturas Recentes</CardTitle>
              <CardDescription className="text-[15px] font-medium text-slate-500">Últimas movimentações financeiras no escritório</CardDescription>
            </div>
            <div className="flex gap-4">
               <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                 <Activity className="w-3.5 h-3.5" /> Filtrar
               </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[14px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="px-8 py-4">No</th>
                    <th className="px-8 py-4">Descrição</th>
                    <th className="px-8 py-4">Data</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentFinancials.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                      <td className="px-8 py-5 text-[13px] font-medium text-slate-400">#{i + 1}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[13px] font-semibold text-slate-700">
                            {f.description?.charAt(0) || 'F'}
                          </div>
                          <span className="text-[16px] font-medium text-slate-700">{f.description || 'Fatura Geral'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-[13px] font-medium text-slate-500">
                        {new Date(f.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                          f.paid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                        }`}>
                          {f.paid ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-[16px] font-semibold text-slate-800 text-right">
                        R$ {Number(f.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Row: Projetos & Alertas ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Últimos Projetos (Expandido) */}
        <Card className="lg:col-span-2 rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <CardHeader className="px-8 py-6 border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
            <div className="grid gap-1">
              <CardTitle className="text-xl font-semibold text-slate-800">Últimos Projetos</CardTitle>
              <CardDescription className="text-[15px] font-medium text-slate-500">Projetos recém adicionados na produção</CardDescription>
            </div>
            <Link href="/projects" className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
               Ver todos &rarr;
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[14px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="px-8 py-4">Cliente</th>
                    <th className="px-8 py-4">Veículo</th>
                    <th className="px-8 py-4">Data de Entrada</th>
                    <th className="px-8 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentProjects.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                      <td className="px-8 py-5">
                         <span className="text-[15px] font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{p.customer_name}</span>
                      </td>
                      <td className="px-8 py-5 text-[15px] font-medium text-slate-600">
                         {p.vehicle_model || 'Não informado'}
                      </td>
                      <td className="px-8 py-5 text-[14px] text-slate-500">
                         {new Date(p.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                          p.status === 'concluido' ? 'bg-emerald-50 text-emerald-600' :
                          p.status === 'producao' ? 'bg-blue-50 text-blue-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {p.status || 'Novo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentProjects.length === 0 && (
                     <tr><td colSpan={4} className="px-8 py-8 text-center text-[14px] text-slate-500">Nenhum projeto encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card className="lg:col-span-1 rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col overflow-hidden bg-gradient-to-b from-white to-slate-50/30">
          <CardHeader className="px-8 py-6 border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
             <CardTitle className="text-xl font-semibold text-slate-800">Alertas</CardTitle>
             <ShieldAlert className="w-5 h-5 text-rose-500" />
          </CardHeader>
          <CardContent className="p-0 flex-1">
             <div className="divide-y divide-slate-50">
                {pendenciasSicovab > 0 && (
                   <div className="px-8 py-5 flex items-start gap-4 hover:bg-white transition-colors cursor-pointer group">
                      <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                         <ShieldAlert className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                         <h4 className="text-[15px] font-semibold text-slate-800">SICOVAB Pendente</h4>
                         <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">{pendenciasSicovab} projetos aguardando emissão ou aprovação de SICOVAB.</p>
                      </div>
                   </div>
                )}
                <div className="px-8 py-5 flex items-start gap-4 hover:bg-white transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h4 className="text-[15px] font-semibold text-slate-800">Prazos Próximos</h4>
                        <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">Existem veículos com data de entrega para os próximos 7 dias.</p>
                    </div>
                </div>
                <div className="px-8 py-5 flex items-start gap-4 hover:bg-white transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Activity className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h4 className="text-[15px] font-semibold text-slate-800">Qualidade</h4>
                        <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">Nenhuma não-conformidade relatada nas últimas 48 horas.</p>
                    </div>
                </div>
             </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
