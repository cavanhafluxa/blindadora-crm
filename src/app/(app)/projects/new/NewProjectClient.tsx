'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, User, Car, DollarSign, Image as ImageIcon, X, Upload } from 'lucide-react'

type Lead = { id: string; customer_name: string; vehicle_model: string | null; plate: string | null; quoted_value: number | null }

const InputField = ({ 
  label, 
  name, 
  form,
  setForm,
  type = "text", 
  required = false, 
  placeholder = "" 
}: {
  label: string;
  name: string;
  form: any;
  setForm: any;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) => (
  <div>
    <label className="block text-[13px] font-semibold text-slate-700 mb-1.5 ml-1">{label} {required && '*'}</label>
    <input
      type={type}
      required={required}
      placeholder={placeholder}
      value={form[name] || ''}
      onChange={e => setForm((prev: any) => ({ ...prev, [name]: e.target.value }))}
      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
    />
  </div>
)

export default function NewProjectClient({ leads }: { leads: Lead[] }) {
  const [form, setForm] = useState({
    customer_name: '', plate: '', vehicle_model: '', chassis: '', vehicle_year: '', vehicle_color: '', odometer_entry: '',
    contract_value: '', expected_delivery_date: '', lead_id: ''
  })
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const router = useRouter()
  const supabase = createClient()

  async function getOrgId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    return data?.organization_id ?? null
  }

  function handleLeadSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const lead = leads.find(l => l.id === e.target.value)
    if (lead) {
      setForm(prev => ({
        ...prev,
        lead_id: lead.id,
        customer_name: lead.customer_name,
        vehicle_model: lead.vehicle_model || '',
        plate: lead.plate || '',
        contract_value: lead.quoted_value?.toString() || '',
      }))
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    }
  }

  function clearFile() {
    setFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const orgId = await getOrgId()

    let uploadedUrls: string[] | null = null

    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `vehicle-entries/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('stage-photos')
        .upload(filePath, file)

      if (uploadError) {
        setLoading(false)
        setError(`Falha ao fazer upload da imagem: ${uploadError.message}`)
        return
      }

      const { data: publicUrlData } = supabase.storage.from('stage-photos').getPublicUrl(filePath)
      if (publicUrlData) {
         uploadedUrls = [publicUrlData.publicUrl]
      }
    }

    const { data, error } = await supabase.from('projects').insert({
      customer_name: form.customer_name,
      plate: form.plate || null,
      vehicle_model: form.vehicle_model || null,
      chassis: form.chassis || null,
      vehicle_year: form.vehicle_year || null,
      vehicle_color: form.vehicle_color || null,
      odometer_entry: form.odometer_entry ? Number(form.odometer_entry) : null,
      contract_value: form.contract_value ? Number(form.contract_value) : null,
      expected_delivery_date: form.expected_delivery_date || null,
      lead_id: form.lead_id || null,
      entry_photos: uploadedUrls,
      organization_id: orgId,
    }).select().single()

    setLoading(false)
    if (error) {
      setError(error.message)
    } else if (data) {
      router.push(`/projects/${data.id}`)
    }
  }

  const InputField = ({ label, name, type = "text", required = false, placeholder = "" }: any) => (
    <div>
      <label className="block text-[13px] font-semibold text-slate-700 mb-1.5 ml-1">{label} {required && '*'}</label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={form[name as keyof typeof form]}
        onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
      />
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/projects" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">Novo Projeto de Blindagem</h1>
          <p className="text-slate-500 mt-0.5 font-medium">As 12 etapas de fabricação serão criadas automaticamente.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="gap-8 grid grid-cols-1 lg:grid-cols-3">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Dados do Cliente */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><User className="w-5 h-5"/></div>
              <h2 className="text-lg font-bold text-slate-800">Dados do Cliente</h2>
            </div>
            
            {leads.length > 0 && (
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5 ml-1">Importar de Lead Contratado (Facilitador)</label>
                <select onChange={handleLeadSelect} className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer">
                  <option value="">Selecionar um contrato comercial pronto...</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.customer_name} - {l.vehicle_model || 'Veículo'}</option>
                  ))}
                </select>
              </div>
            )}
            
            <InputField label="Nome do Proprietário / Cliente" name="customer_name" form={form} setForm={setForm} required placeholder="Ex: Sr. Carlos Antunes" />
          </div>

          {/* Card: Identificação do Veículo */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Car className="w-5 h-5"/></div>
              <h2 className="text-lg font-bold text-slate-800">Identificação do Veículo</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <InputField label="Modelo do Veículo" name="vehicle_model" form={form} setForm={setForm} placeholder="Ex: Toyota SW4 SRX" />
              <InputField label="Cor" name="vehicle_color" form={form} setForm={setForm} placeholder="Ex: Branco Pérola" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
              <InputField label="Ano" name="vehicle_year" form={form} setForm={setForm} placeholder="Ex: 2024" />
              <InputField label="Placa" name="plate" form={form} setForm={setForm} placeholder="Ex: ABC-1234" />
              <InputField label="KM de Entrada" name="odometer_entry" form={form} setForm={setForm} type="number" placeholder="Ex: 12500" />
            </div>

            <InputField label="Chassi" name="chassis" form={form} setForm={setForm} placeholder="Ex: 9BWZZZ..." />
          </div>
          
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          
          {/* Card: Foto Oficial */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ImageIcon className="w-5 h-5"/></div>
              <h2 className="text-lg font-bold text-slate-800">Foto Oficial</h2>
            </div>

            {previewUrl ? (
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 shadow-inner group">
                <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-red-50 text-red-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 flex flex-col items-center justify-center cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-3 bg-white border border-slate-100 shadow-sm rounded-full mb-3 text-indigo-500">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">Enviar Foto</p>
                <p className="text-xs text-slate-400 mt-1">.jpg ou .png</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelected} 
            />
          </div>

          {/* Card: Financeiro */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><DollarSign className="w-5 h-5"/></div>
              <h2 className="text-lg font-bold text-slate-800">Investimento e Prazos</h2>
            </div>

            <div className="space-y-5">
              <InputField label="Valor Contratado (R$)" name="contract_value" form={form} setForm={setForm} type="number" placeholder="Ex: 150000" />
              <InputField label="Previsão de Entrega" name="expected_delivery_date" form={form} setForm={setForm} type="date" />
            </div>
          </div>

          {/* Submit */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-sm shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Processando...
              </span>
            ) : (
              'Cadastrar Projeto'
            )}
          </button>

        </div>
      </form>
    </div>
  )
}
