import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Allow internal calls (from NotificationBell) OR cron calls with secret
  const authHeader = req.headers.get('authorization')
  const isInternalCall = req.headers.get('x-internal-call') === '1'
  const isCronCall = authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!isInternalCall && !isCronCall) {
    return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const next3Days = new Date(today)
  next3Days.setDate(next3Days.getDate() + 3)

  const next7Days = new Date(today)
  next7Days.setDate(next7Days.getDate() + 7)

  const newNotifs: any[] = []

  // ─────────────────────────────────────────────────────────────
  // 1. FINANCEIRO — Pagamentos vencidos (não pagos, data no passado)
  // ─────────────────────────────────────────────────────────────
  const { data: financials } = await supabase
    .from('financials')
    .select('id, description, amount, due_date, type, category, organization_id')
    .eq('paid', false)
    .not('due_date', 'is', null)

  financials?.forEach(f => {
    if (!f.due_date) return
    const dueDate = new Date(f.due_date)
    dueDate.setHours(0, 0, 0, 0)

    const amountFmt = Number(f.amount).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })

    const desc = f.description || (f.type === 'income' ? 'Receita' : 'Despesa')
    const daysDiff = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (dueDate < today) {
      // Vencido
      const daysLate = Math.abs(daysDiff)
      newNotifs.push({
        organization_id: f.organization_id,
        type: f.type === 'income' ? 'payment_overdue_income' : 'payment_overdue_expense',
        title: f.type === 'income' ? '⚠️ Recebível Vencido' : '🔴 Pagamento Vencido',
        body: `"${desc}" — ${amountFmt} está vencido há ${daysLate} dia${daysLate !== 1 ? 's' : ''}.`,
        link: '/financial',
      })
    } else if (dueDate <= next3Days) {
      // Vence em até 3 dias — urgente
      newNotifs.push({
        organization_id: f.organization_id,
        type: f.type === 'income' ? 'payment_due_soon_income' : 'payment_due_soon_expense',
        title: f.type === 'income' ? '📅 Recebível Urgente' : '📅 Pagamento Urgente',
        body: `"${desc}" — ${amountFmt} vence em ${daysDiff === 0 ? 'hoje' : `${daysDiff} dia${daysDiff !== 1 ? 's' : ''}`}.`,
        link: '/financial',
      })
    } else if (dueDate <= next7Days) {
      // Vence em até 7 dias — alerta
      newNotifs.push({
        organization_id: f.organization_id,
        type: f.type === 'income' ? 'payment_due_week_income' : 'payment_due_week_expense',
        title: f.type === 'income' ? '📬 Recebível Próximo' : '📬 Pagamento Próximo',
        body: `"${desc}" — ${amountFmt} vence em ${daysDiff} dias (${dueDate.toLocaleDateString('pt-BR')}).`,
        link: '/financial',
      })
    }
  })

  // ─────────────────────────────────────────────────────────────
  // 2. PÓS-VENDA — Revisões atrasadas ou próximas
  // ─────────────────────────────────────────────────────────────
  const { data: maintenance } = await supabase
    .from('maintenance_orders')
    .select('id, type, vehicle_model, scheduled_date, organization_id')
    .eq('status', 'scheduled')

  maintenance?.forEach(m => {
    if (!m.scheduled_date) return
    const sd = new Date(m.scheduled_date)
    sd.setHours(0, 0, 0, 0)

    if (sd < today) {
      newNotifs.push({
        organization_id: m.organization_id,
        type: 'revision_due',
        title: '🔧 Revisão Atrasada',
        body: `Revisão (${m.type}) de ${m.vehicle_model || 'Veículo'} está atrasada desde ${sd.toLocaleDateString('pt-BR')}.`,
        link: '/maintenance',
      })
    } else if (sd <= next7Days) {
      newNotifs.push({
        organization_id: m.organization_id,
        type: 'revision_due',
        title: '🔧 Revisão Próxima',
        body: `Revisão (${m.type}) de ${m.vehicle_model || 'Veículo'} agendada para ${sd.toLocaleDateString('pt-BR')}.`,
        link: '/maintenance',
      })
    }
  })

  // ─────────────────────────────────────────────────────────────
  // 3. PROJETOS — SICOVAB pendente
  // ─────────────────────────────────────────────────────────────
  const { data: projects } = await supabase
    .from('projects')
    .select('id, customer_name, vehicle_model, expected_delivery_date, sicovab_status, organization_id')
    .neq('status', 'concluido')

  projects?.forEach(p => {
    // SICOVAB pendente
    if (p.sicovab_status === 'pending') {
      newNotifs.push({
        organization_id: p.organization_id,
        type: 'pending_sicovab',
        title: '🛡️ SICOVAB Pendente',
        body: `Projeto de ${p.customer_name} (${p.vehicle_model || 'Sem modelo'}) aguarda protocolo do Exército.`,
        link: `/projects/${p.id}`,
      })
    }

    // Entrega atrasada
    if (p.expected_delivery_date) {
      const ed = new Date(p.expected_delivery_date)
      ed.setHours(0, 0, 0, 0)
      if (ed < today) {
        newNotifs.push({
          organization_id: p.organization_id,
          type: 'overdue_project',
          title: '🚗 Entrega Atrasada',
          body: `Projeto de ${p.customer_name} deveria ter sido entregue em ${ed.toLocaleDateString('pt-BR')}.`,
          link: `/projects/${p.id}`,
        })
      }
    }
  })

  // ─────────────────────────────────────────────────────────────
  // Recriar: apaga não lidas geradas por sistema e insere novas
  // ─────────────────────────────────────────────────────────────
  await supabase.from('notifications').delete().eq('read', false)

  if (newNotifs.length > 0) {
    await supabase.from('notifications').insert(newNotifs)
  }

  return NextResponse.json({ success: true, count: newNotifs.length })
}
