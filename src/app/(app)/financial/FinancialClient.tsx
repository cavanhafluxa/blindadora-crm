'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, CheckCircle, Clock } from 'lucide-react'

type Financial = {
  id: string
  type: string
  amount: number
  description: string | null
  due_date: string | null
  paid: boolean
  payment_method: string
  category: string
  created_at: string
}

const PAYMENT_METHODS = ['pix', 'cartão', 'boleto', 'dinheiro', 'transferência', 'cheque']
const CATEGORIES_INCOME = ['contrato', 'entrada', 'parcela', 'bonus', 'outros']
const CATEGORIES_EXPENSE = ['material', 'mão de obra', 'aluguel', 'fornecedor', 'imposto', 'outros']

export default function FinancialClient({ initialData }: { initialData: Financial[] }) {
  const supabase = createClient()
  const [records, setRecords] = useState<Financial[]>(initialData)
  const [tab, setTab] = useState<'all' | 'income' | 'expense' | 'reports'>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: 'income',
    amount: '',
    description: '',
    due_date: '',
    payment_method: 'pix',
    category: 'contrato',
  })
  const [saving, setSaving] = useState(false)

  const income = records.filter(r => r.type === 'income')
  const expense = records.filter(r => r.type === 'expense')
  const totalIncome = income.reduce((s, r) => s + Number(r.amount), 0)
  const totalExpense = expense.reduce((s, r) => s + Number(r.amount), 0)
  const paidIncome = income.filter(r => r.paid).reduce((s, r) => s + Number(r.amount), 0)
  const result = totalIncome - totalExpense

  const filtered = tab === 'income' ? income : tab === 'expense' ? expense : tab === 'all' ? records : []

  async function getOrgId() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    return data?.organization_id ?? null
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const orgId = await getOrgId()
    const { data, error } = await supabase.from('financials').insert({
      type: form.type,
      amount: Number(form.amount),
      description: form.description || null,
      due_date: form.due_date || null,
      payment_method: form.payment_method,
      category: form.category,
      organization_id: orgId,
    }).select().single()
    if (!error && data) {
      setRecords(prev => [data as Financial, ...prev])
      setShowForm(false)
      setForm({ type: 'income', amount: '', description: '', due_date: '', payment_method: 'pix', category: 'contrato' })
    }
    setSaving(false)
  }

  async function togglePaid(id: string, current: boolean) {
    await supabase.from('financials').update({ paid: !current }).eq('id', id)
    setRecords(prev => prev.map(r => r.id === id ? { ...r, paid: !current } : r))
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir lançamento?')) return
    await supabase.from('financials').delete().eq('id', id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>
          <p className="text-slate-500 text-sm mt-1">Controle de receitas, despesas e resultados</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Novo Lançamento
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Receitas', value: totalIncome, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Recebido', value: paidIncome, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Despesas', value: totalExpense, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Resultado Líquido', value: result, icon: DollarSign, color: result >= 0 ? 'text-green-700' : 'text-red-700', bg: result >= 0 ? 'bg-green-50' : 'bg-red-50' },
        ].map(card => (
          <div key={card.label} className={`soft-card p-5 ${card.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <p className="text-xs text-slate-500 font-medium">{card.label}</p>
            </div>
            <p className={`text-xl font-bold ${card.color}`}>
              R$ {Math.abs(card.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="soft-card p-5 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">Novo Lançamento</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Tipo</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value, category: e.target.value === 'income' ? 'contrato' : 'material' }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Valor (R$)</label>
              <input required type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="0,00" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Categoria</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
                {(form.type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Método Pagamento</label>
              <select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:outline-none">
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Descrição</label>
              <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" placeholder="Ex: Entrada contrato João" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Vencimento</label>
              <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
            </div>
            <div className="col-span-2 flex gap-3 items-end">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Adicionar'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'income', label: 'Receitas' },
          { id: 'expense', label: 'Despesas' },
          { id: 'reports', label: 'Relatório' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Reports Tab */}
      {tab === 'reports' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DRE */}
          <div className="soft-card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">DRE Simplificado</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Receita Bruta</span>
                <span className="font-semibold text-green-600">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">(-) Despesas</span>
                <span className="font-semibold text-red-500">- R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-slate-50 rounded-xl px-3">
                <span className="text-sm font-bold text-slate-700">Resultado Líquido</span>
                <span className={`text-lg font-bold ${result >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {result.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          {/* Por categoria */}
          <div className="soft-card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Receitas por Categoria</h3>
            <div className="space-y-2">
              {CATEGORIES_INCOME.map(cat => {
                const total = income.filter(r => r.category === cat).reduce((s, r) => s + Number(r.amount), 0)
                if (total === 0) return null
                const pct = totalIncome > 0 ? (total / totalIncome) * 100 : 0
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span className="capitalize">{cat}</span>
                      <span>R$ {total.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Records list */
        <div className="soft-card overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-12 text-sm">Nenhum lançamento encontrado.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(r => {
                const isOverdue = r.due_date && !r.paid && new Date(r.due_date) < new Date()
                return (
                  <div key={r.id} className={`flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-red-50/50' : ''}`}>
                    <button onClick={() => togglePaid(r.id, r.paid)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${r.paid ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-green-400'}`}>
                      {r.paid && <CheckCircle className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${r.paid ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {r.description || `${r.type === 'income' ? 'Receita' : 'Despesa'} — ${r.category}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-400 capitalize">{r.category}</span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-400 capitalize">{r.payment_method}</span>
                        {r.due_date && <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>vence {new Date(r.due_date).toLocaleDateString('pt-BR')}</span>}
                      </div>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${r.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {r.type === 'income' ? '+' : '-'} R$ {Number(r.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <button onClick={() => handleDelete(r.id)} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
