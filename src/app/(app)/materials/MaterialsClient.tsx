'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, X, AlertTriangle } from 'lucide-react'

type Material = {
  id: string
  name: string
  sku: string | null
  quantity_in_stock: number
  unit_price: number | null
  minimum_stock: number
}

export default function MaterialsClient({ materials: initial }: { materials: Material[] }) {
  const [materials, setMaterials] = useState<Material[]>(initial)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', sku: '', quantity_in_stock: '', unit_price: '', minimum_stock: '5' })
  const supabase = createClient()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const { data } = await supabase.from('materials').insert({
      name: form.name,
      sku: form.sku || null,
      quantity_in_stock: Number(form.quantity_in_stock) || 0,
      unit_price: form.unit_price ? Number(form.unit_price) : null,
      minimum_stock: Number(form.minimum_stock) || 5,
    }).select().single()

    if (data) {
      setMaterials(prev => [...prev, data])
      setShowModal(false)
      setForm({ name: '', sku: '', quantity_in_stock: '', unit_price: '', minimum_stock: '5' })
    }
  }

  async function updateQuantity(id: string, delta: number, current: number) {
    const newQty = Math.max(0, current + delta)
    await supabase.from('materials').update({ quantity_in_stock: newQty }).eq('id', id)
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, quantity_in_stock: newQty } : m))
  }

  return (
    <>
      <div className="soft-card">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{materials.length} materiais cadastrados</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Novo Material
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Material</th>
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">SKU</th>
                <th className="text-center text-xs font-semibold text-slate-500 px-5 py-3">Estoque</th>
                <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Preço Unit.</th>
                <th className="text-center text-xs font-semibold text-slate-500 px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-slate-400 py-12">Nenhum material ainda.</td></tr>
              ) : (
                materials.map(m => (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {m.quantity_in_stock <= m.minimum_stock && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        )}
                        <span className="font-medium text-slate-800">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">{m.sku || '-'}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`font-bold ${m.quantity_in_stock <= m.minimum_stock ? 'text-red-600' : 'text-slate-800'}`}>
                        {m.quantity_in_stock}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {m.unit_price ? `R$ ${Number(m.unit_price).toLocaleString('pt-BR')}` : '-'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updateQuantity(m.id, -1, m.quantity_in_stock)} className="w-7 h-7 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 flex items-center justify-center transition-colors">-</button>
                        <button onClick={() => updateQuantity(m.id, 1, m.quantity_in_stock)} className="w-7 h-7 rounded-lg bg-green-50 text-green-600 font-bold hover:bg-green-100 flex items-center justify-center transition-colors">+</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-slate-800">Novo Material</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              {[
                { name: 'name', label: 'Nome do Material *', type: 'text', required: true, placeholder: 'Manta Aramida IIIA' },
                { name: 'sku', label: 'SKU', type: 'text', required: false, placeholder: 'MANTA-IIIA-001' },
                { name: 'quantity_in_stock', label: 'Qtd. em Estoque', type: 'number', required: false, placeholder: '50' },
                { name: 'unit_price', label: 'Preço Unitário (R$)', type: 'number', required: false, placeholder: '1200' },
                { name: 'minimum_stock', label: 'Estoque Mínimo', type: 'number', required: false, placeholder: '5' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={form[f.name as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
