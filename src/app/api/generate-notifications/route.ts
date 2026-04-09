import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const today = new Date()
  today.setHours(0,0,0,0)
  const next7Days = new Date(today)
  next7Days.setDate(next7Days.getDate() + 7)

  // 1. Revisões Atrasadas ou na Semana
  const { data: maintenance } = await supabase
    .from('maintenance_orders')
    .select('*')
    .eq('status', 'scheduled')

  const newNotifs: any[] = []

  maintenance?.forEach(m => {
    if (!m.scheduled_date) return
    const sd = new Date(m.scheduled_date)
    if (sd < today) {
      newNotifs.push({
        organization_id: m.organization_id,
        type: 'revision_due',
        title: 'Revisão Atrasada',
        body: `A revisão (${m.type}) de ${m.vehicle_model || 'Veículo'} está atrasada.`,
        link: '/maintenance'
      })
    } else if (sd <= next7Days) {
      newNotifs.push({
        organization_id: m.organization_id,
        type: 'revision_due',
        title: 'Revisão Próxima',
        body: `A revisão (${m.type}) de ${m.vehicle_model || 'Veículo'} será dia ${sd.toLocaleDateString('pt-BR')}.`,
        link: '/maintenance'
      })
    }
  })

  // 2. Projetos pendentes de SICOVAB
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .neq('status', 'concluido')
    .eq('sicovab_status', 'pending')

  projects?.forEach(p => {
    newNotifs.push({
      organization_id: p.organization_id,
      type: 'pending_sicovab',
      title: 'SICOVAB Pendente',
      body: `O projeto de ${p.customer_name} (${p.vehicle_model || 'Sem modelo'}) precisa do protocolo do Exército.`,
      link: `/projects/${p.id}`
    })
  })

  // 3. Projetos Atrasados (Delivery)
  projects?.forEach(p => {
    if (p.expected_delivery_date) {
      const ed = new Date(p.expected_delivery_date)
      if (ed < today) {
        newNotifs.push({
          organization_id: p.organization_id,
          type: 'overdue_project',
          title: 'Entrega Atrasada',
          body: `O projeto de ${p.customer_name} deveria ter sido entregue em ${ed.toLocaleDateString('pt-BR')}.`,
          link: `/projects/${p.id}`
        })
      }
    }
  })

  // Inserir ignorando duplicatas exatas no mesmo dia (usaremos title + body match para simplificar)
  // Como não temos uma unique constraint com data e body, para não floodar na API GET, vamos apagar as não lidas de "hoje" ou simplesmente limpar e recriar.
  // Abordagem limpa: limpar notificações geradas por sistema não lidas e recriá-las.
  await supabase.from('notifications').delete().eq('read', false)
  
  if (newNotifs.length > 0) {
    await supabase.from('notifications').insert(newNotifs)
  }

  return NextResponse.json({ success: true, count: newNotifs.length })
}
