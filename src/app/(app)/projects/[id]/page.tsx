import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import StageList from './StageList'
import ProjectMaterials from './ProjectMaterials'
import VehicleEntryForm from './VehicleEntryForm'
import DocumentsSection from './DocumentsSection'
import { ArrowLeft, Car, Hash, Calendar, DollarSign, Gauge, Shield } from 'lucide-react'
import Link from 'next/link'

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

      {/* Production Timeline + Materials Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 soft-card p-6">
          <h2 className="font-semibold text-slate-800 mb-6">12 Etapas de Blindagem</h2>
          <StageList stages={stages || []} projectId={project.id} teamMembers={teamMembers || []} />
        </div>
        <div>
          <ProjectMaterials
            projectId={project.id}
            initialProjectMaterials={projectMaterials as any || []}
            allMaterials={allMaterials as any || []}
          />
        </div>
      </div>
    </div>
  )
}
