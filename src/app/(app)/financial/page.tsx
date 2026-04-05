import { createClient } from '@/utils/supabase/server'
import FinancialClient from './FinancialClient'

export const dynamic = 'force-dynamic'

export default async function FinancialPage() {
  const supabase = await createClient()

  const [{ data: financials }, { data: projects }] = await Promise.all([
    supabase.from('financials').select('*, projects(customer_name)').order('created_at', { ascending: false }),
    supabase.from('projects').select('id, customer_name'),
  ])

  const totalIncome = financials?.filter(f => f.type === 'income' && f.paid).reduce((a, f) => a + Number(f.amount), 0) || 0
  const totalPending = financials?.filter(f => f.type === 'income' && !f.paid).reduce((a, f) => a + Number(f.amount), 0) || 0
  const totalExpense = financials?.filter(f => f.type === 'expense').reduce((a, f) => a + Number(f.amount), 0) || 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>
        <p className="text-slate-500 text-sm mt-1">Controle de receitas e despesas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="soft-card p-5">
          <p className="text-xs font-semibold text-slate-500 mb-1">Receitas Recebidas</p>
          <p className="text-2xl font-bold text-green-600">R$ {totalIncome.toLocaleString('pt-BR')}</p>
        </div>
        <div className="soft-card p-5">
          <p className="text-xs font-semibold text-slate-500 mb-1">A Receber</p>
          <p className="text-2xl font-bold text-orange-500">R$ {totalPending.toLocaleString('pt-BR')}</p>
        </div>
        <div className="soft-card p-5">
          <p className="text-xs font-semibold text-slate-500 mb-1">Despesas</p>
          <p className="text-2xl font-bold text-red-500">R$ {totalExpense.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <FinancialClient financials={financials || []} projects={projects || []} />
    </div>
  )
}
