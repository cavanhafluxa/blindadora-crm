'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Globe, DollarSign, MessageCircle, FileText, Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CatalogPublishSection({ project }: { project: any }) {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [published, setPublished] = useState(project.published_to_catalog || false)
  const [price, setPrice] = useState(project.catalog_price || '')
  const [desc, setDesc] = useState(project.catalog_description || '')
  const [wpp, setWpp] = useState(project.contact_whatsapp || '')

  async function handleSave() {
    setLoading(true)
    try {
      const { error } = await supabase.from('projects').update({
        published_to_catalog: published,
        catalog_price: price ? Number(price) : null,
        catalog_description: desc || null,
        contact_whatsapp: wpp || null
      }).eq('id', project.id)

      if (error) throw error
      alert('Configurações do Catálogo atualizadas com sucesso!')
      router.refresh()
    } catch (err: any) {
      alert('Erro ao salvar configurações do catálogo: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="soft-card p-6 border-l-4 border-amber-500">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-500" /> Portal de Seminovos (Catálogo)
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500 font-medium">Publicar Veículo no Site?</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={published} onChange={e => setPublished(e.target.checked)} />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-300 ${!published ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1 flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-slate-400" /> Valor de Venda (R$)
          </label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none" placeholder="Ex: 150000" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1 flex items-center gap-1">
            <MessageCircle className="w-4 h-4 text-slate-400" /> WhatsApp para Contato
          </label>
          <input type="text" value={wpp} onChange={e => setWpp(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none" placeholder="Ex: 11999999999" />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-slate-700 block mb-1 flex items-center gap-1">
            <FileText className="w-4 h-4 text-slate-400" /> Descrição do Anúncio
          </label>
          <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none" placeholder="Descreva os diferenciais do veículo, histórico, etc." />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button 
          onClick={handleSave} 
          disabled={loading} 
          className={`h-[42px] px-6 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 ${
            published 
              ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200' 
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
        >
           {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
           Salvar Anúncio
        </button>
      </div>
      
      {published && (
        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3 text-amber-800 text-sm">
           <Globe className="w-5 h-5 flex-shrink-0 mt-0.5" />
           <p>Este veículo está <strong>público</strong>. Qualquer pessoa com o link pode visualizar e entrar em contato.</p>
        </div>
      )}
    </div>
  )
}
