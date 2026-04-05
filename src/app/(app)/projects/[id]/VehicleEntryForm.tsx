'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ClipboardCheck, CheckSquare, Square, Gauge, Camera, X } from 'lucide-react'

const CHECKLIST_ITEMS = [
  { key: 'pintura_ok', label: 'Pintura sem arranhões graves' },
  { key: 'lataria_ok', label: 'Lataria sem amassados' },
  { key: 'vidros_ok', label: 'Vidros originais intactos' },
  { key: 'radio_ok', label: 'Rádio / Central multimídia funcionando' },
  { key: 'ar_condicionado_ok', label: 'Ar-condicionado funcionando' },
  { key: 'eletrica_ok', label: 'Sistema elétrico OK (faróis, lanterna)' },
  { key: 'pneus_ok', label: 'Pneus calibrados e sem dano aparente' },
  { key: 'estepe_ok', label: 'Estepe presente no veículo' },
  { key: 'macaco_ok', label: 'Macaco e chave de roda presentes' },
  { key: 'documentos_ok', label: 'Documentos do veículo conferidos' },
  { key: 'chaves_ok', label: 'Todas as chaves recebidas' },
  { key: 'sinistro_ausente', label: 'Ausência de sinistros anteriores visíveis' },
]

type Props = {
  projectId: string
  currentOdometer: number | null
  currentChecklist: Record<string, boolean> | null
  entryCompleted: boolean
}

export default function VehicleEntryForm({ projectId, currentOdometer, currentChecklist, entryCompleted }: Props) {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(!entryCompleted)
  const [saved, setSaved] = useState(entryCompleted)
  const [odometer, setOdometer] = useState(currentOdometer?.toString() || '')
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    currentChecklist || Object.fromEntries(CHECKLIST_ITEMS.map(i => [i.key, false]))
  )
  const [saving, setSaving] = useState(false)

  function toggle(key: string) {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('projects').update({
      odometer_entry: parseInt(odometer) || 0,
      entry_checklist: checklist,
      entry_completed_at: new Date().toISOString(),
    }).eq('id', projectId)

    if (!error) {
      setSaved(true)
      setIsOpen(false)
    }
    setSaving(false)
  }

  const checkedCount = Object.values(checklist).filter(Boolean).length

  return (
    <div className={`rounded-2xl border-2 mb-6 overflow-hidden transition-all ${saved ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${saved ? 'bg-green-100' : 'bg-amber-100'}`}>
            <ClipboardCheck className={`w-5 h-5 ${saved ? 'text-green-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Entrada do Veículo</p>
            <p className="text-xs text-slate-500">
              {saved
                ? `✓ Checklist concluído — ${checkedCount}/${CHECKLIST_ITEMS.length} itens verificados`
                : `⚠ Pendente — preencha o checklist de recepção`}
            </p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${saved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {saved ? 'Concluído' : 'Pendente'}
        </span>
      </button>

      {/* Body */}
      {isOpen && (
        <div className="border-t border-amber-200 p-5 space-y-5 bg-white">
          {/* Odômetro */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Gauge className="w-4 h-4 text-slate-500" />
              Odômetro de Entrada (km)
            </label>
            <input
              type="number"
              placeholder="Ex: 45200"
              value={odometer}
              onChange={e => setOdometer(e.target.value)}
              className="w-full max-w-xs px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          {/* Checklist */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">
              Checklist de Avarias Pré-Existentes
              <span className="ml-2 text-xs font-normal text-slate-400">({checkedCount}/{CHECKLIST_ITEMS.length} itens OK)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CHECKLIST_ITEMS.map(item => (
                <button
                  key={item.key}
                  onClick={() => toggle(item.key)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all text-sm ${
                    checklist[item.key]
                      ? 'border-green-300 bg-green-50 text-green-800'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {checklist[item.key]
                    ? <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
                    : <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  }
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save button */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !odometer}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? 'Salvando...' : '✓ Confirmar Entrada do Veículo'}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
