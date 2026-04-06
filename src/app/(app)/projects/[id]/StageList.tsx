'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  CheckCircle2, Clock, Circle, ChevronDown, ChevronUp,
  Camera, UserCircle2, Loader2, ImageIcon, X, Upload
} from 'lucide-react'

type Profile = { id: string; full_name: string | null }

type Photo = { id: string; photo_url: string; uploaded_at: string }

type Stage = {
  id: string
  stage_name: string
  stage_order: number
  status: string
  notes: string | null
  started_at: string | null
  completed_at: string | null
  assigned_to: string | null
  completion_percentage: number
}

const STATUS_MAP = {
  pending: { label: 'Pendente', color: 'text-slate-400', bg: 'bg-slate-100', bar: 'bg-slate-200' },
  in_progress: { label: 'Em Andamento', color: 'text-amber-600', bg: 'bg-amber-100', bar: 'bg-amber-400' },
  completed: { label: 'Concluída', color: 'text-green-600', bg: 'bg-green-100', bar: 'bg-green-500' },
}

export default function StageList({
  stages: initialStages,
  projectId,
  teamMembers,
}: {
  stages: Stage[]
  projectId: string
  teamMembers: Profile[]
}) {
  const supabase = createClient()
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [photos, setPhotos] = useState<Record<string, Photo[]>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeUploadStage, setActiveUploadStage] = useState<string | null>(null)

  async function loadPhotos(stageId: string) {
    if (photos[stageId]) return
    const { data } = await supabase
      .from('stage_photos')
      .select('id, photo_url, uploaded_at')
      .eq('stage_id', stageId)
      .order('uploaded_at')
    setPhotos(prev => ({ ...prev, [stageId]: data || [] }))
  }

  async function toggleExpand(stageId: string) {
    if (expanded === stageId) {
      setExpanded(null)
    } else {
      setExpanded(stageId)
      await loadPhotos(stageId)
    }
  }

  async function updateStage(stageId: string, updates: Partial<Stage>) {
    setLoading(stageId)
    const now = new Date().toISOString()
    const extra: Partial<Stage> = {}

    if (updates.status === 'in_progress' && !stages.find(s => s.id === stageId)?.started_at) {
      extra.started_at = now
    }
    if (updates.status === 'completed') {
      extra.completed_at = now
      extra.completion_percentage = 100
    }
    if (updates.status === 'pending') {
      extra.started_at = null
      extra.completed_at = null
      extra.completion_percentage = 0
    }

    const payload = { ...updates, ...extra }
    const { data } = await supabase
      .from('production_stages')
      .update(payload)
      .eq('id', stageId)
      .select()
      .single()

    if (data) setStages(prev => prev.map(s => s.id === stageId ? { ...s, ...data } : s))
    setLoading(null)
  }

  async function handlePhotoUpload(stageId: string, file: File) {
    setUploading(stageId)
    const ext = file.name.split('.').pop()
    const path = `${projectId}/${stageId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('stage-photos')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      alert('Erro no upload: ' + uploadError.message)
      setUploading(null)
      return
    }

    const { data: urlData } = supabase.storage.from('stage-photos').getPublicUrl(path)
    const publicUrl = urlData.publicUrl

    const { data: photoRecord } = await supabase
      .from('stage_photos')
      .insert({ stage_id: stageId, photo_url: publicUrl })
      .select()
      .single()

    if (photoRecord) {
      setPhotos(prev => ({
        ...prev,
        [stageId]: [...(prev[stageId] || []), photoRecord as Photo]
      }))
    }
    setUploading(null)
  }

  async function deletePhoto(stageId: string, photoId: string) {
    await supabase.from('stage_photos').delete().eq('id', photoId)
    setPhotos(prev => ({
      ...prev,
      [stageId]: prev[stageId]?.filter(p => p.id !== photoId) || []
    }))
  }

  const completedCount = stages.filter(s => s.status === 'completed').length

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async e => {
          const files = e.target.files
          if (files && files.length > 0 && activeUploadStage) {
            for (let i = 0; i < files.length; i++) {
              await handlePhotoUpload(activeUploadStage, files[i])
            }
          }
          e.target.value = ''
        }}
      />

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-slate-100 z-0" />

        <div className="space-y-3 relative z-10">
          {stages.map((stage, index) => {
            const config = STATUS_MAP[stage.status as keyof typeof STATUS_MAP] || STATUS_MAP.pending
            const isExpanded = expanded === stage.id
            const isLoading = loading === stage.id
            const isUploading = uploading === stage.id
            const stagePhotos = photos[stage.id] || []
            const teamMember = teamMembers.find(m => m.id === stage.assigned_to)

            return (
              <div key={stage.id} className="relative pl-12">
                {/* Timeline dot */}
                <div className={`absolute left-0 top-4 w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
                  stage.status === 'completed'
                    ? 'bg-green-500 border-green-500 text-white'
                    : stage.status === 'in_progress'
                    ? 'bg-amber-400 border-amber-400 text-white'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}>
                  {stage.status === 'completed'
                    ? <CheckCircle2 className="w-5 h-5" />
                    : stage.status === 'in_progress'
                    ? <Clock className="w-5 h-5" />
                    : index + 1
                  }
                </div>

                {/* Stage card */}
                <div className={`rounded-xl border overflow-hidden transition-all ${
                  stage.status === 'completed' ? 'border-green-200 bg-green-50/40' :
                  stage.status === 'in_progress' ? 'border-amber-200 bg-amber-50/40' :
                  'border-slate-200 bg-white'
                }`}>
                  {/* Card header */}
                  <div
                    className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-black/[0.02] transition-colors"
                    onClick={() => toggleExpand(stage.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${stage.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {stage.stage_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                        {teamMember && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <UserCircle2 className="w-3 h-3" /> {teamMember.full_name}
                          </span>
                        )}
                        {stagePhotos.length > 0 && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> {stagePhotos.length} foto{stagePhotos.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mini progress bar */}
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className={`h-full rounded-full transition-all ${config.bar}`}
                        style={{ width: `${stage.completion_percentage || 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right flex-shrink-0">{stage.completion_percentage || 0}%</span>

                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    }
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 space-y-4 bg-white">
                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {stage.status === 'pending' && (
                          <button
                            disabled={isLoading}
                            onClick={() => updateStage(stage.id, { status: 'in_progress' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '▶'} Iniciar Etapa
                          </button>
                        )}
                        {stage.status !== 'completed' && (
                          <button
                            disabled={isLoading}
                            onClick={() => updateStage(stage.id, { status: 'completed', completion_percentage: 100 })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '✓'} Marcar Concluída
                          </button>
                        )}
                        {stage.status === 'completed' && (
                          <button
                            disabled={isLoading}
                            onClick={() => updateStage(stage.id, { status: 'pending' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                          >
                            ↩ Reverter
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActiveUploadStage(stage.id)
                            fileInputRef.current?.click()
                          }}
                          disabled={isUploading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 ml-auto"
                        >
                          {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          {isUploading ? 'Enviando...' : 'Upload Foto'}
                        </button>
                      </div>

                      {/* Percentual manual */}
                      {stage.status === 'in_progress' && (
                        <div>
                          <label className="text-xs font-medium text-slate-500 block mb-1.5">
                            Percentual de Conclusão: <span className="text-amber-600 font-bold">{stage.completion_percentage}%</span>
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={stage.completion_percentage}
                            onChange={e => {
                              const val = parseInt(e.target.value)
                              setStages(prev => prev.map(s => s.id === stage.id ? { ...s, completion_percentage: val } : s))
                            }}
                            onMouseUp={e => updateStage(stage.id, { completion_percentage: parseInt((e.target as HTMLInputElement).value) })}
                            className="w-full accent-amber-500"
                          />
                        </div>
                      )}

                      {/* Atribuição de técnico */}
                      {teamMembers.length > 0 && (
                        <div>
                          <label className="text-xs font-medium text-slate-500 block mb-1.5 flex items-center gap-1">
                            <UserCircle2 className="w-3.5 h-3.5" /> Responsável Técnico
                          </label>
                          <select
                            value={stage.assigned_to || ''}
                            onChange={e => updateStage(stage.id, { assigned_to: e.target.value || null })}
                            className="w-full max-w-xs px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                          >
                            <option value="">Não atribuído</option>
                            {teamMembers.map(m => (
                              <option key={m.id} value={m.id}>{m.full_name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Photo gallery */}
                      {stagePhotos.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5" /> Galeria de Evidências ({stagePhotos.length})
                          </p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {stagePhotos.map(photo => (
                              <div key={photo.id} className="relative group aspect-square">
                                <img
                                  src={photo.photo_url}
                                  alt="Evidência"
                                  className="w-full h-full object-cover rounded-lg border border-slate-200"
                                />
                                <button
                                  onClick={() => deletePhoto(stage.id, photo.id)}
                                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <p className="text-[10px] text-slate-400 mt-0.5 text-center">
                                  {new Date(photo.uploaded_at).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notas */}
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-1.5">Notas e Observações</label>
                        <textarea
                          defaultValue={stage.notes || ''}
                          rows={2}
                          placeholder="Registre observações sobre esta etapa..."
                          onBlur={e => updateStage(stage.id, { notes: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white resize-none"
                        />
                      </div>

                      {/* Timestamps */}
                      {(stage.started_at || stage.completed_at) && (
                        <div className="flex gap-4 text-xs text-slate-400">
                          {stage.started_at && <span>▶ Iniciada: {new Date(stage.started_at).toLocaleString('pt-BR')}</span>}
                          {stage.completed_at && <span>✓ Concluída: {new Date(stage.completed_at).toLocaleString('pt-BR')}</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
        <span>{completedCount} de {stages.length} etapas concluídas</span>
        <span className="font-semibold text-slate-700">
          {stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : 0}% completo
        </span>
      </div>
    </div>
  )
}
