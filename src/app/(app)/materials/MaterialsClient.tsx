'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Package, Plus, Trash2, Edit2, Check, X, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react'

type Material = {
  id: string
  name: string
  sku: string | null
  quantity_in_stock: number
  unit_price: number | null
  minimum_stock: number
}

export default function MaterialsClient({ initialMaterials }: { initialMaterials: Material[] }) {
  const supabase = createClient()
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [stockModal, setStockModal] = useState<{ id: string; name: string; op: 'add' | 'remove' } | null>(null)
  const [stockQty, setStockQty] = useState('1')
  const [form, setForm] = useState({ name: '', sku: '', unit_price: '', minimum_stock: '5', quantity_in_stock: '0' })
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
      const { data } = await supabase.from('materials').update({
        name: form.name,
        sku: form.sku || null,
        unit_price: form.unit_price ? Number(form.unit_price) : null,
        minimum_stock: Number(form.minimum_stock),
      }).eq('id', editingId).select().single()
      if (data) setMaterials(prev => prev.map(m => m.id === editingId ? data as Material : m))
      setEditingId(null)
    } else {
      const orgId = await getOrgId()
      const { data } = await supabase.from('materials').insert({
        name: form.name,
        sku: form.sku || null,
        unit_price: form.unit_price ? Number(form.unit_price) : null,
        minimum_stock: Number(form.minimum_stock),
        quantity_in_stock: Number(form.quantity_in_stock),
        organization_id: orgId,
      }).select().single()
      if (data) setMaterials(prev => [data as Material, ...prev])
    }
    setSaving(false)
    setShowForm(false)
    setForm({ name: '', sku: '', unit_price: '', minimum_stock: '5', quantity_in_stock: '0' })
  }

  function startEdit(m: Material) {
    setForm({ name: m.name, sku: m.sku || '', unit_price: m.unit_price?.toString() || '', minimum_stock: m.minimum_stock.toString(), quantity_in_stock: m.quantity_in_stock.toString() })
    setEditingId(m.id)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir material?')) return
    await supabase.from('materials').delete().eq('id', id)
    setMaterials(prev => prev.filter(m => m.id !== id))
  }

  async function handleStockUpdate() {
    if (!stockModal) return
    const qty = parseInt(stockQty) || 0
    const mat = materials.find(m => m.id === stockModal.id)!
    const newQty = stockModal.op === 'add' ? mat.quantity_in_stock + qty : Math.max(0, mat.quantity_in_stock - qty)
    await supabase.from('materials').update({ quantity_in_stock: newQty }).eq('id', stockModal.id)
    setMaterials(prev => prev.map(m => m.id === stockModal.id ? { ...m, quantity_in_stock: newQty } : m))
    setStockModal(null)
    setStockQty('1')
  }

  const lowStock = materials.filter(m => m.quantity_in_stock <= m.minimum_stock)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Estoque de Materiais</h1>
          <p className="text-slate-500 text-sm mt-1">{materials.length} itens cadastrados</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', sku: '', unit_price: '', minimum_stock: '5', quantity_in_stock: '0' }) }}>
          <Plus className="w-4 h-4" /> Novo Material
        </button>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            <strong>{lowStock.length} item{lowStock.length > 1 ? 's' : ''}</strong> com estoque baixo: {lowStock.map(m => m.name).join(', ')}
          </p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="soft-card p-5 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">{editingId ? 'Editar Material' : 'Novo Material'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'name', label: 'Nome do Material *', type: 'text', required: true, placeholder: 'Manta Aramida' },
              { name: 'sku', label: 'SKU / Código', type: 'text', required: false, placeholder: 'MAT-001' },
              { name: 'unit_price', label: 'Preço Unitário (R$)', type: 'number', required: false, placeholder: '250,00' },
              { name: 'minimum_stock', label: 'Estoque Mínimo', type: 'number', required: false, placeholder: '5' },
              ...(!editingId ? [{ name: 'quantity_in_stock', label: 'Qtd. Inicial em Estoque', type: 'number', required: false, placeholder: '0' }] : []),
            ].map(f => (
              <div key={f.name}>
                <label className="text-xs font-medium text-slate-600 block mb-1">{f.label}</label>
                <input required={f.required} type={f.type} placeholder={f.placeholder} value={form[f.name as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
              </div>
            ))}
            <div className="flex gap-3 items-end col-span-2 md:col-span-1">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="soft-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Material</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">SKU</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Em Estoque</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Mín.</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Preço Unit.</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Movimentar</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map(m => {
                const isLow = m.quantity_in_stock <= m.minimum_stock
                return (
                  <tr key={m.id} className={`hover:bg-slate-50 transition-colors ${isLow ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700">{m.name}</span>
                        {isLow && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Baixo</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{m.sku || '—'}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`font-bold text-lg ${isLow ? 'text-amber-600' : 'text-slate-700'}`}>{m.quantity_in_stock}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-slate-500">{m.minimum_stock}</td>
                    <td className="px-5 py-3.5 text-right text-slate-600">
                      {m.unit_price ? `R$ ${Number(m.unit_price).toLocaleString('pt-BR')}` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setStockModal({ id: m.id, name: m.name, op: 'add' })} title="Entrada"
                          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setStockModal({ id: m.id, name: m.name, op: 'remove' })} title="Saída"
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => startEdit(m)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {materials.length === 0 && <p className="text-center text-slate-400 py-12 text-sm">Nenhum material cadastrado.</p>}
        </div>
      </div>

      {/* Stock movement modal */}
      {stockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-800 mb-1">{stockModal.op === 'add' ? '📦 Entrada de Estoque' : '📤 Saída de Estoque'}</h3>
            <p className="text-sm text-slate-500 mb-4">{stockModal.name}</p>
            <input type="number" min="1" value={stockQty} onChange={e => setStockQty(e.target.value)}
              className="w-full px-4 py-3 text-lg font-bold text-center border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-green-500 focus:outline-none" />
            <div className="flex gap-3">
              <button onClick={() => setStockModal(null)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={handleStockUpdate} className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white ${stockModal.op === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}>
                {stockModal.op === 'add' ? 'Confirmar Entrada' : 'Confirmar Saída'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
