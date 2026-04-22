import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import StageList from './StageList'
import ProjectMaterials from './ProjectMaterials'
import VehicleEntryForm from './VehicleEntryForm'
import DocumentsSection from './DocumentsSection'
import ProjectCostPanel from './ProjectCostPanel'
import { ArrowLeft, Car, Hash, Calendar, DollarSign, Gauge, Shield, Receipt, TrendingUp, Filter, Milestone, Printer, FileSignature, ClipboardCheck, CheckCircle2, Clock, User } from 'lucide-react'
import Link from 'next/link'
import PDFDownloadButton from '@/components/PDFDownloadButton'
import OrdemServicoPDF from '@/components/OrdemServicoPDF'
import ContractPDF from '@/components/ContractPDF'
import MarkAsDeliveredButton from './MarkAsDeliveredButton'
import CatalogPublishSection from './CatalogPublishSection'
import ProjectTimeline from './ProjectTimeline'
import CollapsibleTimelineWrapper from './CollapsibleTimelineWrapper'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const [
    { data: project },
    { data: stages },
    { data: projectMaterials },
    { data: allMaterials },
    { data: teamMembers },
    { data: documents },
    { data: projectPurchases },
    { data: stockOutflows },
    { data: financials },
    { data: project_events },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('production_stages').select('*').eq('project_id', id).order('stage_order'),
    supabase.from('project_materials').select('*, materials(name)').eq('project_id', id),
    supabase.from('materials').select('id, name, quantity_in_stock').order('name'),
    supabase.from('profiles').select('id, full_name').order('full_name'),
    supabase.from('documents').select('*').eq('project_id', id).order('uploaded_at', { ascending: false }),
    supabase.from('project_purchases').select('*').eq('project_id', id).order('purchase_date', { ascending: false }),
    supabase.from('stock_movements').select('quantity, unit_cost').eq('project_id', id).eq('movement_type', 'out'),
    supabase.from('financials').select('*').eq('project_id', id).order('created_at'),
    supabase.from('project_events').select('*, profiles(full_name)').eq('project_id', id).order('created_at', { ascending: false }),
  ])

  if (!project) notFound()

  // Ensure project_events is an array even if the query fails or returns null
  const eventsData = project_events || []

  // Custo de materiais: soma das saídas de estoque vinculadas ao projeto
  const materialCost = (stockOutflows || []).reduce((acc, m) => acc + (Number(m.unit_cost || 0) * Number(m.quantity)), 0)


  const statusColors: Record<string, string> = {
    producao: 'bg-blue-100 text-blue-700',
    revisao: 'bg-yellow-100 text-yellow-700',
    concluido: 'bg-green-100 text-green-700',
  }

  const statusLabels: Record<string, string> = {
    producao: 'Em Produção',
    revisao: 'Em Revisão',
    concluido: 'Concluído',
  }

  const completedStages = stages?.filter(s => s.status === 'completed').length || 0
  const totalStages = stages?.length || 12
  
  const currentStage = stages?.find(s => s.status === 'in_progress');
  const currentStageName = currentStage ? currentStage.stage_name : (project.overall_progress === 100 ? 'Finalizado' : 'Aguardando Início');

  const financialsArray = financials || []

  const projectFinancials = {
    income: financialsArray.filter((f: any) => f.type === 'income').reduce((acc: number, f: any) => acc + Number(f.amount), 0),
    expense: financialsArray.filter((f: any) => f.type === 'expense').reduce((acc: number, f: any) => acc + Number(f.amount), 0),
    balance: 0
  }
  projectFinancials.balance = projectFinancials.income - projectFinancials.expense

  return (
    <div className="px-6 py-6 space-y-8 max-w-[1400px] mx-auto w-full">
      {/* Header / Vehicle Info */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 relative group/header">
        {/* Back button */}
        <Link 
          href="/projects" 
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#111111] hover:border-slate-200 hover:shadow-sm transition-all z-10"
          title="Voltar aos Projetos"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Vehicle Image */}
        <div className="w-full md:w-[380px] h-[240px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-[16px] flex items-center justify-center overflow-hidden border border-slate-100/60 flex-shrink-0 relative group">
          {project.vehicle_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.vehicle_image} alt={project.vehicle_model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="text-center flex flex-col items-center justify-center text-slate-400 transition-transform duration-500 group-hover:scale-105">
              <Car className="w-16 h-16 mb-3 opacity-20" />
              <span className="text-sm font-medium">Foto do Veículo</span>
            </div>
          )}
          
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm border ${
              project.status === 'concluido' ? 'bg-green-50 text-green-700 border-green-200' :
              project.status === 'revisao' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              'bg-[#111111] text-white border-transparent'
            }`}>
              {statusLabels[project.status] || project.status}
            </span>
          </div>
        </div>

        {/* Info Section - Dashboard Style */}
        <div className="flex-1 flex flex-col pt-2 w-full justify-between">
          <div>
            {/* Header Row: Client */}
            <div className="flex items-center gap-3 mb-5 pr-12">
              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shadow-sm">
                {project.customer_name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5 leading-none">Cliente</p>
                <h2 className="text-sm font-semibold text-slate-800 leading-none">{project.customer_name}</h2>
              </div>
            </div>

            {/* Vehicle Model & Badges & Value */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center flex-wrap gap-3 mb-2">
                  <h1 className="text-[28px] font-extrabold text-[#111111] tracking-tight leading-none">
                    {project.vehicle_model || 'Modelo não especificado'}
                  </h1>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 text-[10px] font-bold tracking-wide shadow-sm">
                      <Shield className="w-3 h-3 text-[#111111]" />
                      Nível {project.armor_type || 'III-A'}
                    </div>
                    {project.plate && (
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 text-[10px] font-bold tracking-wide uppercase shadow-sm">
                        <Hash className="w-3 h-3 text-slate-400" />
                        {project.plate}
                      </div>
                    )}
                  </div>
                </div>
                {project.odometer_entry !== null && project.odometer_entry !== undefined && (
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium pl-0.5 mt-1">
                    <Gauge className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-sm tracking-tight">{Number(project.odometer_entry).toLocaleString('pt-BR')} <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold ml-0.5">km</span></span>
                  </div>
                )}
              </div>
              
              <div className="sm:text-right shrink-0">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1.5 leading-none">Valor do Projeto</p>
                <div className="text-xl font-black text-slate-800 leading-none tracking-tight">
                  {project.contract_value ? `R$ ${Number(project.contract_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'A definir'}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            {/* Dashboard Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {/* Progress Metric */}
              <div className="lg:col-span-2 bg-slate-50/50 rounded-2xl p-4 border border-slate-100/60 flex flex-col justify-center transition-colors hover:bg-slate-50">
                <div className="flex justify-between items-center mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Progresso</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{project.overall_progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-200/60 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${project.overall_progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {completedStages} de {totalStages} etapas concluídas
                </p>
              </div>

              {/* Current Stage */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/60 flex flex-col justify-center relative overflow-hidden group/stage transition-colors hover:bg-slate-50">
                <div className="absolute -right-3 -bottom-3 opacity-5 transition-transform duration-500 group-hover/stage:scale-110">
                  <ClipboardCheck className="w-16 h-16" />
                </div>
                <div className="flex items-center gap-1.5 mb-2 relative z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Etapa Atual</span>
                </div>
                <span className="text-[13px] font-bold text-slate-800 leading-tight relative z-10 line-clamp-2">
                  {currentStageName}
                </span>
              </div>

              {/* Delivery / Deadline */}
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/60 flex flex-col justify-center relative overflow-hidden group/date transition-colors hover:bg-slate-50">
                <div className="absolute -right-3 -bottom-3 opacity-5 transition-transform duration-500 group-hover/date:scale-110">
                  <Clock className="w-16 h-16" />
                </div>
                <div className="flex items-center gap-1.5 mb-2 relative z-10">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Entrega</span>
                </div>
                <span className="text-[13px] font-bold text-slate-800 leading-tight relative z-10">
                  {project.expected_delivery_date ? new Date(project.expected_delivery_date).toLocaleDateString('pt-BR') : 'A definir'}
                </span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2">
              {project.status !== 'concluido' && (
                <MarkAsDeliveredButton 
                  projectId={project.id} 
                  organizationId={project.organization_id} 
                  vehicleModel={project.vehicle_model || ''}
                  plate={project.plate || ''}
                />
              )}
              <PDFDownloadButton
                document={<OrdemServicoPDF project={project} stages={stages || []} />}
                fileName={`OS_${project.chassis || project.plate || 'Projeto'}.pdf`}
                className="h-[38px] px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-[#111111] rounded-xl flex items-center gap-2 text-xs font-semibold transition-all shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> O.S.
              </PDFDownloadButton>
              <PDFDownloadButton
                document={<ContractPDF project={project} />}
                fileName={`Contrato_${(project.customer_name || 'Cliente').replace(/\s+/g, '_')}.pdf`}
                className="h-[38px] px-4 bg-[#111111] text-white hover:bg-black rounded-xl flex items-center gap-2 text-xs font-semibold transition-all shadow-sm"
              >
                <FileSignature className="w-3.5 h-3.5" /> Contrato
              </PDFDownloadButton>
            </div>
          </div>
        </div>
      </div>
      {/* Vehicle Entry Checklist */}
      <VehicleEntryForm
        projectId={project.id}
        currentOdometer={project.odometer_entry}
        currentChecklist={project.entry_checklist}
        entryCompleted={!!project.entry_completed_at}
      />

      {/* Documents & Approvals */}
      <DocumentsSection
        projectId={project.id}
        initialFiles={documents || []}
        initialDocs={{
          authorization_status: project.authorization_status || 'pending_docs',
          authorization_notes: project.authorization_notes,
          declaration_status: project.declaration_status || 'pending_docs',
          declaration_notes: project.declaration_notes,
        }}
      />

      {/* Warranty */}
      {project.entry_completed_at && (
        <div className="soft-card p-5 mb-6 flex items-center gap-3">
          <Shield className="w-5 h-5 text-indigo-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">Garantia do Serviço</p>
            <p className="text-[13px] text-slate-500">{project.warranty_months || 24} meses a partir da entrega</p>
          </div>
          {project.satisfaction_rating && (
            <div className="text-right">
              <p className="text-[13px] text-slate-500">Avaliação do cliente</p>
              <p className="text-lg">{Array.from({ length: project.satisfaction_rating }).map(() => '⭐').join('')}</p>
            </div>
          )}
        </div>
      )}

      {/* Production Timeline + Materials Grid + Finance Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 soft-card p-6">
          <h2 className="font-semibold text-slate-800 mb-6">12 Etapas de Blindagem</h2>
          <StageList stages={stages || []} projectId={project.id} organizationId={project.organization_id} teamMembers={teamMembers || []} />
        </div>
        <div className="flex flex-col gap-6">
          <ProjectMaterials
            projectId={project.id}
            initialProjectMaterials={projectMaterials as any || []}
            allMaterials={allMaterials as any || []}
          />
          
          {/* Fluxo de Caixa do Projeto */}
          <div className="soft-card p-6 border-t-4 border-indigo-500">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-indigo-500" />
              <h2 className="font-semibold text-slate-800">Fluxo de Caixa</h2>
            </div>
            
            <div className="space-y-4 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Receitas</span>
                <span className="font-semibold text-green-600">R$ {projectFinancials.income.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Despesas (Custos)</span>
                <span className="font-bold text-red-600 text-lg">R$ {projectFinancials.expense.toLocaleString('pt-BR')}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700">Margem (Lucro)</span>
                <span className={`font-black text-xl ${projectFinancials.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {projectFinancials.balance.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
            
            <Link href="/financial" className="text-indigo-600 hover:text-indigo-700 text-[13px] font-semibold w-full block text-center bg-indigo-50 hover:bg-indigo-100 py-2 rounded-lg transition-colors">
              Detalhar Financeiro
            </Link>
          </div>
        </div>
      </div>
      
      {/* Catalog Publish */}
      <div className="mb-8">
        <CatalogPublishSection project={project} />
      </div>

      {/* Painel de Custos & Compras Específicas */}
      <ProjectCostPanel
        projectId={project.id}
        organizationId={project.organization_id}
        contractValue={Number(project.contract_value || 0)}
        initialPurchases={projectPurchases as any || []}
        materialCost={materialCost}
      />

      {/* Timeline Visual de Eventos */}
      <CollapsibleTimelineWrapper>
        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          
          <div className="relative">
            <div className="absolute -left-7 top-1 bottom-0 flex flex-col items-center">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full ring-4 ring-green-50 z-10"></div>
            </div>
            <div className="flex flex-col gap-2 pb-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-200 bg-emerald-50 text-emerald-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-1 mb-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Criação do Projeto (Contrato)
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User className="w-3 h-3" />
                      </div>
                      <span>Sistema Automático</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(project.created_at).toLocaleDateString('pt-BR')} às {new Date(project.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ProjectTimeline initialEvents={eventsData} projectId={project.id} teamMembers={teamMembers || []} />

          {project.entry_completed_at && !eventsData?.find((e: any) => e.description?.includes('Checklist')) && (
            <div className="relative">
              <div className="absolute -left-7 top-1 bottom-0 flex flex-col items-center">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full ring-4 ring-blue-50 z-10"></div>
              </div>
              <div className="flex flex-col gap-2 pb-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-200 bg-blue-50 text-blue-500">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-1 mb-3">
                      <p className="text-sm font-semibold text-slate-800">
                        Checklist de Entrada Concluído
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User className="w-3 h-3" />
                        </div>
                        <span>Sistema Automático</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(project.entry_completed_at).toLocaleDateString('pt-BR')} às {new Date(project.entry_completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {project.status === 'concluido' && (
            <div className="relative">
              <div className="absolute -left-7 top-1 bottom-0 flex flex-col items-center">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full ring-4 ring-amber-50 z-10"></div>
              </div>
              <div className="flex flex-col gap-2 pb-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-amber-200 bg-amber-50 text-amber-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-1 mb-3">
                      <p className="text-sm font-semibold text-slate-800">
                        Entrega Finalizada
                      </p>
                      <p className="text-[13px] text-slate-500">Veículo entregue ao cliente.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </CollapsibleTimelineWrapper>
    </div>
  )
}
