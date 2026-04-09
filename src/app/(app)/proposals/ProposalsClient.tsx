'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FileText, Plus, X, ChevronDown, ChevronUp, DollarSign, Car, User, Trash2, Send } from 'lucide-react'
import ProposalPDF from '@/components/ProposalPDF'
import PDFDownloadButton from '@/components/PDFDownloadButton'
import ContractPDF from '@/components/ContractPDF'

type Lead = { id: string; customer_name: string; vehicle_model: string | null }

type ProposalItem = { description: string; quantity: number; unit_price: number }

type Proposal = {
  id: string
  customer_name: string
  vehicle_model: string | null
  armor_level: string | null
  items: ProposalItem[]
  total_value: number | null
  validity_days: number
  status: string
  notes: string | null
  created_at: string
}

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', color: 'text-slate-600', bg: 'bg-slate-100' },
  sent: { label: 'Enviada', color: 'text-blue-700', bg: 'bg-blue-100' },
  accepted: { label: 'Aceita', color: 'text-green-700', bg: 'bg-green-100' },
  rejected: { label: 'Recusada', color: 'text-red-700', bg: 'bg-red-100' },
}

export default function ProposalsClient({ initialProposals, leads }: { initialProposals: Proposal[]; leads: Lead[] }) {
  const supabase = createClient()
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    lead_id: '',
    customer_name: '',
    vehicle_model: '',
    armor_level: '',
    validity_days: '30',
    notes: '',
  })
  const [items, setItems] = useState<ProposalItem[]>([{ description: '', quantity: 1, unit_price: 0 }])

  const totalValue = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)

  function handleLeadChange(leadId: string) {
    const lead = leads.find(l => l.id === leadId)
    setForm(p => ({ ...p, lead_id: leadId, customer_name: lead?.customer_name || '', vehicle_model: lead?.vehicle_model || '' }))
  }

  function updateItem(idx: number, field: keyof ProposalItem, value: string | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: field === 'description' ? value : Number(value) } : item))
  }

  function addItem() { setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }]) }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  async function getOrgId() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    return data?.organization_id ?? null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const orgId = await getOrgId()
    const { data } = await supabase.from('proposals').insert({
      customer_name: form.customer_name,
      vehicle_model: form.vehicle_model || null,
      armor_level: form.armor_level || null,
      lead_id: form.lead_id || null,
      items: items,
      total_value: totalValue,
      validity_days: Number(form.validity_days),
      notes: form.notes || null,
      organization_id: orgId,
    }).select().single()
    if (data) setProposals(prev => [data as Proposal, ...prev])
    setSaving(false)
    setShowForm(false)
    setForm({ lead_id: '', customer_name: '', vehicle_model: '', armor_level: '', validity_days: '30', notes: '' })
    setItems([{ description: '', quantity: 1, unit_price: 0 }])
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('proposals').update({ status }).eq('id', id)
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir proposta?')) return
    await supabase.from('proposals').delete().eq('id', id)
    setProposals(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Propostas Comerciais</h1>
          <p className="text-slate-500 text-sm mt-1">{proposals.length} proposta{proposals.length !== 1 ? 's' : ''} cadastrada{proposals.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Nova Proposta
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="soft-card p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">Nova Proposta</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Importar de Lead</label>
                <select value={form.lead_id} onChange={e => handleLeadChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
                  <option value="">Selecionar lead (opcional)</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.customer_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nome do Cliente *</label>
                <input required type="text" value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                  placeholder="João Silva" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Veículo</label>
                <input type="text" value={form.vehicle_model} onChange={e => setForm(p => ({ ...p, vehicle_model: e.target.value }))}
                  placeholder="Toyota Hilux SW4" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nível de Blindagem</label>
                <input type="text" value={form.armor_level} onChange={e => setForm(p => ({ ...p, armor_level: e.target.value }))}
                  placeholder="IIIA" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Validade (dias)</label>
                <input type="number" value={form.validity_days} onChange={e => setForm(p => ({ ...p, validity_days: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">Itens da Proposta</label>
                <button type="button" onClick={addItem} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar item</button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <input type="text" placeholder="Descrição" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                      className="col-span-6 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
                    <input type="number" placeholder="Qtd" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)}
                      className="col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-center" />
                    <input type="number" placeholder="R$" step="0.01" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                      className="col-span-3 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
                    <button type="button" onClick={() => removeItem(idx)} className="col-span-1 flex justify-center text-slate-300 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="text-right mt-2">
                <span className="text-sm font-bold text-slate-700">Total: <span className="text-green-600 text-lg">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Observações</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-green-500 focus:outline-none" />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Criar Proposta'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Proposals list */}
      <div className="space-y-3">
        {proposals.length === 0 ? (
          <div className="soft-card p-12 text-center text-slate-400 text-sm">Nenhuma proposta criada ainda.</div>
        ) : proposals.map(p => {
          const cfg = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft
          const isExpanded = expanded === p.id
          return (
            <div key={p.id} className="soft-card overflow-hidden">
              <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpanded(isExpanded ? null : p.id)}>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800">{p.customer_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{p.vehicle_model || 'Veículo'} {p.armor_level ? `· ${p.armor_level}` : ''} · Válida {p.validity_days} dias</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-green-600">R$ {Number(p.total_value || 0).toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/50 space-y-4">
                  {/* Items table */}
                  {p.items && p.items.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">Itens</p>
                      <div className="space-y-1.5">
                        {(p.items as ProposalItem[]).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm text-slate-700 bg-white rounded-lg px-3 py-2 border border-slate-100">
                            <span>{item.description}</span>
                            <span className="text-slate-500">{item.quantity}x R$ {Number(item.unit_price).toLocaleString('pt-BR')} = <strong>R$ {(item.quantity * item.unit_price).toLocaleString('pt-BR')}</strong></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {p.notes && <p className="text-sm text-slate-600 italic">"{p.notes}"</p>}

                  {/* Status actions */}
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(STATUS_CONFIG).filter(s => s !== p.status).map(s => (
                      <button key={s} onClick={() => updateStatus(p.id, s)}
                        className={`text-xs px-3 py-1.5 rounded-lg border border-transparent font-medium transition-colors ${(STATUS_CONFIG as any)[s].bg} ${(STATUS_CONFIG as any)[s].color} hover:opacity-80`}>
                        {(STATUS_CONFIG as any)[s].label}
                      </button>
                    ))}
                    
                    <PDFDownloadButton
                      document={<ProposalPDF proposal={p} />}
                      fileName={`Proposta_${p.customer_name.replace(/\s+/g, '_')}.pdf`}
                      className="text-xs px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold transition-colors ml-2"
                    >
                      Exportar Proposta
                    </PDFDownloadButton>

                    {(p.status === 'accepted' || p.status === 'sent') && (
                      <PDFDownloadButton
                        document={<ContractPDF proposal={p} />}
                        fileName={`Contrato_${p.customer_name.replace(/\s+/g, '_')}.pdf`}
                        className="text-xs px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors"
                      >
                        📄 Gerar Contrato
                      </PDFDownloadButton>
                    )}

                    <button onClick={() => handleDelete(p.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 ml-auto font-medium">
                      <Trash2 className="w-3.5 h-3.5 inline mr-1" />Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
