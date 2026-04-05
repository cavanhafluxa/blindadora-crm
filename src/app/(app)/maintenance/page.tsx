import { createClient } from '@/utils/supabase/server'
import MaintenanceClient from './MaintenanceClient'

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
  const supabase = await createClient()
  const [{ data: orders }, { data: projects }] = await Promise.all([
    supabase.from('maintenance_orders').select('*, projects(customer_name, plate, vehicle_model)').order('created_at', { ascending: false }),
    supabase.from('projects').select('id, customer_name, plate, vehicle_model').order('customer_name'),
  ])

  return <MaintenanceClient initialOrders={orders || []} projects={projects || []} />
}
