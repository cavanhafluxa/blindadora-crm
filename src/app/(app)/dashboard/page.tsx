import { createClient } from '@/utils/supabase/server'
import { CircleDollarSign, Truck, Receipt, Flame, ArrowUp } from 'lucide-react'

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
      label: 'Projetos em Produção',
      value: activeProjects.toString(),
      sub: `${projects?.length || 0} projetos no total`,
      icon: Truck,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      grad: 'bg-indigo-200',
    },
    {
      label: 'A Receber',
      value: `R$ ${pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
      sub: 'Pagamentos pendentes',
      icon: Receipt,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      grad: 'bg-orange-200',
    },
    {
      label: 'Leads no Pipeline',
      value: totalLeads.toString(),
      sub: 'Oportunidades ativas',
      icon: Flame,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      grad: 'bg-rose-200',
    },
  ]

  // Conversion Metrics
  const funnelStats = {
    total: leads?.length || 0,
    new: leads?.filter(l => l.pipeline_stage === 'new').length || 0,
    prospecting: leads?.filter(l => l.pipeline_stage === 'prospecting').length || 0,
    quoted: leads?.filter(l => l.pipeline_stage === 'quoted').length || 0,
    contracted: leads?.filter(l => l.pipeline_stage === 'contracted').length || 0,
  }
  const conversionRate = funnelStats.total > 0 ? Math.round((funnelStats.contracted / funnelStats.total) * 100) : 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Visão geral da operação</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="soft-card p-6 relative overflow-hidden group">
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${kpi.grad}`} />
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-4`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className="text-xs font-semibold text-slate-500 mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">{kpi.value}</h3>
            <p className="text-xs text-slate-400">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projetos Recentes */}
        <div className="soft-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-slate-800">Projetos Recentes</h2>
            <a href="/projects" className="text-xs text-green-600 font-semibold hover:underline">Ver todos →</a>
          </div>
          {projects && projects.length > 0 ? (
            <div className="space-y-3">
              {projects.slice(0, 5).map((p) => (
                <a key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{p.customer_name}</p>
                    <p className="text-xs text-slate-500">{p.vehicle_model || 'Veículo'} · {p.plate || 'Sem placa'}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-24 progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${p.overall_progress}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 text-right">{p.overall_progress}%</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              Nenhum projeto criado ainda.<br />
              <a href="/projects" className="text-green-600 font-medium hover:underline">Criar primeiro projeto →</a>
            </div>
          )}
        </div>

        {/* Leads Recentes */}
        <div className="soft-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-slate-800">Últimos Leads</h2>
            <a href="/pipeline" className="text-xs text-green-600 font-semibold hover:underline">Ver pipeline →</a>
          </div>
          {leads && leads.length > 0 ? (
            <div className="space-y-3">
              {leads.slice(0, 5).map((l) => {
                const stageLabels: Record<string, string> = {
                  new: 'Novo', prospecting: 'Prospecção', quoted: 'Orçado', contracted: 'Contratado'
                }
                const stageColors: Record<string, string> = {
                  new: 'bg-red-100 text-red-700',
                  prospecting: 'bg-yellow-100 text-yellow-700',
                  quoted: 'bg-orange-100 text-orange-700',
                  contracted: 'bg-green-100 text-green-700'
                }
                return (
                  <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{l.customer_name}</p>
                      <p className="text-xs text-slate-500">{l.vehicle_model || 'Veículo'} · {l.armor_type || 'Blindagem'}</p>
                    </div>
                    <span className={`stage-badge ${stageColors[l.pipeline_stage] || 'bg-slate-100 text-slate-600'}`}>
                      {stageLabels[l.pipeline_stage] || l.pipeline_stage}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              Nenhum lead ainda.<br />
              <a href="/pipeline" className="text-green-600 font-medium hover:underline">Adicionar lead →</a>
            </div>
          )}
        </div>
      </div>

      {/* Taxa de Conversão */}
      <div className="mt-6 soft-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-slate-800">Cenário de Vendas e Funil</h2>
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
                <div className={`rounded-xl p-4 ${step.color} ${step.text} flex flex-col items-center justify-center relative z-10`}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">{step.label}</p>
                  <p className="text-3xl font-black">{step.val}</p>
                  <p className="text-xs font-semibold mt-1 opacity-80">{stepPercent}%</p>
                </div>
                {idx < arr.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 bg-white border border-slate-200 rounded-full flex justify-center items-center z-20 transform -translate-y-1/2">
                    <span className="text-slate-400 text-xs">→</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
