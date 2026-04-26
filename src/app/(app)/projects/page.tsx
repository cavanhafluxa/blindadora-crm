import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Plus, ArrowRight, Wrench, AlertTriangle, FileWarning, Clock, FileX, Flame, Box, Calendar, Check, Car, ShieldAlert } from 'lucide-react'

export const revalidate = 30 // Cache for 30 seconds to speed up navigation

export default async function ProjectsPage() {
  const supabase = await createClient()
  const [
    { data: projects },
    { data: stages }
  ] = await Promise.all([
    supabase.from('projects').select('*').order('created_at', { ascending: false }),
    supabase.from('production_stages').select('stage_name, status, project_id').eq('status', 'in_progress')
  ])

  const safeProjects = projects || []
  const safeStages = stages || []

  // --- KPI LOGIC ---
  const inProductionCount = safeProjects.filter(p => p.status === 'producao' || p.status === 'revisao').length
  const completedCount = safeProjects.filter(p => p.status === 'concluido').length

  // Stages breakdown
  const stageCounts: Record<string, number> = {}
  safeStages.forEach(s => {
    stageCounts[s.stage_name] = (stageCounts[s.stage_name] || 0) + 1
  })
  const topStages = Object.entries(stageCounts).sort((a,b) => b[1] - a[1]).slice(0, 3)

  // Rejected docs
  const rejectedDocs = safeProjects.filter(p => p.authorization_status === 'rejected' || p.declaration_status === 'rejected')

  // Pendente SICOVAB
  const pendenteSicovab = safeProjects.filter(p => p.status !== 'concluido' && (!p.sicovab_protocol || p.sicovab_status === 'pending' || p.sicovab_status === 'rejected'))


  // At risk or delayed
  const today = new Date()
  const in7Days = new Date()
  in7Days.setDate(today.getDate() + 7)
  
  const atRiskProjects = safeProjects.filter(p => {
    if (p.status === 'concluido' || !p.expected_delivery_date) return false
    const expected = new Date(p.expected_delivery_date)
    return expected <= in7Days
  }).sort((a,b) => new Date(a.expected_delivery_date!).getTime() - new Date(b.expected_delivery_date!).getTime())

  const statusLabels: Record<string, { label: string; class: string }> = {
    producao: { label: 'Em Produção', class: 'bg-blue-100 text-blue-700' },
    revisao: { label: 'Em Revisão', class: 'bg-yellow-100 text-yellow-700' },
    concluido: { label: 'Concluído', class: 'bg-green-100 text-green-700' },
  }

  return (
    <div className="px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start pr-16">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Projetos de Blindagem</h1>
          <p className="text-slate-500 text-sm mt-1">{safeProjects.length} projetos no total</p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Novo Projeto
        </Link>
      </div>

      {/* DASHBOARD SECTION */}
      {safeProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Em produção */}
          <div className="soft-card p-5 border-l-4 border-l-indigo-500 hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700 text-sm">Painel de Fabricação</h3>
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Wrench className="w-4 h-4" /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-800">{inProductionCount}</span>
              <span className="text-[13px] text-slate-500">veículos ativos</span>
            </div>
            <p className="text-[13px] text-slate-400 mt-2">{completedCount} concluídos em histórico</p>
          </div>

          {/* Card 2: Engarrafamento de Etapas */}
          <div className="soft-card p-5 border-l-4 border-l-blue-500 hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700 text-sm">Radar de Etapas</h3>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Box className="w-4 h-4" /></div>
            </div>
            {topStages.length > 0 ? (
              <div className="space-y-2">
                {topStages.map(([name, count]) => (
                  <div key={name} className="flex justify-between items-center text-[13px]">
                    <span className="text-slate-600 truncate mr-2" title={name}>{name}</span>
                    <span className="font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{count} carro(s)</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-slate-400 italic">Nenhuma etapa em andamento.</p>
            )}
          </div>

          {/* Card 3: Documentos Rejeitados */}
          <div className="soft-card p-5 border-l-4 border-l-red-500 hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700 text-sm">Pendências Legais</h3>
              <div className="p-2 bg-red-50 rounded-lg text-red-600"><FileWarning className="w-4 h-4" /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${rejectedDocs.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {rejectedDocs.length}
              </span>
              <span className="text-[13px] text-slate-500">Docs rejeitados</span>
            </div>
            {rejectedDocs.length > 0 && (
              <p className="text-[13px] text-red-500 mt-2 line-clamp-1">
                Atenção em: {rejectedDocs.map(p => p.customer_name).join(', ')}
              </p>
            )}
            {rejectedDocs.length === 0 && (
              <p className="text-[13px] text-green-600 mt-2 flex items-center gap-1"><Check className="w-3 h-3"/> Tudo em ordem</p>
            )}
          </div>

          {/* Card 4: Atrasos / Prazos Apertados */}
          <div className="soft-card p-5 border-l-4 border-l-orange-500 hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700 text-sm">Prazos e Atrasos</h3>
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Clock className="w-4 h-4" /></div>
            </div>
            {atRiskProjects.length > 0 ? (
              <div className="space-y-2">
                {atRiskProjects.slice(0, 3).map(p => {
                  const daysDiff = Math.ceil((new Date(p.expected_delivery_date!).getTime() - today.getTime()) / (1000 * 3600 * 24))
                  const isLate = daysDiff < 0
                  return (
                    <Link href={`/projects/${p.id}`} key={p.id} className="flex justify-between items-center text-[13px] group">
                      <span className="text-slate-600 truncate mr-2 group-hover:text-orange-600">{p.customer_name}</span>
                      <span className={`font-semibold px-2 py-0.5 rounded-full ${isLate ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {isLate ? 'Atrasado' : `${daysDiff} dias`}
                      </span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-start gap-1">
                <span className="text-3xl font-bold text-slate-800">0</span>
                <span className="text-[13px] text-green-600 flex items-center gap-1"><Check className="w-3 h-3"/> Entregas sob controle</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* PROJECT LIST */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Car className="w-5 h-5 text-indigo-500" /> Lista de Veículos
        </h2>
        {safeProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {safeProjects.map((p) => {
              const status = statusLabels[p.status] || { label: p.status, class: 'bg-slate-100 text-slate-600' }
              
              // Project Alerts Logic
              const isLate = p.expected_delivery_date && p.status !== 'concluido' && new Date(p.expected_delivery_date) < new Date()
              const hasRejectedDocs = p.authorization_status === 'rejected' || p.declaration_status === 'rejected'
              const isPendenteSicovab = p.status !== 'concluido' && (!p.sicovab_protocol || p.sicovab_status === 'pending')
              const hasAlert = isLate || hasRejectedDocs || isPendenteSicovab

              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className={`soft-card p-5 block group hover:-translate-y-1 transition-all relative overflow-hidden ${
                    hasAlert ? 'border-l-4 border-l-red-400' : ''
                  }`}
                >
                  {/* Optional top gradient for alert feel - kept very subtle */}
                  {hasAlert && <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -z-10 opacity-50" />}
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-green-600 transition-colors flex items-center gap-1.5">
                        {p.customer_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <p className="text-sm text-slate-500">{p.vehicle_model || 'Veículo'} · {p.plate || 'Sem placa'}</p>
                        
                        {/* Status Badges for Issues */}
                        {hasRejectedDocs && (
                          <span className="flex items-center gap-0.5 text-[13px] font-medium text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                            <FileWarning className="w-3 h-3"/> Docs Rejeitados
                          </span>
                        )}
                        {isPendenteSicovab && (
                          <span className="flex items-center gap-0.5 text-[13px] font-medium text-purple-600 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded">
                            <ShieldAlert className="w-3 h-3"/> Pendente SICOVAB
                          </span>
                        )}
                        {isLate && (
                          <span className="flex items-center gap-0.5 text-[13px] font-medium text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded">
                            <Clock className="w-3 h-3"/> Atrasado
                          </span>
                        )}
                      </div>
                      
                      {/* Datas de Docs */}
                      {(p.auth_req_date || p.auth_app_date) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {p.auth_req_date && (
                             <span className="text-[13px] text-slate-400 font-medium whitespace-nowrap">
                               Auth. Solic: {new Date(p.auth_req_date).toLocaleDateString('pt-BR')}
                             </span>
                          )}
                          {p.auth_app_date && (
                             <span className="text-[13px] text-green-600 font-medium whitespace-nowrap">
                               Auth. Aprov: {new Date(p.auth_app_date).toLocaleDateString('pt-BR')}
                             </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`stage-badge ${status.class}`}>{status.label}</span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-[13px] text-slate-500 mb-1">
                      <span>Progresso</span>
                      <span className="font-semibold">{p.overall_progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className={`progress-bar-fill ${hasAlert ? 'bg-red-500' : ''}`} style={{ width: `${p.overall_progress}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                    <span className="text-[13px] text-slate-400 font-medium">
                      {p.contract_value
                        ? `R$ ${Number(p.contract_value).toLocaleString('pt-BR')}`
                        : 'Valor a definir'}
                    </span>
                    <ArrowRight className={`w-4 h-4 transition-colors ${hasAlert ? 'text-red-300 group-hover:text-red-500' : 'text-slate-300 group-hover:text-green-500'}`} />
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="soft-card p-12 text-center border-dashed">
            <p className="text-slate-400 mb-4">A oficina está vazia. Nenhum projeto ainda.</p>
            <Link href="/projects/new" className="btn-primary inline-flex">
              <Plus className="w-4 h-4" /> Cadastrar Primeiro Veículo
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
