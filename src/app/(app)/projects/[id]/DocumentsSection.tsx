'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FileCheck, Clock, Check, X, AlertCircle, Upload, Trash2, Loader2, FileText, Download, ShieldAlert } from 'lucide-react'

type DocStatus = 'pending_docs' | 'pending_approval' | 'approved' | 'rejected'

type ProjectDocs = {
  authorization_status: DocStatus
  authorization_notes: string | null
  declaration_status: DocStatus
  declaration_notes: string | null
  sicovab_status?: string | null
  sicovab_protocol?: string | null
  army_authorization?: string | null
  sicovab_sent_at?: string | null
  auth_req_date?: string | null
  auth_app_date?: string | null
  decl_req_date?: string | null
  decl_app_date?: string | null
}

export interface DocumentRecord {
  id: string
  project_id: string
  doc_type: string
  file_url: string
  status: string | null
  uploaded_at: string
}

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending_docs: { label: 'Aguardando Docs', color: 'text-slate-600', bg: 'bg-slate-100', icon: Clock },
  pending_approval: { label: 'Em Aprovação', color: 'text-amber-700', bg: 'bg-amber-100', icon: AlertCircle },
  approved: { label: 'Aprovado', color: 'text-green-700', bg: 'bg-green-100', icon: Check },
  rejected: { label: 'Rejeitado', color: 'text-red-700', bg: 'bg-red-100', icon: X },
}

