'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Lead = { id: string; customer_name: string; vehicle_model: string | null; plate: string | null; quoted_value: number | null }

export default function NewProjectClient({ leads }: { leads: Lead[] }) {
  const [form, setForm] = useState({
    customer_name: '', plate: '', vehicle_model: '', chassis: '',
    contract_value: '', expected_delivery_date: '', lead_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.from('projects').insert({
      customer_name: form.customer_name,
      plate: form.plate || null,
      vehicle_model: form.vehicle_model || null,
      chassis: form.chassis || null,
      contract_value: form.contract_value ? Number(form.contract_value) : null,
      expected_delivery_date: form.expected_delivery_date || null,
      lead_id: form.lead_id || null,
    }).select().single()

    setLoading(false)
    if (error) {
      setError(error.message)
    } else if (data) {
      router.push(`/projects/${data.id}`)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/projects" className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Novo Projeto</h1>
          <p className="text-slate-500 text-sm">As 12 etapas serão criadas automaticamente</p>
        </div>
      </div>

      <div className="soft-card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {leads.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Importar de Lead Contratado</label>
              <select
                onChange={handleLeadSelect}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">Selecionar lead (opcional)</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>{l.customer_name} - {l.vehicle_model || 'Veículo'}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'customer_name', label: 'Nome do Cliente *', type: 'text', required: true, placeholder: 'João Silva' },
              { name: 'vehicle_model', label: 'Modelo do Veículo', type: 'text', required: false, placeholder: 'Toyota Hilux SW4' },
              { name: 'plate', label: 'Placa', type: 'text', required: false, placeholder: 'ABC-1234' },
              { name: 'chassis', label: 'Chassi', type: 'text', required: false, placeholder: '9BWZZZ377VT004251' },
              { name: 'contract_value', label: 'Valor Contratado (R$)', type: 'number', required: false, placeholder: '150000' },
              { name: 'expected_delivery_date', label: 'Previsão de Entrega', type: 'date', required: false, placeholder: '' },
            ].map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={form[field.name as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [field.name]: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-3"
          >
            {loading ? 'Criando...' : 'Criar Projeto e 12 Etapas'}
          </button>
        </form>
      </div>
    </div>
  )
}
