'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ClipboardCheck, CheckSquare, Square, Gauge, Camera, X, Plus, 
  Trash2, Loader2, PlayCircle, Maximize2, FileText, CheckCircle2, Upload} from 'lucide-react'

type ChecklistValue = {
  checked: boolean
  media_path?: string // New field to store relative path
  media_url?: string // Legacy or signed version
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
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(!entryCompleted)
  const [saved, setSaved] = useState(entryCompleted)
  const [odometer, setOdometer] = useState(currentOdometer?.toString() || '')
  const [selectedMedia, setSelectedMedia] = useState<{url: string, type: string} | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  
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

  // Load signed URLs for all items
  useEffect(() => {
    async function loadUrls() {
      const paths: string[] = []
      const keys: string[] = []

      Object.entries(checklist).forEach(([key, val]) => {
        if (val.media_path) {
          paths.push(val.media_path)
          keys.push(key)
        } else if (val.media_url && val.media_url.includes('stage-photos/')) {
          const path = val.media_url.split('stage-photos/').pop()
          if (path) {
            paths.push(path)
            keys.push(key)
          }
        }
      })

      if (paths.length > 0) {
        const { data, error } = await supabase.storage
          .from('stage-photos')
          .createSignedUrls(paths, 3600)

        if (data) {
          const newUrls: Record<string, string> = {}
          data.forEach((item, index) => {
            if (item.signedUrl) newUrls[keys[index]] = item.signedUrl
          })
          setSignedUrls(prev => ({ ...prev, ...newUrls }))
        }
      }
    }
    loadUrls()
  }, []) // Load once on mount or when checklist is initialized

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

      // Get signed URL immediately
      const { data: signedData, error: signedError } = await supabase.storage
        .from('stage-photos')
        .createSignedUrl(fileName, 3600)

      if (signedError) throw signedError

      setSignedUrls(prev => ({ ...prev, [itemKey]: signedData.signedUrl }))
      setChecklist(prev => ({
        ...prev,
        [itemKey]: { 
          ...prev[itemKey], 
          media_path: fileName, // Store path for security
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
    const now = new Date().toISOString()
    const { error } = await supabase.from('projects').update({
      odometer_entry: parseInt(odometer) || 0,
      entry_checklist: checklist,
      entry_completed_at: now,
    }).eq('id', projectId)

    if (!error) {
      setSaved(true)
      setIsOpen(false)

      // Log event
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
        if (profile) {
          await supabase.from('project_events').insert({
            project_id: projectId,
            organization_id: profile.organization_id,
            user_id: user.id,
            event_type: 'checklist_completed',
            description: 'Checklist de Entrada Concluído'
          })
        }
      }
      router.refresh()
    }
    setSaving(false)
  }

  const allItems = Object.entries(checklist)
  const checkedCount = allItems.filter(([_, v]) => v.checked).length

  return (
    <div className={`soft-card mb-6 overflow-hidden border transition-all duration-500 ${saved ? 'border-emerald-100 bg-white' : 'border-amber-100 bg-white'}`}>
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
      <div className={`p-0.5 bg-gradient-to-r ${saved ? 'from-emerald-500 to-teal-600' : 'from-amber-400 to-orange-500'}`} />
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 text-left group hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-inner ${saved ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            <ClipboardCheck className={`w-5 h-5 ${saved ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">Checklist de Entrada</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full animate-pulse ${saved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">
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
        <div className="p-5 pt-0 space-y-6 animate-in slide-in-from-top-4 duration-500">
          {/* Odometer Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-inner">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[13px] font-bold text-slate-400 uppercase tracking-normal">
                <Gauge className="w-3.5 h-3.5 text-amber-500" />
                Odômetro de Entrada
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="000000"
                  value={odometer}
                  onChange={e => setOdometer(e.target.value)}
                  className="w-full text-lg font-mono tracking-widest px-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-300 text-sm">KM</span>
              </div>
            </div>
            <p className="text-[13px] text-slate-400 italic mb-1">
              * Obrigatório registrar a quilometragem na recepção do veículo.
            </p>
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Itens de Vistoria Técnica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allItems.map(([key, item]) => (
                <div 
                  key={key}
                  className={`relative flex items-center p-0.5 pl-3 rounded-xl border transition-all duration-300 group ${
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
                    className="flex-1 py-2 flex items-center gap-3 text-left"
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white group-hover:border-slate-400'
                    }`}>
                      {item.checked && <CheckSquare className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-sm font-semibold transition-colors ${item.checked ? 'text-emerald-900' : 'text-slate-600'}`}>
                      {item.label || CHECKLIST_ITEMS.find(i => i.key === key)?.label}
                    </span>
                  </button>

                  {/* Actions & Preview Area */}
                  <div className="flex items-center gap-2 py-1.5 pr-2">
                    {/* Media Thumbnail/Button */}
                    <div className="relative">
                      { (item.media_path || item.media_url) ? (
                        <div className="relative group/media">
                          <button 
                            onClick={() => {
                              const url = signedUrls[key] || item.media_url
                              if (url) setSelectedMedia({url, type: item.media_type!})
                            }}
                            className="w-10 h-10 rounded-lg border-2 border-white shadow-md overflow-hidden bg-black transition-transform hover:scale-110 active:scale-95"
                          >
                            {!signedUrls[key] && !item.media_url && uploadingItem !== key ? (
                               <Loader2 className="w-4 h-4 animate-spin text-white/50 m-auto" />
                            ) : item.media_type === 'video' ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <PlayCircle className="w-4 h-4 text-white/80" />
                                <video src={signedUrls[key] || item.media_url} className="absolute inset-0 w-full h-full object-cover opacity-40" muted />
                              </div>
                            ) : (
                              <img src={signedUrls[key] || item.media_url} alt="Evidência" className="w-full h-full object-cover" />
                            )}
                          </button>
                          <button 
                            onClick={() => {
                              setChecklist(prev => ({ ...prev, [key]: { ...prev[key], media_path: undefined, media_url: undefined } }))
                              setSignedUrls(prev => {
                                const n = {...prev}; delete n[key]; return n
                              })
                            }}
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
                          className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center transition-all shadow-sm ${
                            uploadingItem === key 
                              ? 'bg-indigo-100' 
                              : 'bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100'
                          }`}
                        >
                          {uploadingItem === key ? (
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          ) : (
                            <Upload className="w-4 h-4" />
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
              <div className="flex items-center gap-3 p-1 pl-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-amber-300 transition-all">
                <FileText className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Adicionar observação ou novo item..."
                  value={newCustomLabel}
                  onChange={e => setNewCustomLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomItem()}
                  className="flex-1 py-2 text-sm font-semibold bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                />
                <button
                  onClick={addCustomItem}
                  disabled={!newCustomLabel.trim()}
                  className="p-2.5 bg-white text-emerald-600 rounded-lg shadow-sm hover:shadow-md disabled:opacity-0 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col md:flex-row items-center gap-4 pt-8 border-t border-slate-100">
            <button
              onClick={handleSave}
              disabled={saving || !odometer}
              className="btn-primary w-full md:w-auto bg-slate-900 hover:bg-black text-white px-8 py-2.5 rounded-xl shadow-lg shadow-slate-100 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin text-amber-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {saving ? 'Validando...' : 'Finalizar e Salvar Entrada'}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full md:w-auto px-6 py-2.5 text-sm font-semibold text-slate-400 hover:text-red-500 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
