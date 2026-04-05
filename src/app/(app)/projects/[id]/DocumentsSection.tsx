'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FileCheck, FileX, Clock, Upload, Check, X, AlertCircle } from 'lucide-react'

type DocStatus = 'pending_docs' | 'pending_approval' | 'approved' | 'rejected'

type ProjectDocs = {
  authorization_status: DocStatus
  authorization_notes: string | null
  declaration_status: DocStatus
  declaration_notes: string | null
}

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending_docs: { label: 'Aguardando Docs', color: 'text-slate-600', bg: 'bg-slate-100', icon: Clock },
  pending_approval: { label: 'Em Aprovação', color: 'text-amber-700', bg: 'bg-amber-100', icon: AlertCircle },
  approved: { label: 'Aprovado', color: 'text-green-700', bg: 'bg-green-100', icon: Check },
  rejected: { label: 'Rejeitado', color: 'text-red-700', bg: 'bg-red-100', icon: X },
}

export default function DocumentsSection({ projectId, initialDocs }: { projectId: string; initialDocs: ProjectDocs | null }) {
  const supabase = createClient()
  const defaultDocs: ProjectDocs = {
    authorization_status: 'pending_docs',
    authorization_notes: null,
    declaration_status: 'pending_docs',
    declaration_notes: null,
  }
  const [docs, setDocs] = useState<ProjectDocs>(initialDocs || defaultDocs)
  const [saving, setSaving] = useState<string | null>(null)

  async function updateDoc(field: keyof ProjectDocs, value: string) {
    setSaving(field)
    const updated = { ...docs, [field]: value }
    setDocs(updated)
    await supabase.from('projects').update({
      [field]: value
    }).eq('id', projectId)
    setSaving(null)
  }

  function DocCard({
    title,
    description,
    statusKey,
    notesKey,
  }: {
    title: string
    description: string
    statusKey: 'authorization_status' | 'declaration_status'
    notesKey: 'authorization_notes' | 'declaration_notes'
  }) {
    const status = docs[statusKey] as DocStatus
    const notes = docs[notesKey] as string | null
    const cfg = STATUS_CONFIG[status]
    const Icon = cfg.icon

    return (
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-5 bg-white">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-semibold text-slate-800">{title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            </div>
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
              <Icon className="w-3.5 h-3.5" /> {cfg.label}
            </span>
          </div>

          {/* Status selector */}
          <div className="mb-3">
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Alterar Status</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as DocStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => updateDoc(statusKey, s)}
                  disabled={saving === statusKey}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                    status === s
                      ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} border-transparent`
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                  }`}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Observações / Motivo</label>
            <textarea
              rows={2}
              defaultValue={notes || ''}
              placeholder="Ex: aguardando DUT atualizado..."
              onBlur={e => updateDoc(notesKey, e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="soft-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <FileCheck className="w-5 h-5 text-indigo-500" />
        <h2 className="font-semibold text-slate-800">Documentações & Aprovações</h2>
      </div>

      <div className="space-y-4">
        <DocCard
          title="Autorização de Blindagem"
          description="Documento legal que autoriza a blindagem do veículo junto ao DETRAN/Exército"
          statusKey="authorization_status"
          notesKey="authorization_notes"
        />
        <DocCard
          title="Declaração de Blindagem"
          description="Declaração final emitida após conclusão da blindagem para registro"
          statusKey="declaration_status"
          notesKey="declaration_notes"
        />
      </div>

      {/* Status Summary */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-4 text-xs text-slate-500">
        <span>Autorização: <strong className={STATUS_CONFIG[docs.authorization_status].color}>{STATUS_CONFIG[docs.authorization_status].label}</strong></span>
        <span>Declaração: <strong className={STATUS_CONFIG[docs.declaration_status].color}>{STATUS_CONFIG[docs.declaration_status].label}</strong></span>
      </div>
    </div>
  )
}
