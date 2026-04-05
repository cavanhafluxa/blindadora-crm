import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import StageList from './StageList'
import ProjectMaterials from './ProjectMaterials'
import VehicleEntryForm from './VehicleEntryForm'
import DocumentsSection from './DocumentsSection'
import { ArrowLeft, Car, Hash, Calendar, DollarSign, Gauge, Shield, Palette, CheckCircle, FileWarning, MapPin } from 'lucide-react'
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
  
  // Dashboard Extractions
  const currentStage = stages?.find(s => s.status === 'in_progress')?.stage_name || 'Nenhuma etapa em andamento'
  const hasRejectedDocs = project.authorization_status === 'rejected' || project.declaration_status === 'rejected'
  const docsApproved = project.authorization_status === 'approved' && project.declaration_status === 'approved'
  const vehiclePhoto = project.entry_photos && Array.isArray(project.entry_photos) && project.entry_photos.length > 0 
    ? project.entry_photos[0] 
    : null

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Back Button */}
      <div>
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para projetos
        </Link>
      </div>

      {/* Hero Vehicle Dashboard (Inspired by Visual Reference) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="flex flex-col md:flex-row">
          
          {/* Left: Full Height Image Block */}
          <div className="w-full md:w-[35%] lg:w-[30%] relative min-h-[320px] bg-slate-100 flex items-center justify-center overflow-hidden">
            {vehiclePhoto ? (
               <Image 
                src={vehiclePhoto} 
                alt="Foto do Veículo" 
                fill 
                className="object-cover"
              />
            ) : (
                <div className="text-center p-6 flex flex-col items-center">
                  <Car className="w-16 h-16 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-400">Sem Foto</p>
                </div>
            )}
            {/* Status Badge over the image like in reference "Top Pick" */}
            <div className={`absolute top-4 left-4 px-2.5 py-1 rounded text-[11px] uppercase tracking-wider font-bold shadow-sm ${
              project.status === 'producao' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white'
            }`}>
              {statusLabels[project.status] || 'Ativo'}
            </div>
          </div>

          {/* Right: Details Container */}
          <div className="w-full md:w-[65%] lg:w-[70%] p-6 md:p-8 flex flex-col">
            
            {/* Top row: Title and Price */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 pb-6 border-b border-slate-100 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {project.vehicle_model || 'Modelo não informado'}
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  {project.customer_name} · <span className="text-indigo-600">Oficina Principal</span>
                </p>
              </div>
              
              <div className="sm:text-right">
                <p className="text-[11px] font-bold text-indigo-500 mb-0.5 uppercase tracking-wider">
                  Valor do Contrato
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {project.contract_value ? `R$ ${Number(project.contract_value).toLocaleString('pt-BR')}` : 'Sob Consulta'}
                </p>
              </div>
            </div>

            {/* Middle row: Specs grid (like the 4 seats, manual icons in image) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4 mb-8">
              <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                <Hash className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                <span className="uppercase">{project.plate || 'Sem placa'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                <span>{project.vehicle_year || 'Ano N/D'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                <Palette className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                <span className="capitalize">{project.vehicle_color || 'Cor N/D'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-600 font-medium">
                <Gauge className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                <span>{project.odometer_entry ? `${project.odometer_entry.toLocaleString('pt-BR')} km` : 'KM N/D'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-medium">
                {hasRejectedDocs ? <FileWarning className="w-4 h-4 text-red-500 flex-shrink-0"/> : <CheckCircle className={`w-4 h-4 flex-shrink-0 ${docsApproved ? 'text-green-500' : 'text-slate-400'}`} />}
                <span className={hasRejectedDocs ? 'text-red-600' : (docsApproved ? 'text-green-700' : 'text-slate-500')}>
                  {hasRejectedDocs ? 'Docs Rejeitados' : (docsApproved ? 'Docs Aprovados' : 'Docs Pendentes')}
                </span>
              </div>
            </div>

            {/* Bottom row: Special badge (like "Winter tyres included") */}
            <div className="mt-auto">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700">
                 <Shield className="w-4 h-4 text-indigo-500" />
                 Etapa Atual: <span className="font-bold">{currentStage}</span>
              </div>
            </div>

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
