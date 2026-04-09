import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import StageList from './StageList'
import ProjectMaterials from './ProjectMaterials'
import VehicleEntryForm from './VehicleEntryForm'
import DocumentsSection from './DocumentsSection'
import { ArrowLeft, Car, Hash, Calendar, DollarSign, Gauge, Shield, Receipt, TrendingUp, Filter, Milestone, Printer } from 'lucide-react'
import Link from 'next/link'
import PDFDownloadButton from '@/components/PDFDownloadButton'
import OrdemServicoPDF from '@/components/OrdemServicoPDF'
import MarkAsDeliveredButton from './MarkAsDeliveredButton'

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
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('production_stages').select('*').eq('project_id', id).order('stage_order'),
    supabase.from('project_materials').select('*, materials(name)').eq('project_id', id),
    supabase.from('materials').select('id, name, quantity_in_stock').order('name'),
    supabase.from('profiles').select('id, full_name').order('full_name'),
    supabase.from('documents').select('*').eq('project_id', id).order('uploaded_at', { ascending: false }),
    supabase.from('financials').select('*').eq('project_id', id).order('created_at'),
  ])

  if (!project) notFound()


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

  const financialsArray = arguments[0]?.[6]?.data || [] // Wait, Promise.all order

  const projectFinancials = {
    income: financialsArray.filter((f: any) => f.type === 'income').reduce((acc: number, f: any) => acc + Number(f.amount), 0),
    expense: financialsArray.filter((f: any) => f.type === 'expense').reduce((acc: number, f: any) => acc + Number(f.amount), 0),
    balance: 0
  }
  projectFinancials.balance = projectFinancials.income - projectFinancials.expense

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Link href="/projects" className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors flex-shrink-0 mt-0.5">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-800">{project.customer_name}</h1>
            <span className={`stage-badge ${statusColors[project.status] || 'bg-slate-100 text-slate-600'}`}>
              {statusLabels[project.status] || project.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            {project.vehicle_model && (
              <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5" /> {project.vehicle_model}</span>
            )}
            {project.plate && (
              <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {project.plate}</span>
            )}
            {project.odometer_entry && (
              <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5" /> {project.odometer_entry.toLocaleString('pt-BR')} km</span>
            )}
            {project.expected_delivery_date && (
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(project.expected_delivery_date).toLocaleDateString('pt-BR')}</span>
            )}
            {project.contract_value && (
              <span className="flex items-center gap-1 font-semibold text-green-600"><DollarSign className="w-3.5 h-3.5" /> R$ {Number(project.contract_value).toLocaleString('pt-BR')}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
            className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-sm flex-shrink-0"
          >
            <Printer className="w-4 h-4" /> Gerar O.S.
          </PDFDownloadButton>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="soft-card p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="font-semibold text-slate-800">Progresso Geral</h2>
            <p className="text-xs text-slate-400 mt-0.5">{completedStages} de {totalStages} etapas concluídas</p>
          </div>
          <span className="text-3xl font-bold text-green-600">{project.overall_progress}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-700"
            style={{ width: `${project.overall_progress}%` }}
          />
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
            <p className="text-xs text-slate-500">{project.warranty_months || 24} meses a partir da entrega</p>
          </div>
          {project.satisfaction_rating && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Avaliação do cliente</p>
              <p className="text-lg">{Array.from({ length: project.satisfaction_rating }).map(() => '⭐').join('')}</p>
            </div>
          )}
        </div>
      )}

      {/* Production Timeline + Materials Grid + Finance Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 soft-card p-6">
          <h2 className="font-semibold text-slate-800 mb-6">12 Etapas de Blindagem</h2>
          <StageList stages={stages || []} projectId={project.id} teamMembers={teamMembers || []} />
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
                <span className="font-semibold text-red-600">R$ {projectFinancials.expense.toLocaleString('pt-BR')}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-700">Margem (Lucro)</span>
                <span className={`font-bold ${projectFinancials.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {projectFinancials.balance.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
            
            <Link href="/financial" className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold w-full block text-center bg-indigo-50 hover:bg-indigo-100 py-2 rounded-lg transition-colors">
              Detalhar Financeiro
            </Link>
          </div>
        </div>
      </div>

      {/* Timeline Visual de Eventos */}
      <div className="soft-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Milestone className="w-5 h-5 text-slate-500" />
          <h2 className="font-semibold text-slate-800">Linha do Tempo (Eventos)</h2>
        </div>
        
        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
          
          <div className="relative">
            <div className="absolute -left-7 top-1 w-2.5 h-2.5 bg-green-500 rounded-full ring-4 ring-green-50"></div>
            <p className="text-sm font-semibold text-slate-800">Criação do Projeto (Contrato)</p>
            <p className="text-xs text-slate-400">{new Date(project.created_at).toLocaleString('pt-BR')}</p>
          </div>

          {project.entry_completed_at && (
            <div className="relative">
              <div className="absolute -left-7 top-1 w-2.5 h-2.5 bg-blue-500 rounded-full ring-4 ring-blue-50"></div>
              <p className="text-sm font-semibold text-slate-800">Checklist de Entrada Concluído</p>
              <p className="text-xs text-slate-400">{new Date(project.entry_completed_at).toLocaleString('pt-BR')}</p>
            </div>
          )}

          {stages?.filter(s => s.status === 'completed').map((stage) => (
            <div key={stage.id} className="relative">
              <div className="absolute -left-7 top-1 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-4 ring-indigo-50"></div>
              <p className="text-sm font-semibold text-slate-800">Etapa Concluída: {stage.stage_name}</p>
              <p className="text-xs text-slate-400">{stage.completed_at ? new Date(stage.completed_at).toLocaleString('pt-BR') : ''}</p>
            </div>
          ))}

          {project.status === 'concluido' && (
            <div className="relative">
              <div className="absolute -left-7 top-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-4 ring-amber-50"></div>
              <p className="text-sm font-semibold text-slate-800">Entrega Finalizada</p>
              <p className="text-xs text-slate-400">Veículo entregue ao cliente.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
