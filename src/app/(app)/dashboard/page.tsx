import { createClient } from '@/utils/supabase/server'
import {
  CircleDollarSign, Target, Percent, Award,
  CalendarDays, Car, BarChart2, Clock,
  ShieldAlert, Activity, TrendingUp, TrendingDown,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

export const revalidate = 30

export default async function DashboardPage() {
  const supabase = await createClient()

  let projects: any[] = [], 
      leads: any[] = [], 
      financials: any[] = [], 
      stages: any[] = [], 
      projectPurchases: any[] = [], 
      stockOutflows: any[] = [];

  try {
    const results = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('leads').select('*'),
      supabase.from('financials').select('*'),
      supabase.from('production_stages').select('*'), 
      supabase.from('project_purchases').select('project_id, total_price'),
      supabase.from('stock_movements').select('project_id, quantity, unit_cost').eq('movement_type', 'out'),
    ])

    projects = results[0].data || []
    leads = results[1].data || []
    financials = results[2].data || []
    stages = results[3].data || []
    projectPurchases = results[4].data || []
    stockOutflows = results[5].data || []
  } catch (err) {
    console.error('Erro ao carregar dados do Dashboard:', err)
  }



  const currentMonth = new Date().getMonth()
  const currentYear  = new Date().getFullYear()

  // ── KPIs ──────────────────────────────────────
  const totalRevenue = financials
    .filter(f => f.type === 'income' && f.paid)
    .reduce((acc, f) => acc + Number(f.amount), 0)

  const ticketMedio = projects.length > 0 ? totalRevenue / projects.length : 0

  const concludedProjects = projects.filter(p => p.status === 'concluido')

  const tempoMedioPatio   = concludedProjects.length > 0
    ? Math.round(concludedProjects.reduce((acc, p) => {
        const start = new Date(p.created_at).getTime()
        const end   = new Date(p.updated_at).getTime()
        return acc + (end - start) / (1000 * 60 * 60 * 24)
      }, 0) / concludedProjects.length)
    : 0

  const leadsThisMonth     = leads.filter(l =>
    new Date(l.created_at).getMonth() === currentMonth &&
    new Date(l.created_at).getFullYear() === currentYear
  )
  const contractedThisMonth = leadsThisMonth.filter(l => l.pipeline_stage === 'contracted').length
  const conversaoMes        = leadsThisMonth.length > 0
    ? Math.round((contractedThisMonth / leadsThisMonth.length) * 100)
    : 0

  const activeProjects    = projects.filter(p => p.status === 'producao').length
  const pendenciasSicovab = projects.filter(p =>
    p.status !== 'concluido' && (!p.sicovab_protocol || p.sicovab_status === 'pending')
  ).length

  // ── Faturamento mensal ────────────────────────
  const faturamentoMes = Array(12).fill(0)
  financials
    .filter(f => f.type === 'income' && f.paid && new Date(f.created_at).getFullYear() === currentYear)
    .forEach(f => {
      const month = new Date(f.created_at).getMonth()
      faturamentoMes[month] += Number(f.amount)
    })

  const maxFaturamento = Math.max(...faturamentoMes, 1)
  const meses          = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  // ── Margem ───────────────────────────────────
  const costByProject: Record<string, number> = {}
  stockOutflows.forEach(m => {
    if (m.project_id) {
      costByProject[m.project_id] = (costByProject[m.project_id] || 0) +
        (Number(m.unit_cost || 0) * Number(m.quantity))
    }
  })
  projectPurchases.forEach(p => {
    if (p.project_id) {
      costByProject[p.project_id] = (costByProject[p.project_id] || 0) + Number(p.total_price || 0)
    }
  })
  const totalRealCost     = Object.values(costByProject).reduce((a, b) => a + b, 0)
  const totalContractValue = projects.reduce((acc, p) => acc + Number(p.contract_value || 0), 0)
  const estimatedMargin    = totalContractValue - totalRealCost
  const marginPct          = totalContractValue > 0
    ? Math.round((estimatedMargin / totalContractValue) * 100)
    : 0

  // ── Rankings ─────────────────────────────────
  const modelsRanking: Record<string, number> = projects.reduce((acc: Record<string, number>, p) => {
    const model  = p.vehicle_model || 'Não Informado'
    acc[model]   = (acc[model] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topModels = Object.entries(modelsRanking).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const lostLeads = leads.filter(l => l.pipeline_stage === 'lost')


  // ── Forecast ─────────────────────────────────
  const today     = new Date()
  const next30Days = new Date()
  next30Days.setDate(today.getDate() + 30)

  const upcomingDeliveries = projects
    .filter(p => {
      if (p.status === 'concluido' || !p.expected_delivery_date) return false
      const date = new Date(p.expected_delivery_date)
      return date.getTime() >= today.getTime() && date.getTime() <= next30Days.getTime()
    })
    .sort((a, b) => new Date(a.expected_delivery_date).getTime() - new Date(b.expected_delivery_date).getTime())
    .slice(0, 5)

  // ── Derived for "last transactions" look ─────
  const recentFinancials = [...financials]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6)


  return (
    <div className="flex-1 w-full flex flex-col px-6 py-6 space-y-6">

      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1
            className="text-[26px] font-black tracking-tight"
            style={{ color: '#111111', letterSpacing: '-0.03em', fontFamily: "'Inter Tight', sans-serif" }}
          >
            Dashboard
          </h1>
          <p className="text-[13px] font-medium mt-0.5" style={{ color: '#888888' }}>
            Resumo financeiro e operacional — {meses[currentMonth]} {currentYear}
          </p>
        </div>

        {/* Indicador mês atual */}
        <div
          className="flex items-center gap-2 px-3 py-1.5"
          style={{
            background:   '#111111',
            borderRadius: '7px',
            color:        '#FFFFFF',
            fontSize:     '12px',
            fontWeight:   700,
            fontFamily:   "'Inter Tight', sans-serif",
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>{meses[currentMonth]}</span>
          <span>{currentYear}</span>
        </div>
      </div>

      {/* ── KPI Row ──────────────────────────────── */}
      {/*
        Inspirado na diagramação da referência: linha horizontal de stats
        com rótulo pequeno em cima e valor em destaque, sem ícones coloridos.
        Separadores via bordas finas.
      */}
      <div
        className="w-full grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        style={{
          background:   '#FFFFFF',
          borderRadius: '10px',
          border:       '1px solid rgba(0,0,0,0.07)',
          boxShadow:    '0 2px 12px rgba(0,0,0,0.04)',
          overflow:     'hidden',
        }}
      >
        {[
          {
            label: 'Faturamento Recebido',
            value: `R$ ${(totalRevenue / 1000).toFixed(1)}k`,
            sub:   'Total pago confirmado',
          },
          {
            label: 'Ticket Médio',
            value: `R$ ${(ticketMedio / 1000).toFixed(1)}k`,
            sub:   `${projects?.length || 0} projetos`,
          },
          {
            label: 'Margem Bruta Est.',
            value: `${marginPct}%`,
            sub:   `R$ ${(estimatedMargin / 1000).toFixed(1)}k`,
          },
          {
            label: 'Conversão Mensal',
            value: `${conversaoMes}%`,
            sub:   `${contractedThisMonth} leads fechados`,
          },
          {
            label: 'Tempo Médio Pátio',
            value: `${tempoMedioPatio}d`,
            sub:   'Média de conclusão',
          },
          {
            label: 'Pendências SICOVAB',
            value: `${pendenciasSicovab}`,
            sub:   'Sem protocolo',
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className="flex flex-col justify-between p-5"
            style={{
              borderRight: i < 5 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              minHeight:   '100px',
            }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#AAAAAA', letterSpacing: '0.08em', fontFamily: "'Inter Tight', sans-serif" }}
            >
              {kpi.label}
            </p>
            <div>
              <div
                className="text-[22px] font-black tracking-tight leading-none mb-1"
                style={{ color: '#111111', letterSpacing: '-0.03em', fontFamily: "'Inter Tight', sans-serif" }}
              >
                {kpi.value}
              </div>
              <p className="text-[11px] font-medium" style={{ color: '#BBBBBB' }}>{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Middle Row: Bar Chart + Recent Transactions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Bar Chart — Visão Mensal */}
        <div
          className="lg:col-span-2 flex flex-col p-6"
          style={{
            background:   '#FFFFFF',
            borderRadius: '10px',
            border:       '1px solid rgba(0,0,0,0.07)',
            boxShadow:    '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          {/* Chart header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2
                className="text-[15px] font-bold tracking-tight"
                style={{ color: '#111111', letterSpacing: '-0.02em', fontFamily: "'Inter Tight', sans-serif" }}
              >
                Visão Mensal
              </h2>
              <p className="text-[12px] font-medium mt-0.5" style={{ color: '#888888' }}>
                Faturamento mês a mês — {currentYear}
              </p>
            </div>

            {/* Legend row */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#111111' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#888888' }}>Faturado</span>
              </div>
              <div
                className="px-2.5 py-1"
                style={{
                  background: '#F5F5F5',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#555555',
                  fontFamily: "'Inter Tight', sans-serif",
                }}
              >
                Máx · R$ {(maxFaturamento / 1000).toFixed(0)}k
              </div>
            </div>
          </div>

          {/* Bars */}
          <div className="flex-1 flex items-end justify-between gap-1" style={{ minHeight: '200px' }}>
            {faturamentoMes.map((val, idx) => {
              const isCurrent = idx === currentMonth
              const hasData   = val > 0
              const heightPct = hasData ? Math.max((val / maxFaturamento) * 100, 8) : 4

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-end h-full group relative"
                  style={{ flex: 1 }}
                >
                  {/* Tooltip */}
                  {hasData && (
                    <div
                      className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                      style={{
                        background:   '#111111',
                        color:        '#FFFFFF',
                        padding:      '4px 8px',
                        borderRadius: '6px',
                        fontSize:     '11px',
                        fontWeight:   700,
                        whiteSpace:   'nowrap',
                        transform:    'translateX(-50%)',
                        left:         '50%',
                        fontFamily:   "'Inter Tight', sans-serif",
                      }}
                    >
                      R$ {(val / 1000).toFixed(1)}k
                    </div>
                  )}

                  {/* Bar */}
                  <div className="w-full flex flex-col justify-end" style={{ height: '100%' }}>
                    <div
                      style={{
                        width:           '100%',
                        height:          `${heightPct}%`,
                        background:      isCurrent ? '#111111' : (hasData ? '#DDDDDD' : '#F0F0F0'),
                        borderRadius:    '3px 3px 0 0',
                        transition:      'all 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Month label */}
                  <span
                    className="mt-2 uppercase"
                    style={{
                      fontSize:    '9px',
                      fontWeight:  isCurrent ? 800 : 600,
                      color:       isCurrent ? '#111111' : '#BBBBBB',
                      letterSpacing: '0.06em',
                      fontFamily:  "'Inter Tight', sans-serif",
                    }}
                  >
                    {meses[idx][0]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Volume Cards (right column) */}
        <div className="lg:col-span-1 flex flex-col gap-4">

          {/* Modelo mais blindado */}
          <div
            className="flex items-center justify-between p-5"
            style={{
              background:   '#111111',
              borderRadius: '10px',
              flex:         '0 0 auto',
            }}
          >
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.38)', letterSpacing: '0.08em', fontFamily: "'Inter Tight', sans-serif" }}
              >
                Modelo Mais Blindado
              </p>
              <div
                className="text-[16px] font-black tracking-tight leading-none text-white mb-1"
                style={{ letterSpacing: '-0.02em', fontFamily: "'Inter Tight', sans-serif" }}
              >
                {topModels[0]?.[0]?.slice(0, 18) || 'N/A'}
              </div>
              <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {topModels[0]?.[1] || 0} unidades blindadas
              </p>
            </div>
            <div
              style={{
                width:      '36px',
                height:     '36px',
                background: 'rgba(255,255,255,0.10)',
                borderRadius: '8px',
                display:    'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
          </div>

          {/* Volume Sicovab / Perdas */}
          <div
            className="flex flex-col p-5 flex-1"
            style={{
              background:   '#FFFFFF',
              borderRadius: '10px',
              border:       '1px solid rgba(0,0,0,0.07)',
              boxShadow:    '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            <h3
              className="text-[13px] font-bold tracking-tight mb-5"
              style={{ color: '#111111', letterSpacing: '-0.01em', fontFamily: "'Inter Tight', sans-serif" }}
            >
              Volume Operacional
            </h3>

            <div className="flex flex-col gap-5 flex-1 justify-center">
              {/* Sicovab */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[12px] font-semibold" style={{ color: '#444444' }}>Aguardando SICOVAB</span>
                  <span
                    className="text-[12px] font-black"
                    style={{
                      background:   '#111111',
                      color:        '#FFFFFF',
                      padding:      '1px 8px',
                      borderRadius: '999px',
                      fontFamily:   "'Inter Tight', sans-serif",
                      fontSize:     '11px',
                    }}
                  >
                    {pendenciasSicovab}
                  </span>
                </div>
                <div style={{ height: '3px', background: '#F0F0F0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height:     '100%',
                      width:      pendenciasSicovab > 0 ? '70%' : '0%',
                      background: '#111111',
                      borderRadius: '999px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>

              {/* Leads perdidos */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[12px] font-semibold" style={{ color: '#444444' }}>Leads Perdidos</span>
                  <span
                    className="text-[12px] font-black"
                    style={{
                      background:   '#EEEEEE',
                      color:        '#555555',
                      padding:      '1px 8px',
                      borderRadius: '999px',
                      fontFamily:   "'Inter Tight', sans-serif",
                      fontSize:     '11px',
                    }}
                  >
                    {lostLeads.length}
                  </span>
                </div>
                <div style={{ height: '3px', background: '#F0F0F0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height:     '100%',
                      width:      lostLeads.length > 0 ? '35%' : '0%',
                      background: '#CCCCCC',
                      borderRadius: '999px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>

              {/* Em produção */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[12px] font-semibold" style={{ color: '#444444' }}>Em Produção</span>
                  <span
                    className="text-[12px] font-black"
                    style={{
                      background:   '#EEEEEE',
                      color:        '#555555',
                      padding:      '1px 8px',
                      borderRadius: '999px',
                      fontFamily:   "'Inter Tight', sans-serif",
                      fontSize:     '11px',
                    }}
                  >
                    {activeProjects}
                  </span>
                </div>
                <div style={{ height: '3px', background: '#F0F0F0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height:     '100%',
                      width:      activeProjects > 0 ? '55%' : '0%',
                      background: '#AAAAAA',
                      borderRadius: '999px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Movimentações + Próximas Entregas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Últimas Movimentações Financeiras */}
        <div
          className="lg:col-span-3"
          style={{
            background:   '#FFFFFF',
            borderRadius: '10px',
            border:       '1px solid rgba(0,0,0,0.07)',
            boxShadow:    '0 2px 12px rgba(0,0,0,0.04)',
            overflow:     'hidden',
          }}
        >
          {/* Table header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
          >
            <div>
              <h2
                className="text-[15px] font-bold tracking-tight"
                style={{ color: '#111111', letterSpacing: '-0.02em', fontFamily: "'Inter Tight', sans-serif" }}
              >
                Últimas Movimentações
              </h2>
              <p className="text-[12px] font-medium mt-0.5" style={{ color: '#888888' }}>
                Financeiro · registros recentes
              </p>
            </div>
            <Link
              href="/financial"
              className="flex items-center gap-1 text-[12px] font-bold"
              style={{ color: '#111111', fontFamily: "'Inter Tight', sans-serif" }}
            >
              Ver tudo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Column headers */}
          <div
            className="grid px-6 py-2.5"
            style={{
              gridTemplateColumns: '1fr auto auto auto',
              gap: '12px',
              borderBottom: '1px solid rgba(0,0,0,0.04)',
              background: '#FAFAFA',
            }}
          >
            {['Descrição', 'Data', 'Valor', 'Status'].map((h, i) => (
              <span
                key={i}
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#BBBBBB', letterSpacing: '0.07em', fontFamily: "'Inter Tight', sans-serif" }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div>
            {recentFinancials.length > 0 ? recentFinancials.map((f, idx) => {
              const isIncome = f.type === 'income'
              const isPaid   = f.paid
              return (
                <div
                  key={f.id}
                  className="grid items-center px-6 py-3.5 group transition-colors"
                  style={{
                    gridTemplateColumns: '1fr auto auto auto',
                    gap:              '12px',
                    borderBottom:     idx < recentFinancials.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                    cursor:           'default',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAFA')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Descrição */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      style={{
                        width:      '6px',
                        height:     '6px',
                        borderRadius: '50%',
                        background: isIncome ? '#111111' : '#CCCCCC',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="text-[13px] font-semibold truncate"
                      style={{ color: '#222222', fontFamily: "'Inter Tight', sans-serif" }}
                    >
                      {f.description || (isIncome ? 'Receita' : 'Despesa')}
                    </span>
                  </div>

                  {/* Data */}
                  <span
                    className="text-[11px] font-medium whitespace-nowrap"
                    style={{ color: '#AAAAAA', fontFamily: "'Inter Tight', sans-serif" }}
                  >
                    {new Date(f.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>

                  {/* Valor */}
                  <span
                    className="text-[13px] font-bold whitespace-nowrap"
                    style={{ color: isIncome ? '#111111' : '#888888', fontFamily: "'Inter Tight', sans-serif" }}
                  >
                    {isIncome ? '+' : '-'} R$ {Number(f.amount).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </span>

                  {/* Status */}
                  <span
                    style={{
                      fontSize:     '10px',
                      fontWeight:   800,
                      padding:      '3px 10px',
                      borderRadius: '999px',
                      background:   isPaid ? '#111111' : '#F0F0F0',
                      color:        isPaid ? '#FFFFFF' : '#888888',
                      fontFamily:   "'Inter Tight', sans-serif",
                      letterSpacing: '0.03em',
                      whiteSpace:   'nowrap',
                    }}
                  >
                    {isPaid ? 'Pago' : 'Pendente'}
                  </span>
                </div>
              )
            }) : (
              <div className="px-6 py-10 text-center">
                <p className="text-[13px] font-medium" style={{ color: '#AAAAAA' }}>
                  Nenhuma movimentação registrada.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Próximas Entregas */}
        <div
          className="lg:col-span-2"
          style={{
            background:   '#FFFFFF',
            borderRadius: '10px',
            border:       '1px solid rgba(0,0,0,0.07)',
            boxShadow:    '0 2px 12px rgba(0,0,0,0.04)',
            overflow:     'hidden',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
          >
            <div>
              <h2
                className="text-[15px] font-bold tracking-tight"
                style={{ color: '#111111', letterSpacing: '-0.02em', fontFamily: "'Inter Tight', sans-serif" }}
              >
                Próximas Entregas
              </h2>
              <p className="text-[12px] font-medium mt-0.5" style={{ color: '#888888' }}>
                Previsão — próximos 30 dias
              </p>
            </div>
            <div
              style={{
                width:      '32px',
                height:     '32px',
                background: '#F5F5F5',
                borderRadius: '7px',
                display:    'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CalendarDays className="w-4 h-4" style={{ color: '#888888' }} />
            </div>
          </div>

          <div>
            {upcomingDeliveries.length > 0 ? upcomingDeliveries.map((p, idx) => {
              const isLate = new Date(p.expected_delivery_date) < new Date()
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors"
                  style={{
                    borderBottom: idx < upcomingDeliveries.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAFA')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      style={{
                        width:      '34px',
                        height:     '34px',
                        background: '#F5F5F5',
                        borderRadius: '7px',
                        display:    'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Car className="w-4 h-4" style={{ color: '#888888' }} />
                    </div>
                    <div className="min-w-0">
                      <h4
                        className="text-[13px] font-bold truncate"
                        style={{ color: '#222222', fontFamily: "'Inter Tight', sans-serif" }}
                      >
                        {p.vehicle_model || 'Não Informado'}
                      </h4>
                      <p
                        className="text-[11px] font-medium truncate"
                        style={{ color: '#AAAAAA' }}
                      >
                        {p.customer_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                    <span
                      className="text-[12px] font-bold"
                      style={{ color: '#333333', fontFamily: "'Inter Tight', sans-serif" }}
                    >
                      {new Date(p.expected_delivery_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                    <span
                      style={{
                        fontSize:   '10px',
                        fontWeight: 800,
                        padding:    '2px 8px',
                        borderRadius: '999px',
                        background: isLate ? '#111111' : '#F0F0F0',
                        color:      isLate ? '#FFFFFF' : '#888888',
                        fontFamily: "'Inter Tight', sans-serif",
                        letterSpacing: '0.02em',
                      }}
                    >
                      {isLate ? 'Atrasado' : 'No Prazo'}
                    </span>
                  </div>
                </div>
              )
            }) : (
              <div className="px-5 py-10 text-center">
                <p className="text-[13px] font-medium" style={{ color: '#AAAAAA' }}>
                  Nenhuma entrega prevista.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