export default function DocumentsSection({ 
  projectId, 
  initialDocs,
  initialFiles = []
}: { 
  projectId: string; 
  initialDocs: ProjectDocs | null;
  initialFiles?: DocumentRecord[]
}) {
  const supabase = createClient()
  const defaultDocs: ProjectDocs = {
    authorization_status: 'pending_docs',
    authorization_notes: null,
    declaration_status: 'pending_docs',
    declaration_notes: null,
    sicovab_status: 'pending',
    sicovab_protocol: null,
    army_authorization: null,
    sicovab_sent_at: null,
  }
  const [docs, setDocs] = useState<ProjectDocs>({ ...defaultDocs, ...initialDocs })
  const [saving, setSaving] = useState<string | null>(null)
  
  const [files, setFiles] = useState<DocumentRecord[]>(initialFiles)
  const [uploading, setUploading] = useState<string | null>(null)
  
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadSignedUrls() {
      const pathsToSign = files
        .map(f => f.file_url)
        .filter(path => !signedUrls[path] && !path.startsWith('http'))

      if (pathsToSign.length === 0) return

      const newUrls: Record<string, string> = {}
      for (const path of pathsToSign) {
        const { data } = await supabase.storage.from('documents').createSignedUrl(path, 60 * 60)
        if (data?.signedUrl) {
          newUrls[path] = data.signedUrl
        }
      }
      setSignedUrls(prev => ({ ...prev, ...newUrls }))
    }
    loadSignedUrls()
  }, [files, signedUrls, supabase])

  async function updateDoc(field: keyof ProjectDocs, value: string | null) {
    setSaving(field)
    const payload: Partial<ProjectDocs> = { [field]: value }
    const now = new Date().toISOString()
    
    if (field === 'authorization_status') {
      if (value === 'approved') payload.auth_app_date = now
      else if (value === 'pending_approval') payload.auth_req_date = payload.auth_req_date || now
    }
    if (field === 'declaration_status') {
      if (value === 'approved') payload.decl_app_date = now
      else if (value === 'pending_approval') payload.decl_req_date = payload.decl_req_date || now
    }

    const updated = { ...docs, ...payload }
    setDocs(updated as ProjectDocs)
    await supabase.from('projects').update(payload).eq('id', projectId)
    setSaving(null)
  }

  async function handleFileUpload(docType: string, file: File) {
    setUploading(docType)
    
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')
    const path = `${projectId}/${docType}/${Date.now()}_${safeName}`
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      alert('Erro ao fazer upload: ' + uploadError.message)
      setUploading(null)
      return
    }

    const { data: record, error: dbError } = await supabase.from('documents').insert({
      project_id: projectId,
      doc_type: docType,
      file_url: path
    }).select().single()

    if (dbError) {
      alert('Erro ao vincular documento: ' + dbError.message)
    } else if (record) {
      setFiles(prev => [record as DocumentRecord, ...prev])
      
      // Auto-set the request date (Etapa 2.2)
      if (docType === 'authorization' && !docs.auth_req_date) {
        await updateDoc('authorization_status', 'pending_approval')
      }
      if (docType === 'declaration' && !docs.decl_req_date) {
        await updateDoc('declaration_status', 'pending_approval')
      }
    }
    
    setUploading(null)
  }

  async function handleDeleteFile(fileId: string, path: string) {
    if (!confirm('Deseja realmente remover este arquivo?')) return
    
    await supabase.from('documents').delete().eq('id', fileId)
    setFiles(prev => prev.filter(f => f.id !== fileId))
    
    if (!path.startsWith('http')) {
      await supabase.storage.from('documents').remove([path])
    }
  }

  function FileList({ docType }: { docType: string }) {
    const relevantFiles = files.filter(f => f.doc_type === docType)
    if (relevantFiles.length === 0) return null
    
    return (
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
        {relevantFiles.map(file => {
          const fileName = file.file_url.split('/').pop() || 'documento'
          const displayUrl = file.file_url.startsWith('http') ? file.file_url : signedUrls[file.file_url]

          return (
            <div key={file.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50 group hover:border-slate-200 transition-colors">
              <a 
                href={displayUrl || '#'} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 min-w-0"
              >
                <div className="w-8 h-8 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{fileName}</p>
                  <p className="text-[10px] text-slate-400">
                    Enviado em {new Date(file.uploaded_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </a>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {displayUrl && (
                  <a href={displayUrl} download className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200 rounded">
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => handleDeleteFile(file.id, file.file_url)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function DocCard({
    title,
    description,
    statusKey,
    notesKey,
    reqDateKey,
    appDateKey,
    docTypeString
  }: {
    title: string
    description: string
    statusKey?: 'authorization_status' | 'declaration_status'
    notesKey?: 'authorization_notes' | 'declaration_notes'
    reqDateKey?: 'auth_req_date' | 'decl_req_date'
    appDateKey?: 'auth_app_date' | 'decl_app_date'
    docTypeString: string
  }) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isUploading = uploading === docTypeString

    return (
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow transition-shadow">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(docTypeString, e.target.files[0])
            }
            e.target.value = ''
          }} 
        />
        
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">{title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
              
              {(reqDateKey && docs[reqDateKey] || appDateKey && docs[appDateKey]) && (
                <div className="flex gap-4 mt-2 text-[10px] text-slate-400 font-medium">
                   {reqDateKey && docs[reqDateKey] && <span>Solicitado em: {new Date(docs[reqDateKey]!).toLocaleDateString('pt-BR')}</span>}
                   {appDateKey && docs[appDateKey] && <span className="text-green-600">Aprovado em: {new Date(docs[appDateKey]!).toLocaleDateString('pt-BR')}</span>}
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-2 shrink-0">
              {statusKey && docs[statusKey] && (
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_CONFIG[docs[statusKey] as DocStatus].bg} ${STATUS_CONFIG[docs[statusKey] as DocStatus].color}`}>
                  {(() => {
                     const cfg = STATUS_CONFIG[docs[statusKey] as DocStatus]
                     const Icon = cfg.icon
                     return <><Icon className="w-3.5 h-3.5" /> {cfg.label}</>
                  })()}
                </span>
              )}
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                Anexar
              </button>
            </div>
          </div>

          {statusKey && notesKey && (
            <>
              <div className="mb-3">
                <label className="text-xs font-medium text-slate-500 block mb-1.5">Alterar Status</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STATUS_CONFIG) as DocStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => updateDoc(statusKey, s)}
                      disabled={saving === statusKey}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                        docs[statusKey] === s
                          ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} border-transparent shadow-sm`
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1.5">Observações / Motivo</label>
                <textarea
                  rows={2}
                  defaultValue={(docs[notesKey] as string) || ''}
                  placeholder="Ex: aguardando DUT atualizado..."
                  onBlur={e => updateDoc(notesKey, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 resize-none"
                />
              </div>
            </>
          )}

          <FileList docType={docTypeString} />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="soft-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <ShieldAlert className="w-5 h-5 text-indigo-500" />
          <h2 className="font-semibold text-slate-800">Controle SICOVAB / Exército</h2>
        </div>
        
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow transition-shadow">
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-6">
               <div>
                  <h3 className="font-semibold text-slate-800">Protocolo e Autorizações SICOVAB</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Gestão de registros e comprovantes junto ao exército e SICOVAB.</p>
               </div>
               <div className="flex flex-col items-end gap-2 shrink-0">
                 <input type="file" ref={(ref) => { if(ref) (ref as any).uploadSicovab = () => ref.click() }} className="hidden" onChange={e => {
                   if (e.target.files && e.target.files[0]) handleFileUpload('sicovab', e.target.files[0]); e.target.value = ''
                 }} />
                 <button onClick={() => {
                   const node = document.querySelector('input[type="file"].hidden') as any
                   if (node?.uploadSicovab) node.uploadSicovab()
                 }} disabled={uploading === 'sicovab'} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors disabled:opacity-50">
                    {uploading === 'sicovab' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Anexar Comprovante
                 </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Status SICOVAB</label>
                <select
                  value={docs.sicovab_status || 'pending'}
                  onChange={(e) => updateDoc('sicovab_status', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pending">Aguardando Envio</option>
                  <option value="submitted">Protocolado</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Data de Envio</label>
                <input
                  type="date"
                  value={docs.sicovab_sent_at ? docs.sicovab_sent_at.split('T')[0] : ''}
                  onChange={(e) => updateDoc('sicovab_sent_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Protocolo SICOVAB</label>
                <input
                  type="text"
                  placeholder="Ex: 2023.12345/67"
                  defaultValue={docs.sicovab_protocol || ''}
                  onBlur={(e) => updateDoc('sicovab_protocol', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Autorização Exército</label>
                <input
                  type="text"
                  placeholder="N° Autorização..."
                  defaultValue={docs.army_authorization || ''}
                  onBlur={(e) => updateDoc('army_authorization', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <FileList docType="sicovab" />
          </div>
        </div>
      </div>

      <div className="soft-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileCheck className="w-5 h-5 text-indigo-500" />
          <h2 className="font-semibold text-slate-800">Documentações & Aprovações</h2>
        </div>

        <div className="space-y-5">
          <DocCard
            title="Autorização de Blindagem"
            description="Documento legal que autoriza a blindagem do veículo (Exército/Detran)"
            statusKey="authorization_status"
            notesKey="authorization_notes"
            reqDateKey="auth_req_date"
            appDateKey="auth_app_date"
            docTypeString="authorization"
          />
          <DocCard
            title="Declaração de Blindagem"
            description="Declaração final emitida após conclusão do serviço para registro veicular"
            statusKey="declaration_status"
            notesKey="declaration_notes"
            reqDateKey="decl_req_date"
            appDateKey="decl_app_date"
            docTypeString="declaration"
          />
          
          <DocCard
            title="Outros Materiais e Documentos"
            description="CRV/DUT, CNH, RG, termos de vistoria e outros arquivos anexos do cliente"
            docTypeString="other"
          />
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>Autorização: <strong className={STATUS_CONFIG[docs.authorization_status].color}>{STATUS_CONFIG[docs.authorization_status].label}</strong></span>
          <span>Declaração: <strong className={STATUS_CONFIG[docs.declaration_status].color}>{STATUS_CONFIG[docs.declaration_status].label}</strong></span>
          <span>Anexos Totais: <strong className="text-slate-700">{files.length}</strong></span>
        </div>
      </div>
    </>
  )
}
