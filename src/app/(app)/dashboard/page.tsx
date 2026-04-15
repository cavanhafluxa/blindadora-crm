import { createClient } from '@/utils/supabase/server'
import {
  CircleDollarSign, Target, Percent, Award,
  CalendarDays, Car, BarChart2, Clock,
  ShieldAlert, Activity, TrendingUp, TrendingDown,
  ArrowRight, Users, Receipt
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

  // ── Render ──────────────────────────────────
  return (
    <div className="flex-1 w-full flex flex-col px-8 py-8 space-y-8 bg-[#F8FAFC] min-h-screen">
      
      {/* ── KPI Row ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Clientes', 
            value: projects.length, 
            trend: '+6,5%', 
            color: '#4F46E5', 
            icon: Users,
            sub: 'Desde a última semana'
          },
          { 
            label: 'Faturamento', 
            value: `R$ ${(totalRevenue / 1000).toFixed(1)}k`, 
            trend: '-0,10%', 
            color: '#10B981', 
            icon: CircleDollarSign,
            sub: 'Desde a última semana'
          },
          { 
            label: 'Margem Bruta', 
            value: `${marginPct}%`, 
            trend: '-0,2%', 
            color: '#8B5CF6', 
            icon: Percent,
            sub: 'Desde a última semana'
          },
          { 
            label: 'Financeiro Total', 
            value: financials.length, 
            trend: '+11,5%', 
            color: '#3B82F6', 
            icon: Receipt,
            sub: 'Desde a última semana'
          },
        ].map((kpi, i) => (
          <Card 
            key={i} 
            className="group relative p-6 transition-all duration-300 border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
          >
            {/* Vertical Bar */}
            <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full" style={{ backgroundColor: kpi.color }} />
            
            <div className="flex justify-between items-start pl-3">
              <div>
                <p className="text-[13px] font-semibold text-slate-400 mb-1">{kpi.label}</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{kpi.value}</h3>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-bold ${kpi.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {kpi.trend.startsWith('+') ? '↑' : '↓'} {kpi.trend}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{kpi.sub}</span>
                </div>
              </div>
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300" 
                style={{ backgroundColor: `${kpi.color}10` }}
              >
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Middle Row: Interactive Charts ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <InvoicesDonutChart data={invoiceStatusData} total={financials.length} />
        <div className="lg:col-span-2">
           <SalesAreaChart data={salesData} />
        </div>
      </div>

      {/* ── Bottom Row: Table ────────────────────── */}
      <Card className="rounded-[32px] border-none shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
        <CardHeader className="px-8 py-6 border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
          <div className="grid gap-1">
            <CardTitle className="text-lg font-bold text-slate-800">Faturas Recentes</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500">Últimas movimentações financeiras no escritório</CardDescription>
          </div>
          <div className="flex gap-4">
             <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[12px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">
               <Activity className="w-3.5 h-3.5" /> Filtrar
             </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-bold text-slate-300 uppercase tracking-widest bg-slate-50/50">
                  <th className="px-8 py-4">No</th>
                  <th className="px-8 py-4">Descrição</th>
                  <th className="px-8 py-4">Data</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Preço</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentFinancials.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 text-[13px] font-medium text-slate-400">#{i + 1}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-500">
                          {f.description?.charAt(0) || 'F'}
                        </div>
                        <span className="text-[14px] font-bold text-slate-700">{f.description || 'Fatura Geral'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[13px] font-medium text-slate-400">
                      {new Date(f.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-tight ${
                        f.paid ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                      }`}>
                        {f.paid ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-[14px] font-black text-slate-800 text-right">
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
  )
}
