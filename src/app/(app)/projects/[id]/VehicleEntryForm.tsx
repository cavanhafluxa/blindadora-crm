'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  ClipboardCheck, CheckSquare, Square, Gauge, Camera, X, Plus, 
  Trash2, Loader2, PlayCircle, Maximize2, FileText, CheckCircle2, Upload, Pencil} from 'lucide-react'
import { createPortal } from 'react-dom'

type MediaFile = {
  path: string
  type: 'image' | 'video'
  id: string
}

type ChecklistValue = {
  checked: boolean
  media_path?: string // Legacy
  media_url?: string // Legacy 
  media_type?: 'image' | 'video' // Legacy
  media_files?: MediaFile[]
  description?: string
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
  const [signedUrls, setSignedUrls] = useState<Record<string, Record<string, string>>>({}) // itemKey -> { fileId: url }
  const [editingItem, setEditingItem] = useState<string | null>(null)
  
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
  const [activeTab, setActiveTab] = useState<'details' | 'media'>('details')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent scroll when modal is open
  useEffect(() => {
    if (editingItem || selectedMedia) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [editingItem, selectedMedia])

  function toggle(key: string) {
    setChecklist(prev => ({
      ...prev,
      [key]: { ...prev[key], checked: !prev[key].checked }
    }))
  }

  // Load signed URLs for all items
  useEffect(() => {
    async function loadUrls() {
      const paths: {key: string, id: string, path: string}[] = []

      Object.entries(checklist).forEach(([key, val]) => {
        // Handle new multi-file structure
        if (val.media_files && val.media_files.length > 0) {
          val.media_files.forEach(file => {
            paths.push({ key, id: file.id, path: file.path })
          })
        }
        
        // Handle legacy single-file structure for compatibility
        if (val.media_path) {
          paths.push({ key, id: 'legacy', path: val.media_path })
        } else if (val.media_url && val.media_url.includes('stage-photos/')) {
          const path = val.media_url.split('stage-photos/').pop()
          if (path) {
            paths.push({ key, id: 'legacy', path })
          }
        }
      })

      if (paths.length > 0) {
        const { data, error } = await supabase.storage
          .from('stage-photos')
          .createSignedUrls(paths.map(p => p.path), 3600)

        if (data) {
          const newUrls: Record<string, Record<string, string>> = {}
          data.forEach((item, index) => {
            const info = paths[index]
            if (item.signedUrl) {
              if (!newUrls[info.key]) newUrls[info.key] = {}
              newUrls[info.key][info.id] = item.signedUrl
            }
          })
          setSignedUrls(newUrls)
        }
      }
    }
    loadUrls()
  }, [checklist]) // Refresh when checklist changes to get new signed URLs

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

  function removeMediaFile(itemKey: string, fileId: string) {
    setChecklist(prev => {
      const item = prev[itemKey]
      if (!item) return prev
      return {
        ...prev,
        [itemKey]: {
          ...item,
          media_files: item.media_files?.filter(f => f.id !== fileId)
        }
      }
    })
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    const itemKey = activeItemForUpload
    if (!files || files.length === 0 || !itemKey) return

    setUploadingItem(itemKey)
    try {
      const newMediaFiles: MediaFile[] = [...(checklist[itemKey]?.media_files || [])]
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileId = Math.random().toString(36).substring(2, 9)
        const fileName = `${projectId}/${itemKey}_${Date.now()}_${fileId}.${fileExt}`
        
        const { error } = await supabase.storage.from('stage-photos').upload(fileName, file)
        if (error) throw error

        newMediaFiles.push({
          id: fileId,
          path: fileName,
          type: file.type.startsWith('video') ? 'video' : 'image'
        })
      }

      setChecklist(prev => ({
        ...prev,
        [itemKey]: { 
          ...prev[itemKey], 
          media_files: newMediaFiles,
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
    <>
      <div className={`soft-card mb-6 overflow-hidden border transition-all duration-500 ${saved ? 'border-emerald-100 bg-white' : 'border-amber-100 bg-white'}`}>
      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" multiple onChange={handleFileUpload} />

      {/* Header Bar */}
      <div className={`p-0.5 bg-gradient-to-r ${saved ? 'from-emerald-600 to-teal-600' : 'from-amber-400 to-orange-500'}`} />
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
              <span className={`w-2 h-2 rounded-full animate-pulse ${saved ? 'bg-emerald-600' : 'bg-amber-500'}`} />
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
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Itens de Vistoria Técnica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allItems.map(([key, item]) => (
                <div 
                  key={key}
                  className={`relative flex items-center p-0.5 pl-3 rounded-xl border transition-all duration-300 group ${
                    item.checked 
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm' 
                      : 'border-slate-100 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all ${item.checked ? 'bg-emerald-600 scale-y-100' : 'bg-slate-200 scale-y-50 opacity-0'}`} />

                  {/* Text & Toggle */}
                  <button
                    onClick={() => toggle(key)}
                    className="flex-1 py-2 flex items-center gap-3 text-left"
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      item.checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-200 bg-white group-hover:border-slate-400'
                    }`}>
                      {item.checked && <CheckSquare className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-sm font-semibold transition-colors ${item.checked ? 'text-emerald-900' : 'text-slate-600'}`}>
                      {item.label || CHECKLIST_ITEMS.find(i => i.key === key)?.label}
                    </span>
                  </button>

                  {/* Actions & Preview Area */}
                  <div className="flex items-center gap-2 py-1.5 pr-2">
                    {/* Media Thumbnails Preview */}
                    <div className="flex -space-x-2 overflow-hidden">
                      {checklist[key].media_files?.slice(0, 3).map((file, idx) => (
                        <div key={file.id} className="relative w-8 h-8 rounded-lg border-2 border-white shadow-sm overflow-hidden bg-slate-200 shrink-0">
                          {file.type === 'video' ? (
                            <PlayCircle className="w-full h-full p-1.5 text-slate-400" />
                          ) : (
                            <img 
                              src={signedUrls[key]?.[file.id]} 
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          )}
                        </div>
                      ))}
                      {(checklist[key].media_files?.length || 0) > 3 && (
                        <div className="w-8 h-8 rounded-lg border-2 border-white shadow-sm bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                          +{(checklist[key].media_files?.length || 0) - 3}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setEditingItem(key)}
                      className={`p-2 rounded-xl transition-all ${
                        item.checked ? 'text-emerald-600 hover:bg-emerald-100' : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title="Editar detalhes e mídias"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {item.is_custom && (
                      <button
                        onClick={() => removeCustomItem(key)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
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

      {/* Item Detail Modal - Portaled to body */}
      {mounted && editingItem && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-in fade-in duration-300"
          onClick={() => setEditingItem(null)}
        >
          <div 
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${checklist[editingItem].checked ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 group/title">
                    <input 
                      type="text"
                      value={checklist[editingItem].label ?? CHECKLIST_ITEMS.find(i => i.key === editingItem)?.label ?? ''}
                      onChange={(e) => setChecklist(prev => ({
                        ...prev,
                        [editingItem]: { ...prev[editingItem], label: e.target.value }
                      }))}
                      className="w-full text-2xl md:text-3xl font-black text-slate-900 bg-transparent border-none outline-none focus:ring-0 p-0 transition-all placeholder:text-slate-300"
                      placeholder="Nome do item..."
                    />
                    <Pencil className="w-5 h-5 text-slate-300 opacity-0 group-hover/title:opacity-100 transition-all shrink-0 cursor-text" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1">Identificação do Item ou Avaria</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingItem(null)} 
                className="ml-4 p-2.5 hover:bg-slate-100 text-slate-400 rounded-full transition-all shrink-0 active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Status Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-700">Status do Item</p>
                  <p className="text-xs text-slate-400">Marque se este item foi verificado e está em conformidade.</p>
                </div>
                <button 
                  onClick={() => toggle(editingItem)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${checklist[editingItem].checked ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checklist[editingItem].checked ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  Observações e Descrição
                </label>
                <textarea 
                  placeholder="Descreva aqui o estado do item, se houver arranhões, amassados ou observações importantes..."
                  className="w-full h-24 p-4 rounded-2xl border border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50 outline-none transition-all text-sm text-slate-600 resize-none"
                  value={checklist[editingItem].description || ''}
                  onChange={(e) => setChecklist(prev => ({
                    ...prev,
                    [editingItem]: { ...prev[editingItem], description: e.target.value }
                  }))}
                />
              </div>

              {/* Media Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-500" />
                    Fotos e Vídeos de Evidência
                  </label>
                  <button 
                    onClick={() => {
                      setActiveItemForUpload(editingItem)
                      fileInputRef.current?.click()
                    }}
                    className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    ADICIONAR MÍDIA
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Uploading Placeholder */}
                  {uploadingItem === editingItem && (
                    <div className="aspect-square rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">Enviando...</span>
                    </div>
                  )}

                  {/* Media Files */}
                  {checklist[editingItem].media_files?.map((file) => (
                    <div key={file.id} className="relative aspect-square rounded-2xl overflow-hidden group border border-slate-100 shadow-sm bg-slate-50">
                      {file.type === 'video' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-slate-900">
                          <PlayCircle className="w-8 h-8 text-white/80" />
                          <span className="text-[10px] font-bold text-white/60 uppercase">Vídeo</span>
                          <video src={signedUrls[editingItem]?.[file.id]} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                        </div>
                      ) : (
                        <img 
                          src={signedUrls[editingItem]?.[file.id]} 
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setSelectedMedia({ url: signedUrls[editingItem]?.[file.id], type: file.type })}
                          className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => removeMediaFile(editingItem, file.id)}
                          className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Empty State */}
                  {(!checklist[editingItem].media_files || checklist[editingItem].media_files.length === 0) && uploadingItem !== editingItem && (
                    <button 
                      onClick={() => {
                        setActiveItemForUpload(editingItem)
                        fileInputRef.current?.click()
                      }}
                      className="col-span-full aspect-[2/1] rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-3 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                        <Camera className="w-6 h-6 text-slate-300 group-hover:text-indigo-500" />
                      </div>
                      <div className="text-center">
                        <span className="block text-sm font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">Nenhuma evidência anexada</span>
                        <span className="block text-[11px] text-slate-400 uppercase tracking-widest mt-1">Clique para adicionar fotos ou vídeos</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setEditingItem(null)}
                className="btn-primary bg-slate-900 hover:bg-black text-white px-8 py-2.5 rounded-xl shadow-lg transition-all active:scale-95"
              >
                Concluir Detalhes
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Lightbox Modal - Portaled to body */}
      {mounted && selectedMedia && createPortal(
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-4 md:p-10 animate-in fade-in zoom-in duration-300"
          onClick={() => setSelectedMedia(null)}
        >
          <button onClick={() => setSelectedMedia(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[120]">
            <X className="w-6 h-6" />
          </button>
          <div 
            className="max-w-5xl w-full h-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedMedia.type === 'video' ? (
              <video src={selectedMedia.url} className="max-h-full w-auto rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10" controls autoPlay />
            ) : (
              <img src={selectedMedia.url} alt="Ampliada" className="max-h-full w-auto object-contain rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10" />
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
