import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  ClipboardCheck, CheckSquare, Square, Gauge, Camera, X, Plus, 
  Trash2, Loader2, PlayCircle, Maximize2, FileText, CheckCircle2 
} from 'lucide-react'

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
  { key: 'radio_ok', label: 'Rádio / Central multimídia' },
  { key: 'ar_condicionado_ok', label: 'Ar-condicionado' },
  { key: 'eletrica_ok', label: 'Sistema elétrico (faróis, luzes)' },
  { key: 'pneus_ok', label: 'Pneus e rodas' },
  { key: 'estepe_ok', label: 'Estepe e Ferramentas' },
  { key: 'macaco_ok', label: 'Macaco e chave de roda' },
  { key: 'documentos_ok', label: 'Documentos do veículo' },
  { key: 'chaves_ok', label: 'Todas as chaves' },
  { key: 'sinistro_ausente', label: 'Histórico de sinistros' },
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
  const [selectedMedia, setSelectedMedia] = useState<{url: string, type: string} | null>(null)
  
  const [checklist, setChecklist] = useState<Record<string, ChecklistValue>>(() => {
    const initial: Record<string, ChecklistValue> = {}
    CHECKLIST_ITEMS.forEach(item => {
      const existing = currentChecklist?.[item.key]
      if (typeof existing === 'boolean') {
        initial[item.key] = { checked: existing }
      } else if (existing && typeof existing === 'object') {
        initial[item.key] = existing as ChecklistValue
      } else {
        initial[item.key] = { checked: false }
      }
    })

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
      const { error } = await supabase.storage.from('stage-photos').upload(fileName, file)
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('stage-photos').getPublicUrl(fileName)

      setChecklist(prev => ({
        ...prev,
        [itemKey]: { 
          ...prev[itemKey], 
          media_url: publicUrl, 
          media_type: file.type.startsWith('video') ? 'video' : 'image',
          checked: true 
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
    <div className={`soft-card mb-8 overflow-hidden border-2 transition-all duration-500 ${saved ? 'border-emerald-100 bg-white' : 'border-amber-100 bg-white'}`}>
      {/* Lightbox Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 md:p-10 animate-in fade-in duration-300">
          <button onClick={() => setSelectedMedia(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-5xl w-full h-full flex flex-col items-center justify-center">
            {selectedMedia.type === 'video' ? (
              <video src={selectedMedia.url} className="max-h-full w-auto rounded-2xl shadow-2xl" controls autoPlay />
            ) : (
              <img src={selectedMedia.url} alt="Ampliada" className="max-h-full w-auto object-contain rounded-2xl shadow-2xl" />
            )}
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />

      {/* Header Bar */}
      <div className={`p-1 bg-gradient-to-r ${saved ? 'from-emerald-500 to-teal-600' : 'from-amber-400 to-orange-500'}`} />
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left group hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${saved ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            <ClipboardCheck className={`w-6 h-6 ${saved ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Checklist de Entrada</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full animate-pulse ${saved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                {saved ? `Concluído • ${checkedCount} Itens` : `Pendente • ${checkedCount}/${allItems.length} Verificados`}
              </p>
            </div>
          </div>
        </div>
        <div className={`p-2 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600 transition-all ${isOpen ? 'rotate-180' : ''}`}>
          <Plus className="w-5 h-5" />
        </div>
      </button>

      {/* Body Content */}
      {isOpen && (
        <div className="p-6 pt-0 space-y-8 animate-in slide-in-from-top-4 duration-500">
          {/* Odometer Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end p-5 rounded-3xl bg-slate-50 border border-slate-100 shadow-inner">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-tighter">
                <Gauge className="w-4 h-4 text-amber-500" />
                Odômetro de Entrada
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="000000"
                  value={odometer}
                  onChange={e => setOdometer(e.target.value)}
                  className="w-full text-2xl font-mono tracking-widest px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-300">KM</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 italic mb-1">
              * Obrigatório registrar a quilometragem na recepção do veículo.
            </p>
          </div>

          {/* Checklist Items */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Itens de Vistoria Técnica
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allItems.map(([key, item]) => (
                <div 
                  key={key}
                  className={`relative flex items-center p-1 pl-4 rounded-2xl border-2 transition-all duration-300 group ${
                    item.checked 
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' 
                      : 'border-slate-100 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all ${item.checked ? 'bg-emerald-500 scale-y-100' : 'bg-slate-200 scale-y-50 opacity-0'}`} />

                  {/* Text & Toggle */}
                  <button
                    onClick={() => toggle(key)}
                    className="flex-1 py-4 flex items-center gap-4 text-left"
                  >
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white group-hover:border-slate-400'
                    }`}>
                      {item.checked && <CheckSquare className="w-4 h-4" />}
                    </div>
                    <span className={`text-sm font-bold transition-colors ${item.checked ? 'text-emerald-900' : 'text-slate-600'}`}>
                      {item.label || CHECKLIST_ITEMS.find(i => i.key === key)?.label}
                    </span>
                  </button>

                  {/* Actions & Preview Area */}
                  <div className="flex items-center gap-2 py-2 pr-2">
                    {/* Media Thumbnail/Button */}
                    <div className="relative">
                      {item.media_url ? (
                        <div className="relative group/media">
                          <button 
                            onClick={() => setSelectedMedia({url: item.media_url!, type: item.media_type!})}
                            className="w-12 h-12 rounded-xl border-2 border-white shadow-md overflow-hidden bg-black transition-transform hover:scale-110 active:scale-95"
                          >
                            {item.media_type === 'video' ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <PlayCircle className="w-5 h-5 text-white/80" />
                                <video src={item.media_url} className="absolute inset-0 w-full h-full object-cover opacity-40" muted />
                              </div>
                            ) : (
                              <img src={item.media_url} alt="Evidência" className="w-full h-full object-cover" />
                            )}
                          </button>
                          <button 
                            onClick={() => setChecklist(prev => ({ ...prev, [key]: { ...prev[key], media_url: undefined } }))}
                            className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover/media:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveItemForUpload(key)
                            fileInputRef.current?.click()
                          }}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            uploadingItem === key ? 'bg-indigo-100' : 'bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600'
                          }`}
                        >
                          {uploadingItem === key ? (
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                          ) : (
                            <Camera className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Delete Custom */}
                    {item.is_custom && (
                      <button
                        onClick={() => removeCustomItem(key)}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Custom Item Integration */}
              <div className="flex items-center gap-3 p-2 pl-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-amber-300 transition-all">
                <FileText className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Adicionar observação ou novo item..."
                  value={newCustomLabel}
                  onChange={e => setNewCustomLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomItem()}
                  className="flex-1 py-3 text-sm font-semibold bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                />
                <button
                  onClick={addCustomItem}
                  disabled={!newCustomLabel.trim()}
                  className="p-3 bg-white text-emerald-600 rounded-xl shadow-sm hover:shadow-md disabled:opacity-0 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col md:flex-row items-center gap-4 pt-8 border-t border-slate-100">
            <button
              onClick={handleSave}
              disabled={saving || !odometer}
              className="w-full md:flex-1 py-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin text-amber-400" /> : <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
              {saving ? 'Validando Vistoria...' : 'Finalizar e Salvar Entrada'}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full md:w-auto px-8 py-4 text-sm font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
