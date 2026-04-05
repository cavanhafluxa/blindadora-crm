'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, X, Check } from 'lucide-react'

type Financial = {
  id: string
  type: string
  amount: number
  description: string | null
  due_date: string | null
  paid: boolean
  projects?: { customer_name: string } | null
}

type Project = { id: string; customer_name: string }

export default function FinancialClient({ financials: initial, projects }: { financials: Financial[]; projects: Project[] }) {
  const [financials, setFinancials] = useState<Financial[]>(initial)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: 'income', amount: '', description: '', due_date: '', project_id: '' })
  const supabase = createClient()

  async function togglePaid(id: string, paid: boolean) {
    await supabase.from('financials').update({ paid: !paid }).eq('id', id)
    setFinancials(prev => prev.map(f => f.id === id ? { ...f, paid: !paid } : f))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const { data } = await supabase.from('financials').insert({
      type: form.type,
      amount: Number(form.amount),
      description: form.description || null,
      due_date: form.due_date || null,
      project_id: form.project_id || null,
      paid: false,
    }).select('*, projects(customer_name)').single()

    if (data) {
      setFinancials(prev => [data, ...prev])
      setShowModal(false)
      setForm({ type: 'income', amount: '', description: '', due_date: '', project_id: '' })
    }
  }

  return (
    <div className="soft-card">
      <div className="flex justify-between items-center p-5 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">Lançamentos</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Novo Lançamento
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Tipo</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Descrição</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Projeto</th>
              <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">Vencimento</th>
              <th className="text-right text-xs font-semibold text-slate-500 px-5 py-3">Valor</th>
              <th className="text-center text-xs font-semibold text-slate-500 px-5 py-3">Pago</th>
            </tr>
          </thead>
          <tbody>
            {financials.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-slate-400 py-12">Nenhum lançamento ainda.</td>
              </tr>
            ) : (
              financials.map(f => (
                <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className={`stage-badge ${f.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {f.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{f.description || '-'}</td>
                  <td className="px-5 py-3 text-slate-500">{f.projects?.customer_name || '-'}</td>
                  <td className="px-5 py-3 text-slate-500">{f.due_date ? new Date(f.due_date).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-800">
                    R$ {Number(f.amount).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => togglePaid(f.id, f.paid)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-all ${f.paid ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400'}`}
                    >
                      {f.paid && <Check className="w-3 h-3 text-white" />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-slate-800">Novo Lançamento</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="income">Receita</option>
                  <option value="expense">Despesa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Entrada do cliente..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$) *</label>
                <input type="number" required value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="50000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento</label>
                <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Projeto associado</label>
                <select value={form.project_id} onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                  <option value="">Nenhum</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.customer_name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
