'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Wallet,
  Receipt,
  CreditCard,
  ShoppingBag,
  Home,
  Tool,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from '@/components/ui/chart'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { cn } from '@/lib/utils'

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
  status: string
  parent_id?: string
  installment_number?: number
  total_installments?: number
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
    installments: '1',
    status: 'pending',
  })
  const [saving, setSaving] = useState(false)

  const chartConfig = {
    income: {
      label: "Receitas",
      color: "#22c55e",
    },
    expense: {
      label: "Despesas",
      color: "#ef4444",
    },
  } satisfies ChartConfig

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
    
    const numInstallments = parseInt(form.installments) || 1
    const baseAmount = Number(form.amount)
    const installmentAmount = Number((baseAmount / numInstallments).toFixed(2))
    
    const inserts = []
    const baseDate = form.due_date ? new Date(form.due_date) : new Date()

    // Se houver parcelas, tratamos de forma especial
    for (let i = 0; i < numInstallments; i++) {
      const dueDate = new Date(baseDate)
      dueDate.setMonth(dueDate.getMonth() + i)
      
      inserts.push({
        type: form.type,
        amount: installmentAmount,
        description: numInstallments > 1 ? `${form.description} (${i+1}/${numInstallments})` : (form.description || null),
        due_date: dueDate.toISOString().split('T')[0],
        payment_method: form.payment_method,
        category: form.category,
        organization_id: orgId,
        installment_number: numInstallments > 1 ? i + 1 : null,
        total_installments: numInstallments > 1 ? numInstallments : null,
        status: form.status,
        paid: form.status === 'paid'
      })
    }

    const { data, error } = await supabase.from('financials').insert(inserts).select()
    
    if (!error && data) {
      setRecords(prev => [...(data as Financial[]), ...prev])
      setShowForm(false)
      setForm({ type: 'income', amount: '', description: '', due_date: '', payment_method: 'pix', category: 'contrato', installments: '1' })
    }
    setSaving(false)
  }

  async function updateStatus(id: string, newStatus: string) {
    const isPaid = newStatus === 'paid'
    const { error } = await supabase
      .from('financials')
      .update({ status: newStatus, paid: isPaid })
      .eq('id', id)
    
    if (!error) {
      setRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, paid: isPaid } : r))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir lançamento?')) return
    await supabase.from('financials').delete().eq('id', id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Financeiro</h1>
          <p className="text-slate-400 text-lg font-medium mt-1">Gestão inteligente de fluxo de caixa e resultados</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "btn-primary px-6 py-3 rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-95",
            showForm ? "bg-rose-500 hover:bg-rose-600" : "bg-indigo-600 hover:bg-indigo-700"
          )}
        >
          {showForm ? <Trash2 className="w-4 h-4 rotate-45" /> : <Plus className="w-5 h-5" />}
          <span className="ml-2">{showForm ? 'Fechar' : 'Novo Lançamento'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Receitas', value: totalIncome, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500/10', iconBg: 'bg-emerald-50' },
          { label: 'Recebido', value: paidIncome, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-500/10', iconBg: 'bg-blue-50' },
          { label: 'Total Despesas', value: totalExpense, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-500/10', iconBg: 'bg-rose-50' },
          { label: 'Resultado Líquido', value: result, icon: Wallet, color: result >= 0 ? 'text-indigo-600' : 'text-rose-600', bg: result >= 0 ? 'bg-indigo-500/10' : 'bg-rose-500/10', iconBg: result >= 0 ? 'bg-indigo-50' : 'bg-rose-50' },
        ].map(card => (
          <div key={card.label} className="soft-card p-5 flex items-center gap-4 bg-white/70 backdrop-blur-xl border border-white/40 hover:translate-y-[-2px] transition-all">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm", card.iconBg)}>
              <card.icon className={cn("w-6 h-6", card.color)} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-xl font-bold text-slate-800 mt-1">
                R$ {Math.abs(card.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="soft-card p-8 mb-10 bg-white/80 backdrop-blur-2xl border border-white/50 shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Novo Lançamento</h3>
          </div>
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
              <label className="text-xs font-medium text-slate-600 block mb-1">Vencimento (1ª pcela)</label>
              <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Parcelas</label>
              <input type="number" min="1" max="60" value={form.installments} onChange={e => setForm(p => ({ ...p, installments: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Status Inicial</label>
              <NativeSelect 
                value={form.status} 
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="h-[38px] text-sm"
              >
                <option value="pending">Não pago</option>
                <option value="paid">Pago</option>
                <option value="overdue">Em atraso</option>
              </NativeSelect>
            </div>
            <div className="md:col-span-1 lg:col-span-1 flex gap-3 items-end">
              <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Salvando...' : 'Adicionar'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 bg-white/50 backdrop-blur-md border border-white/40 p-1.5 rounded-2xl w-fit shadow-sm">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'income', label: 'Receitas' },
          { id: 'expense', label: 'Despesas' },
          { id: 'reports', label: 'Relatórios' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={cn(
              "px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300",
              tab === t.id 
                ? "bg-slate-800 text-white shadow-md shadow-slate-400/20" 
                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Reports Tab */}
      {tab === 'reports' ? (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 soft-card p-8">
              <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" /> Fluxo de Caixa Mensal
              </h3>
              <div className="h-[350px] w-full mt-4">
                <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
                  <BarChart data={(() => {
                    const monthsOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                    const data: any = {}
                    records.forEach(r => {
                      if (!r.due_date) return
                      const m = monthsOrder[new Date(r.due_date).getMonth()]
                      if (!data[m]) data[m] = { month: m, income: 0, expense: 0 }
                      data[m][r.type] += Number(r.amount)
                    })
                    return monthsOrder.map(m => data[m] || { month: m, income: 0, expense: 0 })
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            <div className="soft-card p-6">
              <h3 className="font-semibold text-slate-800 mb-6">Status dos Recebíveis</h3>
              <div className="space-y-6">
                {[
                  { label: 'Em Dia', val: records.filter(r => r.type === 'income' && r.paid).length, color: 'bg-green-500', total: records.filter(r => r.type === 'income').length },
                  { label: 'Pendentes', val: records.filter(r => r.type === 'income' && !r.paid && (r.due_date && new Date(r.due_date) >= new Date())).length, color: 'bg-amber-500', total: records.filter(r => r.type === 'income').length },
                  { label: 'Atrasados', val: records.filter(r => r.type === 'income' && !r.paid && (r.due_date && new Date(r.due_date) < new Date())).length, color: 'bg-red-500', total: records.filter(r => r.type === 'income').length },
                ].map(stat => (
                  <div key={stat.label}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-slate-600">{stat.label}</span>
                      <span className="text-xs font-bold text-slate-800">{stat.val}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${stat.color} rounded-full`} style={{ width: `${(stat.val / (stat.total || 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* DRE */}
          <div className="soft-card p-8">
            <h3 className="text-xl font-semibold text-slate-800 mb-6">DRE Simplificado</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-base text-slate-600">Receita Bruta</span>
                <span className="text-lg font-semibold text-green-600">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-base text-slate-600">(-) Despesas</span>
                <span className="text-lg font-semibold text-red-500">- R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-4 bg-slate-50 rounded-xl px-4">
                <span className="text-base font-bold text-slate-700">Resultado Líquido</span>
                <span className={`text-xl font-bold ${result >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {result.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          {/* Por categoria */}
          <div className="soft-card p-8">
            <h3 className="text-xl font-semibold text-slate-800 mb-6">Receitas por Categoria</h3>
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
                const currentStatus = r.paid ? 'paid' : (r.status === 'overdue' || isOverdue ? 'overdue' : 'pending')
                
                const getIcon = () => {
                  if (r.type === 'income') return <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                  if (r.category === 'material') return <ShoppingBag className="w-5 h-5 text-indigo-500" />
                  if (r.category === 'aluguel') return <Home className="w-5 h-5 text-rose-500" />
                  if (r.category === 'mão de obra') return <Tool className="w-5 h-5 text-amber-500" />
                  return <Receipt className="w-5 h-5 text-slate-500" />
                }

                const getIconBg = () => {
                  if (r.type === 'income') return 'bg-emerald-50'
                  if (r.category === 'material') return 'bg-indigo-50'
                  if (r.category === 'aluguel') return 'bg-rose-50'
                  if (r.category === 'mão de obra') return 'bg-amber-50'
                  return 'bg-slate-50'
                }

                return (
                  <div key={r.id} className="group flex items-center gap-5 py-4 px-6 hover:bg-white/60 transition-all border-b border-slate-50 last:border-0">
                    {/* Icon Box */}
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105", getIconBg())}>
                      {getIcon()}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="text-base font-bold text-slate-800 truncate">
                          {r.description || `${r.type === 'income' ? 'Receita' : 'Despesa'} — ${r.category}`}
                        </p>
                        {/* Status Tag */}
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          currentStatus === 'paid' ? "bg-emerald-100 text-emerald-700" : 
                          currentStatus === 'overdue' ? "bg-rose-100 text-rose-700" : 
                          "bg-slate-100 text-slate-600"
                        )}>
                          {currentStatus === 'paid' ? 'Pago' : currentStatus === 'overdue' ? 'Atrasado' : 'Pendente'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-slate-400">
                        <span className="text-xs font-medium uppercase tracking-tight">{r.category}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                        <span className="text-xs">{r.payment_method}</span>
                        {r.due_date && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className="text-xs font-medium">Vence {new Date(r.due_date).toLocaleDateString('pt-BR')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className={cn("text-lg font-black tracking-tight", r.type === 'income' ? 'text-emerald-600' : 'text-rose-500')}>
                        {r.type === 'income' ? '+' : '-'} R$ {Number(r.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Actions Selection */}
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <NativeSelect 
                        value={currentStatus} 
                        onChange={(e) => updateStatus(r.id, e.target.value)}
                        className={cn(
                          "w-[110px] text-[10px] font-bold uppercase tracking-wider h-8 bg-transparent border-slate-200",
                          currentStatus === 'paid' ? "text-emerald-600" : 
                          currentStatus === 'overdue' ? "text-rose-600" : 
                          "text-slate-500"
                        )}
                      >
                        <NativeSelectOption value="pending">Não pago</NativeSelectOption>
                        <NativeSelectOption value="paid">Pago</NativeSelectOption>
                        <NativeSelectOption value="overdue">Em atraso</NativeSelectOption>
                      </NativeSelect>
                      
                      <button onClick={() => handleDelete(r.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
