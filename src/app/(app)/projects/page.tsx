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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Em produção */}
          <div className="bg-white rounded-[22px] px-6 py-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100/80 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl group-hover:bg-indigo-100/50 transition-colors" />
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-500 text-[13px] uppercase tracking-wider">Fabricação</h3>
            </div>
            <div className="relative z-10">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-800 tracking-tight">{inProductionCount}</span>
                <span className="text-[13px] font-medium text-slate-500">ativos</span>
              </div>
              <p className="text-[13px] text-slate-400 mt-2 font-medium bg-slate-50 inline-block px-2 py-0.5 rounded-md">
                {completedCount} concluídos no total
              </p>
            </div>
          </div>

          {/* Card 2: Engarrafamento de Etapas */}
          <div className="bg-white rounded-[22px] px-6 py-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100/80 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50/50 rounded-full blur-2xl group-hover:bg-blue-100/50 transition-colors" />
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                <Box className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-500 text-[13px] uppercase tracking-wider">Radar de Etapas</h3>
            </div>
            <div className="relative z-10 flex-1 flex flex-col justify-end">
              {topStages.length > 0 ? (
                <div className="space-y-2.5">
                  {topStages.map(([name, count]) => (
                    <div key={name} className="flex justify-between items-center text-[13px]">
                      <span className="text-slate-600 font-medium truncate mr-2" title={name}>{name}</span>
                      <span className="font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-slate-400 italic">Nenhuma etapa ativa.</p>
              )}
            </div>
          </div>

          {/* Card 3: Documentos Rejeitados */}
          <div className="bg-white rounded-[22px] px-6 py-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100/80 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50/50 rounded-full blur-2xl group-hover:bg-rose-100/50 transition-colors" />
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="p-3 bg-rose-50 rounded-xl text-rose-600 group-hover:scale-110 transition-transform">
                <FileWarning className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-500 text-[13px] uppercase tracking-wider">Legais</h3>
            </div>
            <div className="relative z-10">
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black tracking-tight ${rejectedDocs.length > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {rejectedDocs.length}
                </span>
                <span className="text-[13px] font-medium text-slate-500">rejeições</span>
              </div>
              {rejectedDocs.length > 0 ? (
                <p className="text-[13px] text-rose-500 mt-2 line-clamp-1 font-medium bg-rose-50 inline-block px-2 py-0.5 rounded-md">
                  Verificar: {rejectedDocs[0].customer_name} {rejectedDocs.length > 1 ? `+${rejectedDocs.length - 1}` : ''}
                </p>
              ) : (
                <p className="text-[13px] text-emerald-600 mt-2 flex items-center gap-1.5 font-medium bg-emerald-50 inline-block px-2 py-0.5 rounded-md">
                  <Check className="w-3.5 h-3.5"/> Tudo em ordem
                </p>
              )}
            </div>
          </div>

          {/* Card 4: Atrasos / Prazos Apertados */}
          <div className="bg-white rounded-[22px] px-6 py-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100/80 flex flex-col justify-between hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50/50 rounded-full blur-2xl group-hover:bg-amber-100/50 transition-colors" />
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-500 text-[13px] uppercase tracking-wider">Atrasos</h3>
            </div>
            <div className="relative z-10 flex-1 flex flex-col justify-end">
              {atRiskProjects.length > 0 ? (
                <div className="space-y-2.5">
                  {atRiskProjects.slice(0, 3).map(p => {
                    const daysDiff = Math.ceil((new Date(p.expected_delivery_date!).getTime() - today.getTime()) / (1000 * 3600 * 24))
                    const isLate = daysDiff < 0
                    return (
                      <Link href={`/projects/${p.id}`} key={p.id} className="flex justify-between items-center text-[13px] group/item">
                        <span className="text-slate-600 font-medium truncate mr-2 group-hover/item:text-amber-600 transition-colors">{p.customer_name}</span>
                        <span className={`font-bold px-2 py-0.5 rounded-md ${isLate ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isLate ? 'Atrasado' : `${daysDiff} dias`}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-start gap-1">
                  <span className="text-4xl font-black text-slate-800 tracking-tight">0</span>
                  <span className="text-[13px] text-emerald-600 flex items-center gap-1.5 font-medium bg-emerald-50 inline-block px-2 py-0.5 rounded-md">
                    <Check className="w-3.5 h-3.5"/> Sob controle
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* PROJECT LIST */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          <Car className="w-5 h-5 text-indigo-500" /> Veículos em Execução
        </h2>
        {safeProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
                  className={`bg-white rounded-[22px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border block group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all relative overflow-hidden ${
                    hasAlert ? 'border-rose-200/60' : 'border-slate-100/80'
                  }`}
                >
                  {/* Subtle alert gradient */}
                  {hasAlert && <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/40 rounded-bl-[100px] -z-10 transition-opacity group-hover:opacity-100 opacity-50" />}
                  
                  <div className="flex justify-between items-start mb-4 relative z-10 gap-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-slate-800 text-[16px] group-hover:text-indigo-600 transition-colors flex items-center gap-1.5 leading-tight truncate">
                        {p.customer_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-[12px] font-medium text-slate-500 border border-slate-100">
                           <Car className="w-3.5 h-3.5 text-slate-400" /> {p.vehicle_model || 'Veículo'}
                        </span>
                        {p.plate && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-50 text-[12px] font-bold text-slate-600 border border-slate-100 uppercase tracking-widest">
                            {p.plate}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap ${status.class}`}>
                        {status.label}
                      </span>
                      {/* Vehicle Image Thumbnail */}
                      <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 flex items-center justify-center shadow-sm">
                        {p.vehicle_image ? (
                          <img src={p.vehicle_image} alt={p.vehicle_model || 'Veículo'} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                          <Car className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges for Issues */}
                  {hasAlert && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {hasRejectedDocs && (
                        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-tight text-rose-600 bg-rose-50 border border-rose-100/50 px-2 py-1 rounded-md">
                          <FileWarning className="w-3 h-3"/> Docs Rejeitados
                        </span>
                      )}
                      {isPendenteSicovab && (
                        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-tight text-purple-600 bg-purple-50 border border-purple-100/50 px-2 py-1 rounded-md">
                          <ShieldAlert className="w-3 h-3"/> SICOVAB Pend.
                        </span>
                      )}
                      {isLate && (
                        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-tight text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-1 rounded-md">
                          <Clock className="w-3 h-3"/> Atrasado
                        </span>
                      )}
                    </div>
                  )}

                  {/* Datas de Docs */}
                  {(p.auth_req_date || p.auth_app_date) && (
                    <div className="flex flex-wrap gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50">
                      {p.auth_req_date && (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Solicitado Exército</span>
                            <span className="text-[13px] text-slate-600 font-medium">
                              {new Date(p.auth_req_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                      )}
                      {p.auth_req_date && p.auth_app_date && <div className="w-[1px] bg-slate-200 mx-1" />}
                      {p.auth_app_date && (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Autorizado Exército</span>
                            <span className="text-[13px] text-emerald-700 font-bold">
                              {new Date(p.auth_app_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                      )}
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex justify-between text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      <span>Progresso Geral</span>
                      <span className="text-indigo-600">{p.overall_progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${hasAlert && p.overall_progress < 100 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${p.overall_progress}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100">
                    <span className="text-[14px] font-black tracking-tight text-slate-800">
                      {p.contract_value
                        ? `R$ ${Number(p.contract_value).toLocaleString('pt-BR')}`
                        : <span className="text-slate-400 font-medium text-[13px]">Valor a definir</span>}
                    </span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasAlert ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white' : 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white'}`}>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[22px] p-12 text-center border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Car className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhum veículo na oficina</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">A oficina está vazia no momento. Cadastre seu primeiro projeto para iniciar o acompanhamento.</p>
            <Link href="/projects/new" className="btn-primary inline-flex">
              <Plus className="w-4 h-4" /> Cadastrar Primeiro Veículo
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
