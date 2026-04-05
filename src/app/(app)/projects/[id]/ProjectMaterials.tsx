'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Package, Plus, Trash2 } from 'lucide-react'

type Material = { id: string; name: string; quantity_in_stock: number }
type ProjectMaterial = { id: string; quantity_used: number; materials: { name: string } | null }

export default function ProjectMaterials({
  projectId,
  initialProjectMaterials,
  allMaterials
}: {
  projectId: string
  initialProjectMaterials: ProjectMaterial[]
  allMaterials: Material[]
}) {
  const [usedMaterials, setUsedMaterials] = useState<ProjectMaterial[]>(initialProjectMaterials)
  const [adding, setAdding] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [quantity, setQuantity] = useState('1')
  const supabase = createClient()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMaterial || !quantity) return

    const qty = parseInt(quantity, 10)
    const mat = allMaterials.find(m => m.id === selectedMaterial)
    if (!mat) return

    if (qty > mat.quantity_in_stock) {
      alert(`Erro: Quantidade solicitada (${qty}) é maior que o estoque atual (${mat.quantity_in_stock}).`)
      return
    }

    // 1. Insert in project_materials
    const { data: newUsage, error } = await supabase.from('project_materials').insert({
      project_id: projectId,
      material_id: selectedMaterial,
      quantity_used: qty
    }).select('id, quantity_used, materials(name)').single()

    if (error) {
      alert(error.message)
      return
    }

    // 2. Decrement from global materials stock
    await supabase.from('materials').update({
      quantity_in_stock: mat.quantity_in_stock - qty
    }).eq('id', selectedMaterial)

    // Update local state and parent reference stock
    if (newUsage) {
      setUsedMaterials(prev => [...prev, newUsage as unknown as ProjectMaterial])
      mat.quantity_in_stock -= qty // Optimistic local decrement
    }
    setAdding(false)
    setQuantity('1')
  }

  async function handleDelete(id: string, matName: string | undefined, qtyUsed: number) {
    if (!confirm(`Remover ${qtyUsed}x ${matName || 'item'} consumido deste projeto? (O estoque não será reembolsado automaticamente)`)) return

    await supabase.from('project_materials').delete().eq('id', id)
    setUsedMaterials(prev => prev.filter(pm => pm.id !== id))
  }

  return (
    <div className="soft-card p-6 h-full">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-500" />
          <h2 className="font-semibold text-slate-800">Materiais Consumidos</h2>
        </div>
        <button onClick={() => setAdding(!adding)} className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
          {adding ? 'Cancelar' : '+ Lançar Uso'}
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="mb-4 p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Material do Estoque</label>
            <select
              value={selectedMaterial}
              onChange={e => setSelectedMaterial(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              required
            >
              <option value="">Selecione...</option>
              {allMaterials.map(m => (
                <option key={m.id} value={m.id} disabled={m.quantity_in_stock <= 0}>
                  {m.name} ({m.quantity_in_stock} em estoque)
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Qtd. Usada</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button type="submit" className="self-end px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors h-[38px]">
              Confirmar
            </button>
          </div>
        </form>
      )}

      {usedMaterials.length === 0 ? (
        <p className="text-sm text-center text-slate-400 py-6">Nenhum material registrado neste carro ainda.</p>
      ) : (
        <div className="space-y-2">
          {usedMaterials.map(pm => (
            <div key={pm.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-700">{pm.materials?.name || 'Material Excluído'}</p>
                <p className="text-xs text-slate-500">{pm.quantity_used} unidades consumidas</p>
              </div>
              <button
                onClick={() => handleDelete(pm.id, pm.materials?.name, pm.quantity_used)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
