'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { CheckCircle, Clock, Circle, ChevronDown, ChevronUp } from 'lucide-react'

type Stage = {
  id: string
  stage_name: string
  stage_order: number
  status: string
  notes: string | null
  started_at: string | null
  completed_at: string | null
}

export default function StageList({ stages: initialStages, projectId }: { stages: Stage[]; projectId: string }) {
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  async function updateStageStatus(stageId: string, newStatus: string) {
    setLoading(stageId)
    const now = new Date().toISOString()
    const updates: Partial<Stage> = { status: newStatus }

    if (newStatus === 'in_progress') updates.started_at = now
    if (newStatus === 'completed') updates.completed_at = now

    const { data } = await supabase
      .from('production_stages')
      .update(updates)
      .eq('id', stageId)
      .select()
      .single()

    if (data) {
      setStages(prev => prev.map(s => s.id === stageId ? { ...s, ...data } : s))
    }
    setLoading(null)
  }

  async function saveNotes(stageId: string, notes: string) {
    await supabase.from('production_stages').update({ notes }).eq('id', stageId)
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, notes } : s))
  }

  return (
    <div className="space-y-2">
      {stages.map((stage) => {
        const isExpanded = expanded === stage.id

        const statusConfig = {
          pending: { icon: Circle, label: 'Pendente', class: 'stage-pending' },
          in_progress: { icon: Clock, label: 'Em Andamento', class: 'stage-in_progress' },
          completed: { icon: CheckCircle, label: 'Concluída', class: 'stage-completed' },
        }[stage.status] || { icon: Circle, label: stage.status, class: 'stage-pending' }

        const Icon = statusConfig.icon

        return (
          <div key={stage.id} className="border border-slate-100 rounded-xl overflow-hidden">
            {/* Stage Row */}
            <div
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors ${stage.status === 'completed' ? 'bg-green-50/50' : 'bg-white'}`}
              onClick={() => setExpanded(isExpanded ? null : stage.id)}
            >
              <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                {stage.stage_order}
              </span>
              <Icon className={`w-4 h-4 flex-shrink-0 ${stage.status === 'completed' ? 'text-green-500' : stage.status === 'in_progress' ? 'text-yellow-500' : 'text-slate-300'}`} />
              <span className={`flex-1 text-sm font-medium ${stage.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                {stage.stage_name}
              </span>
              <span className={`stage-badge ${statusConfig.class} mr-2`}>{statusConfig.label}</span>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>

            {/* Expanded Controls */}
            {isExpanded && (
              <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100 space-y-3 pt-3">
                {/* Status Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {stage.status !== 'in_progress' && stage.status !== 'completed' && (
                    <button
                      onClick={() => updateStageStatus(stage.id, 'in_progress')}
                      disabled={loading === stage.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
                    >
                      ▶ Iniciar Etapa
                    </button>
                  )}
                  {stage.status !== 'completed' && (
                    <button
                      onClick={() => updateStageStatus(stage.id, 'completed')}
                      disabled={loading === stage.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                    >
                      ✓ Marcar Concluída
                    </button>
                  )}
                  {stage.status === 'completed' && (
                    <button
                      onClick={() => updateStageStatus(stage.id, 'pending')}
                      disabled={loading === stage.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                    >
                      ↩ Reverter
                    </button>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Observações</label>
                  <textarea
                    defaultValue={stage.notes || ''}
                    rows={2}
                    placeholder="Adicionar observação sobre esta etapa..."
                    onBlur={(e) => saveNotes(stage.id, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  />
                </div>

                {/* Timestamps */}
                {(stage.started_at || stage.completed_at) && (
                  <div className="text-xs text-slate-400 space-y-0.5">
                    {stage.started_at && <p>Iniciada em: {new Date(stage.started_at).toLocaleString('pt-BR')}</p>}
                    {stage.completed_at && <p>Concluída em: {new Date(stage.completed_at).toLocaleString('pt-BR')}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
