import { createClient } from '@/utils/supabase/server'
import {
  CircleDollarSign, Target, Percent, Award,
  CalendarDays, Car, BarChart2, Clock,
  ShieldAlert, Activity, TrendingUp, TrendingDown,
  ArrowRight, Users, Receipt
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
          <div 
            key={i} 
            className="group relative bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300"
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
          </div>
        ))}
      </div>

      {/* ── Middle Row: Charts ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Invoice Statistics (Donut) */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Estatísticas de Faturas</h3>
            <button className="text-slate-300 hover:text-slate-600 transition-colors">•••</button>
          </div>
          
          <div className="relative flex flex-col items-center">
            {/* Real SVG Donut */}
            <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F8FAFC" strokeWidth="12" />
              {/* Paid segment (Indigo) */}
              <circle 
                cx="50" cy="50" r="40" fill="transparent" stroke="#4F46E5" strokeWidth="12"
                strokeDasharray={`${(financials.filter(f => f.paid).length / Math.max(financials.length, 1)) * 251} 251`}
                className="transition-all duration-1000"
              />
              {/* Overdue segment (Slate) */}
              <circle 
                cx="50" cy="50" r="40" fill="transparent" stroke="#1E1B4B" strokeWidth="12"
                strokeDasharray={`${(financials.filter(f => !f.paid && f.type === 'expense').length / Math.max(financials.length, 1)) * 251} 251`}
                strokeDashoffset={`-${(financials.filter(f => f.paid).length / Math.max(financials.length, 1)) * 251}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute top-[38%] left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{financials.length}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturas</p>
            </div>


            <div className="w-full mt-10 space-y-4">
               {[
                 { label: 'Pago', val: financials.filter(f => f.paid && f.type === 'income').length, color: 'bg-indigo-500' },
                 { label: 'Atrasado', val: financials.filter(f => !f.paid && f.type === 'expense').length, color: 'bg-slate-800' },
                 { label: 'Pendente', val: financials.filter(f => !f.paid && f.type === 'income').length, color: 'bg-indigo-100' },
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                     <span className="text-[13px] font-bold text-slate-400">{item.label}</span>
                   </div>
                   <span className="text-[14px] font-black text-slate-800">{item.val}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Sales Analytics (Line Chart) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Análise de Vendas</h3>
            <button className="text-slate-300 hover:text-slate-600 transition-colors">•••</button>
          </div>

          <div className="h-[280px] w-full relative flex items-end justify-between px-2">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.05]">
              {[...Array(6)].map((_, i) => <div key={i} className="w-full h-[1px] bg-slate-200" />)}
            </div>

            {/* Real SVG Area Chart */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path 
                  d="M0,80 Q10,20 20,60 T40,30 T60,70 T80,20 T100,50 L100,100 L0,100 Z" 
                  fill="url(#areaGradient)"
                  className="animate-fade-in"
                />
                <path 
                  d="M0,80 Q10,20 20,60 T40,30 T60,70 T80,20 T100,50" 
                  fill="none" 
                  stroke="#4F46E5" 
                  strokeWidth="2"
                  className="animate-in slide-in-from-left duration-1000"
                />
                {/* Dots */}
                {[0, 20, 40, 60, 80, 100].map(x => (
                   <circle key={x} cx={x} cy={x === 40 ? 30 : 50} r="1.5" fill="white" stroke="#4F46E5" strokeWidth="0.5" />
                ))}
              </svg>
            </div>


            {meses.map((m, i) => (
              <span key={i} className={`text-[11px] font-bold ${i === currentMonth ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' : 'text-slate-300'}`}>
                {m}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* ── Bottom Row: Table ────────────────────── */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Faturas Recentes</h3>
          <div className="flex gap-4">
             <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[12px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">
               <Activity className="w-3.5 h-3.5" /> Filtrar
             </button>
             <button className="text-slate-300 hover:text-slate-600 transition-colors">•••</button>
          </div>
        </div>

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
                    R$ {Number(f.amount || 0).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

