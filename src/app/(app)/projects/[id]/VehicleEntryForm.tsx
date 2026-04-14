'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ClipboardCheck, CheckSquare, Square, Gauge, Camera, X, Plus, Trash2, Loader2, PlayCircle } from 'lucide-react'

type ChecklistValue = {
  checked: boolean
  media_url?: string
  media_type?: 'image' | 'video'
  label?: string
  is_custom?: boolean
}

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
  currentChecklist: any | null
  entryCompleted: boolean
}

export default function VehicleEntryForm({ projectId, currentOdometer, currentChecklist, entryCompleted }: Props) {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(!entryCompleted)
  const [saved, setSaved] = useState(entryCompleted)
  const [odometer, setOdometer] = useState(currentOdometer?.toString() || '')
  
  const [checklist, setChecklist] = useState<Record<string, ChecklistValue>>(() => {
    const initial: Record<string, ChecklistValue> = {}
    
    // Reconstruir estado inicial suportando upgrade de boolean -> object
    CHECKLIST_ITEMS.forEach(item => {
      const existing = currentChecklist?.[item.key]
      if (typeof existing === 'boolean') {
        initial[item.key] = { checked: existing }
      } else if (existing && typeof existing === 'object' && existing !== null) {
        initial[item.key] = existing as ChecklistValue
      } else {
        initial[item.key] = { checked: false }
      }
    })

    // Adicionar itens customizados que já existem no banco
    if (currentChecklist) {
      Object.entries(currentChecklist).forEach(([key, value]) => {
        if (!initial[key] && value && typeof value === 'object' && (value as any).is_custom) {
          initial[key] = value as ChecklistValue
        }
      })
    }

    return initial
  })

  const [saving, setSaving] = useState(false)
  const [uploadingItem, setUploadingItem] = useState<string | null>(null)
  const [newCustomLabel, setNewCustomLabel] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeItemForUpload, setActiveItemForUpload] = useState<string | null>(null)

  function toggle(key: string) {
    setChecklist(prev => ({
      ...prev,
      [key]: { ...prev[key], checked: !prev[key].checked }
    }))
  }

  function addCustomItem() {
    if (!newCustomLabel.trim()) return
    const key = `custom_${Date.now()}`
    setChecklist(prev => ({
      ...prev,
      [key]: { checked: true, label: newCustomLabel, is_custom: true }
    }))
    setNewCustomLabel('')
  }

  function removeCustomItem(key: string) {
    setChecklist(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const itemKey = activeItemForUpload
    if (!file || !itemKey) return

    setUploadingItem(itemKey)
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${projectId}/${itemKey}_${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('stage-photos')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('stage-photos')
        .getPublicUrl(fileName)

      setChecklist(prev => ({
        ...prev,
        [itemKey]: { 
          ...prev[itemKey], 
          media_url: publicUrl, 
          media_type: file.type.startsWith('video') ? 'video' : 'image',
          checked: true // Auto-marcar se subiu foto
        }
      }))
    } catch (err) {
      console.error('Upload error:', err)
      alert('Erro ao enviar arquivo.')
    } finally {
      setUploadingItem(null)
      setActiveItemForUpload(null)
    }
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

  const allItems = Object.entries(checklist)
  const checkedCount = allItems.filter(([_, v]) => v.checked).length

  return (
    <div className={`rounded-2xl border-2 mb-6 overflow-hidden transition-all duration-300 ${saved ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,video/*"
        onChange={handleFileUpload}
      />

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
                ? `✓ Checklist concluído — ${checkedCount} itens verificados`
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
        <div className="border-t border-amber-200 p-6 space-y-6 bg-white/80 backdrop-blur-sm">
          {/* Odômetro */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
              <Gauge className="w-4 h-4 text-amber-500" />
              Odômetro de Entrada (km)
            </label>
            <input
              type="number"
              placeholder="Ex: 45200"
              value={odometer}
              onChange={e => setOdometer(e.target.value)}
              className="w-full max-w-xs px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all"
            />
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-slate-700">
                Checklist de Avarias Pré-Existentes
                <span className="ml-2 text-xs font-normal text-slate-400">({checkedCount} itens OK)</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allItems.map(([key, item]) => (
                <div 
                  key={key}
                  className={`group relative flex flex-col p-3 rounded-2xl border transition-all ${
                    item.checked 
                      ? 'border-green-200 bg-green-50/30' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => toggle(key)}
                      className="flex items-center gap-3 text-left flex-1"
                    >
                      {item.checked
                        ? <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0" />
                        : <Square className="w-5 h-5 text-slate-300 flex-shrink-0" />
                      }
                      <span className={`text-sm ${item.checked ? 'font-medium text-green-900' : 'text-slate-600'}`}>
                        {item.label || CHECKLIST_ITEMS.find(i => i.key === key)?.label}
                      </span>
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Upload Media Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveItemForUpload(key)
                          fileInputRef.current?.click()
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          item.media_url 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-600'
                        }`}
                      >
                        {uploadingItem === key ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </button>

                      {/* Remove Custom Item */}
                      {item.is_custom && (
                        <button
                          onClick={() => removeCustomItem(key)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Media Preview */}
                  {item.media_url && (
                    <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-black group-hover:h-48 transition-all">
                      {item.media_type === 'video' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white text-xs gap-2">
                          <PlayCircle className="w-8 h-8 opacity-50" />
                          <span>Vídeo anexado</span>
                          <video src={item.media_url} className="absolute inset-0 w-full h-full object-cover opacity-30" muted />
                        </div>
                      ) : (
                        <img src={item.media_url} alt="Evidência" className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => setChecklist(prev => ({ ...prev, [key]: { ...prev[key], media_url: undefined } }))}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Custom Item Input */}
              <div className="p-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex flex-col gap-2">
                <p className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">Novo Item</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Risco porta traseira..."
                    value={newCustomLabel}
                    onChange={e => setNewCustomLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomItem()}
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                  <button
                    onClick={addCustomItem}
                    disabled={!newCustomLabel.trim()}
                    className="p-2 bg-amber-100 text-amber-600 rounded-xl hover:bg-amber-200 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={handleSave}
              disabled={saving || !odometer}
              className="flex-1 md:flex-none btn-primary px-8 py-3.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardCheck className="w-5 h-5" />}
              {saving ? 'Salvando Vistoria...' : '✓ Confirmar Entrada'}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-6 py-3.5 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
