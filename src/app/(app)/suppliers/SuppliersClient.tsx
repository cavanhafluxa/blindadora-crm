'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Users, Plus, Trash2, Edit2, Phone, Mail, Building2 } from 'lucide-react'

type Supplier = {
  id: string
  name: string
  cnpj: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  payment_terms: string | null
  notes: string | null
}

export default function SuppliersClient({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const supabase = createClient()
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', cnpj: '', contact_name: '', phone: '', email: '', payment_terms: '', notes: '' })
  const [saving, setSaving] = useState(false)

  async function getOrgId() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    return data?.organization_id ?? null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editingId) {
      const { data } = await supabase.from('suppliers').update({ ...form }).eq('id', editingId).select().single()
      if (data) setSuppliers(prev => prev.map(s => s.id === editingId ? data as Supplier : s))
      setEditingId(null)
    } else {
      const orgId = await getOrgId()
      const { data } = await supabase.from('suppliers').insert({ ...form, organization_id: orgId }).select().single()
      if (data) setSuppliers(prev => [data as Supplier, ...prev])
    }
    setSaving(false)
    setShowForm(false)
    setForm({ name: '', cnpj: '', contact_name: '', phone: '', email: '', payment_terms: '', notes: '' })
  }

  function startEdit(s: Supplier) {
    setForm({ name: s.name, cnpj: s.cnpj || '', contact_name: s.contact_name || '', phone: s.phone || '', email: s.email || '', payment_terms: s.payment_terms || '', notes: s.notes || '' })
    setEditingId(s.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir fornecedor?')) return
    await supabase.from('suppliers').delete().eq('id', id)
    setSuppliers(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fornecedores</h1>
          <p className="text-slate-500 text-sm mt-1">{suppliers.length} fornecedor{suppliers.length !== 1 ? 'es' : ''} cadastrado{suppliers.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', cnpj: '', contact_name: '', phone: '', email: '', payment_terms: '', notes: '' }) }}>
          <Plus className="w-4 h-4" /> Novo Fornecedor
        </button>
      </div>

      {showForm && (
        <div className="soft-card p-5 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">{editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'name', label: 'Razão Social *', required: true, placeholder: 'Vidros Técnicos Ltda' },
              { name: 'cnpj', label: 'CNPJ', required: false, placeholder: '00.000.000/0001-00' },
              { name: 'contact_name', label: 'Contato', required: false, placeholder: 'João Silva' },
              { name: 'phone', label: 'Telefone', required: false, placeholder: '(11) 99999-9999' },
              { name: 'email', label: 'E-mail', required: false, placeholder: 'contato@empresa.com' },
              { name: 'payment_terms', label: 'Condições de Pagamento', required: false, placeholder: '30/60/90 dias' },
            ].map(f => (
              <div key={f.name}>
                <label className="text-xs font-medium text-slate-600 block mb-1">{f.label}</label>
                <input required={f.required} type="text" placeholder={f.placeholder} value={form[f.name as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
            ))}
            <div className="col-span-2 md:col-span-3">
              <label className="text-xs font-medium text-slate-600 block mb-1">Observações</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:outline-none" />
            </div>
            <div className="flex gap-3 items-center col-span-2">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.length === 0 ? (
          <div className="col-span-2 soft-card p-12 text-center text-slate-400 text-sm">Nenhum fornecedor cadastrado.</div>
        ) : suppliers.map(s => (
          <div key={s.id} className="soft-card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{s.name}</p>
                  {s.cnpj && <p className="text-xs text-slate-500">{s.cnpj}</p>}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => startEdit(s)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="space-y-1.5">
              {s.contact_name && <p className="text-sm text-slate-600 flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-400" />{s.contact_name}</p>}
              {s.phone && <p className="text-sm text-slate-600 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" />{s.phone}</p>}
              {s.email && <p className="text-sm text-slate-600 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400" />{s.email}</p>}
              {s.payment_terms && <p className="text-sm text-slate-500 mt-2 italic">💳 {s.payment_terms}</p>}
              {s.notes && <p className="text-xs text-slate-400 mt-1">{s.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
