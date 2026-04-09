'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MarkAsDeliveredButtonProps {
  projectId: string
  organizationId: string
  vehicleModel: string
  plate: string
}

export default function MarkAsDeliveredButton({ projectId, organizationId, vehicleModel, plate }: MarkAsDeliveredButtonProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleMarkAsDelivered() {
    if (!confirm('Deseja marcar este veículo como entregue? Isso criará automaticamente as revisões de 6 e 12 meses.')) return

    setLoading(true)
    try {
      // 1. Update project status
      const { error: projectError } = await supabase
        .from('projects')
        .update({ status: 'concluido' })
        .eq('id', projectId)

      if (projectError) throw projectError

      // 2. Create maintenance orders
      const today = new Date()
      
      const date6m = new Date(today)
      date6m.setMonth(date6m.getMonth() + 6)
      
      const date12m = new Date(today)
      date12m.setMonth(date12m.getMonth() + 12)

      const orders = [
        {
          project_id: projectId,
          organization_id: organizationId,
          type: 'scheduled_6m',
          issue_description: 'Revisão programada de 6 meses (garantia)',
          scheduled_date: date6m.toISOString().split('T')[0],
          status: 'scheduled',
          vehicle_model: vehicleModel,
          plate: plate
        },
        {
          project_id: projectId,
          organization_id: organizationId,
          type: 'scheduled_12m',
          issue_description: 'Revisão programada de 12 meses',
          scheduled_date: date12m.toISOString().split('T')[0],
          status: 'scheduled',
          vehicle_model: vehicleModel,
          plate: plate
        }
      ]

      const { error: maintenanceError } = await supabase
        .from('maintenance_orders')
        .insert(orders)

      if (maintenanceError) throw maintenanceError

      alert('Veículo marcado como entregue! Revisões agendadas com sucesso.')
      router.refresh()
    } catch (error: any) {
      alert('Erro ao marcar como entregue: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleMarkAsDelivered}
      disabled={loading}
      className="btn-primary bg-green-600 hover:bg-green-700 text-sm flex-shrink-0 flex items-center gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
      Marcar como Entregue
    </button>
  )
}
