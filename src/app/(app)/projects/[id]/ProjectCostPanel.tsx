'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { DollarSign, Package, ShoppingCart, Plus, Trash2, TrendingUp, TrendingDown, Loader2, Receipt } from 'lucide-react'

type Purchase = {
  id: string
  description: string
  supplier_name: string | null
  quantity: number
  unit_price: number
  total_price: number
  purchase_date: string
  category: string
  notes: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  material: '🔩 Material',
  service: '🛠️ Serviço',
  logistics: '🚚 Logística',
  other: '📦 Outro',
}

export default function ProjectCostPanel({
  projectId,
  organizationId,
  contractValue,
  initialPurchases,
  materialCost,
}: {
  projectId: string
  organizationId: string
  contractValue: number
  initialPurchases: Purchase[]
  materialCost: number // soma dos stock outflows com unit_cost
}) {
  const supabase = createClient()
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    description: '',
    supplier_name: '',
    quantity: '1',
    unit_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
    category: 'material',
    notes: '',
  })

  const totalPurchases = purchases.reduce((acc, p) => acc + Number(p.total_price), 0)
  const totalCost = materialCost + totalPurchases
  const margin = contractValue - totalCost
  const marginPct = contractValue > 0 ? Math.round((margin / contractValue) * 100) : 0

  async function handleAddPurchase(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data } = await supabase.from('project_purchases').insert({
      project_id: projectId,
      organization_id: organizationId,
      description: form.description,
      supplier_name: form.supplier_name || null,
      quantity: Number(form.quantity),
      unit_price: Number(form.unit_price),
      purchase_date: form.purchase_date,
      category: form.category,
      notes: form.notes || null,
    }).select().single()

    if (data) {
      setPurchases(prev => [data as Purchase, ...prev])
      setShowForm(false)
      setForm({ description: '', supplier_name: '', quantity: '1', unit_price: '', purchase_date: new Date().toISOString().split('T')[0], category: 'material', notes: '' })
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este item de custo?')) return
    await supabase.from('project_purchases').delete().eq('id', id)
    setPurchases(prev => prev.filter(p => p.id !== id))
  }

  const marginColor = marginPct >= 30 ? 'text-emerald-600' : marginPct >= 10 ? 'text-amber-600' : 'text-red-600'
  const marginBg = marginPct >= 30 ? 'bg-emerald-50 border-emerald-200' : marginPct >= 10 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'

  return (
    <div className="soft-card p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold text-slate-800">Custos & Margem do Projeto</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs px-3 py-2">
          <Plus className="w-3.5 h-3.5" /> Compra Específica
        </button>
      </div>

      {/* Resumo Financeiro */}
      <div className={`p-4 rounded-2xl border mb-6 ${marginBg}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Contrato</p>
            <p className="text-lg font-black text-emerald-700">R$ {contractValue.toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Custo Materiais</p>
            <p className="text-lg font-black text-slate-700">R$ {materialCost.toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Compras Proj.</p>
            <p className="text-lg font-black text-slate-700">R$ {totalPurchases.toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Margem Bruta</p>
            <div className="flex items-center gap-1.5">
              {margin >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
              <p className={`text-lg font-black ${marginColor}`}>R$ {Math.abs(margin).toLocaleString('pt-BR')}</p>
              <span className={`text-xs font-bold ${marginColor}`}>({marginPct}%)</span>
            </div>
          </div>
        </div>

        {/* Progress bar de margem */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
            <span>Custo Total: R$ {totalCost.toLocaleString('pt-BR')}</span>
            <span>Meta: ≥30% Margem</span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all ${marginPct >= 30 ? 'bg-emerald-500' : marginPct >= 10 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(Math.max(marginPct, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Formulário de Nova Compra */}
      {showForm && (
        <form onSubmit={handleAddPurchase} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5 space-y-4">
          <h3 className="font-semibold text-slate-700 text-sm">Nova Compra Específica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Descrição *</label>
              <input required type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Ex: Vidro laminado frontal IIIA" className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Fornecedor</label>
              <input type="text" value={form.supplier_name} onChange={e => setForm(p => ({ ...p, supplier_name: e.target.value }))}
                placeholder="Nome do fornecedor" className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Categoria</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input-field w-full">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Data da Compra</label>
              <input type="date" value={form.purchase_date} onChange={e => setForm(p => ({ ...p, purchase_date: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Quantidade</label>
              <input required type="number" min="0.001" step="0.001" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Valor Unitário (R$) *</label>
              <input required type="number" min="0" step="0.01" value={form.unit_price} onChange={e => setForm(p => ({ ...p, unit_price: e.target.value }))}
                placeholder="0,00" className="input-field w-full font-bold text-emerald-700" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Adicionar Custo'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm px-4 py-2 text-slate-500 hover:text-slate-700">Cancelar</button>
          </div>
        </form>
      )}

      {/* Lista de Compras */}
      {purchases.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ShoppingCart className="w-3.5 h-3.5" /> Compras Específicas do Projeto
          </h3>
          <div className="space-y-2">
            {purchases.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0 text-sm">
                    {CATEGORY_LABELS[p.category]?.split(' ')[0] || '📦'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.description}</p>
                    <p className="text-[10px] text-slate-400">
                      {p.supplier_name && <>{p.supplier_name} · </>}
                      {p.quantity}x R$ {Number(p.unit_price).toLocaleString('pt-BR')} ·{' '}
                      {new Date(p.purchase_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-slate-800">R$ {Number(p.total_price).toLocaleString('pt-BR')}</span>
                  <button onClick={() => handleDelete(p.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-500">Total Compras Específicas</span>
            <span className="text-sm font-black text-slate-800">R$ {totalPurchases.toLocaleString('pt-BR')}</span>
          </div>
        </div>
      )}

      {purchases.length === 0 && !showForm && (
        <div className="text-center py-6 text-slate-400">
          <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma compra específica registrada.</p>
          <p className="text-xs mt-1">Itens comprados sob encomenda para este projeto.</p>
        </div>
      )}
    </div>
  )
}
