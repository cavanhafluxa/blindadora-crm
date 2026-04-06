import { createClient } from '@/utils/supabase/server'
import AuditClient from './AuditClient'

export const dynamic = 'force-dynamic'

export default async function AuditPage() {
  const supabase = await createClient()

  // Fetch audit logs with the associated profile
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      created_at,
      profiles (
        full_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching audit logs:', error)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 bg-[#F3F5F8]">
      <div className="mb-2 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Auditoria (Logs)</h1>
        <p className="text-slate-500 text-sm mt-1">Verifique o histórico de todas as alterações feitas no sistema</p>
      </div>
      <AuditClient initialLogs={logs || []} />
    </div>
  )
}
